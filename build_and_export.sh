#!/bin/bash
# ================================================================
# build_and_export.sh
# Builds the Docker image and saves it as a shareable .tar file
# ================================================================
# Usage:
#   chmod +x build_and_export.sh
#   ./build_and_export.sh
# ================================================================

set -e

IMAGE_NAME="bus-reservation-system"
IMAGE_TAG="latest"
OUTPUT_FILE="bus_reservation_system_image.tar"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Bus Reservation System — Docker Build Tool    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Step 1 — Make sure Docker is running
echo "[1/4] Checking Docker daemon..."
if ! docker info > /dev/null 2>&1; then
    echo "  ✗ Docker is not running."
    echo "  Please run: sudo systemctl start docker"
    exit 1
fi
echo "  ✓ Docker is running."

# Step 2 — Build the image
echo ""
echo "[2/4] Building Docker image (this may take 5-10 minutes)..."
docker compose build --no-cache
echo "  ✓ Image built successfully."

# Step 3 — Export image to a .tar file for sharing
echo ""
echo "[3/4] Exporting image to '${OUTPUT_FILE}'..."
docker save -o "${OUTPUT_FILE}" "${IMAGE_NAME}:${IMAGE_TAG}"
echo "  ✓ Image exported: $(du -sh ${OUTPUT_FILE} | cut -f1)"

# Step 4 — Done
echo ""
echo "[4/4] All done!"
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Share the file: ${OUTPUT_FILE}                  "
echo "║                                                  "
echo "║  To load on another machine:                     "
echo "║    docker load -i ${OUTPUT_FILE}                 "
echo "║    docker compose up -d                          "
echo "╚══════════════════════════════════════════════════╝"
echo ""
