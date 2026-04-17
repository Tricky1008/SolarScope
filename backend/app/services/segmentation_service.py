import logging
import io
import base64
from dataclasses import dataclass
from typing import Tuple, List, Optional
logger = logging.getLogger(__name__)

try:
    import numpy as np
    from PIL import Image
    import cv2
    _DEPENDENCIES_LOADED = True
except ImportError:
    _DEPENDENCIES_LOADED = False
    logger.warning("Image processing libraries (cv2, numpy, PIL) not found. roof segmentation will not work.")

@dataclass
class SegmentationResult:
    polygon_pixels: List[List[int]]
    polygon_normalized: List[List[float]]
    pixel_area: int
    coverage_ratio: float
    shading_ratio: float
    estimated_orientation_deg: float
    roof_slope_estimate: str
    obstruction_count: int
    mask_base64: str
    method: str
    confidence: float

class RoofSegmentationService:
    def __init__(self, checkpoint_path: str = "./checkpoints/sam2.1_hiera_small.pt", 
                 config_path: str = "sam2_hiera_small.yaml"):
        self.checkpoint_path = checkpoint_path
        self.config_path = config_path
        self._predictor = None

    def segment_roof(self, image_bytes: bytes, click_point: Optional[Tuple[int, int]] = None) -> SegmentationResult:
        if not _DEPENDENCIES_LOADED:
            raise RuntimeError("Image analysis dependencies not installed. Please run `pip install opencv-python Pillow numpy`")
            
        # Load image via PIL
        img = Image.open(io.BytesIO(image_bytes))
        
        # Max dimension 1024px
        img.thumbnail((1024, 1024), Image.LANCZOS)
        img_array = np.array(img.convert("RGB"))
        h, w = img_array.shape[:2]
        
        if click_point is None:
            click_point = (w // 2, h // 2)

        try:
            predictor = self._get_predictor()
            if predictor:
                return self._segment_with_sam2(img_array, click_point, predictor)
            else:
                logger.warning("SAM2 skipped, returning heuristic.")
                return self._segment_heuristic(img_array, click_point)
        except Exception as e:
            logger.error(f"SAM2 inference failed, falling back to heuristic: {e}")
            return self._segment_heuristic(img_array, click_point)

    def _get_predictor(self):
        if self._predictor is None:
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
                logger.info(f"Loading SAM2 on {device}...")
                from sam2.build_sam import build_sam2
                from sam2.sam2_image_predictor import SAM2ImagePredictor

                sam2_model = build_sam2(self.config_path, self.checkpoint_path, device=device)
                self._predictor = SAM2ImagePredictor(sam2_model)
            except Exception as e:
                logger.warning(f"Could not load SAM2 model: {e}")
                
        return self._predictor

    def _segment_with_sam2(self, img_array: np.ndarray, point: Tuple[int, int], predictor) -> SegmentationResult:
        import torch
        predictor.set_image(img_array)
        
        h, w = img_array.shape[:2]
        offset = min(w, h) // 10
        
        px, py = point
        input_point = np.array([
            [px, py],
            [min(px+offset, w-1), py],
            [px, min(py+offset, h-1)],
            [max(px-offset, 0), py]
        ])
        input_label = np.array([1, 1, 1, 1])
        
        with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16) if torch.cuda.is_available() else torch.autocast("cpu"):
            masks, scores, logits = predictor.predict(
                point_coords=input_point,
                point_labels=input_label,
                multimask_output=True,
            )
            
        best_mask_idx = np.argmax(scores)
        best_mask = masks[best_mask_idx]
        confidence = float(scores[best_mask_idx])
        
        return self._build_result(best_mask.astype(bool), img_array, confidence, "SAM2")

    def _segment_heuristic(self, img_array: np.ndarray, point: Tuple[int, int]) -> SegmentationResult:
        lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
        mask = np.zeros((img_array.shape[0] + 2, img_array.shape[1] + 2), dtype=np.uint8)
        
        # flood fill
        loDiff, upDiff = (12, 8, 8), (12, 8, 8)
        flags = 4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY
        cv2.floodFill(lab, mask, point, 0, loDiff, upDiff, flags)
        
        binary_mask = mask[1:-1, 1:-1]
        
        # morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel, iterations=3)
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel, iterations=2)
        
        return self._build_result(binary_mask == 255, img_array, 0.55, "HEURISTIC")

    def _build_result(self, bool_mask: np.ndarray, img_array: np.ndarray, confidence: float, method: str) -> SegmentationResult:
        h, w = img_array.shape[:2]
        uint8_mask = (bool_mask * 255).astype(np.uint8)
        
        # Contours
        contours, _ = cv2.findContours(uint8_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None # Should handle gracefully but for simplicity assuming mask found
            
        largest_contour = max(contours, key=cv2.contourArea)
        epsilon = 0.015 * cv2.arcLength(largest_contour, True)
        approx_contour = cv2.approxPolyDP(largest_contour, epsilon, True)
        polygon_pixels = approx_contour.reshape(-1, 2).tolist()
        polygon_normalized = [[x/w, y/h] for x, y in polygon_pixels]
        
        # Orientation & Slope
        rect = cv2.minAreaRect(largest_contour)
        box_w, box_h = rect[1]
        angle = rect[2]
        
        if box_w < box_h:
            angle += 90
            box_w, box_h = box_h, box_w
            
        angle = angle % 360
        
        try:
            aspect = max(box_w, box_h) / min(box_w, box_h)
        except ZeroDivisionError:
            aspect = 1.0
            
        if aspect < 1.15: slope = "flat"
        elif aspect < 1.4: slope = "low"
        elif aspect < 1.8: slope = "medium"
        else: slope = "steep"
        
        # Area and Coverage
        pixel_area = int(np.sum(bool_mask))
        coverage_ratio = float(pixel_area) / (w * h)
        
        # Shading
        grey = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        roof_pixels = grey[bool_mask]
        
        if len(roof_pixels) > 0:
            roof_median = np.median(roof_pixels)
            shadow_pixels = np.sum(roof_pixels < (roof_median * 0.65))
            shading_ratio = float(shadow_pixels) / len(roof_pixels)
        else:
            shading_ratio = 0.0
            
        # Obstructions
        inverse_mask = cv2.bitwise_not(uint8_mask)
        masked_grey = cv2.bitwise_and(grey, grey, mask=uint8_mask)
        _, thresh = cv2.threshold(masked_grey, roof_median * 0.8, 255, cv2.THRESH_BINARY_INV)
        thresh[inverse_mask == 255] = 0
        
        params = cv2.SimpleBlobDetector_Params()
        params.filterByArea = True
        params.minArea = 40
        params.maxArea = 800
        detector = cv2.SimpleBlobDetector_create(params)
        keypoints = detector.detect(cv2.bitwise_not(thresh))
        obstruction_count = len(keypoints)
        
        # Overlay Generation
        overlay = img_array.copy()
        
        # Compute amber overlay
        amber_color = np.array([255, 165, 0], dtype=np.float32)
        roof_roi = overlay[bool_mask].astype(np.float32)
        blended = roof_roi * 0.45 + amber_color * 0.55
        overlay[bool_mask] = blended.astype(np.uint8)
        
        cv2.drawContours(overlay, [approx_contour], -1, (0, 200, 255), 3)
        
        overlay_pil = Image.fromarray(overlay)
        buffered = io.BytesIO()
        overlay_pil.save(buffered, format="JPEG", quality=88)
        mask_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return SegmentationResult(
            polygon_pixels=polygon_pixels,
            polygon_normalized=polygon_normalized,
            pixel_area=pixel_area,
            coverage_ratio=coverage_ratio,
            shading_ratio=shading_ratio,
            estimated_orientation_deg=round(angle, 1),
            roof_slope_estimate=slope,
            obstruction_count=obstruction_count,
            mask_base64=mask_base64,
            method=method,
            confidence=round(confidence, 3)
        )
