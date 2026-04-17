import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import type { SolarAnalysis, BuildingFeature, City } from '../types';
import { useAuthStore } from '../store/authStore';

export const API_BASE_URL = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_BASE_URL || 'http://10.0.2.2:8000')
  : (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? `http://${window.location.hostname}:8000` : ''));

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Auto-retry on network error (for mobile offline resilience)
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.config && !error.config._retry && error.code === 'ERR_NETWORK') {
      error.config._retry = true;
      await new Promise(r => setTimeout(r, 2000));
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

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

export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  const { data } = await api.get('/reverse-geocode', { params: { lat, lon } });
  return data.address;
};

export const fetchCities = async (): Promise<City[]> => {
  const { data } = await api.get('/cities');
  return data.cities;
};

export const generateReport = async (analysis: any): Promise<Blob> => {
  const payload = {
    ...analysis,
    roof_area_m2: analysis.roof_area_m2 ?? analysis.total_roof_area_m2,
  };
  const { data } = await api.post('/solar/report', payload, {
    responseType: 'blob'
  });
  return data;
};

export const fetchIrradiance = async (lat: number, lon: number) => {
  const { data } = await api.get('/irradiance', { params: { lat, lon } });
  return data;
};


// ── Image Analysis ────────────────────────────────────────

import type { ImageAnalysisResult, RoofMaskData } from '../types';

export const analyzeImage = async (
  file: File,
  lat: number,
  lon: number,
  tariff = 8,
  costPerKwp = 60000,
  currency = 'INR',
): Promise<ImageAnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/solar/analyze-image', formData, {
    params: { lat, lon, tariff, cost_per_kwp: costPerKwp, currency },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
};

export const getMaskOnly = async (file: File): Promise<RoofMaskData> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/solar/mask-only', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return data;
};
