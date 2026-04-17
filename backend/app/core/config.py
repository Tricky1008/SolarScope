from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",          # CRITICAL: prevents crash for unknown .env keys
        case_sensitive=False
    )

    # ── Database ──────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://solarscrope:solarscrope@localhost:5432/solarscrope"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── CORS ──────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,capacitor://localhost,http://10.0.2.2:5173"

    # ── Supabase (optional auth) ───────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Anthropic Vision AI ───────────────────
    ANTHROPIC_API_KEY: str = ""

    # ── Mapbox Satellite ──────────────────────
    MAPBOX_TOKEN: str = ""

    # ── SAM2 Segmentation ─────────────────────
    SAM2_CHECKPOINT: str = "./checkpoints/sam2.1_hiera_large.pt"
    SAM2_CONFIG: str = "sam2_hiera_large.yaml"
    TORCH_DEVICE: str = "cpu"

    # ── Solar Defaults ────────────────────────
    DEFAULT_TARIFF_PER_KWH: float = 8.0
    DEFAULT_COST_PER_KWP: float = 60000.0
    DEFAULT_CURRENCY: str = "INR"

    # ── Firebase (mobile push notifications) ──
    FIREBASE_SERVER_KEY: str = ""

    # ── App ───────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-use-random-32-chars"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
