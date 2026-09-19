import { orders, warehouses, orders_route, trucks } from "./controller";
import { pg_conn } from "./model";
import { converterEndereco } from "./geocoding";

// In-memory geocoding cache to avoid Nominatim rate-limiting (1 req/sec)
const geocodeCache = new Map<string, { lat: number; lon: number }>();

// City-level fallback coordinates — used when Nominatim is unavailable but the
// address string contains a recognisable city name. Much better than collapsing
// every order to the same single default point.
const CITY_FALLBACKS: { patterns: string[]; lat: number; lon: number }[] = [
  { patterns: ["Petrópolis", "Petrópolis", "Itaipava", "Araras", "Cascatinha"], lat: -22.3842, lon: -43.1311 },
  { patterns: ["Teresópolis", "Teresopolis", "Várzea", "Agriões", "Vale do Paraíso"], lat: -22.4123, lon: -42.9656 },
  { patterns: ["Nova Friburgo", "Friburgo", "Olaria", "Conselheiro Paulino"], lat: -22.2819, lon: -42.5311 },
  { patterns: ["Três Rios", "Tres Rios"], lat: -22.1167, lon: -43.2045 },
  { patterns: ["Bom Jardim"], lat: -22.2061, lon: -42.3798 },
  { patterns: ["Cantagalo"], lat: -21.8674, lon: -42.3062 },
  { patterns: ["Cordeiro"], lat: -22.0282, lon: -42.3614 },
  { patterns: ["Areal"], lat: -22.2303, lon: -43.1028 },
  { patterns: ["Magé"], lat: -22.6610, lon: -43.0355 },
  { patterns: ["Guapimirim"], lat: -22.5397, lon: -42.9821 },
  { patterns: ["Valparaíso", "Valparaiso"], lat: -22.5207, lon: -43.1885 },
];

function cityFallback(str: string): { lat: number; lon: number } | null {
  for (const fb of CITY_FALLBACKS) {
    if (fb.patterns.some((p) => str.includes(p))) {
      return { lat: fb.lat, lon: fb.lon };
    }
  }
  return null;
}

/**
 * Parses location coordinates from various formats:
 *  - Object with latitude/longitude keys (warehouse JSON)
 *  - JSON string with latitude/longitude keys
 *  - Plain text address → Nominatim forward geocoding (cached, 3s timeout)
 *  - City-level fallback when Nominatim unavailable
 *  - Falls back to defaultLat/defaultLon if nothing else works
 */
