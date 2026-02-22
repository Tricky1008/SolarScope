export interface IrradianceData {
  ghi: number;
  dni: number;
  pvout: number;
  avg_temp: number;
  source: string;
}

export interface MonthlyGeneration {
  month: string;
  kwh: number;
}

export interface MLPredictionItem {
  model_key: string;
  display_name: string;
  predicted_kwh: number | null;
  r2_score: number | null;
  mae: number | null;
  is_primary: boolean;
  error?: string;
}

export interface MLPredictions {
  predictions: MLPredictionItem[];
  ensemble_avg_kwh: number | null;
  best_model: string | null;
  confidence: string;
  models_used: number;
}

export interface SolarAnalysis {
  id: string;
  lat: number;
  lon: number;
  address?: string;
  roof_area_m2: number;
  usable_area_m2: number;
  num_panels: number;
  system_capacity_kwp: number;
  annual_generation_kwh: number;
  monthly_generation: MonthlyGeneration[];
  installation_cost: number;
  annual_savings: number;
  payback_years: number;
  npv_25yr: number;
  co2_annual_kg: number;
  trees_equivalent: number;
  solar_score: number;
  irradiance: IrradianceData;
  currency: string;
  created_at: string;
  // ML fields
  ml_predictions?: MLPredictions;
  ml_predicted_kwh?: number | null;
  pvlib_kwh?: number | null;
  prediction_source?: string;
}

export interface BuildingFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    id: string;
    osm_id?: string;
    area_m2: number;
    levels: number;
    roof_shape: string;
    address: string;
  };
}

export interface CalculationRequest {
  lat: number;
  lon: number;
  roof_area_m2?: number;
  electricity_tariff?: number;
  cost_per_kwp?: number;
  usability_factor?: number;
  panel_efficiency?: number;
  panel_watt_peak?: number;
  tilt_angle?: number;
  currency?: string;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}
