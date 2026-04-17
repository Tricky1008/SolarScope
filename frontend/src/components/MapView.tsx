import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/appStore';
import { fetchNearbyBuildings, calculateSolar, reverseGeocode } from '../api/client';
import type { BuildingFeature } from '../types';
import SearchBar from './SearchBar';
import AnalysisModeToggle from './AnalysisModeToggle';
import ImageAnalysisPanel from './ImageAnalysisPanel';
import { AnimatePresence } from 'framer-motion';
import { GPSButton } from './GPSButton';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const selectedIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#FF6B1A;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(255,107,26,0.8)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapSync() {
  const map = useMap();
  const { mapCenter, mapZoom } = useAppStore();

  useEffect(() => {
    map.flyTo(mapCenter, mapZoom, { duration: 0.6 });
  }, [mapCenter, mapZoom, map]);

  return null;
}

function ClickHandler() {
  const {
    setSelectedLocation, setNearbyBuildings, setSelectedBuilding,
    setAnalysis, setCalculating, setCalculationError, setPanelOpen,
    electricityTariff, costPerKwp, currency,
    usabilityFactor, panelEfficiency, panelWattPeak, roofTiltAngle, getEffectiveRoofArea,
  } = useAppStore();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setSelectedLocation(lat, lng);
      setCalculating(true);
      setCalculationError(null);
      setPanelOpen(true);

      try {
        const buildings = await fetchNearbyBuildings(lat, lng, 100);
        let addressStr = '';
        try {
          addressStr = await reverseGeocode(lat, lng);
        } catch (e) {
          console.error(e);
        }

        if (buildings.length === 0) {
          const dummyBuilding = {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]] },
            properties: { id: `dummy-${Date.now()}`, area_m2: 80, address: addressStr || 'Unknown location' }
          };
          buildings.push(dummyBuilding as any);
        } else if (addressStr && (!buildings[0].properties.address || buildings[0].properties.address === 'Unknown address' || buildings[0].properties.address.trim() === '')) {
          buildings[0].properties.address = addressStr;
        }

        setNearbyBuildings(buildings);
        setSelectedBuilding(buildings[0]);

        // Priority: user-provided area > auto-detected from OSM
        const userArea = getEffectiveRoofArea();
        const area = userArea > 0
          ? userArea
          : (buildings.length > 0 ? buildings[0].properties.area_m2 : undefined);

        const analysis = await calculateSolar({
          lat, lon: lng,
          roof_area_m2: area,
          electricity_tariff: electricityTariff,
          cost_per_kwp: costPerKwp,
          usability_factor: usabilityFactor,
          panel_efficiency: panelEfficiency,
          panel_watt_peak: panelWattPeak,
          tilt_angle: roofTiltAngle,
          currency,
        });
        setAnalysis(analysis);
      } catch (err: any) {
        setCalculationError(err?.response?.data?.detail ?? 'Calculation failed. Is the backend running?');
      } finally {
        setCalculating(false);
      }
    }
  });

  return null;
}

function buildingStyle(feature: BuildingFeature, selected: boolean): L.PathOptions {
  return {
    fillColor: selected ? '#FF6B1A' : '#0A84FF',
    fillOpacity: selected ? 0.5 : 0.2,
    color: selected ? '#FF6B1A' : '#0A84FF',
    weight: selected ? 3 : 1.5,
    dashArray: selected ? undefined : '4 4',
  };
}

