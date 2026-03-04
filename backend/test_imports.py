import sys
import traceback

print("Testing imports...", flush=True)

try:
    print("  config...", flush=True)
    from app.core.config import settings
    print("  config OK", flush=True)
except Exception as e:
    print(f"  config FAILED: {e}", flush=True)
    traceback.print_exc()

try:
    print("  database...", flush=True)
    from app.core.database import Base
    print("  database OK", flush=True)
except Exception as e:
    print(f"  database FAILED: {e}", flush=True)
    traceback.print_exc()

try:
    print("  models...", flush=True)
    from app.models.models import Building
    print("  models OK", flush=True)
except Exception as e:
    print(f"  models FAILED: {e}", flush=True)
    traceback.print_exc()

try:
    print("  schemas...", flush=True)
    from app.schemas.schemas import SolarAnalysisResponse
    print("  schemas OK", flush=True)
except Exception as e:
    print(f"  schemas FAILED: {e}", flush=True)
    traceback.print_exc()

try:
    print("  routes...", flush=True)
    from app.api.routes import router
    print("  routes OK", flush=True)
except Exception as e:
    print(f"  routes FAILED: {e}", flush=True)
    traceback.print_exc()

try:
    print("  main app...", flush=True)
    from app.main import app
    print("  main OK", flush=True)
except Exception as e:
    print(f"  main FAILED: {e}", flush=True)
    traceback.print_exc()

print("\nAll done!", flush=True)
