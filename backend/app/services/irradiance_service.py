import httpx
import asyncio
from typing import Optional
from app.schemas.schemas import IrradianceData
from app.core.config import settings


# Monthly irradiance distribution factors (relative weights per month)
# These represent typical seasonal patterns - adjust per region
MONTHLY_FACTORS = [0.70, 0.78, 0.90, 1.05, 1.12, 1.10, 1.08, 1.05, 0.95, 0.85, 0.72, 0.68]


async def fetch_nasa_power(lat: float, lon: float) -> Optional[dict]:
    """Fetch solar irradiance data from NASA POWER API."""
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,ALLSKY_SFC_SW_DNI",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": "2019",
        "end": "2023",
        "format": "JSON",
        "temporal-average": "CLIMATOLOGY",
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                "https://power.larc.nasa.gov/api/temporal/climatology/point",
                params=params
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"NASA POWER fetch error: {e}")
        return None


def parse_nasa_response(data: dict) -> Optional[IrradianceData]:
    """Parse NASA POWER API response into IrradianceData."""
    try:
        props = data["properties"]["parameter"]
        ghi_monthly = props.get("ALLSKY_SFC_SW_DWN", {})
        dni_monthly = props.get("ALLSKY_SFC_SW_DNI", {})
        temp_monthly = props.get("T2M", {})

        # Annual averages (kWh/m2/day)
        ghi = ghi_monthly.get("ANN", 4.5)
        dni = dni_monthly.get("ANN", 3.8)
        avg_temp = temp_monthly.get("ANN", 25.0)

        # PVOUT estimate: GHI * 365 * performance_ratio / 1 (normalized to kWh/kWp/year)
        pvout = ghi * 365 * 0.80

        return IrradianceData(
            ghi=round(ghi, 3),
            dni=round(dni, 3),
            pvout=round(pvout, 1),
            avg_temp=round(avg_temp, 1),
            source="NASA_POWER"
        )
    except Exception as e:
        print(f"NASA parse error: {e}")
        return None


def get_fallback_irradiance(lat: float, lon: float) -> IrradianceData:
    """
    Fallback irradiance estimation based on latitude when NASA API is unavailable.
    Uses simplified solar irradiance model.
    """
    abs_lat = abs(lat)

    # Simple latitude-based GHI estimation
    if abs_lat < 15:
        ghi = 5.8
    elif abs_lat < 25:
        ghi = 5.5
    elif abs_lat < 35:
        ghi = 5.0
    elif abs_lat < 45:
        ghi = 4.2
    elif abs_lat < 55:
        ghi = 3.5
    else:
        ghi = 2.8

    # India boost (high irradiance zone)
    if 8 <= lat <= 37 and 68 <= lon <= 97:
        ghi = min(ghi + 0.5, 6.5)

    dni = ghi * 0.85
    pvout = ghi * 365 * 0.80
    avg_temp = max(5, 35 - abs_lat * 0.5)

    return IrradianceData(
        ghi=round(ghi, 3),
        dni=round(dni, 3),
        pvout=round(pvout, 1),
        avg_temp=round(avg_temp, 1),
        source="ESTIMATED"
    )


async def get_irradiance(lat: float, lon: float) -> IrradianceData:
    """Main entry point: fetch irradiance with NASA fallback to estimation."""
    nasa_data = await fetch_nasa_power(lat, lon)
    if nasa_data:
        parsed = parse_nasa_response(nasa_data)
        if parsed:
            return parsed
    return get_fallback_irradiance(lat, lon)


def get_monthly_generation(annual_kwh: float) -> list:
    """Distribute annual generation across months using seasonal factors."""
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    factor_sum = sum(MONTHLY_FACTORS)
    monthly = []
    for i, month in enumerate(months):
        kwh = round(annual_kwh * MONTHLY_FACTORS[i] / factor_sum, 1)
        monthly.append({"month": month, "kwh": kwh})
    return monthly
