from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CoordinateRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")


class GeocodeResponse(BaseModel):
    lat: float
    lon: float
    address: str
    city: Optional[str] = None
    country: Optional[str] = None


class BuildingFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class BuildingResponse(BaseModel):
    buildings: List[BuildingFeature]
    count: int


class IrradianceData(BaseModel):
    ghi: float = Field(..., description="Global Horizontal Irradiance kWh/m2/day")
    dni: float = Field(..., description="Direct Normal Irradiance kWh/m2/day")
    pvout: float = Field(..., description="PV Output potential kWh/kWp/year")
    avg_temp: float = Field(..., description="Average temperature Celsius")
    source: str = "NASA_POWER"


class SolarCalculationRequest(BaseModel):
    lat: float
    lon: float
    roof_area_m2: Optional[float] = None
    usability_factor: float = Field(0.75, ge=0.1, le=1.0)
    panel_efficiency: float = Field(0.20, ge=0.10, le=0.25)
    panel_watt_peak: float = Field(400.0, description="Panel watt peak rating")
    tilt_angle: float = Field(15.0, ge=0, le=90, description="Roof tilt angle in degrees")
    electricity_tariff: float = Field(8.0, description="INR per kWh")
    cost_per_kwp: float = Field(60000.0, description="Installation cost per kWp in INR")
    currency: str = "INR"


class MonthlyGeneration(BaseModel):
    month: str
    kwh: float


class MLPrediction(BaseModel):
    model_key: str
    display_name: str
    predicted_kwh: Optional[float] = None
    r2_score: Optional[float] = None
    mae: Optional[float] = None
    is_primary: bool = False
    error: Optional[str] = None


class MLPredictions(BaseModel):
    predictions: List[MLPrediction] = []
    ensemble_avg_kwh: Optional[float] = None
    best_model: Optional[str] = None
    confidence: str = "unknown"
    models_used: int = 0


class SolarAnalysisResponse(BaseModel):
    id: str
    lat: float
    lon: float
    address: Optional[str] = None
    roof_area_m2: float
    usable_area_m2: float
    num_panels: int
    system_capacity_kwp: float
    annual_generation_kwh: float
    monthly_generation: List[MonthlyGeneration]
    installation_cost: float
    annual_savings: float
    payback_years: float
    npv_25yr: float
    co2_annual_kg: float
    trees_equivalent: int
    solar_score: int
    irradiance: IrradianceData
    currency: str
    created_at: datetime
    # ML prediction fields
    ml_predictions: Optional[MLPredictions] = None
    ml_predicted_kwh: Optional[float] = None
    pvlib_kwh: Optional[float] = None
    prediction_source: str = "formula"


class BatchCalculationRequest(BaseModel):
    locations: List[CoordinateRequest]
    common_settings: Optional[SolarCalculationRequest] = None


class HealthResponse(BaseModel):
    status: str
    database: str
    cache: str
    version: str = "1.0.0"
