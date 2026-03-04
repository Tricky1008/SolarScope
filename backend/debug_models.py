import os
from pathlib import Path

# Trace from the current file location
# This script is in backend/
current_file = Path(__file__).resolve()
backend_dir = current_file.parent
model_dir = backend_dir / "data" / "models"

print(f"Current script: {current_file}")
print(f"Backend dir: {backend_dir}")
print(f"Target Model dir: {model_dir}")
print(f"Exists: {model_dir.exists()}")

if model_dir.exists():
    print("Contents:")
    for item in model_dir.iterdir():
        print(f"  - {item.name}")
else:
    print("DIRECTORY NOT FOUND!")
