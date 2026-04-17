# Model Files Directory

Place your trained model files here:

| Format | Filename Example | Framework |
|--------|-----------------|-----------|
| ONNX (recommended) | `roof_seg.onnx` | Any → ONNX export |
| PyTorch | `roof_seg.pth` | torch |
| Keras/TF | `roof_seg.h5` | tensorflow |
| YOLO | `roof_seg_yolo.pt` | ultralytics |

## Quick Start

1. Place your model file in this directory
2. Set `SEG_MODEL_FILE=your_model_filename` in `backend/.env`
3. Uncomment the matching framework block in `image_analysis_service.py`
4. Restart the backend

Without a model file, the app uses a brightness-heuristic fallback (low accuracy).
