import axios from 'axios';
import type { SolarAnalysis, BuildingFeature, City } from '../types';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const fetchNearbyBuildings = async (
  lat: number, lon: number, radius = 100
): Promise<BuildingFeature[]> => {
  const { data } = await api.get('/buildings/nearby', {
    params: { lat, lon, radius_m: radius }
  });
  return data.buildings;
};

export const calculateSolar = async (params: {
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
}): Promise<SolarAnalysis> => {
  const { data } = await api.post('/solar/calculate', {
    lat: params.lat,
    lon: params.lon,
    electricity_tariff: params.electricity_tariff ?? 8,
    cost_per_kwp: params.cost_per_kwp ?? 60000,
    usability_factor: params.usability_factor ?? 0.75,
    panel_efficiency: params.panel_efficiency ?? 0.20,
    panel_watt_peak: params.panel_watt_peak ?? 400,
    tilt_angle: params.tilt_angle ?? 15,
    currency: params.currency ?? 'INR',
  }, {
    params: {
      lat: params.lat,
      lon: params.lon,
      roof_area_m2: params.roof_area_m2,
    }
  });
  return data;
};

export const geocodeAddress = async (address: string) => {
  const { data } = await api.get('/geocode', { params: { address } });
  return data;
};

export const fetchCities = async (): Promise<City[]> => {
  const { data } = await api.get('/cities');
  return data.cities;
};

export const generateReport = async (analysis: SolarAnalysis): Promise<Blob> => {
  const { data } = await api.post('/solar/report', analysis, {
    responseType: 'blob'
  });
  return data;
};

export const fetchIrradiance = async (lat: number, lon: number) => {
  const { data } = await api.get('/irradiance', { params: { lat, lon } });
  return data;
};
