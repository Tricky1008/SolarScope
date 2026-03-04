import { create } from 'zustand';
import type { SolarAnalysis, BuildingFeature } from '../types';

interface RooftopConfig {
  roofLength: number;
  roofWidth: number;
  roofArea: number;
  panelDirection: string;
  roofTiltAngle: number;
  panelEfficiency: number;
  panelWattPeak: number;
  usabilityFactor: number;
}

interface AppState {
  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  selectedLat: number | null;
  selectedLon: number | null;
  selectedBuilding: BuildingFeature | null;
  nearbyBuildings: BuildingFeature[];

  // Analysis state
  analysis: SolarAnalysis | null;
  isCalculating: boolean;
  calculationError: string | null;

  // UI state
  isPanelOpen: boolean;
  isSettingsOpen: boolean;
  activeFlow: 'choice' | 'map' | 'manual';
  isReportOpen: boolean;


  // User settings (financial)
  electricityTariff: number;
  costPerKwp: number;
  currency: string;

  // Rooftop configuration
  roofLength: number;
  roofWidth: number;
  roofArea: number;
  panelDirection: string;
  roofTiltAngle: number;
  panelEfficiency: number;
  panelWattPeak: number;
  usabilityFactor: number;

  // Computed
  getEffectiveRoofArea: () => number;

  // Actions
  setMapCenter: (center: [number, number], zoom?: number) => void;
  setSelectedLocation: (lat: number, lon: number) => void;
  setSelectedBuilding: (b: BuildingFeature | null) => void;
  setNearbyBuildings: (buildings: BuildingFeature[]) => void;
  setAnalysis: (a: SolarAnalysis | null) => void;
  setCalculating: (v: boolean) => void;
  setCalculationError: (e: string | null) => void;
  setPanelOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setActiveFlow: (v: 'choice' | 'map' | 'manual') => void;
  setReportOpen: (v: boolean) => void;

  updateSettings: (s: Partial<RooftopConfig & { electricityTariff: number; costPerKwp: number; currency: string }>) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mapCenter: [20.5937, 78.9629],
  mapZoom: 5,
  selectedLat: null,
  selectedLon: null,
  selectedBuilding: null,
  nearbyBuildings: [],
  analysis: null,
  isCalculating: false,
  calculationError: null,
  isPanelOpen: false,
  isSettingsOpen: false,
  activeFlow: 'choice',
  isReportOpen: false,


  // Financial defaults
  electricityTariff: 8,
  costPerKwp: 60000,
  currency: 'INR',

  // Rooftop defaults
  roofLength: 0,
  roofWidth: 0,
  roofArea: 0,
  panelDirection: 'south',
  roofTiltAngle: 15,
  panelEfficiency: 0.20,
  panelWattPeak: 400,
  usabilityFactor: 0.75,

  // Computed: returns user-specified area if set, or auto-detected area from building
  getEffectiveRoofArea: () => {
    const s = get();
    if (s.roofLength > 0 && s.roofWidth > 0) return s.roofLength * s.roofWidth;
    if (s.roofArea > 0) return s.roofArea;
    return s.selectedBuilding?.properties.area_m2 ?? 0;
  },

  setMapCenter: (center, zoom) => set((s) => ({ mapCenter: center, mapZoom: zoom ?? s.mapZoom })),
  setSelectedLocation: (lat, lon) => set({ selectedLat: lat, selectedLon: lon }),
  setSelectedBuilding: (b) => set({ selectedBuilding: b }),
  setNearbyBuildings: (buildings) => set({ nearbyBuildings: buildings }),
  setAnalysis: (a) => set({ analysis: a }),
  setCalculating: (v) => set({ isCalculating: v }),
  setCalculationError: (e) => set({ calculationError: e }),
  setPanelOpen: (v) => set({ isPanelOpen: v }),
  setSettingsOpen: (v) => set({ isSettingsOpen: v }),
  setActiveFlow: (v) => set({ activeFlow: v }),
  setReportOpen: (v) => set({ isReportOpen: v }),

  updateSettings: (s) => set(s),
  reset: () => set({
    analysis: null, isCalculating: false, calculationError: null, isPanelOpen: false,
    activeFlow: 'choice'
  }),

}));
