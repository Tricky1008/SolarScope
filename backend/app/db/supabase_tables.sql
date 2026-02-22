-- Enable PostGIS extension for geometry/geography data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. USERS TABLE (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." 
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a public.users row when a new auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. SOLAR_ANALYSES TABLE
CREATE TABLE public.solar_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Inputs
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  location_geom GEOMETRY(Point, 4326) NOT NULL, -- PostGIS point
  roof_area_m2 FLOAT,
  tilt_angle FLOAT,
  usability_factor FLOAT,
  panel_efficiency FLOAT,
  panel_watt_peak INT,
  electricity_tariff FLOAT,
  cost_per_kwp FLOAT,
  currency TEXT,

  -- Irradiance
  ghi FLOAT,
  dni FLOAT,
  pvout FLOAT,
  avg_temp FLOAT,
  irradiance_source TEXT,

  -- Outputs
  annual_generation_kwh FLOAT,
  pvlib_kwh FLOAT,
  ml_predicted_kwh FLOAT,
  prediction_source TEXT,

  financial_savings_annual FLOAT,
  financial_payback_years FLOAT,
  financial_roi_percentage FLOAT,
  
  co2_annual_kg FLOAT,
  trees_equivalent INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for fast spatial queries
CREATE INDEX idx_solar_analyses_geom ON public.solar_analyses USING GIST (location_geom);

ALTER TABLE public.solar_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses." 
  ON public.solar_analyses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses." 
  ON public.solar_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses." 
  ON public.solar_analyses FOR DELETE USING (auth.uid() = user_id);


-- 3. BUILDINGS_CACHE TABLE (Caches OSM polygons via PostGIS)
CREATE TABLE public.buildings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE NOT NULL,
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  area_m2 FLOAT NOT NULL,
  center_lat FLOAT NOT NULL,
  center_lon FLOAT NOT NULL,
  address_tags JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for rapid cache bounding box lookups
CREATE INDEX idx_buildings_cache_geom ON public.buildings_cache USING GIST (geometry);

ALTER TABLE public.buildings_cache ENABLE ROW LEVEL SECURITY;

-- Buildings cache should be readable by any authenticated user
CREATE POLICY "Authenticated users can read building cache"
  ON public.buildings_cache FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert building cache"
  ON public.buildings_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
