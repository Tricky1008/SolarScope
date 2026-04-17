"""
config.py  — additions for the Rooftop Image Analysis Pipeline
Merge these constants into your existing config.py.
"""

import os
from pathlib import Path

# ── Existing settings (keep whatever you already have) ──────────────────────
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./solarscope.db")
# ...

# ── NEW: ML / Image Analysis ─────────────────────────────────────────────────

# Directory where model files live (relative to backend root)
MODELS_DIR: str = os.getenv("MODELS_DIR", str(Path(__file__).parent / "models"))

# Filename of the segmentation model inside MODELS_DIR.
# Leave blank to use the brightness-heuristic fallback.
SEG_MODEL_FILE: str = os.getenv("SEG_MODEL_FILE", "")

# Ground Sampling Distance — metres per pixel in a typical aerial/satellite image.
# 0.15 m/px ≈ standard satellite imagery at ~15 cm resolution.
# Adjust per your image source (e.g. 0.30 for lower-res tiles).
DEFAULT_GSD_M_PER_PX: float = float(os.getenv("DEFAULT_GSD_M_PER_PX", "0.15"))

# Both axes of the square input fed to the segmentation model.
MODEL_INPUT_SIZE: int = int(os.getenv("MODEL_INPUT_SIZE", "512"))

# Probability threshold above which a pixel is classified as roof.
SEG_CONFIDENCE_THRESHOLD: float = float(os.getenv("SEG_CONFIDENCE_THRESHOLD", "0.5"))

# Fraction of detected roof area assumed to be usable for panels
# (accounts for edges, obstructions, set-backs).
ROOF_USABILITY_FACTOR: float = float(os.getenv("ROOF_USABILITY_FACTOR", "0.75"))
