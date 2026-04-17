"""
schemas.py  — additions for the Rooftop Image Analysis Pipeline
Merge these Pydantic models into your existing schemas.py.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field


# ── Nested models ─────────────────────────────────────────────────────────────

class ObstructionItem(BaseModel):
    label: str
    confidence: float
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2] in model-input pixels")


class RoofOrientation(BaseModel):
    facing: str                          # "N" | "NE" | "E" | … | "unknown"
    tilt_deg: float
    shading_factor: float
    principal_angle_deg: Optional[float] = None


# ── Main response model ───────────────────────────────────────────────────────

class ImageAnalysisResponse(BaseModel):
    """
    Returned by POST /solar/analyze-image.
    Combines ML-extracted roof geometry with the full solar report.
    """
    # ── Roof geometry (from image_analysis_service) ──────────────────────
    roof_area_m2: float
    orientation: RoofOrientation
    obstructions: List[ObstructionItem] = []
    mask_64: List[int] = Field(
        ...,
        description="64×64 binary roof mask flattened to a list of 0/1 ints",
    )
    model_used: str                       # e.g. "onnx" | "brightness_fallback"
    gsd_m_per_px: float

    # ── Solar report (from solar_service.calculate_from_model_analysis) ──
    annual_kwh: Optional[float] = None
    system_size_kw: Optional[float] = None
    panel_count: Optional[int] = None
    co2_offset_kg: Optional[float] = None
    payback_years: Optional[float] = None
    financial: Optional[dict] = None
    irradiance: Optional[dict] = None
    score: Optional[float] = None
    prediction_source: str = "model_image"

    # ── Pass-through metadata ─────────────────────────────────────────────
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MaskOnlyResponse(BaseModel):
    """Returned by POST /solar/mask-only (quick preview, no solar calc)."""
    roof_area_m2: float
    orientation: RoofOrientation
    obstructions: List[ObstructionItem] = []
    mask_64: List[int]
    model_used: str
    gsd_m_per_px: float
