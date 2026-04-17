from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from io import BytesIO
import logging

from app.schemas.schemas import (
    SolarCalculationRequest, SolarAnalysisResponse,
    BuildingResponse, GeocodeResponse, HealthResponse,
    CoordinateRequest, BatchCalculationRequest
)
from app.services.solar_service import run_solar_calculation
from app.services.building_service import (
    query_osm_buildings, geocode_address, create_dummy_building, calculate_area_m2
)
from app.services.irradiance_service import get_irradiance
from app.services.report_service import generate_pdf_report
from app.services.auth_service import sign_in, sign_up, sign_out, get_current_user, optional_get_current_user, AuthCredentials, security
from fastapi.security import HTTPAuthorizationCredentials

logger = logging.getLogger("solarscope.routes")

router = APIRouter(prefix="/api/v1")

# ── Auth ───────────────────────────────────────────────────────────────────

@router.post("/auth/signup")
async def register_user(creds: AuthCredentials):
    return await sign_up(creds.email, creds.password)

@router.post("/auth/signin")
async def login_user(creds: AuthCredentials):
    return await sign_in(creds.email, creds.password)

@router.post("/auth/signout")
async def logout_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return await sign_out(credentials.credentials)

@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


# ── Health ─────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", database="connected", cache="connected")


# ── Geocoding ──────────────────────────────────────────────────────────────

@router.get("/geocode", response_model=GeocodeResponse)
async def geocode(address: str = Query(..., description="Address to geocode")):
    result = await geocode_address(address)
    if not result:
        raise HTTPException(status_code=404, detail="Address not found")
    return GeocodeResponse(**result)

@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    from app.services.building_service import reverse_geocode_address
    address = await reverse_geocode_address(lat, lon)
    return {"address": address}


# ── Buildings ──────────────────────────────────────────────────────────────

@router.get("/buildings/nearby", response_model=BuildingResponse)
async def get_nearby_buildings(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_m: int = Query(100, ge=10, le=500)
):
    """Fetch buildings from OpenStreetMap near a coordinate."""
    buildings = await query_osm_buildings(lat, lon, radius_m)
    return BuildingResponse(buildings=buildings, count=len(buildings))


# ── Irradiance ─────────────────────────────────────────────────────────────

