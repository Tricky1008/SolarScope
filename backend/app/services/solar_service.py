import math
import logging
from typing import Optional
from app.schemas.schemas import (
    IrradianceData, SolarCalculationRequest, SolarAnalysisResponse,
    MLPredictions, MLPrediction
)
from app.services.irradiance_service import get_irradiance, get_monthly_generation
from datetime import datetime
import uuid

logger = logging.getLogger("solarscope.solar")

# Constants
PANEL_AREA_M2 = 1.7          # Standard panel footprint
PERFORMANCE_RATIO = 0.80      # DC to AC losses
CO2_FACTOR_KG_KWH = 0.82     # India grid emission factor (CEA 2023)
TREES_PER_KG_CO2 = 21        # kg CO2 per tree per year
DISCOUNT_RATE = 0.05          # 5% discount rate for NPV
TARIFF_ESCALATION = 0.005     # 0.5% annual tariff increase
NPV_YEARS = 25


def calculate_solar_score(
    pvout: float,
    usable_area_m2: float,
    avg_temp: float,
    payback_years: float
) -> int:
    """Compute a 0-100 solar suitability score."""
    score = 0
    irr_score = min(40, max(0, (pvout - 800) / 1000 * 40))
    score += irr_score
    size_score = min(25, max(0, (usable_area_m2 - 20) / 180 * 25))
    score += size_score
    if avg_temp <= 25:
        temp_score = 15
    elif avg_temp <= 35:
        temp_score = 15 - (avg_temp - 25) * 1.0
    else:
        temp_score = max(0, 5 - (avg_temp - 35) * 0.5)
    score += temp_score
    fin_score = max(0, min(20, (15 - payback_years) / 10 * 20))
    score += fin_score
    return round(min(100, max(0, score)))


def calculate_npv(annual_savings: float, installation_cost: float) -> float:
    """Calculate 25-year Net Present Value of solar investment."""
    npv = -installation_cost
    for year in range(1, NPV_YEARS + 1):
        escalated = annual_savings * ((1 + TARIFF_ESCALATION) ** year)
        discounted = escalated / ((1 + DISCOUNT_RATE) ** year)
        npv += discounted
    return round(npv, 2)


def _build_ml_features(
    lat: float, lon: float, roof_area_m2: float,
    irradiance: IrradianceData, request: SolarCalculationRequest
) -> dict:
    """Build the 10-feature dict that all ML models expect."""
    return {
        "lat": lat,
        "lon": lon,
        "roof_area_m2": roof_area_m2,
        "ghi": irradiance.ghi,
        "dni": irradiance.dni,
        "pvout": irradiance.pvout,
        "avg_temp": irradiance.avg_temp,
        "usability_factor": request.usability_factor,
        "panel_efficiency": request.panel_efficiency,
        "tilt_angle": getattr(request, "tilt_angle", 15.0),
    }


def _run_ml_predictions(features_dict: dict) -> tuple:
    """
    Run ML predictions. Returns (ml_predictions_obj, best_ml_kwh).
    Returns (None, None) if ML service unavailable.
    """
    try:
        from app.services.ml_service import predict_energy, get_best_prediction

        # Get all predictions
        result = predict_energy(features_dict)
        best_kwh = get_best_prediction(features_dict)

        # Build response objects
        pred_list = []
        primary_key = None
        for key, pred in result["predictions"].items():
            is_primary = (key == "xgboost") or (primary_key is None and pred.get("value") is not None)
            if is_primary and primary_key is None:
                primary_key = key
            pred_list.append(MLPrediction(
                model_key=key,
                display_name=pred["display_name"],
                predicted_kwh=pred.get("value"),
                r2_score=pred.get("r2"),
                mae=pred.get("mae"),
                is_primary=is_primary,
                error=pred.get("error"),
            ))

        ml_predictions = MLPredictions(
            predictions=pred_list,
            ensemble_avg_kwh=result.get("ensemble_avg"),
            best_model=primary_key,
            confidence=result.get("confidence", "unknown"),
            models_used=result.get("models_used", 0),
        )

        return ml_predictions, best_kwh

    except Exception as e:
        logger.warning(f"[Solar] ML prediction failed (non-fatal): {e}")
        return None, None


