from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import base64
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

image_router = APIRouter(prefix="/api/v1/image", tags=["Image Analysis"])

# Lazy-load services to avoid crashing on missing heavy dependencies (torch, cv2, etc.)
_coord_svc = None
_seg_svc = None
_vision_svc = None

def _get_services():
    global _coord_svc, _seg_svc, _vision_svc
    if _coord_svc is None:
        from app.services.image_coord_service import ImageCoordService
        from app.services.segmentation_service import RoofSegmentationService
        from app.services.vision_ai_service import VisionAIService
        _coord_svc = ImageCoordService(mapbox_token=settings.MAPBOX_TOKEN)
        _seg_svc = RoofSegmentationService(settings.SAM2_CHECKPOINT, settings.SAM2_CONFIG)
        _vision_svc = VisionAIService(settings.ANTHROPIC_API_KEY)
    return _coord_svc, _seg_svc, _vision_svc

class ImageAnalysisResponse(BaseModel):
    lat: float
    lon: float
    coord_source: str
    roof_area_m2: float
    usable_area_m2: float
    panel_count: int
    system_kwp: float
    segmentation_method: str
    seg_confidence: float
    shading_ratio: float
    orientation_deg: float
    roof_slope: str
    obstruction_count: int
    mask_overlay_base64: str
    polygon_normalized: List[List[float]]
    roof_material: str
    roof_color: str
    cardinal_orientation: str
    shading_severity: str
    solar_suitability: str
    solar_score: int
    key_observations: List[str]
    recommendation: str
    annual_kwh: float
    annual_savings_inr: float
    payback_years: float
    co2_kg_per_year: float
    irradiance_source: str

