"""
image_analysis_service.py
─────────────────────────
Rooftop image analysis pipeline using locally trained ML models.
No external AI APIs are used. All inference runs on your own models.

Pipeline:
  image_bytes
    → preprocess_image()          Step 1: resize, normalize, RGB
    → run_segmentation()          Step 2: binary roof mask
    → compute_roof_area()         Step 3: m² from pixel count + GSD
    → detect_obstructions()       Step 4: YOLO detection (optional)
    → infer_roof_orientation()    Step 5: facing direction + tilt estimate
    → returns roof_data dict      feeds into solar_service.calculate_from_image_analysis()
"""

import logging
import os
from io import BytesIO

logger = logging.getLogger("solarscope.image_analysis")

# Optional ML libraries
try:
    import cv2
    import numpy as np
    from PIL import Image, ImageFilter
    _DEPENDENCIES_LOADED = True
except ImportError:
    _DEPENDENCIES_LOADED = False
    logger.warning("Image processing libraries (cv2, numpy, PIL) not found. Image analysis will not work.")

from app.core.config import settings

logger = logging.getLogger("solarscope.image_analysis")

# ─────────────────────────────────────────────────────────
# Global model handles (loaded once at startup)
# ─────────────────────────────────────────────────────────
_seg_model = None
_det_model = None
_seg_framework = None  # "pytorch" | "tensorflow" | "onnx" | "yolo" | "fallback"


# ─────────────────────────────────────────────────────────
# STARTUP: load_models()
# ─────────────────────────────────────────────────────────
def load_models():
    """
    Load all trained models into memory at application startup.
    Supports four model formats. Uncomment the block that matches your model.
    """
    global _seg_model, _det_model, _seg_framework

    models_dir = settings.MODELS_DIR
    seg_file = os.path.join(models_dir, settings.SEG_MODEL_FILE)
    det_file = os.path.join(models_dir, settings.DET_MODEL_FILE) if settings.DET_MODEL_FILE else None

    # ── OPTION A: PyTorch (.pth) ────────────────────────────
    # import torch
    # from app.ml.seg_model import SegmentationModel
    # if os.path.exists(seg_file):
    #     _seg_model = SegmentationModel()
    #     state_dict = torch.load(seg_file, map_location="cpu")
    #     _seg_model.load_state_dict(state_dict)
    #     _seg_model.eval()
    #     _seg_framework = "pytorch"
    #     logger.info(f"PyTorch segmentation model loaded: {seg_file}")
    # else:
    #     _seg_framework = "fallback"

    # ── OPTION B: TensorFlow / Keras (.h5) ──────────────────
    # import tensorflow as tf
    # if os.path.exists(seg_file):
    #     _seg_model = tf.keras.models.load_model(seg_file)
    #     _seg_framework = "tensorflow"
    #     logger.info(f"TensorFlow model loaded: {seg_file}")
    # else:
    #     _seg_framework = "fallback"

    # ── OPTION C: ONNX Runtime (.onnx) — RECOMMENDED ────────
    # import onnxruntime as ort
    # if os.path.exists(seg_file):
    #     providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    #     _seg_model = ort.InferenceSession(seg_file, providers=providers)
    #     _seg_framework = "onnx"
    #     logger.info(f"ONNX model loaded: {seg_file}")
    # else:
    #     _seg_framework = "fallback"

    # ── OPTION D: Ultralytics YOLO (.pt) ────────────────────
    # from ultralytics import YOLO
    # if os.path.exists(seg_file):
    #     _seg_model = YOLO(seg_file)
    #     _seg_framework = "yolo"
    #     logger.info(f"YOLO model loaded: {seg_file}")
    # else:
    #     _seg_framework = "fallback"

    # ── DEFAULT (no model file) ─────────────────────────────
    _seg_framework = "fallback"
    logger.warning(
        "No segmentation model loaded — using brightness-heuristic fallback. "
        "Add your model file to backend/models/"
    )

    # ── Object detection model (optional) ───────────────────
    if det_file and os.path.exists(det_file):
        try:
            from ultralytics import YOLO as _YOLO
            _det_model = _YOLO(det_file)
            logger.info(f"Detection model loaded: {det_file}")
        except Exception as e:
            logger.warning(f"Could not load detection model: {e}")


# ─────────────────────────────────────────────────────────
# STEP 1: preprocess_image()
# ─────────────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> tuple:
    """Load image bytes, convert to RGB, resize for model input."""
    target = settings.MODEL_INPUT_SIZE
    img = Image.open(BytesIO(image_bytes))

    if img.mode != "RGB":
        img = img.convert("RGB")

    original_size = (img.width, img.height)
    img_resized = img.resize((target, target), Image.LANCZOS)
    img_array = np.array(img_resized, dtype=np.float32) / 255.0

    logger.debug(f"Preprocessed image: {original_size} → ({target}, {target})")
    return img, img_array, original_size


