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

  // --- MULTI-STOP ROUTING: COMBINE MULTIPLE ORDERS INTO MULTI-WAYPOINT ROUTES ---
  if (url.pathname === "/routes/multi-stop" && (req.method === "POST" || req.method === "GET")) {
    try {
      let warehouseId: string | undefined;
      let orderIds: string[] = [];
      let truckId: string | undefined;
      let roundTrip: boolean = false;

      if (req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as {
          warehouseId?: string;
          orderIds?: string[];
          truckId?: string;
          roundTrip?: boolean;
        };
        warehouseId = body.warehouseId;
        orderIds = body.orderIds || [];
        truckId = body.truckId;
        roundTrip = Boolean(body.roundTrip);
      } else {
        warehouseId = url.searchParams.get("warehouseId") || undefined;
        const rawOrderIds = url.searchParams.get("orderIds");
        orderIds = rawOrderIds ? rawOrderIds.split(",").map((s) => s.trim()).filter(Boolean) : [];
        truckId = url.searchParams.get("truckId") || undefined;
        roundTrip = url.searchParams.get("roundTrip") === "true";
      }

      if (!orderIds || orderIds.length === 0) {
        return Response.json({ success: false, error: "At least one orderId is required for multi-stop routing" }, { status: 400 });
      }

      const multiRoute = await calculateMultiStopRoute({
        warehouseId,
        orderIds,
        truckId,
        roundTrip,
      });

      return Response.json(multiRoute);
    } catch (error: any) {
      console.error("Multi-Stop Logistics Route Error:", error);
      return Response.json(
        { success: false, error: error.message || "Failed to calculate multi-stop route" },
        { status: 400 }
      );
    }
  }

  return null;
}

