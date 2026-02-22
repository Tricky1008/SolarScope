import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.routes import router
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("solarscope")

app = FastAPI(
    title="SolarScope API",
    description="Rooftop Solar Potential Calculator — REST API with ML Models",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Preload ML models into memory on app startup."""
    logger.info("=" * 60)
    logger.info("SolarScope API v1.0.0 — Starting up")
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

    logger.info("=" * 60)
    logger.info("SolarScope API ready — http://localhost:8000/docs")
    logger.info("=" * 60)


@app.get("/")
async def root():
    return {
        "name": "SolarScope API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
