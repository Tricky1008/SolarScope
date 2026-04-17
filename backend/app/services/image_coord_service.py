import logging
import io
import math
from typing import Optional
from dataclasses import dataclass
import httpx

try:
    import mercantile
except ImportError:
    mercantile = None

try:
    from pyproj import Transformer
except ImportError:
    Transformer = None

logger = logging.getLogger(__name__)

try:
    import piexif
except ImportError:
    piexif = None

try:
    import rasterio
except ImportError:
    rasterio = None

@dataclass
class CoordResult:
    lat: float
    lon: float
    source: str
    accuracy_m: Optional[float] = None

@dataclass
class SatelliteTile:
    image_bytes: bytes
    tile_x: int
    tile_y: int
    tile_z: int
    bounds: dict
    width_px: int = 512
    height_px: int = 512

class ImageCoordService:
    def __init__(self, mapbox_token: str = ""):
        self.mapbox_token = mapbox_token

    def extract_coords(self, image_bytes: bytes, filename: str = "") -> Optional[CoordResult]:
        # Try EXIF GPS first
        coord = self._from_exif(image_bytes)
        if coord:
            return coord
        
        # Try GeoTIFF
        coord = self._from_geotiff(image_bytes)
        if coord:
            return coord
            
        return None

    def _from_exif(self, image_bytes: bytes) -> Optional[CoordResult]:
        if not piexif:
            logger.warning("piexif not installed, skipping EXIF GPS extraction")
            return None
            
        try:
            exif_dict = piexif.load(image_bytes)
            if "GPS" not in exif_dict or not exif_dict["GPS"]:
                return None
                
            gps = exif_dict["GPS"]
            
            # Helper to convert DMS rational tuples to decimal degrees
            def _convert_to_degrees(value):
                d = float(value[0][0]) / float(value[0][1])
                m = float(value[1][0]) / float(value[1][1])
                s = float(value[2][0]) / float(value[2][1])
                return d + (m / 60.0) + (s / 3600.0)

            lat_ref = gps.get(piexif.GPSIFD.GPSLatitudeRef, b'N').decode('ascii')
            lat_dms = gps.get(piexif.GPSIFD.GPSLatitude)
            lon_ref = gps.get(piexif.GPSIFD.GPSLongitudeRef, b'E').decode('ascii')
            lon_dms = gps.get(piexif.GPSIFD.GPSLongitude)
            
            if not lat_dms or not lon_dms:
                return None
                
            lat = _convert_to_degrees(lat_dms)
            lon = _convert_to_degrees(lon_dms)
            
            if lat_ref == 'S': lat = -lat
            if lon_ref == 'W': lon = -lon
            
            accuracy_m = None
            if piexif.GPSIFD.GPSDOP in gps:
                dop_tuple = gps[piexif.GPSIFD.GPSDOP]
                if dop_tuple[1] != 0:
                    dop = float(dop_tuple[0]) / float(dop_tuple[1])
                    accuracy_m = dop * 5.0
            
            logger.info(f"EXIF GPS extraction successful: ({lat}, {lon})")
            return CoordResult(lat=lat, lon=lon, source="EXIF_GPS", accuracy_m=accuracy_m)

        except Exception as e:
            logger.warning(f"Failed to extract EXIF data: {str(e)}")
            return None

    def _from_geotiff(self, image_bytes: bytes) -> Optional[CoordResult]:
        if not rasterio:
            logger.warning("rasterio not installed, skipping GeoTIFF coordinates")
            return None
            
        try:
            with rasterio.MemoryFile(image_bytes) as memfile:
                with memfile.open() as dataset:
                    if not dataset.crs:
                        return None
                        
                    # Calculate center point in original CRS
                    bounds = dataset.bounds
                    cx = (bounds.left + bounds.right) / 2.0
                    cy = (bounds.bottom + bounds.top) / 2.0
                    
                    # Transform to EPSG:4326 (WGS84)
                    transformer = Transformer.from_crs(dataset.crs, "EPSG:4326", always_xy=True)
                    lon, lat = transformer.transform(cx, cy)
                    logger.info(f"GeoTIFF extraction successful: ({lat}, {lon})")
                    return CoordResult(lat=lat, lon=lon, source="GEOTIFF")
        except Exception as e:
            # Not a valid GeoTIFF or could not read bounds
            return None

    async def fetch_satellite_tile(self, lat: float, lon: float, zoom: int = 19) -> SatelliteTile:
        if mercantile is None:
            raise ImportError("mercantile is required for satellite tile fetching. Install with: pip install mercantile")
        # Get tile coordinates
        tile = mercantile.tile(lon, lat, zoom)
        bounds = mercantile.bounds(tile)
        bounds_dict = {
            "west": bounds.west,
            "south": bounds.south,
            "east": bounds.east,
            "north": bounds.north
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            if self.mapbox_token:
                # Use mapbox high-res satellite
                url = f"https://api.mapbox.com/v4/mapbox.satellite/{zoom}/{tile.x}/{tile.y}@2x.jpg90?access_token={self.mapbox_token}"
                resp = await client.get(url)
                resp.raise_for_status()
                image_bytes = resp.content
            else:
                # Fallback to OSM tile (standard Mapnik, not aerial imagery, but works for bounding coords)
                url = f"https://tile.openstreetmap.org/{zoom}/{tile.x}/{tile.y}.png"
                headers = {"User-Agent": "SolarScope/1.0"}
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                image_bytes = resp.content
                
        return SatelliteTile(
            image_bytes=image_bytes,
            tile_x=tile.x,
            tile_y=tile.y,
            tile_z=zoom,
            bounds=bounds_dict,
            width_px=512,
            height_px=512
        )

    def auto_utm_epsg(self, lat: float, lon: float) -> int:
        zone = int((lon + 180) / 6) + 1
        if lat >= 0:
            return 32600 + zone
        else:
            return 32700 + zone

    def pixels_to_m2(self, pixel_count: int, tile: SatelliteTile, utm_zone_epsg: int = 32644) -> float:
        if Transformer is None:
            raise ImportError("pyproj is required for area calculation. Install with: pip install pyproj")
        transformer = Transformer.from_crs("EPSG:4326", f"EPSG:{utm_zone_epsg}", always_xy=True)
        
        # Project tile bounds
        x_west, y_south = transformer.transform(tile.bounds["west"], tile.bounds["south"])
        x_east, y_north = transformer.transform(tile.bounds["east"], tile.bounds["north"])
        
        width_m = abs(x_east - x_west)
        height_m = abs(y_north - y_south)
        
        tile_area_m2 = width_m * height_m
        m2_per_pixel = tile_area_m2 / (tile.width_px * tile.height_px)
        
        return round(pixel_count * m2_per_pixel, 2)