async function parseLocationCoords(
  raw: any,
  defaultLat: number,
  defaultLon: number
): Promise<{ lat: number; lon: number }> {
  if (!raw) return { lat: defaultLat, lon: defaultLon };

  // Object with lat/lon keys (e.g. warehouse.location already parsed)
  if (typeof raw === "object" && raw !== null) {
    const lat = Number(raw.latitude ?? raw.lat);
    const lon = Number(raw.longitude ?? raw.lon);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon };
  }

  const str = String(raw);

  // JSON string with lat/lon keys
  if (str.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(str);
      const lat = Number(parsed.latitude ?? parsed.lat);
      const lon = Number(parsed.longitude ?? parsed.lon);
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon };
    } catch {}
  }

  // Embedded "Lat: -22.xxx, Lon: -43.xxx" pattern
  const latMatch = str.match(/Lat:\s*(-?\d+\.\d+)/i) || str.match(/(-?\d+\.\d+)\s*,/);
  const lonMatch = str.match(/Lon:\s*(-?\d+\.\d+)/i) || str.match(/,\s*(-?\d+\.\d+)/);
  if (latMatch && lonMatch) {
    const lat = Number(latMatch[1]);
    const lon = Number(lonMatch[1]);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }

  // Plain text address → Nominatim geocoding (with cache)
  const cacheKey = str.trim().toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const result = await converterEndereco(str);
    if (typeof result === "object" && result.latitude && result.longitude) {
      const lat = Number(result.latitude);
      const lon = Number(result.longitude);
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) {
        const coords = { lat, lon };
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
    }
  } catch {
    // Nominatim unavailable — fall through to city-level fallback
  }

  // City-level fallback — at least puts each order in the right municipality
  const cityCoords = cityFallback(str);
  const resolvedCoords = cityCoords || { lat: defaultLat, lon: defaultLon };
  geocodeCache.set(cacheKey, resolvedCoords);

  return resolvedCoords;
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
      const wCoords = await parseLocationCoords(warehouse.location, -22.3842, -43.1311);
      const oCoords = await parseLocationCoords(order.final_destination, -22.4123, -42.9656);

      // Adding the 50m radius restriction to the locations array
      const valhallaLocations = [
        { lat: wCoords.lat, lon: wCoords.lon, radius: 50 },
        { lat: oCoords.lat, lon: oCoords.lon, radius: 50 }
      ];

      // Combined URLs list: includes local docker server and environment fallback options
      const valhallaUrls = [
        process.env.VALHALLA_URL,
        "http://localhost:8002/route",
        "http://127.0.0.1:8002/route",
        "http://valhalla_server:8002/route", 
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

  // --- QUICK PICK: CORRIDOR PROXIMITY ROUTE SELECTION ---
  if (url.pathname === "/routes/quick-pick" && (req.method === "POST" || req.method === "GET")) {
    try {
      let warehouseId: string | undefined;
      let truckId: string | undefined;
      let maxOrders: number | undefined;
      let roundTrip: boolean = true;
      let anchorOrderId: string | undefined;

      if (req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as any;
        warehouseId = body.warehouseId;
        truckId = body.truckId;
        maxOrders = body.maxOrders ? Number(body.maxOrders) : undefined;
        if (body.roundTrip !== undefined) roundTrip = Boolean(body.roundTrip);
        anchorOrderId = body.anchorOrderId;
      } else {
        warehouseId = url.searchParams.get("warehouseId") || undefined;
        truckId = url.searchParams.get("truckId") || undefined;
        const maxStr = url.searchParams.get("maxOrders");
        maxOrders = maxStr ? Number(maxStr) : undefined;
        if (url.searchParams.has("roundTrip")) {
          roundTrip = url.searchParams.get("roundTrip") === "true";
        }
        anchorOrderId = url.searchParams.get("anchorOrderId") || undefined;
      }

      const quickPickResult = await calculateQuickPickOrders({
        warehouseId,
        truckId,
        maxOrders,
        roundTrip,
        anchorOrderId,
      });

      return Response.json(quickPickResult);
    } catch (error: any) {
      console.error("Quick Pick Logistics Route Error:", error);
      return Response.json(
        { success: false, error: error.message || "Failed to calculate quick pick route" },
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

  // 1. Enforce: an order cannot be added to a route more than once
  const uniqueOrderIds = Array.from(new Set(orderIds));
  if (uniqueOrderIds.length !== orderIds.length) {
    throw new Error("Duplicate orders detected: an order cannot be in more than one route or stop at the same time");
  }

  // 2. Resolve origin warehouse
  let whId = options.warehouseId;
  if (!whId) {
    const firstRoute = await orders_route.byOrder(orderIds[0]);
    whId = firstRoute[0]?.warehouse_id || "WH-001";
  }
  const whRes = await warehouses.byId(whId);
  const warehouse = whRes && whRes.length > 0 ? whRes[0] : null;
  const originCoords = await parseLocationCoords(warehouse?.location, -22.3842, -43.1311);
  const originLabel =
    (warehouse?.location && typeof warehouse.location === "object"
      ? (warehouse.location as any).label
      : null) || `Warehouse ${whId}`;

  // 3. Fetch all orders & destinations
  const ordersDetails = [];
  let collectiveWeight = 0;
  let collectiveVolume = 0;
  let totalItemsCount = 0;

  for (const orderId of orderIds) {
    const oRes = await orders.byId(orderId);
    if (!oRes || oRes.length === 0) {
      if (orderIds.length === 1) {
        throw new Error(`Order ${orderId} not found`);
      }
      continue;
    }
    const order = oRes[0];
    const load = await orders.getOrderLoad(orderId);
    collectiveWeight += load.totalWeight;
    collectiveVolume += load.totalVolume;
    totalItemsCount += load.itemCount;

    const coords = await parseLocationCoords(order.final_destination, -22.4123, -42.9656);
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

  // 4. Warehouse stock verification: If origin warehouse lacks stock, consider a stop in another warehouse with all products
  const intermediateWarehouseStops: { id: string; label: string; coords: { lat: number; lon: number } }[] = [];
  const addedWhIds = new Set<string>();

  for (const o of ordersDetails) {
    const items = await pg_conn`
      SELECT product_id, quantity FROM orders_items WHERE order_id = ${o.order_id}
    `;
    if (!items || items.length === 0) continue;

    let originHasStock = true;
    for (const it of items) {
      const stock = await pg_conn`
        SELECT quantity FROM warehouses_stock 
        WHERE warehouse_id = ${whId} AND product_id = ${it.product_id}
      `;
      if (Number(stock[0]?.quantity || 0) < Number(it.quantity)) {
        originHasStock = false;
        break;
      }
    }

    if (!originHasStock) {
      // Find another warehouse with all products of this order
      const otherWhs = await pg_conn`
        SELECT id, location FROM warehouses WHERE id != ${whId} ORDER BY id ASC
      `;
      let pickupWh: any = null;
      for (const owh of otherWhs) {
        let hasAll = true;
        for (const it of items) {
          const s = await pg_conn`
            SELECT quantity FROM warehouses_stock 
            WHERE warehouse_id = ${owh.id} AND product_id = ${it.product_id}
          `;
          if (Number(s[0]?.quantity || 0) < Number(it.quantity)) {
            hasAll = false;
            break;
          }
        }
        if (hasAll) {
          pickupWh = owh;
          break;
        }
      }

      if (pickupWh && !addedWhIds.has(pickupWh.id)) {
        addedWhIds.add(pickupWh.id);
        const pCoords = await parseLocationCoords(pickupWh.location, -22.3842, -43.1311);
        const pLabel = (pickupWh.location && typeof pickupWh.location === "object"
          ? (pickupWh.location as any).label
          : null) || `Pickup Depot (${pickupWh.id})`;
        intermediateWarehouseStops.push({
          id: pickupWh.id,
          label: pLabel,
          coords: pCoords,
        });
      }
    }
  }

  // 5. Truck verification and capacity enforcement across all combined orders
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

  // 6. Build waypoint locations for Valhalla
  const waypoints = [
    { lat: originCoords.lat, lon: originCoords.lon, radius: 50, name: originLabel, type: "break" as const },
    ...intermediateWarehouseStops.map((wh) => ({
      lat: wh.coords.lat,
      lon: wh.coords.lon,
      radius: 50,
      name: `Warehouse Pickup: ${wh.label}`,
      type: "break" as const,
      warehouseId: wh.id,
    })),
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
    "http://host.docker.internal:8002/route",
  ].filter(Boolean) as string[];

  let valhallaRes: Response | null = null;
  for (const valhallaUrl of valhallaUrls) {
    try {
      const res = await fetch(valhallaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
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
    // Collect all leg shapes so the full multi-stop route polyline is available
    const allShapes: string[] = [];

    for (let i = 0; i < data.trip.legs.length; i++) {
      const leg = data.trip.legs[i];
      const fromWp = waypoints[i];
      const toWp = waypoints[i + 1];
      if (leg.shape) allShapes.push(leg.shape);
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

    // encodedShape = first leg only was a bug; now store all shapes joined
    // Frontend route-map.tsx already iterates legs[].shape — encodedShape is the fallback
    encodedShape = allShapes.join("|");
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

/**
 * Haversine formula to compute distance between two coordinates in kilometers.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0088;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Calculates shortest distance from coordinate point to a route segment [a, b] in km.
 */
export function distancePointToSegmentKm(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [pLat, pLon] = p;
  const [aLat, aLon] = a;
  const [bLat, bLon] = b;

  const dx = bLon - aLon;
  const dy = bLat - aLat;

  if (dx === 0 && dy === 0) {
    return haversineDistanceKm(pLat, pLon, aLat, aLon);
  }

  const t = Math.max(0, Math.min(1, ((pLon - aLon) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)));
  const projLat = aLat + t * dy;
  const projLon = aLon + t * dx;

  return haversineDistanceKm(pLat, pLon, projLat, projLon);
}

/**
 * Finds the minimum distance from target to any point or segment along a route polyline.
 */
export function minDistanceToRouteKm(
  target: [number, number] | { lat: number; lon: number },
  routePoints: Array<[number, number] | { lat: number; lon: number }>
): number {
  if (!routePoints || routePoints.length === 0) return 99999;
  const pCoord: [number, number] = Array.isArray(target) ? target : [target.lat, target.lon];

  const pts: [number, number][] = routePoints.map((pt) =>
    Array.isArray(pt) ? pt : [pt.lat, pt.lon]
  );

  if (pts.length === 1) {
    return haversineDistanceKm(pCoord[0], pCoord[1], pts[0][0], pts[0][1]);
  }

  let minDistance = Infinity;
  const step = pts.length > 300 ? Math.ceil(pts.length / 150) : 1;

  for (let i = 0; i < pts.length - 1; i += step) {
    const nextIdx = Math.min(i + step, pts.length - 1);
    const d = distancePointToSegmentKm(pCoord, pts[i], pts[nextIdx]);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return Math.round(minDistance * 100) / 100;
}

export function decodePolyline6(str: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = 1e6;

  while (index < str.length) {
    let byte: number;
    let shift = 0;
    let result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

/**
 * Partitions active candidate orders into multiple multi-routes (Multi-Route A, B, C...)
 * clustering by route corridor proximity across available fleet vehicles.
 */
export async function calculateFleetMultiRoutes(options: {
  warehouseId?: string;
  maxOrdersPerRoute?: number;
  maxRoutes?: number;
  roundTrip?: boolean;
}) {
  const whId = options.warehouseId || "WH-001";
  const maxOrdersPerRoute = options.maxOrdersPerRoute || 4;
  const roundTrip = options.roundTrip !== undefined ? options.roundTrip : true;
  const maxRoutes = options.maxRoutes || 4;

  const allOrders = await orders.all();
  let candidatePool = (allOrders || []).filter(
    (o: any) => o.status !== "Delivered" && o.status !== "Canceled" && o.status !== "Cancelled"
  );

  if (candidatePool.length === 0) {
    throw new Error("No active pending or shipped orders available for quick pick");
  }

  const allTrucks = await trucks.all();
  const availableTrucks = (allTrucks || []).filter((t: any) => !t.is_traveling);
  const fleetPool = availableTrucks.length > 0 ? availableTrucks : (allTrucks && allTrucks.length > 0 ? allTrucks : [{ id: "TRK-001", model: "Default Truck", weight_max: 25000 }]);

  const routeLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const generatedRoutes = [];

  const whRes = await warehouses.byId(whId);
  const wh = whRes?.[0];
  const originCoords = await parseLocationCoords(wh?.location, -22.3842, -43.1311);

  let routeIndex = 0;
  while (candidatePool.length > 0 && routeIndex < maxRoutes) {
    const routeLetter = routeLetters[routeIndex] || `R${routeIndex + 1}`;
    const assignedTruck = fleetPool[routeIndex % fleetPool.length];
    const maxWeightKg = assignedTruck?.weight_max ? Number(assignedTruck.weight_max) : 25000;

    // Pick anchor order for this corridor: prefer Pending orders
    const pendingOrders = candidatePool.filter((o: any) => o.status === "Pending");
    const anchorOrder = pendingOrders[0] || candidatePool[0];

    // Compute anchor baseline route with Valhalla
    let corridorPoints: [number, number][] = [];
    try {
      const anchorMulti = await calculateMultiStopRoute({
        warehouseId: whId,
        orderIds: [anchorOrder.id],
        truckId: assignedTruck?.id,
        roundTrip: false,
      });
      if (anchorMulti.legs?.[0]?.shape) {
        corridorPoints = decodePolyline6(anchorMulti.legs[0].shape);
      } else if (anchorMulti.encodedShape) {
        corridorPoints = decodePolyline6(anchorMulti.encodedShape);
      }
    } catch (e) {
      console.warn(`Anchor Valhalla route failed for route ${routeLetter}:`, e);
    }

    if (corridorPoints.length === 0) {
      const anchorCoords = await parseLocationCoords(anchorOrder.final_destination, -22.4123, -42.9656);
      corridorPoints = [
        [originCoords.lat, originCoords.lon],
        [anchorCoords.lat, anchorCoords.lon],
      ];
    }

    // Rank remaining candidate orders by shortest detour distance to this route corridor
    const otherCandidates = candidatePool.filter((o: any) => o.id !== anchorOrder.id);
    const scored = await Promise.all(otherCandidates.map(async (o: any) => {
      const coords = await parseLocationCoords(o.final_destination, -22.4123, -42.9656);
      const distToRoute = minDistanceToRouteKm([coords.lat, coords.lon], corridorPoints);
      return { order: o, distance_to_route_km: distToRoute };
    }));

    scored.sort((a: any, b: any) => a.distance_to_route_km - b.distance_to_route_km);

    // Pick closest corridor orders within truck capacity
    const selectedOrderIds = [anchorOrder.id];
    let accumulatedWeight = 35.0;
    for (const item of scored) {
      if (selectedOrderIds.length >= maxOrdersPerRoute) break;
      const estWeight = 35.0;
      if (accumulatedWeight + estWeight <= maxWeightKg) {
        selectedOrderIds.push(item.order.id);
        accumulatedWeight += estWeight;
      }
    }

    // Solve the final consolidated multi-stop route
    const solvedCircuit = await calculateMultiStopRoute({
      warehouseId: whId,
      orderIds: selectedOrderIds,
      truckId: assignedTruck?.id,
      roundTrip,
    });

    generatedRoutes.push({
      id: routeLetter,
      name: `Multi-Route ${routeLetter}`,
      truck_id: assignedTruck?.id,
      truck: assignedTruck,
      order_ids: selectedOrderIds,
      anchor_order_id: anchorOrder.id,
      circuit: solvedCircuit,
      corridor_scored_candidates: scored.map((s: any) => ({
        order_id: s.order.id,
        distance_to_route_km: s.distance_to_route_km,
      })),
    });

    // Remove selected orders from candidatePool so the next route targets remaining unrouted orders
    candidatePool = candidatePool.filter((o: any) => !selectedOrderIds.includes(o.id));
    routeIndex++;
  }

  return {
    success: true,
    routes: generatedRoutes,
    total_routes: generatedRoutes.length,
    remaining_orders_count: candidatePool.length,
  };
}

/**
 * Intelligent Quick Pick:
 * 1. Selects an anchor pending order from the warehouse.
 * 2. Gets the Valhalla baseline route to the anchor order.
 * 3. Measures the distance from all candidate orders to ANY point along that Valhalla route.
 * 4. Selects the closest corridor orders fitting within vehicle capacity.
 * 5. Computes the complete multi-stop Valhalla circuit, and partitions remaining orders into multi-routes (A, B, C...).
 */
export async function calculateQuickPickOrders(options: {
  warehouseId?: string;
  truckId?: string;
  maxOrders?: number;
  roundTrip?: boolean;
  anchorOrderId?: string;
}) {
  const fleetResult = await calculateFleetMultiRoutes({
    warehouseId: options.warehouseId,
    maxOrdersPerRoute: options.maxOrders || 4,
    roundTrip: options.roundTrip,
  });

  const primaryRoute = fleetResult.routes[0];
  if (!primaryRoute) {
    throw new Error("No active orders available for quick pick");
  }

  return {
    ...primaryRoute.circuit,
    quick_pick: true,
    anchor_order_id: primaryRoute.anchor_order_id,
    selected_order_ids: primaryRoute.order_ids,
    corridor_scored_candidates: primaryRoute.corridor_scored_candidates,
    routes: fleetResult.routes,
    total_routes: fleetResult.total_routes,
    remaining_orders_count: fleetResult.remaining_orders_count,
  };
}