# ─────────────────────────────────────────────────────────
# STEP 2: run_segmentation()
# ─────────────────────────────────────────────────────────
def run_segmentation(img_array: np.ndarray) -> np.ndarray:
    """Run segmentation model → binary mask (H, W) uint8."""
    threshold = settings.SEG_CONFIDENCE_THRESHOLD

    if _seg_framework == "pytorch":
        import torch
        tensor = torch.from_numpy(img_array.transpose(2, 0, 1)).unsqueeze(0)
        with torch.no_grad():
            logits = _seg_model(tensor)
        probs = torch.sigmoid(logits[0, 0]).numpy()
        return (probs > threshold).astype(np.uint8)

    if _seg_framework == "tensorflow":
        inp = img_array[np.newaxis]
        probs = _seg_model.predict(inp, verbose=0)[0, ..., 0]
        return (probs > threshold).astype(np.uint8)

    if _seg_framework == "onnx":
        inp_name = _seg_model.get_inputs()[0].name
        inp = img_array.transpose(2, 0, 1)[np.newaxis].astype(np.float32)
        out = _seg_model.run(None, {inp_name: inp})[0]
        probs = out[0, 0]
        return (probs > threshold).astype(np.uint8)

    if _seg_framework == "yolo":
        img_uint8 = (img_array * 255).astype(np.uint8)
        results = _seg_model(img_uint8, verbose=False, conf=threshold)
        h, w = img_array.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        if results[0].masks is not None:
            for m in results[0].masks.data:
                mask = np.logical_or(mask, m.cpu().numpy() > 0.5).astype(np.uint8)
        return mask

    # ── Fallback: OpenCV HSV + Otsu segmentation ──────────────
    # Adapted from DhruvGrover28/SolarScope-AI
    logger.debug("Using OpenCV HSV + Otsu fallback segmentation")
    img_uint8 = (img_array * 255).astype(np.uint8)

    # Strategy 1: HSV color-range mask (catches teal/blue-grey roofs well)
    hsv_img = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2HSV)
    lower_teal = np.array([75, 50, 50])
    upper_teal = np.array([105, 255, 255])
    mask_color = cv2.inRange(hsv_img, lower_teal, upper_teal)

    # Strategy 2: Otsu threshold on grayscale
    gray = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2GRAY)
    _, mask_gray = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Pick whichever strategy captured more roof pixels
    h, w = img_uint8.shape[:2]
    if np.sum(mask_color) > (h * w / 10):
        mask_raw = mask_color
    else:
        mask_raw = mask_gray

    # Morphological cleanup
    kernel = np.ones((5, 5), np.uint8)
    mask_raw = cv2.morphologyEx(mask_raw, cv2.MORPH_OPEN, kernel, iterations=2)
    mask_raw = cv2.morphologyEx(mask_raw, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Keep only the largest connected component (the roof)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_raw, connectivity=8)
    final_mask = np.zeros_like(mask_raw)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        final_mask[labels == largest_label] = 255

    return (final_mask > 0).astype(np.uint8)


# ─────────────────────────────────────────────────────────
# STEP 3: compute_roof_area()
# ─────────────────────────────────────────────────────────
def compute_roof_area(mask: np.ndarray, original_size: tuple) -> dict:
    """Convert binary pixel mask to real-world area in m²."""
    gsd = settings.DEFAULT_GSD_M_PER_PX
    usability = settings.ROOF_USABILITY_FACTOR

    model_h, model_w = mask.shape
    orig_w, orig_h = original_size

    scale_x = orig_w / model_w
    scale_y = orig_h / model_h
    roof_pixels_at_original = float(np.sum(mask)) * scale_x * scale_y

    pixel_area_m2 = gsd ** 2
    total_area_m2 = round(roof_pixels_at_original * pixel_area_m2, 1)
    usable_area_m2 = round(total_area_m2 * usability, 1)
    usable_pct = int(usability * 100)

    # Sanity bounds
    total_area_m2 = max(20.0, min(total_area_m2, 500.0))
    usable_area_m2 = max(15.0, min(usable_area_m2, 380.0))

    coverage = float(np.sum(mask)) / (model_h * model_w)
    logger.info(f"Mask coverage: {coverage:.2%} → total: {total_area_m2} m², usable: {usable_area_m2} m²")

    return {
        "total_roof_area_m2": total_area_m2,
        "usable_area_m2": usable_area_m2,
        "usable_area_percent": usable_pct,
        "mask_coverage_ratio": round(coverage, 4),
    }


# ─────────────────────────────────────────────────────────
# STEP 4: detect_obstructions()
# ─────────────────────────────────────────────────────────
OBSTRUCTION_CLASS_MAP = {
    0: "chimney", 1: "HVAC unit", 2: "skylight", 3: "water tank",
    4: "vent pipe", 5: "solar panel (existing)", 6: "antenna", 7: "staircase access",
}

def detect_obstructions(img_array: np.ndarray) -> list:
    """Run optional YOLO detection for rooftop obstructions."""
    if _det_model is None:
        return []

    img_uint8 = (img_array * 255).astype(np.uint8)
    results = _det_model(img_uint8, verbose=False, conf=0.35)
    detected = set()
    for box in results[0].boxes:
        cls_id = int(box.cls[0].item())
        name = OBSTRUCTION_CLASS_MAP.get(cls_id, f"obstruction_{cls_id}")
        detected.add(name)
    return sorted(detected)


