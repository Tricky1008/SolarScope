from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from datetime import datetime
import uuid
from app.core.database import Base

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    osm_id = Column(String, unique=True, nullable=True, index=True)
    geometry_json = Column(Text, nullable=True)  # Store GeoJSON as text
    area_m2 = Column(Float, nullable=True)
    levels = Column(Integer, nullable=True)
    roof_shape = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SolarAnalysis(Base):
    __tablename__ = "solar_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    roof_area_m2 = Column(Float)
    usable_area_m2 = Column(Float)
    num_panels = Column(Integer)
    system_capacity_kwp = Column(Float)
    annual_generation_kwh = Column(Float)
    monthly_generation_kwh = Column(JSON)
    installation_cost = Column(Float)
    annual_savings = Column(Float)
    payback_years = Column(Float)
    npv_25yr = Column(Float)
    co2_annual_kg = Column(Float)
    trees_equivalent = Column(Integer)
    solar_score = Column(Integer)
    irradiance_data = Column(JSON)
    currency = Column(String, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)

class IrradianceCache(Base):
    __tablename__ = "irradiance_cache"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lat_rounded = Column(Float, nullable=False)
    lon_rounded = Column(Float, nullable=False)
    ghi = Column(Float)
    dni = Column(Float)
    pvout = Column(Float)
    avg_temp = Column(Float)
    data_source = Column(String, default="NASA_POWER")
    fetched_at = Column(DateTime, default=datetime.utcnow)