@router.get("/irradiance")
async def get_irradiance_data(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """Fetch solar irradiance data for a location."""
    data = await get_irradiance(lat, lon)
    return data


# ── Solar Calculation ──────────────────────────────────────────────────────

@router.post("/solar/calculate", response_model=SolarAnalysisResponse)
async def calculate_solar(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    roof_area_m2: Optional[float] = Query(None, ge=5, le=10000),
    request: SolarCalculationRequest = None,
    user: dict = Depends(optional_get_current_user)
):
    """
    Main solar calculation endpoint.
    Uses ML models (XGBoost primary) with PVLib formula as fallback.
    """
    if request is None:
        request = SolarCalculationRequest(lat=lat, lon=lon)

    # Resolve roof area
    actual_area = roof_area_m2
    address = None

    if actual_area is None:
        buildings = await query_osm_buildings(lat, lon, radius_m=80)
        if buildings:
            b = buildings[0]
            actual_area = b["properties"].get("area_m2", 80.0)
            address = b["properties"].get("address")
        else:
            actual_area = 80.0  # Default fallback

    result = await run_solar_calculation(lat, lon, actual_area, request, address)
    return result


@router.post("/solar/calculate/polygon", response_model=SolarAnalysisResponse)
async def calculate_solar_polygon(
    geojson_geometry: dict,
    lat: float = Query(...),
    lon: float = Query(...),
    request: SolarCalculationRequest = None,
    user: dict = Depends(optional_get_current_user)
):
    """Calculate solar potential from a GeoJSON polygon geometry."""
    if request is None:
        request = SolarCalculationRequest(lat=lat, lon=lon)

    area_m2 = calculate_area_m2(geojson_geometry)
    result = await run_solar_calculation(lat, lon, area_m2, request)
    return result


@router.post("/solar/batch")
async def batch_calculate(
    batch_request: BatchCalculationRequest,
    user: dict = Depends(optional_get_current_user)
):
    """Run solar calculation for multiple locations."""
    results = []
    settings = batch_request.common_settings or SolarCalculationRequest(lat=0, lon=0)

    for loc in batch_request.locations[:20]:
        try:
            req = SolarCalculationRequest(
                lat=loc.lat, lon=loc.lon,
                electricity_tariff=settings.electricity_tariff,
                cost_per_kwp=settings.cost_per_kwp,
                usability_factor=settings.usability_factor
            )
            result = await run_solar_calculation(loc.lat, loc.lon, 80.0, req)
            results.append(result)
        except Exception as e:
            results.append({"lat": loc.lat, "lon": loc.lon, "error": str(e)})

    return {"results": results, "count": len(results)}


# ── ML Model Endpoints ────────────────────────────────────────────────────

@router.get("/ml/status")
async def ml_model_status():
    """Returns loaded models, their R² scores, and which is active."""
    try:
        from app.services.ml_service import get_model_status
        return get_model_status()
    except Exception as e:
        return {"error": str(e), "total_loaded": 0}


@router.get("/ml/predict")
async def ml_predict(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    roof_area: float = Query(100.0, ge=5, le=10000, description="Roof area m²"),
    usability: float = Query(0.75, ge=0.1, le=1.0, description="Usability factor"),
    panel_efficiency: float = Query(0.20, ge=0.10, le=0.25),
    tilt_angle: float = Query(15.0, ge=0, le=90),
):
    """
    Run prediction through all loaded models and return comparison table.
    Fetches irradiance data live for the given coordinates.
    """
    try:
        from app.services.ml_service import predict_energy

        # Get live irradiance
        irradiance = await get_irradiance(lat, lon)

        features_dict = {
            "lat": lat,
            "lon": lon,
            "roof_area_m2": roof_area,
            "ghi": irradiance.ghi,
            "dni": irradiance.dni,
            "pvout": irradiance.pvout,
            "avg_temp": irradiance.avg_temp,
            "usability_factor": usability,
            "panel_efficiency": panel_efficiency,
            "tilt_angle": tilt_angle,
        }

        result = predict_energy(features_dict)

        return {
            "input_features": features_dict,
            "irradiance": {
                "ghi": irradiance.ghi,
                "dni": irradiance.dni,
                "pvout": irradiance.pvout,
                "avg_temp": irradiance.avg_temp,
                "source": irradiance.source,
            },
            **result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML prediction failed: {str(e)}")


# ── Report ─────────────────────────────────────────────────────────────────

@router.post("/solar/report")
async def generate_report(
    analysis: SolarAnalysisResponse,
    user: dict = Depends(optional_get_current_user)
):
    """Generate and stream a PDF report for a solar analysis result."""
    pdf_bytes = generate_pdf_report(analysis)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=solarscope-report.pdf"}
    )


# ── Cities ─────────────────────────────────────────────────────────────────

@router.get("/cities")
async def list_cities():
    """Return list of demo cities with coordinates."""
    return {
        "cities": [
            {"name": "Mumbai, India", "lat": 19.0760, "lon": 72.8777},
            {"name": "Delhi, India", "lat": 28.6139, "lon": 77.2090},
            {"name": "Bengaluru, India", "lat": 12.9716, "lon": 77.5946},
            {"name": "Chennai, India", "lat": 13.0827, "lon": 80.2707},
            {"name": "Hyderabad, India", "lat": 17.3850, "lon": 78.4867},
            {"name": "Pune, India", "lat": 18.5204, "lon": 73.8567},
            {"name": "London, UK", "lat": 51.5074, "lon": -0.1278},
            {"name": "New York, USA", "lat": 40.7128, "lon": -74.0060},
            {"name": "Dubai, UAE", "lat": 25.2048, "lon": 55.2708},
            {"name": "Singapore", "lat": 1.3521, "lon": 103.8198},
        ]
    }