async def run_solar_calculation(
    lat: float,
    lon: float,
    roof_area_m2: float,
    request: SolarCalculationRequest,
    address: Optional[str] = None
) -> SolarAnalysisResponse:
    """
    Full solar calculation pipeline:
    1. Get irradiance data
    2. Calculate usable area & panel count
    3. ML prediction for annual generation (primary)
    4. PVLib formula as validation/fallback
    5. Compute financial model
    6. Calculate CO2 impact
    7. Score the rooftop
    """

    # Step 1 — Irradiance
    irradiance = await get_irradiance(lat, lon)

    # Step 2 — Usable area & panels
    usable_area = roof_area_m2 * request.usability_factor
    num_panels = max(1, int(usable_area / PANEL_AREA_M2))
    system_capacity_kwp = round(num_panels * request.panel_watt_peak / 1000, 2)

    # Step 3 — PVLib formula baseline
    pvlib_kwh = round(system_capacity_kwp * irradiance.pvout * PERFORMANCE_RATIO, 1)

    # Step 4 — ML prediction (primary)
    features_dict = _build_ml_features(lat, lon, roof_area_m2, irradiance, request)
    ml_predictions, ml_best_kwh = _run_ml_predictions(features_dict)

    # Decide which prediction to use
    prediction_source = "formula"
    if ml_best_kwh is not None and ml_best_kwh > 0:
        annual_generation_kwh = round(ml_best_kwh, 1)
        prediction_source = "ml_model"

        # Log comparison with PVLib
        if pvlib_kwh > 0:
            diff_pct = abs(ml_best_kwh - pvlib_kwh) / pvlib_kwh * 100
            if diff_pct > 15:
                logger.warning(
                    f"[Solar] ML vs PVLib divergence: {diff_pct:.1f}% "
                    f"(ML={ml_best_kwh:.0f}, PVLib={pvlib_kwh:.0f})"
                )
            else:
                logger.info(
                    f"[Solar] ML & PVLib agree within {diff_pct:.1f}% "
                    f"(ML={ml_best_kwh:.0f}, PVLib={pvlib_kwh:.0f})"
                )
    else:
        annual_generation_kwh = pvlib_kwh
        logger.info(f"[Solar] Using PVLib formula: {pvlib_kwh} kWh (no ML model available)")

    # Log all 4 model predictions
    if ml_predictions:
        for p in ml_predictions.predictions:
            logger.info(
                f"  → {p.display_name}: {p.predicted_kwh} kWh "
                f"(R²={p.r2_score}){' ★ PRIMARY' if p.is_primary else ''}"
            )

    # Step 5 — Financial model
    installation_cost = round(system_capacity_kwp * request.cost_per_kwp, 2)
    annual_savings = round(annual_generation_kwh * request.electricity_tariff, 2)
    payback_years = round(installation_cost / annual_savings, 2) if annual_savings > 0 else 99
    npv_25yr = calculate_npv(annual_savings, installation_cost)

    # Step 6 — CO2 & environment
    co2_annual_kg = round(annual_generation_kwh * CO2_FACTOR_KG_KWH, 1)
    trees_equivalent = max(1, int(co2_annual_kg / TREES_PER_KG_CO2))

    # Step 7 — Solar score
    solar_score = calculate_solar_score(
        irradiance.pvout, usable_area, irradiance.avg_temp, payback_years
    )

    # Step 8 — Monthly generation
    monthly_raw = get_monthly_generation(annual_generation_kwh)
    from app.schemas.schemas import MonthlyGeneration
    monthly_generation = [MonthlyGeneration(**m) for m in monthly_raw]

    return SolarAnalysisResponse(
        id=str(uuid.uuid4()),
        lat=lat,
        lon=lon,
        address=address,
        roof_area_m2=round(roof_area_m2, 2),
        usable_area_m2=round(usable_area, 2),
        num_panels=num_panels,
        system_capacity_kwp=system_capacity_kwp,
        annual_generation_kwh=annual_generation_kwh,
        monthly_generation=monthly_generation,
        installation_cost=installation_cost,
        annual_savings=annual_savings,
        payback_years=payback_years,
        npv_25yr=npv_25yr,
        co2_annual_kg=co2_annual_kg,
        trees_equivalent=trees_equivalent,
        solar_score=solar_score,
        irradiance=irradiance,
        currency=request.currency,
        created_at=datetime.utcnow(),
        # ML fields
        ml_predictions=ml_predictions,
        ml_predicted_kwh=ml_best_kwh,
        pvlib_kwh=pvlib_kwh,
        prediction_source=prediction_source,
    )


