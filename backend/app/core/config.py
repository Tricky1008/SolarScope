from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://solarscrope:solarscrope@localhost:5432/solarscrope"
    REDIS_URL: str = "redis://localhost:6379/0"
    NASA_POWER_API: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org"
    SECRET_KEY: str = "dev-secret-key"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    DEBUG: Union[bool, str] = True
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()
