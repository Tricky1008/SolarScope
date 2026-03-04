import os
from pathlib import Path

# Trace from the current file location
# This script is in backend/
current_file = Path(__file__).resolve()
backend_dir = current_file.parent
model_dir = backend_dir / "data" / "models"

output_path = backend_dir.parent / "debug_log.txt"

with open(output_path, "w") as f:
    f.write(f"Current script: {current_file}\n")
    f.write(f"Backend dir: {backend_dir}\n")
    f.write(f"Target Model dir: {model_dir}\n")
    f.write(f"Exists: {model_dir.exists()}\n")

    if model_dir.exists():
        f.write("Contents:\n")
        for item in model_dir.iterdir():
            f.write(f"  - {item.name}\n")
    else:
        f.write("DIRECTORY NOT FOUND!\n")
