import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/appStore';
import { fetchNearbyBuildings, calculateSolar } from '../api/client';
import type { BuildingFeature } from '../types';

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
        setNearbyBuildings(buildings);
        if (buildings.length > 0) {
          setSelectedBuilding(buildings[0]);
        }

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
  } = useAppStore();

  const handleBuildingClick = useCallback(async (building: BuildingFeature) => {
    setSelectedBuilding(building);
    setCalculating(true);
    setCalculationError(null);
    setPanelOpen(true);

    const centroid = getCentroid(building.geometry.coordinates[0]);

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
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          maxZoom={19}
          className="dark-map-tiles"
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass rounded-card px-6 py-4 text-center pointer-events-none animate-fade-in shadow-deep">
          <p className="text-text-primary text-sm font-semibold">
            ☀ Click any rooftop to calculate solar potential
          </p>
          <p className="text-text-secondary text-xs mt-1.5 font-data">
            Or search an address above · Zoom in for best results
          </p>
        </div>
      )}
    </div>
  );
}

function getCentroid(coords: number[][]): number[] {
  const x = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const y = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [x, y];
}
