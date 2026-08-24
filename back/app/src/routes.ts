import { orders, warehouses, orders_route, trucks } from "./controller";

// Helper function from the other developer to safely parse location coordinates from various formats
function parseLocationCoords(raw: any, defaultLat: number, defaultLon: number): { lat: number; lon: number } {
  if (!raw) return { lat: defaultLat, lon: defaultLon }

  if (typeof raw === "object" && raw !== null) {
    const lat = Number(raw.latitude ?? raw.lat)
    const lon = Number(raw.longitude ?? raw.lon)
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon }
  }

  const str = String(raw)

  if (str.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(str)
      const lat = Number(parsed.latitude ?? parsed.lat)
      const lon = Number(parsed.longitude ?? parsed.lon)
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon }
    } catch {}
  }

  const latMatch = str.match(/Lat:\s*(-?\d+\.\d+)/i) || str.match(/(-?\d+\.\d+)\s*,/)
  const lonMatch = str.match(/Lon:\s*(-?\d+\.\d+)/i) || str.match(/,\s*(-?\d+\.\d+)/)

  if (latMatch && lonMatch) {
    const lat = Number(latMatch[1])
    const lon = Number(lonMatch[1])
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
  }

  if (str.includes("Petrópolis") || str.includes("Itaipava")) return { lat: -22.3842, lon: -43.1311 }
  if (str.includes("Teresópolis") || str.includes("Várzea") || str.includes("Alto")) return { lat: -22.4123, lon: -42.9656 }
  if (str.includes("Friburgo") || str.includes("Olaria")) return { lat: -22.2819, lon: -42.5311 }
  if (str.includes("Bom Jardim")) return { lat: -22.1500, lon: -42.4167 }

  return { lat: defaultLat, lon: defaultLon }
}

export async function handleRoutes(req: Request) {
  const url = new URL(req.url);

  if (url.pathname === "/route" && req.method === "POST") {
    try {
      const body = await req.json() as { orderId: string, warehouseId: string };

      const orderData = await orders.byId(body.orderId);
      const warehouseData = await warehouses.byId(body.warehouseId);

      if (orderData.length === 0 || warehouseData.length === 0) {
        return new Response("Order or Warehouse not found in the database", { status: 404 });
      }

      const order = orderData[0];
      const warehouse = warehouseData[0];

      // --- TRUCK VERIFICATION LOGIC ---
      const routeData = await orders_route.byOrder ? await orders_route.byOrder(body.orderId) : [];

      if (!routeData || routeData.length === 0 || !routeData[0].truck_id) {
        return new Response("Truck not found or not allocated to this order", { status: 404 });
      }

      const truckData = await trucks.byId(routeData[0].truck_id);
      if (!truckData || truckData.length === 0) {
        return new Response("Associated truck not found in the database", { status: 404 });
      }

      const truck = truckData[0];
      const truckWeight = Number(truck.weight_current || truck.weight_max || 0);

      // --- WAREHOUSE PARKING VALIDATION ---
      if (routeData[0]?.destination_warehouse_id) {
        const parkingCheck = await warehouses.checkParkingAvailable(routeData[0].destination_warehouse_id, truck.id);
        if (!parkingCheck.allowed) {
          return new Response(parkingCheck.reason || "Destination warehouse parking capacity exceeded", { status: 400 });
        }
      }
      // ---------------------------------------------

      // Using parseLocationCoords from the other codebase for safe coordinate extraction
      const wCoords = parseLocationCoords(warehouse.location, -22.3842, -43.1311);
      const oCoords = parseLocationCoords(order.final_destination, -22.4123, -42.9656);

      // Adding the 50m radius restriction to the locations array
      const valhallaLocations = [
        { lat: wCoords.lat, lon: wCoords.lon, radius: 50 },
        { lat: oCoords.lat, lon: oCoords.lon, radius: 50 }
      ];

      // Combined URLs list: includes local docker server and environment fallback options
      const valhallaUrls = [
        process.env.VALHALLA_URL,
        "http://valhalla_server:8002/route", 
        "http://localhost:8002/route",
        "http://127.0.0.1:8002/route",
        "http://host.docker.internal:8002/route",
      ].filter(Boolean) as string[];

      let valhallaRes: Response | null = null;
      for (const valhallaUrl of valhallaUrls) {
        try {
          const res = await fetch(valhallaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              locations: valhallaLocations,
              costing: "truck",
              units: "kilometers",
              language: "en-US",
              // --- TRUCK COSTING OPTIONS & WEIGHT INJECTION ---
              costing_options: {
                truck: {
                  use_unpaved: 0.1,
                  use_track: 0.05,
                  weight: truckWeight
                }
              }
              // ---------------------------------------------------
            }),
          });
          
          // Captures successful responses or intentional motor errors (like status 400 for bad coordinates)
          if (res.ok || res.status === 400) {
            valhallaRes = res;
            break; 
          }
        } catch {
          /* try next url */
        }
      }

      // Merged error handling: preserves the actual engine status if reached, otherwise returns 502
      if (!valhallaRes || !valhallaRes.ok) {
        return new Response("Valhalla Engine Error", { status: valhallaRes ? valhallaRes.status : 502 });
      }

      const data = await valhallaRes.json();
      const distanceKm = parseFloat(data.trip.summary.length);

      if (typeof orders.updateDistance === 'function') {
        await orders.updateDistance(body.orderId, distanceKm);
      } else {
        console.warn("Function updateDistance not found in the orders controller.");
      }
      
      // Sending the Polyline6 string directly from Valhalla to the frontend.
      const frontEndResponse = {
        success: true,
        summary: data.trip.summary, 
        encodedShape: data.trip.legs[0].shape,
        distance_km: distanceKm
      };
      
      return Response.json(frontEndResponse);
    } catch (error) {
      console.error("Logistics Route Error:", error);
      return new Response("Internal Routing Server Error", { status: 500 });
    }
  }

  return null;
}
