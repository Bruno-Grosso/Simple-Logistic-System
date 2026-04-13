#!/bin/bash

# Configuration
CONTAINER_NAME="valhalla_server"
IMAGE_NAME="ghcr.io/gis-ops/docker-valhalla/valhalla:latest"
MAP_DIR="$(pwd)/Valhalla_map"
PORT=8002

echo "-------------------------------------------------------"
echo "Starting Valhalla Routing Engine..."
echo "Region: Serra do Rio de Janeiro"
echo "-------------------------------------------------------"

# Check if the map file exists before starting
if [ ! -f "$MAP_DIR/regiao_serrana.osm.pbf" ]; then
    echo "ERROR: Map file not found in $MAP_DIR"
    echo "Please download the .pbf file and rename it to 'regiao_serrana.osm.pbf'"
    exit 1
fi

# Run the Docker container
docker run -dt \
    --name "$CONTAINER_NAME" \
    -p "$PORT":8002 \
    -v "$MAP_DIR":/custom_files \
    --entrypoint valhalla_service \
    "$IMAGE_NAME" \
    /custom_files/valhalla.json 1

echo "Success! Valhalla is running on http://localhost:$PORT"
echo "To stop the server, use: docker stop $CONTAINER_NAME"