# ─────────────────────────────────────────────────────────
# STEP 5: infer_roof_orientation()
# ─────────────────────────────────────────────────────────
def infer_roof_orientation(mask: np.ndarray) -> dict:
    """Estimate roof orientation and tilt from mask shape heuristic."""
    h, w = mask.shape
    if np.sum(mask) == 0:
        return {"roof_orientation": "mixed", "roof_tilt_degrees": 15, "shading_factor": 0.80}

    rows = np.sum(mask, axis=1).astype(float)
    cols = np.sum(mask, axis=0).astype(float)

    cy = float(np.average(np.arange(h), weights=rows + 1e-9)) / h
    cx = float(np.average(np.arange(w), weights=cols + 1e-9)) / w

    dy = cy - 0.5
    dx = cx - 0.5
    coverage = float(np.sum(mask)) / (h * w)

    if coverage > 0.55:
        return {"roof_orientation": "flat", "roof_tilt_degrees": 0, "shading_factor": 0.90}

    if abs(dy) < 0.05 and abs(dx) < 0.05:
        orientation, tilt = "mixed", 15
    elif abs(dy) >= abs(dx):
        orientation = "south-facing" if dy < 0 else "north-facing"
        tilt = min(45, int(abs(dy) * 100))
    else:
        orientation = "east-facing" if dx < 0 else "west-facing"
        tilt = min(45, int(abs(dx) * 100))

    # Estimate shading from mask edge density
    mask_pil = Image.fromarray(mask * 255)
    edge_img = mask_pil.filter(ImageFilter.FIND_EDGES())
    edge_ratio = float(np.mean(np.array(edge_img))) / 255.0
    shading = round(max(0.55, min(1.0, 1.0 - edge_ratio * 3)), 2)

    return {
        "roof_orientation": orientation,
        "roof_tilt_degrees": max(5, tilt),
        "shading_factor": shading,
    }


# ─────────────────────────────────────────────────────────
# STEP 6: generate_mask_png()
# ─────────────────────────────────────────────────────────
def generate_mask_png(mask: np.ndarray, original_size: tuple) -> bytes:
    """Render binary mask as coloured semi-transparent overlay PNG."""
    h_model, w_model = mask.shape
    orig_w, orig_h = original_size

    rgba = np.zeros((h_model, w_model, 4), dtype=np.uint8)
    roof = mask == 1
    rgba[roof] = [163, 230, 53, 153]   # lime-400, alpha=0.6
    rgba[~roof] = [0, 0, 0, 0]

    mask_img = Image.fromarray(rgba, mode="RGBA")
    mask_img = mask_img.resize((orig_w, orig_h), Image.NEAREST)

    buf = BytesIO()
    mask_img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────
# MASTER FUNCTION: analyze_roof_image()
# ─────────────────────────────────────────────────────────
async def analyze_roof_image(image_bytes: bytes) -> dict:
    """Run the complete rooftop analysis pipeline using trained models."""
    if not _DEPENDENCIES_LOADED:
        return {
            "error": "Image analysis dependencies not installed. Please run `pip install opencv-python Pillow numpy`",
            "model_confidence": 0,
            "mask_bytes": b"",
        }

    img_original, img_array, original_size = preprocess_image(image_bytes)
    mask = run_segmentation(img_array)
    area_info = compute_roof_area(mask, original_size)
    obstructions = detect_obstructions(img_array)
    orient_info = infer_roof_orientation(mask)
    mask_bytes = generate_mask_png(mask, original_size)

    # ── Confidence scoring ──────────────────────────────────
    if _seg_framework != "fallback":
        confidence = 0.82
    else:
        # DhruvGrover28/SolarScope-AI confidence formula:
        # component_ratio × 0.6 + edge_quality × 0.4
        total_mask_pixels = float(np.sum(mask))
        mask_uint8 = (mask * 255).astype(np.uint8)
        num_labels_conf, labels_conf, stats_conf, _ = cv2.connectedComponentsWithStats(mask_uint8, connectivity=8)
        if num_labels_conf > 1:
            largest_cc_pixels = float(stats_conf[1 + np.argmax(stats_conf[1:, cv2.CC_STAT_AREA]), cv2.CC_STAT_AREA])
            cc_ratio = largest_cc_pixels / total_mask_pixels if total_mask_pixels > 0 else 0.0
        else:
            largest_cc_pixels = 0.0
            cc_ratio = 0.0

        edges = cv2.Canny(mask_uint8, 50, 150)
        edge_px = float(np.sum(edges > 0))
        ideal_perimeter = 4 * np.sqrt(largest_cc_pixels) if largest_cc_pixels > 0 else 1.0
        edge_quality = min(edge_px / ideal_perimeter, 1.0)

        confidence = round(float(np.clip(cc_ratio * 0.6 + edge_quality * 0.4, 0.0, 1.0)), 2)

    return {
        **area_info,
        **orient_info,
        "obstructions": obstructions,
        "model_name": f"Seg: {settings.SEG_MODEL_FILE} [{_seg_framework}]",
        "model_confidence": confidence,
        "mask_bytes": mask_bytes,
    }
