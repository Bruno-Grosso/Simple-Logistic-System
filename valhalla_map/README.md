# Valhalla Routing Engine

This directory contains the infrastructure required for the Valhalla routing engine.

## How to Run

1. **Prerequisites:**
   - Ensure the .pbf map file is placed inside this folder.

2. **Configuration and Build:**
   The `setup_valhalla.sh` script automatically manages container creation and map data processing.
   `./setup_valhalla.sh`

3. **Monitoring:**
   After running the script, monitor the graph construction (this process may take several minutes):
   `docker logs -f valhalla_server`

4. **Access:**
   The routing server will be available on port 8002.

## Cleanup
To remove the server and free up resources:
`docker rm -f valhalla_server`