@image_router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    click_x: Optional[int] = Form(None),
    click_y: Optional[int] = Form(None),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    tariff_per_kwh: float = Form(8.0),
    cost_per_kwp: float = Form(60000.0)
):
    try:
        coord_svc, seg_svc, vision_svc = _get_services()
        from app.services.image_coord_service import CoordResult
        from app.services.solar_service import calculate_from_model_analysis
    except ImportError as e:
        raise HTTPException(status_code=503, detail=f"Image analysis dependencies not installed: {e}")

    image_bytes = await file.read()
    
    # Max size 20MB
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 20 MB)")

    # Step 1 - Coordinates
    coord_result = coord_svc.extract_coords(image_bytes, file.filename)
    if not coord_result:
        if lat is not None and lon is not None:
            coord_result = CoordResult(lat=lat, lon=lon, source="USER_PROVIDED")
        else:
            raise HTTPException(status_code=400, detail={
                "error": "no_coordinates", 
                "message": "No GPS data found in image. Please locate manually on the map or enter coordinates."
            })
            
    final_lat = coord_result.lat
    final_lon = coord_result.lon

    # Step 2 - Satellite tile
    tile = None
    try:
        tile = await coord_svc.fetch_satellite_tile(final_lat, final_lon, zoom=19)
    except Exception as e:
        logger.warning(f"Failed to fetch satellite tile, falling back to basic pixels: {e}")

    # Step 3 - Segmentation
    click = (click_x, click_y) if click_x is not None and click_y is not None else None
    seg_image = tile.image_bytes if tile else image_bytes
    
    try:
        seg_result = seg_svc.segment_roof(seg_image, click)
    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Segmentation error: {str(e)}")

    if tile:
        utm_epsg = coord_svc.auto_utm_epsg(final_lat, final_lon)
        roof_area_m2 = coord_svc.pixels_to_m2(seg_result.pixel_area, tile, utm_epsg)
    else:
        roof_area_m2 = round(seg_result.pixel_area * 0.05, 2)
        
    # Step 4 - Vision AI
    overlay_bytes = None
    if seg_result and seg_result.mask_base64:
        overlay_bytes = base64.b64decode(seg_result.mask_base64)
        
    try:
        vision_result = await vision_svc.analyse_roof(seg_image, overlay_bytes)
    except Exception as e:
        logger.error(f"Vision API failed: {e}")
        raise HTTPException(status_code=502, detail=f"Vision analysis failed: {str(e)}")

    sev_map = {"none": 0.0, "low": 0.1, "moderate": 0.25, "high": 0.45}
    vision_sev_val = sev_map.get(vision_result.shading_severity, 0.25)
    combined_shading = max(seg_result.shading_ratio, vision_sev_val)
    shading_factor_for_solar = 1.0 - combined_shading
    
    usable_area_m2 = round(roof_area_m2 * vision_result.usable_area_fraction, 2)
    
    # Step 5 - Solar Calculation
    try:
        roof_data_dict = {
            "total_roof_area_m2": roof_area_m2,
            "usable_area_m2": usable_area_m2,
            "roof_orientation": vision_result.cardinal_orientation, # "south-facing" etc
            "shading_factor": shading_factor_for_solar,
            "roof_tilt_degrees": 15,
            "obstructions": []
        }
        
        solar_res = await calculate_from_model_analysis(
            lat=final_lat, 
            lon=final_lon,
            roof_data=roof_data_dict,
            tariff=tariff_per_kwh,
            cost_per_kwp=cost_per_kwp,
            currency="INR"
        )
    except Exception as e:
        logger.error(f"Solar calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Solar calculation failed: {str(e)}")

    return ImageAnalysisResponse(
        lat=final_lat,
        lon=final_lon,
        coord_source=coord_result.source,
        roof_area_m2=roof_area_m2,
        usable_area_m2=usable_area_m2,
        panel_count=solar_res.get("num_panels", 0),
        system_kwp=solar_res.get("system_capacity_kwp", 0.0),
        segmentation_method=seg_result.method,
        seg_confidence=seg_result.confidence,
        shading_ratio=combined_shading,
        orientation_deg=seg_result.estimated_orientation_deg,
        roof_slope=seg_result.roof_slope_estimate,
        obstruction_count=vision_result.obstruction_count,
        mask_overlay_base64=seg_result.mask_base64,
        polygon_normalized=seg_result.polygon_normalized,
        roof_material=vision_result.roof_material,
        roof_color=vision_result.roof_color,
        cardinal_orientation=vision_result.cardinal_orientation,
        shading_severity=vision_result.shading_severity,
        solar_suitability=vision_result.solar_suitability,
        solar_score=vision_result.solar_score,
        key_observations=vision_result.key_observations,
        recommendation=vision_result.recommendation,
        annual_kwh=solar_res.get("annual_generation_kwh", 0.0),
        annual_savings_inr=solar_res.get("annual_savings", 0.0),
        payback_years=solar_res.get("payback_years", 0.0),
        co2_kg_per_year=solar_res.get("co2_annual_kg", 0.0),
        irradiance_source=solar_res.get("irradiance", {}).get("metadata", {}).get("irradiance_source", "NASA")
    )

@image_router.post("/satellite-tile")
async def get_satellite_tile(lat: float, lon: float, zoom: int = 19):
    try:
        coord_svc, _, _ = _get_services()
        tile = await coord_svc.fetch_satellite_tile(lat, lon, zoom)
        img_base64 = base64.b64encode(tile.image_bytes).decode('utf-8')
        return {
            "image_base64": img_base64,
            "bounds": tile.bounds,
            "tile": {"x": tile.tile_x, "y": tile.tile_y, "z": tile.tile_z}
        }
    except Exception as e:
        logger.error(f"Tile fetch failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))

@image_router.post("/segment-preview")
async def segment_preview(
    file: UploadFile = File(...),
    click_x: Optional[int] = Form(None),
    click_y: Optional[int] = Form(None)
):
    image_bytes = await file.read()
    click = (click_x, click_y) if click_x is not None and click_y is not None else None
    
    try:
        _, seg_svc, _ = _get_services()
        seg_res = seg_svc.segment_roof(image_bytes, click)
        return {
            "mask_overlay_base64": seg_res.mask_base64,
            "polygon_normalized": seg_res.polygon_normalized,
            "pixel_area": seg_res.pixel_area,
            "coverage_ratio": seg_res.coverage_ratio,
            "shading_ratio": seg_res.shading_ratio,
            "method": seg_res.method,
            "confidence": seg_res.confidence
        }
    except Exception as e:
        logger.error(f"Segment preview failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
