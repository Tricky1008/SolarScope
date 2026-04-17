import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.routes import router
from app.api.image_routes import image_router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("solarscope")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload ML models into memory and check configuration on app startup."""
    logger.info("=" * 60)
    logger.info("  SolarScope Backend Starting v2.0.0")
    logger.info("=" * 60)
    
    # Startup checks
    checks = {
        "Supabase Auth":  bool(settings.SUPABASE_URL and "supabase.co" in settings.SUPABASE_URL),
        "Anthropic AI":   bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY.startswith("sk-ant")),
        "Mapbox Tiles":   bool(settings.MAPBOX_TOKEN and settings.MAPBOX_TOKEN.startswith("pk.")),
        "SAM2 Model":     os.path.exists(settings.SAM2_CHECKPOINT) if hasattr(settings, 'SAM2_CHECKPOINT') else False,
        "Firebase Push":  bool(getattr(settings, 'FIREBASE_SERVER_KEY', '')),
    }
    for svc, ok in checks.items():
        icon = "✓" if ok else "✗"
        level = "configured" if ok else "NOT configured (optional)"
        logger.info(f"  {icon}  {svc}: {level}")
    logger.info("=" * 60)

    try:
        from app.services.ml_service import get_model_status, load_all_models

        # Force reload to ensure models are in memory
        load_all_models()
        status = get_model_status()

        logger.info(f"[Startup] ML Models: {status['total_loaded']}/{status['total_registered']} loaded")
        logger.info(f"[Startup] Active model: {status['active_model'] or 'None (formula fallback)'}")
        logger.info(f"[Startup] Model directory: {status['model_dir']}")

        for key, info in status["models"].items():
            icon = "✓" if info["loaded"] else "✗"
            size = f" ({info.get('model_size_kb', '?')}KB)" if info["loaded"] else ""
            logger.info(f"  {icon} {info['display_name']}: R²={info['r2']}{size}")

    except Exception as e:
        logger.warning(f"[Startup] ML model loading failed (non-fatal): {e}")
        logger.info("[Startup] App will run with formula-based calculations only")

    # Load image analysis models (segmentation, detection)
    try:
        from app.services.image_analysis_service import load_models as load_image_models
        load_image_models()
        logger.info("[Startup] Image analysis models loaded")
    except Exception as e:
        logger.warning(f"[Startup] Image model loading skipped: {e}")

    logger.info("=" * 60)
    logger.info("SolarScope API ready — http://localhost:8000/docs")
    logger.info("=" * 60)
    
    yield  # App runs here

app = FastAPI(
    title="SolarScope API",
    description="Rooftop Solar Potential Calculator — REST API with ML Models",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)
app.include_router(image_router)


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "version": "2.0.0",
        "services": {
            "supabase": bool(settings.SUPABASE_URL and "supabase.co" in settings.SUPABASE_URL),
            "anthropic": bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY.startswith("sk-ant")),
            "mapbox": bool(settings.MAPBOX_TOKEN and settings.MAPBOX_TOKEN.startswith("pk.")),
            "sam2": os.path.exists(settings.SAM2_CHECKPOINT) if hasattr(settings, 'SAM2_CHECKPOINT') else False,
        }
    }

@app.get("/")
async def root():
    return {
        "name": "SolarScope API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running"
    }
