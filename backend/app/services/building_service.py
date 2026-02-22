import httpx
import json
from typing import Optional, List, Dict, Any
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj


OSM_OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def project_to_utm(geometry):
    """Project a shapely geometry from WGS84 to UTM for accurate area calculation."""
    try:
        # Get centroid for UTM zone determination
        centroid = geometry.centroid
        lon, lat = centroid.x, centroid.y
        utm_zone = int((lon + 180) / 6) + 1
        hemisphere = "north" if lat >= 0 else "south"
        utm_crs = pyproj.CRS(f"+proj=utm +zone={utm_zone} +{hemisphere} +ellps=WGS84")
        wgs84 = pyproj.CRS("EPSG:4326")
        project = pyproj.Transformer.from_crs(wgs84, utm_crs, always_xy=True).transform
        return transform(project, geometry)
    except Exception:
        return geometry


def calculate_area_m2(geojson_geometry: dict) -> float:
    """Calculate actual area in m² from a GeoJSON polygon geometry."""
    try:
        geom = shape(geojson_geometry)
        utm_geom = project_to_utm(geom)
        return round(utm_geom.area, 2)
    except Exception:
        return 50.0  # fallback default area


async def query_osm_buildings(lat: float, lon: float, radius_m: int = 100) -> List[Dict[str, Any]]:
    """Query OpenStreetMap Overpass API for buildings near a coordinate."""
    query = f"""
[out:json][timeout:25];
(
  way["building"](around:{radius_m},{lat},{lon});
  relation["building"](around:{radius_m},{lat},{lon});
);
out body geom;
"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OSM_OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
            return parse_osm_elements(data.get("elements", []))
    except Exception as e:
        print(f"OSM query error: {e}")
        return []


def parse_osm_elements(elements: List[dict]) -> List[Dict[str, Any]]:
    """Convert OSM elements to GeoJSON features."""
    features = []
    for elem in elements:
        if elem.get("type") != "way" or "geometry" not in elem:
            continue
        try:
            coords = [[n["lon"], n["lat"]] for n in elem["geometry"]]
            if len(coords) < 4:
                continue
            if coords[0] != coords[-1]:
                coords.append(coords[0])

            geojson_geom = {"type": "Polygon", "coordinates": [coords]}
            area = calculate_area_m2(geojson_geom)
            tags = elem.get("tags", {})

            feature = {
                "type": "Feature",
                "geometry": geojson_geom,
                "properties": {
                    "id": f"osm_way_{elem['id']}",
                    "osm_id": str(elem["id"]),
                    "area_m2": area,
                    "levels": int(tags.get("building:levels", 1)),
                    "roof_shape": tags.get("roof:shape", "flat"),
                    "building_type": tags.get("building", "yes"),
                    "name": tags.get("name", ""),
                    "address": _build_address(tags),
                }
            }
            features.append(feature)
        except Exception:
            continue
    return features


def _build_address(tags: dict) -> str:
    parts = []
    if tags.get("addr:housenumber"):
        parts.append(tags["addr:housenumber"])
    if tags.get("addr:street"):
        parts.append(tags["addr:street"])
    if tags.get("addr:city"):
        parts.append(tags["addr:city"])
    return ", ".join(parts) if parts else "Unknown address"


async def geocode_address(address: str) -> Optional[dict]:
    """Convert address string to lat/lon using Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": address, "format": "json", "limit": 1},
                headers={"User-Agent": "SolarScope/1.0"}
            )
            resp.raise_for_status()
            results = resp.json()
            if results:
                r = results[0]
                return {
                    "lat": float(r["lat"]),
                    "lon": float(r["lon"]),
                    "address": r.get("display_name", address),
                    "city": r.get("address", {}).get("city"),
                    "country": r.get("address", {}).get("country")
                }
    except Exception as e:
        print(f"Geocoding error: {e}")
    return None


def create_dummy_building(lat: float, lon: float, area_m2: float = 80.0) -> Dict[str, Any]:
    """Create a synthetic building footprint when OSM has no data."""
    import math
    # ~10m x 8m rectangle
    d_lat = (area_m2 ** 0.5) / 2 / 111320
    d_lon = (area_m2 ** 0.5) / 2 / (111320 * math.cos(math.radians(lat)))
    coords = [
        [lon - d_lon, lat - d_lat],
        [lon + d_lon, lat - d_lat],
        [lon + d_lon, lat + d_lat],
        [lon - d_lon, lat + d_lat],
        [lon - d_lon, lat - d_lat],
    ]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [coords]},
        "properties": {
            "id": f"synthetic_{lat}_{lon}",
            "area_m2": area_m2,
            "levels": 1,
            "roof_shape": "flat",
            "address": f"Location ({lat:.4f}, {lon:.4f})"
        }
    }