export default function MapView() {
  const {
    selectedLat, selectedLon,
    nearbyBuildings, selectedBuilding,
    setSelectedBuilding, setAnalysis, setCalculating,
    setCalculationError, setPanelOpen,
    electricityTariff, costPerKwp, currency,
    usabilityFactor, panelEfficiency, panelWattPeak, roofTiltAngle, getEffectiveRoofArea,
    analysisMode,
  } = useAppStore();

  const isImageMode = analysisMode === 'image-upload';

  const handleBuildingClick = useCallback(async (building: BuildingFeature) => {
    setCalculating(true);
    setCalculationError(null);
    setPanelOpen(true);

    const centroid = getCentroid(building.geometry.coordinates[0]);

    if (!building.properties.address || building.properties.address === 'Unknown address' || building.properties.address.trim() === '') {
      try {
        const addressStr = await reverseGeocode(centroid[1], centroid[0]);
        if (addressStr) {
          // Create a new building object to trigger React state updates if needed
          const updatedBuilding = { ...building, properties: { ...building.properties, address: addressStr } };
          setSelectedBuilding(updatedBuilding);
        } else {
          setSelectedBuilding(building);
        }
      } catch (e) {
        console.error(e);
        setSelectedBuilding(building);
      }
    } else {
      setSelectedBuilding(building);
    }

    // Priority: user-provided area > building area
    const userArea = getEffectiveRoofArea();
    const area = userArea > 0 ? userArea : building.properties.area_m2;

    try {
      const analysis = await calculateSolar({
        lat: centroid[1],
        lon: centroid[0],
        roof_area_m2: area,
        electricity_tariff: electricityTariff,
        cost_per_kwp: costPerKwp,
        usability_factor: usabilityFactor,
        panel_efficiency: panelEfficiency,
        panel_watt_peak: panelWattPeak,
        tilt_angle: roofTiltAngle,
        currency,
      });
      setAnalysis(analysis);
    } catch (err: any) {
      setCalculationError(err?.response?.data?.detail ?? 'Calculation failed.');
    } finally {
      setCalculating(false);
    }
  }, [electricityTariff, costPerKwp, currency, usabilityFactor, panelEfficiency, panelWattPeak]);

  return (
    <div className="flex-1 relative" role="application" aria-label="Solar analysis map">
      {/* ── Mode Toggle + Search Bar Overlay ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[1000] pointer-events-auto">
        <div className="bg-[#0A111C]/85 backdrop-blur-xl border border-[#1E3550] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 space-y-3">
          <AnalysisModeToggle />
          {!isImageMode && <SearchBar />}
        </div>
      </div>

      {/* ── Image Upload Panel (covers map when active) ── */}
      <AnimatePresence>
        {isImageMode && <ImageAnalysisPanel onBack={() => { }} onSuccess={() => { }} />}
      </AnimatePresence>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          maxZoom={19}
        />

        <MapSync />
        <ClickHandler />

        {nearbyBuildings.map((building) => (
          <GeoJSON
            key={building.properties.id}
            data={building as any}
            style={() => buildingStyle(
              building,
              selectedBuilding?.properties.id === building.properties.id
            )}
            eventHandlers={{
              click: () => handleBuildingClick(building),
              mouseover: (e) => e.target.setStyle({ fillOpacity: 0.6, weight: 3 }),
              mouseout: (e) => e.target.setStyle(buildingStyle(
                building,
                selectedBuilding?.properties.id === building.properties.id
              )),
            }}
          />
        ))}

        {selectedLat !== null && selectedLon !== null && (
          <Marker position={[selectedLat, selectedLon]} icon={selectedIcon} />
        )}
      </MapContainer>

      {selectedLat === null && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-[#0A111C]/80 backdrop-blur-2xl border border-[#1E3550] shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-2xl px-6 py-4 text-center pointer-events-none animate-fade-in z-[1000]">
          <p className="text-white text-sm font-semibold tracking-wide">
            ☀ Click any rooftop to calculate solar potential
          </p>
          <p className="text-gray-400 text-xs mt-1.5 font-mono">
            Or search an address above · Zoom in for best results
          </p>
        </div>
      )}

      <GPSButton onLocate={(lat, lng) => {
        useAppStore.getState().setMapCenter([lat, lng], 18);
        useAppStore.getState().setSelectedLocation(lat, lng);
      }} />
    </div>
  );
}

function getCentroid(coords: number[][]): number[] {
  const x = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const y = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [x, y];
}
