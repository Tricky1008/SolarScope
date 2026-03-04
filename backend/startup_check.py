"""
startup_check.py — Standalone script to verify all ML models load correctly.
Run this before starting the app: python startup_check.py
Exits with code 0 if XGBoost loads, code 1 if it doesn't.
"""

import sys
import os

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("=" * 64)
    print("  SolarScope ML Model Verification")
    print("=" * 64)
    print()

    # ── Step 1: Check model files exist ──
    from pathlib import Path
    model_dir = Path(__file__).parent / "data" / "models"
    print(f"Model directory: {model_dir}")
    print(f"Directory exists: {model_dir.exists()}")
    print()

    expected_files = [
        "solar_gbm_model.pkl", "feature_scaler.pkl",
        "lr_model.pkl", "lr_scaler.pkl",
        "rf_model.pkl", "rf_scaler.pkl",
        "lgb_model.pkl", "lgb_scaler.pkl",
    ]

    print("File check:")
    for f in expected_files:
        path = model_dir / f
        exists = path.exists()
        size = f" ({path.stat().st_size / 1024:.1f} KB)" if exists else ""
        icon = "[OK]" if exists else "[MISSING]"
        print(f"  {icon} {f}{size}")
    print()

    # ── Step 2: Load models ──
    print("Loading models...")
    try:
        from app.services.ml_service import load_all_models, get_model_status, predict_energy
        loaded = load_all_models()
        status = get_model_status()
    except Exception as e:
        print(f"ERROR: Failed to import ml_service: {e}")
        sys.exit(1)

    print(f"Loaded: {status['total_loaded']}/{status['total_registered']} models")
    print(f"Active model: {status['active_model'] or 'None'}")
    print()

    # ── Step 3: Print model details ──
    print("Model Status:")
    print("-" * 64)
    print(f"{'Model':<25} {'Loaded':<8} {'R²':<8} {'Size':<10}")
    print("-" * 64)
    for key, info in status["models"].items():
        loaded_str = "Yes" if info["loaded"] else "No"
        size_str = f"{info.get('model_size_kb', '-')} KB" if info["loaded"] else "-"
        print(f"  {info['display_name']:<23} {loaded_str:<8} {info['r2']:<8} {size_str:<10}")
    print("-" * 64)
    print()

    # ── Step 4: Run test prediction with Mumbai coordinates ──
    print("Test Prediction — Mumbai (lat=19.08, lon=72.88, roof=150m²)")
    print("-" * 64)

    test_features = {
        "lat": 19.08,
        "lon": 72.88,
        "roof_area_m2": 150.0,
        "ghi": 5.2,
        "dni": 4.8,
        "pvout": 1600.0,
        "avg_temp": 27.5,
        "usability_factor": 0.75,
        "panel_efficiency": 0.20,
        "tilt_angle": 15.0,
    }

    result = predict_energy(test_features)

    if result["models_used"] > 0:
        print(f"{'Model':<25} {'Prediction (kWh)':<20} {'R²':<8}")
        print("-" * 53)
        for key, pred in result["predictions"].items():
            val = f"{pred['value']:,.1f}" if pred.get("value") is not None else "ERROR"
            r2 = pred.get("r2", "-")
            primary = " (*)" if key == "xgboost" else ""
            print(f"  {pred['display_name']:<23} {val:<20} {r2:<8}{primary}")
        print("-" * 53)
        print(f"  {'Ensemble Average':<23} {result['ensemble_avg']:,.1f}")
        print(f"  Confidence: {result['confidence'].upper()}")
    else:
        print("  No models available for prediction.")

    print()

    # ── Step 5: Exit code ──
    xgboost_loaded = "xgboost" in loaded
    if xgboost_loaded:
        print("[OK] XGBoost (primary model) loaded successfully")
        print("[OK] All checks passed")
        sys.exit(0)
    else:
        print("[ERROR] XGBoost (primary model) NOT loaded")
        print("[ERROR] Check failed — primary model is missing")
        sys.exit(1)


if __name__ == "__main__":
    main()