export async function calculateMultiStopRoute(options: {
  warehouseId?: string;
  orderIds: string[];
  truckId?: string;
  roundTrip?: boolean;
}) {
  const { orderIds, truckId, roundTrip } = options;
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    throw new Error("At least one orderId is required for multi-stop routing");
  }

  // 1. Resolve origin warehouse
  let whId = options.warehouseId;
  if (!whId) {
    const firstRoute = await orders_route.byOrder(orderIds[0]);
    whId = firstRoute[0]?.warehouse_id || "WH-001";
  }
  const whRes = await warehouses.byId(whId);
  const warehouse = whRes && whRes.length > 0 ? whRes[0] : null;
  const originCoords = parseLocationCoords(warehouse?.location, -22.3842, -43.1311);
  const originLabel =
    (warehouse?.location && typeof warehouse.location === "object"
      ? (warehouse.location as any).label
      : null) || `Warehouse ${whId}`;

  // 2. Fetch all orders & destinations
  const ordersDetails = [];
  let collectiveWeight = 0;
  let collectiveVolume = 0;
  let totalItemsCount = 0;

  for (const orderId of orderIds) {
    const oRes = await orders.byId(orderId);
    if (!oRes || oRes.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }
    const order = oRes[0];
    const load = await orders.getOrderLoad(orderId);
    collectiveWeight += load.totalWeight;
    collectiveVolume += load.totalVolume;
    totalItemsCount += load.itemCount;

    const coords = parseLocationCoords(order.final_destination, -22.4123, -42.9656);
    let destLabel = order.final_destination;
    try {
      const parsed = JSON.parse(order.final_destination);
      if (parsed?.label) destLabel = parsed.label;
    } catch {}

    ordersDetails.push({
      order_id: order.id,
      client_id: order.client_id,
      destination: destLabel,
      coords,
      status: order.status,
      time_limit: order.time_limit,
      weight_kg: load.totalWeight,
      volume_m3: load.totalVolume,
      item_count: load.itemCount,
    });
  }

  collectiveWeight = Math.round(collectiveWeight * 100) / 100;
  collectiveVolume = Math.round(collectiveVolume * 1000) / 1000;

  // 3. Truck verification and capacity enforcement across all combined orders
  let truckData: any = null;
  if (truckId) {
    const tRes = await trucks.byId(truckId);
    if (!tRes || tRes.length === 0) {
      throw new Error(`Truck ${truckId} not found`);
    }
    truckData = tRes[0];
    const weightMax = Number(truckData.weight_max || 0);
    const volumeMax = Number(truckData.volume_max || 0);

    if (weightMax > 0 && collectiveWeight > weightMax) {
      throw new Error(
        `Truck ${truckData.model || truckId} payload capacity exceeded: combined order weight (${collectiveWeight}kg) exceeds truck limit (${weightMax}kg)`
      );
    }
    if (volumeMax > 0 && collectiveVolume > volumeMax) {
      throw new Error(
        `Truck ${truckData.model || truckId} volume capacity exceeded: combined order volume (${collectiveVolume}m³) exceeds truck limit (${volumeMax}m³)`
      );
    }
  }

  // 4. Build waypoint locations for Valhalla
  const waypoints = [
    { lat: originCoords.lat, lon: originCoords.lon, radius: 50, name: originLabel, type: "break" as const },
    ...ordersDetails.map((o, idx) => ({
      lat: o.coords.lat,
      lon: o.coords.lon,
      radius: 50,
      name: `Stop ${idx + 1}: ${o.destination}`,
      orderId: o.order_id,
      type: "break" as const,
    })),
  ];

  if (roundTrip) {
    waypoints.push({
      lat: originCoords.lat,
      lon: originCoords.lon,
      radius: 50,
      name: `Return: ${originLabel}`,
      type: "break" as const,
    } as any);
  }

  // 5. Try calling Valhalla with all locations
  const valhallaUrls = [
    process.env.VALHALLA_URL,
    "http://localhost:8002/route",
    "http://127.0.0.1:8002/route",
    "http://valhalla_server:8002/route",
  ].filter(Boolean) as string[];

  let valhallaRes: Response | null = null;
  for (const valhallaUrl of valhallaUrls) {
    try {
      const res = await fetch(valhallaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(300),
        body: JSON.stringify({
          locations: waypoints.map((w) => ({ lat: w.lat, lon: w.lon, radius: 50 })),
          costing: "truck",
          units: "kilometers",
          language: "en-US",
          costing_options: {
            truck: {
              use_unpaved: 0.1,
              use_track: 0.05,
              weight: collectiveWeight,
            },
          },
        }),
      });
      if (res.ok) {
        valhallaRes = res;
        break;
      }
    } catch {
      /* try next */
    }
  }

  let totalDistanceKm = 0;
  let totalTimeSeconds = 0;
  let encodedShape = "";
  const legs = [];

  if (valhallaRes && valhallaRes.ok) {
    const data = await valhallaRes.json();
    totalDistanceKm = Math.round(parseFloat(data.trip.summary.length) * 10) / 10;
    totalTimeSeconds = Math.round(Number(data.trip.summary.time));
    encodedShape = data.trip.legs[0]?.shape || "";

    for (let i = 0; i < data.trip.legs.length; i++) {
      const leg = data.trip.legs[i];
      const fromWp = waypoints[i];
      const toWp = waypoints[i + 1];
      legs.push({
        leg_index: i + 1,
        from_label: fromWp?.name,
        to_label: toWp?.name,
        order_id: (toWp as any)?.orderId || null,
        distance_km: Math.round(parseFloat(leg.summary.length) * 10) / 10,
        time_seconds: Math.round(Number(leg.summary.time)),
        shape: leg.shape,
      });
    }
  } else {
    // Geodesic fallback calculation between waypoints
    const { calculateDistanceInDb } = await import("./controller");
    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromWp = waypoints[i];
      const toWp = waypoints[i + 1];
      const legDist = await calculateDistanceInDb(fromWp.lat, fromWp.lon, toWp.lat, toWp.lon);
      const speedKmh = truckData?.speed ? Number(truckData.speed) : 60.0;
      const legTime = Math.round((legDist / speedKmh) * 3600);

      totalDistanceKm += legDist;
      totalTimeSeconds += legTime;

      legs.push({
        leg_index: i + 1,
        from_label: fromWp.name,
        to_label: toWp.name,
        order_id: (toWp as any)?.orderId || null,
        distance_km: legDist,
        time_seconds: legTime,
        shape: null,
      });
    }
    totalDistanceKm = Math.round(totalDistanceKm * 10) / 10;
  }

  // Format stops summary
  const stops = ordersDetails.map((o, idx) => ({
    stop_number: idx + 1,
    order_id: o.order_id,
    destination: o.destination,
    coords: o.coords,
    weight_kg: o.weight_kg,
    volume_m3: o.volume_m3,
    item_count: o.item_count,
    leg_distance_km: legs[idx]?.distance_km || 0,
    leg_time_seconds: legs[idx]?.time_seconds || 0,
  }));

  return {
    success: true,
    warehouse: {
      id: whId,
      label: originLabel,
      coords: originCoords,
    },
    truck: truckData
      ? {
          id: truckData.id,
          model: truckData.model,
          weight_max: Number(truckData.weight_max),
          volume_max: Number(truckData.volume_max),
          speed: Number(truckData.speed),
        }
      : null,
    total_orders: ordersDetails.length,
    total_items_count: totalItemsCount,
    collective_weight_kg: collectiveWeight,
    collective_volume_m3: collectiveVolume,
    truck_capacity_ok: true,
    total_distance_km: totalDistanceKm,
    total_time_seconds: totalTimeSeconds,
    round_trip: Boolean(roundTrip),
    stops,
    legs,
    encodedShape: encodedShape || undefined,
    waypoints: waypoints.map((w, idx) => ({
      index: idx,
      label: w.name,
      lat: w.lat,
      lon: w.lon,
      type: idx === 0 ? "origin" : idx === waypoints.length - 1 && roundTrip ? "return" : "stop",
    })),
  };
}
