#!/bin/bash

# Exit on error
set -e

cd "$(dirname "$0")/.."

mkdir -p checkpoints
echo "Building SAM2 requires PyTorch, downloading models..."
echo "Which model size would you like to download?"
echo "1) Tiny 38MB"
echo "2) Small 185MB"
echo "3) Large 2.4GB"
read -p "[default: 2] " choice

case $choice in
    1)
        FILE="sam2.1_hiera_tiny.pt"
        YAML="sam2_hiera_tiny.yaml"
        ;;
    3)
        FILE="sam2.1_hiera_large.pt"
        YAML="sam2_hiera_large.yaml"
        ;;
    *)
        FILE="sam2.1_hiera_small.pt"
        YAML="sam2_hiera_small.yaml"
        ;;
esac

echo "Downloading $FILE..."
curl -L -o "checkpoints/$FILE" "https://dl.fbaipublicfiles.com/segment_anything_2/092824/$FILE"

echo "Downloading config $YAML..."
curl -L -o "$YAML" "https://raw.githubusercontent.com/facebookresearch/sam2/main/sam2/configs/sam2.1/$YAML"

echo "Installing SAM2 package..."
pip install git+https://github.com/facebookresearch/sam2.git

echo "Done! Make sure you have these in your .env:"
echo "SAM2_CHECKPOINT=./checkpoints/$FILE"
echo "SAM2_CONFIG=$YAML"
