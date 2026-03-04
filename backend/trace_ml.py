import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

print(f"DEBUG: sys.path[0] = {sys.path[0]}")

try:
    from app.services import ml_service
    print(f"DEBUG: ml_service.MODEL_DIR = {ml_service.MODEL_DIR}")
    print(f"DEBUG: MODEL_DIR exists = {ml_service.MODEL_DIR.exists()}")
    
    if ml_service.MODEL_DIR.exists():
        print("DEBUG: Directory contents:")
        for item in ml_service.MODEL_DIR.iterdir():
            print(f"  - {item.name}")
            
    # Try to load models
    print("DEBUG: Calling load_all_models()...")
    loaded = ml_service.load_all_models()
    print(f"DEBUG: Loaded models = {list(loaded.keys())}")
    
    status = ml_service.get_model_status()
    print(f"DEBUG: Model status = {status}")

except Exception as e:
    import traceback
    print(f"DEBUG: Error occurred: {e}")
    traceback.print_exc()