async def calculate_from_model_analysis(
    lat: float,
    lon: float,
    roof_data: dict,
    tariff: float = 8.0,
    cost_per_kwp: float = 65000,
    currency: str = "INR",
) -> dict:
    """
    Run the solar calculation pipeline using model-extracted roof data.
    Replaces Steps 2–5 (OSM fetch + UTM projection + usability factor)
    with the output of image_analysis_service.analyze_roof_image().
    Steps 6–10 are identical to calculate_from_click().
    """
    # Step 6: NASA POWER irradiance (unchanged)
    irradiance = await get_irradiance(lat, lon)

    # Step 7: PVLib simulation using model-extracted area
    usable_area   = roof_data["usable_area_m2"]
    
    # Orientation multiplier heuristic
    orient = roof_data.get("roof_orientation", "mixed")
    if orient in ["south-facing"]:
        orient_mult = 1.0
    elif orient in ["southeast-facing", "southwest-facing"]:
        orient_mult = 0.95
    elif orient in ["east-facing", "west-facing"]:
        orient_mult = 0.85
    elif orient in ["north-facing"]:
        orient_mult = 0.70
    else:
        orient_mult = 0.90
        
    shading       = roof_data.get("shading_factor", 0.85)
    effective_area = usable_area * orient_mult * shading

    num_panels    = max(1, int(effective_area / PANEL_AREA_M2))
    system_kwp    = num_panels * 0.4
    pvout         = irradiance.pvout
    annual_kwh    = round(system_kwp * pvout * PERFORMANCE_RATIO)

    monthly_raw   = get_monthly_generation(annual_kwh)
    from app.schemas.schemas import MonthlyGeneration
    monthly_generation = [MonthlyGeneration(**m).model_dump() for m in monthly_raw]

    # Step 8: Financial model (unchanged)
    annual_savings    = round(annual_kwh * tariff)
    installation_cost = round(system_kwp * cost_per_kwp)
    payback_years     = round(installation_cost / annual_savings, 1) if annual_savings > 0 else 99
    npv_25yr          = calculate_npv(annual_savings, installation_cost)

    # Step 9: CO2 offset (unchanged)
    co2_offset_kg_yr  = round(annual_kwh * CO2_FACTOR_KG_KWH)

    # Step 10: XGBoost solar score (unchanged)
    solar_score = calculate_solar_score(
        irradiance.pvout, usable_area, irradiance.avg_temp, payback_years
    )

    return {
        "id": str(uuid.uuid4()),
        "lat": lat, "lon": lon,
        "solar_score":        solar_score,
        "total_roof_area_m2": roof_data["total_roof_area_m2"],
        "usable_area_m2":     usable_area,
        "num_panels":         num_panels,
        "system_capacity_kwp": round(system_kwp, 2),
        "annual_generation_kwh": annual_kwh,
        "monthly_generation": monthly_generation,
        "annual_savings":     annual_savings,
        "installation_cost":  installation_cost,
        "payback_years":      payback_years,
        "npv_25yr":           round(npv_25yr),
        "co2_annual_kg":      co2_offset_kg_yr,
        "trees_equivalent":   max(1, int(co2_offset_kg_yr / TREES_PER_KG_CO2)),
        "currency":           currency,
        "roof_orientation":   roof_data.get("roof_orientation"),
        "roof_tilt_degrees":  roof_data.get("roof_tilt_degrees"),
        "shading_factor":     roof_data.get("shading_factor"),
        "obstructions":       roof_data.get("obstructions", []),
        "irradiance":         irradiance.model_dump(),
        "created_at":         datetime.utcnow().isoformat(),
        "prediction_source":  "model_image",
    }
