"""
ml_service.py — ML Model Manager for SolarScope
Loads 4 trained models (XGBoost, LR, RF, LightGBM) at import time,
provides predict_energy(), get_best_prediction(), and get_model_status().
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

import numpy as np

logger = logging.getLogger("solarscope.ml")

# ── Feature Order (must match training) ──────────────────────────────────
FEATURES = [
    "lat", "lon", "roof_area_m2", "ghi", "dni", "pvout",
    "avg_temp", "usability_factor", "panel_efficiency", "tilt_angle"
]

# ── Model Registry ───────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "models"

MODEL_REGISTRY = {
    "xgboost": {
        "model_file": "solar_gbm_model.pkl",
        "scaler_file": "feature_scaler.pkl",
        "display_name": "XGBoost (GBM)",
        "r2": 0.9938,
        "mae": 1298,
        "priority": 1,  # highest priority — primary model
        "skip_scaler": False,  # Feature scaler is now locally retrained and compatible
    },
    "random_forest": {
        "model_file": "rf_model.pkl",
        "scaler_file": "rf_scaler.pkl",
        "display_name": "Random Forest",
        "r2": 0.9930,
        "mae": None,
        "priority": 2,
        "skip_scaler": False,
    },
    "lightgbm": {
        "model_file": "lgb_model.pkl",
        "scaler_file": "lgb_scaler.pkl",
        "display_name": "LightGBM",
        "r2": 0.9929,
        "mae": None,
        "priority": 3,
        "skip_scaler": False,  # trained on scaled features
    },
    "linear_regression": {
        "model_file": "lr_model.pkl",
        "scaler_file": "lr_scaler.pkl",
        "display_name": "Linear Regression",
        "r2": 0.9692,
        "mae": None,
        "priority": 4,
        "skip_scaler": False,
    },
}

# ── Loaded Models Storage ────────────────────────────────────────────────
_loaded_models: Dict[str, Dict[str, Any]] = {}


def load_all_models() -> Dict[str, Dict[str, Any]]:
    """
    Load all registered models from disk using joblib.
    Skips gracefully if a file is missing; never crashes.
    """
    global _loaded_models
    _loaded_models = {}

    try:
        import joblib
    except ImportError:
        logger.error("joblib not installed — cannot load ML models")
        return _loaded_models

    for model_key, meta in MODEL_REGISTRY.items():
        model_path = MODEL_DIR / meta["model_file"]
        scaler_path = MODEL_DIR / meta["scaler_file"]

        if not model_path.exists():
            logger.warning(f"[ML] Model file missing: {model_path} — skipping {meta['display_name']}")
            continue

        try:
            model = joblib.load(model_path)
            scaler = None
            if scaler_path.exists():
                scaler = joblib.load(scaler_path)
            else:
                logger.warning(f"[ML] Scaler file missing: {scaler_path} — will use unscaled features for {meta['display_name']}")

            model_size = model_path.stat().st_size
            scaler_size = scaler_path.stat().st_size if scaler_path.exists() else 0

            _loaded_models[model_key] = {
                "model": model,
                "scaler": scaler,
                "skip_scaler": meta.get("skip_scaler", False),
                "display_name": meta["display_name"],
                "r2": meta["r2"],
                "mae": meta["mae"],
                "priority": meta["priority"],
                "model_size_bytes": model_size,
                "scaler_size_bytes": scaler_size,
            }

            logger.info(
                f"[ML] ✓ Loaded {meta['display_name']} "
                f"(model={model_size/1024:.1f}KB, scaler={scaler_size/1024:.1f}KB, R²={meta['r2']})"
            )
        except Exception as e:
            logger.error(f"[ML] ✗ Failed to load {meta['display_name']}: {e}")

    loaded_count = len(_loaded_models)
    total_count = len(MODEL_REGISTRY)
    logger.info(f"[ML] Model loading complete: {loaded_count}/{total_count} models ready")

    return _loaded_models


def _build_feature_array(features_dict: Dict[str, float]) -> np.ndarray:
    """Build a numpy array from a feature dict in the correct order."""
    values = []
    for feat in FEATURES:
        val = features_dict.get(feat, 0.0)
        values.append(float(val))
    return np.array([values])


def predict_energy(features_dict: Dict[str, float]) -> Dict[str, Any]:
    """
    Run all loaded models on the input features.
    Returns a dict with each model's prediction plus ensemble average.
    """
    if not _loaded_models:
        return {
            "predictions": {},
            "ensemble_avg": None,
            "models_used": 0,
            "error": "No ML models loaded"
        }

    raw_features = _build_feature_array(features_dict)
    predictions = {}

    for model_key, entry in _loaded_models.items():
        try:
            features = raw_features.copy()
            if entry["scaler"] is not None and not entry.get("skip_scaler", False):
                features = entry["scaler"].transform(features)

            pred = entry["model"].predict(features)
            pred_value = float(pred[0])
            # Clamp to non-negative — energy can't be negative
            pred_value = max(0.0, pred_value)

            predictions[model_key] = {
                "value": round(pred_value, 1),
                "display_name": entry["display_name"],
                "r2": entry["r2"],
                "mae": entry["mae"],
            }
        except Exception as e:
            logger.error(f"[ML] Prediction error for {entry['display_name']}: {e}")
            predictions[model_key] = {
                "value": None,
                "display_name": entry["display_name"],
                "r2": entry["r2"],
                "error": str(e),
            }

    # Ensemble average (only from successful predictions)
    valid_values = [p["value"] for p in predictions.values() if p.get("value") is not None]
    ensemble_avg = round(sum(valid_values) / len(valid_values), 1) if valid_values else None

    # Confidence: if all models agree within 10% => High, 25% => Medium, else Low
    confidence = "unknown"
    if len(valid_values) >= 2 and ensemble_avg and ensemble_avg > 0:
        max_dev = max(abs(v - ensemble_avg) / ensemble_avg * 100 for v in valid_values)
        if max_dev <= 10:
            confidence = "high"
        elif max_dev <= 25:
            confidence = "medium"
        else:
            confidence = "low"

    return {
        "predictions": predictions,
        "ensemble_avg": ensemble_avg,
        "confidence": confidence,
        "models_used": len(valid_values),
    }


def get_best_prediction(features_dict: Dict[str, float]) -> Optional[float]:
    """
    Returns the XGBoost prediction as primary.
    Falls back to next available model by priority if XGBoost is not loaded.
    """
    raw_features = _build_feature_array(features_dict)

    # Sort loaded models by priority
    sorted_models = sorted(_loaded_models.items(), key=lambda x: x[1]["priority"])

    for model_key, entry in sorted_models:
        try:
            features = raw_features.copy()
            if entry["scaler"] is not None and not entry.get("skip_scaler", False):
                features = entry["scaler"].transform(features)

            pred = entry["model"].predict(features)
            pred_value = max(0.0, float(pred[0]))

            # Sanity check: skip nonsensical predictions (< 100 kWh for any real roof)
            if pred_value < 100.0:
                logger.warning(f"[ML] {entry['display_name']} predicted {pred_value:.1f} kWh (too low), trying next")
                continue

            logger.info(f"[ML] Best prediction from {entry['display_name']}: {pred_value:.1f} kWh")
            return pred_value
        except Exception as e:
            logger.warning(f"[ML] {entry['display_name']} failed, trying next: {e}")
            continue

    logger.warning("[ML] All models failed — returning None (will fall back to formula)")
    return None


def get_model_status() -> Dict[str, Any]:
    """Return which models are loaded, their metadata, and the active primary model."""
    models_info = {}
    active_model = None

    # Sort by priority to find active
    sorted_keys = sorted(
        _loaded_models.keys(),
        key=lambda k: _loaded_models[k]["priority"]
    )

    for model_key in sorted_keys:
        entry = _loaded_models[model_key]
        info = {
            "display_name": entry["display_name"],
            "loaded": True,
            "r2": entry["r2"],
            "mae": entry["mae"],
            "model_size_kb": round(entry["model_size_bytes"] / 1024, 1),
            "has_scaler": entry["scaler"] is not None,
            "priority": entry["priority"],
        }
        models_info[model_key] = info

        if active_model is None:
            active_model = model_key

    # Also report missing models
    for model_key, meta in MODEL_REGISTRY.items():
        if model_key not in models_info:
            models_info[model_key] = {
                "display_name": meta["display_name"],
                "loaded": False,
                "r2": meta["r2"],
                "mae": meta["mae"],
                "priority": meta["priority"],
            }

    return {
        "total_registered": len(MODEL_REGISTRY),
        "total_loaded": len(_loaded_models),
        "active_model": active_model,
        "models": models_info,
        "model_dir": str(MODEL_DIR),
    }


# ── Auto-load on import ─────────────────────────────────────────────────
load_all_models()
