import { pg_conn } from "./model";

// Auto-migration to ensure wage column, distance_km column, and distance calculation function exist
(async () => {
  try {
    await pg_conn`ALTER TABLE users ADD COLUMN IF NOT EXISTS wage REAL NOT NULL DEFAULT 45.0`;
    await pg_conn`ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km REAL DEFAULT 0.0`;
    await pg_conn`UPDATE warehouses SET fuel_price = 5.89 WHERE id = 'WH-001' AND fuel_price < 4.0`;
    await pg_conn`UPDATE warehouses SET fuel_price = 6.15 WHERE id = 'WH-002' AND fuel_price < 4.0`;
    await pg_conn`UPDATE warehouses SET fuel_price = 5.95 WHERE id = 'WH-003' AND fuel_price < 4.0`;
    await pg_conn`
      CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
      RETURNS DOUBLE PRECISION AS $$
      BEGIN
        RETURN 6371.0 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
          ))
        );
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `;
  } catch {
    /* ignore migration errors */
  }
})();

/**
 * Helper to safely parse location coordinates from various formats
 */
export function parseLocationCoords(raw: any, defaultLat = -22.3842, defaultLon = -43.1311): { lat: number; lon: number } {
  if (!raw) return { lat: defaultLat, lon: defaultLon };

  if (typeof raw === "object" && raw !== null) {
    const lat = Number(raw.latitude ?? raw.lat);
    const lon = Number(raw.longitude ?? raw.lon);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon };
  }

  const str = String(raw);

  if (str.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(str);
      const lat = Number(parsed.latitude ?? parsed.lat);
      const lon = Number(parsed.longitude ?? parsed.lon);
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) return { lat, lon };
    } catch {}
  }

  const latMatch = str.match(/Lat:\s*(-?\d+\.\d+)/i) || str.match(/(-?\d+\.\d+)\s*,/);
  const lonMatch = str.match(/Lon:\s*(-?\d+\.\d+)/i) || str.match(/,\s*(-?\d+\.\d+)/);

  if (latMatch && lonMatch) {
    const lat = Number(latMatch[1]);
    const lon = Number(lonMatch[1]);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }

  if (str.includes("Petrópolis") || str.includes("Itaipava")) return { lat: -22.3842, lon: -43.1311 };
  if (str.includes("Teresópolis") || str.includes("Várzea") || str.includes("Alto")) return { lat: -22.4123, lon: -42.9656 };
  if (str.includes("Friburgo") || str.includes("Olaria")) return { lat: -22.2819, lon: -42.5311 };
  if (str.includes("Cachoeiras")) return { lat: -22.4633, lon: -42.6528 };
  if (str.includes("Guapimirim")) return { lat: -22.5367, lon: -42.9819 };

  return { lat: defaultLat, lon: defaultLon };
}

/**
 * Calculates geodesic distance in kilometers between two coordinate pairs using PostgreSQL or Haversine formula
 */
export async function calculateDistanceInDb(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
  try {
    const res = await pg_conn`
      SELECT calculate_distance_km(${lat1}, ${lon1}, ${lat2}, ${lon2}) as distance_km
    `;
    if (res && res[0] && res[0].distance_km !== null) {
      return Math.round(Number(res[0].distance_km) * 10) / 10;
    }
  } catch {
    try {
      const res = await pg_conn`
        SELECT (6371.0 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(${lat1})) * cos(radians(${lat2})) * cos(radians(${lon2} - ${lon1})) +
            sin(radians(${lat1})) * sin(radians(${lat2}))
          ))
        )) as distance_km
      `;
      if (res && res[0] && res[0].distance_km !== null) {
        return Math.round(Number(res[0].distance_km) * 10) / 10;
      }
    } catch {
      /* fallback to JavaScript haversine */
    }
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Functional factory for basic CRUD operations.
 * Returns an object with functions (functors) to execute on routes.
 * Aligned with @back/db/dbdocumentation.md
 */
const createBaseRepo = (table: string) => ({
  all: () => pg_conn`SELECT * FROM ${pg_conn(table)}`,
  byId: (id: string) => pg_conn`SELECT * FROM ${pg_conn(table)} WHERE id = ${id}`,
  byField: (field: string) => (value: string | number | boolean) => 
    pg_conn`SELECT * FROM ${pg_conn(table)} WHERE ${pg_conn(field)} = ${value}`,
});

// 1. IDENTITY & ACCESS
export const users = {
  ...createBaseRepo("users"),
  byRole: (role: string) => pg_conn`SELECT * FROM users WHERE role = ${role}`,
  drivers: () => pg_conn`SELECT * FROM users WHERE role = 'truck_driver'`,
  getDriverWage: async (driverId?: string): Promise<number> => {
    if (driverId) {
      const userRes = await pg_conn`SELECT wage FROM users WHERE id = ${driverId}`;
      if (userRes && userRes.length > 0 && userRes[0].wage !== null && userRes[0].wage !== undefined) {
        return Number(userRes[0].wage);
      }
    }
    const avgRes = await pg_conn`SELECT AVG(wage) as avg_wage FROM users WHERE role = 'truck_driver'`;
    if (avgRes && avgRes.length > 0 && avgRes[0].avg_wage !== null) {
      return Number(avgRes[0].avg_wage);
    }
    return 50.0;
  },
  login: async (identityInput: string, passwordInput: string) => {
    const input = String(identityInput || "").trim().toLowerCase();
    const cleanPrefix = input.includes("@") ? input.split("@")[0] : input;

    const allUsers = await pg_conn`SELECT * FROM users`;
    const matched = allUsers.find((u: any) => {
      const uId = String(u.id).toLowerCase();
      const uName = String(u.name).toLowerCase();
      const firstName = uName.split(" ")[0];
      const matchPass = String(u.password) === String(passwordInput);

      const matchId = uId === input || uId === cleanPrefix;
      const matchName = uName === input || firstName === cleanPrefix || uName.includes(cleanPrefix);

      return matchPass && (matchId || matchName);
    });

    if (!matched) return null;

    const sessionId = `SESS-${Date.now()}`;
    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19);

    try {
      await pg_conn`
        INSERT INTO online_users (session_id, user_id, login_time, last_activity)
        VALUES (${sessionId}, ${matched.id}, ${nowStr}, ${nowStr})
      `;
    } catch {
      /* ignore */
    }

    return {
      sessionToken: sessionId,
      token: sessionId,
      user: {
        id: matched.id,
        name: matched.name,
        email: matched.email || (matched.name ? `${matched.name.split(" ")[0].toLowerCase()}@logisys.com` : `${matched.id.toLowerCase()}@logisys.com`),
        role: matched.role,
        wage: matched.wage !== undefined ? Number(matched.wage) : 45.0,
        address: matched.address,
      },
    };
  },
  update: async (id: string, user: { name?: string; password?: string; address?: any; role?: string; wage?: number }) => {
    let addressVal: string | null = null;
    if (user.address !== undefined) {
      if (typeof user.address === "object" && user.address !== null) {
        addressVal = JSON.stringify(user.address);
      } else if (typeof user.address === "string") {
        addressVal = user.address.trim().startsWith("{")
          ? user.address
          : JSON.stringify({ address: user.address });
      }
    }

    if (user.name !== undefined) {
      await pg_conn`UPDATE users SET name = ${user.name} WHERE id = ${id}`;
    }
    if (user.password !== undefined && user.password !== "") {
      await pg_conn`UPDATE users SET password = ${user.password} WHERE id = ${id}`;
    }
    if (addressVal !== null) {
      await pg_conn`UPDATE users SET address = ${addressVal} WHERE id = ${id}`;
    }
    if (user.role !== undefined) {
      await pg_conn`UPDATE users SET role = ${user.role} WHERE id = ${id}`;
    }
    if (user.wage !== undefined) {
      await pg_conn`UPDATE users SET wage = ${Number(user.wage)} WHERE id = ${id}`;
    }

    const updated = await pg_conn`SELECT * FROM users WHERE id = ${id}`;
    return updated;
  },
  createClient: async (client: { id?: string; name: string; email?: string; password: string; address?: string; role?: string; wage?: number }) => {
    const id = client.id || `USR-${Math.floor(100 + Math.random() * 900)}`;
    const role = client.role || "client";
    const wage = client.wage !== undefined ? Number(client.wage) : (role === "client" ? 0.0 : 45.0);
    const addressJson = JSON.stringify({ address: client.address || "" });
    const inserted = await pg_conn`
      INSERT INTO users (id, name, password, address, role, wage)
      VALUES (${id}, ${client.name}, ${client.password}, ${addressJson}, ${role}, ${wage})
      RETURNING id, name, address, role, wage
    `;
    return inserted[0];
  },
};

export const onlineUsers = {
  ...createBaseRepo("online_users"),
  byUser: (userId: string) => pg_conn`SELECT * FROM online_users WHERE user_id = ${userId}`,
};

// 2. PRODUCT & INVENTORY
export const products = {
  ...createBaseRepo("products"),
  searchByName: (name: string) => pg_conn`SELECT * FROM products WHERE name ILIKE ${'%' + name + '%'}`,
  update: (id: string, product: {
    name: string;
    price: number;
    is_cold: number;
    is_fragile: number;
    expire_date: string | null;
    size: any;
    volume: number;
    weight: number;
  }) =>
    pg_conn`
      UPDATE products
      SET name = ${product.name}, price = ${product.price}, is_cold = ${product.is_cold}, 
          is_fragile = ${product.is_fragile}, expire_date = ${product.expire_date}, 
          size = ${typeof product.size === 'string' ? product.size : JSON.stringify(product.size)}, 
          volume = ${product.volume}, weight = ${product.weight}
      WHERE id = ${id}
      RETURNING *
    `,
};

// 3. INFRASTRUCTURE & FLEET
export const warehouses = {
  ...createBaseRepo("warehouses"),
  stock: (warehouseId: string) => 
    pg_conn`SELECT * FROM warehouses_stock WHERE warehouse_id = ${warehouseId}`,
  getAverageGasPrice: async (warehouseIds?: string[]): Promise<number> => {
    if (warehouseIds && warehouseIds.length > 0) {
      const res = await pg_conn`
        SELECT AVG(fuel_price) as avg_price 
        FROM warehouses 
        WHERE id = ANY(${warehouseIds})
      `;
      if (res && res.length > 0 && res[0].avg_price !== null && res[0].avg_price !== undefined) {
        return Math.round(Number(res[0].avg_price) * 100) / 100;
      }
    }
    const allRes = await pg_conn`SELECT AVG(fuel_price) as avg_price FROM warehouses`;
    if (allRes && allRes.length > 0 && allRes[0].avg_price !== null && allRes[0].avg_price !== undefined) {
      return Math.round(Number(allRes[0].avg_price) * 100) / 100;
    }
    return 5.89;
  },
  getParkingStatus: async (warehouseId: string) => {
    const whRes = await pg_conn`SELECT * FROM warehouses WHERE id = ${warehouseId}`;
    if (!whRes || whRes.length === 0) return null;
    const warehouse = whRes[0];
    const truckCapacity = Number(warehouse.truck_capacity ?? 5);

    const parkedTrucks = await pg_conn`
      SELECT * FROM trucks 
      WHERE current_warehouse_id = ${warehouseId} AND is_delivering = 0
    `;

    const inboundTrucks = await pg_conn`
      SELECT * FROM trucks 
      WHERE destination_warehouse_id = ${warehouseId} AND is_delivering = 1
    `;

    const incomingRoutes = await pg_conn`
      SELECT r.*, o.status as order_status FROM orders_route r
      JOIN orders o ON r.order_id = o.id
      WHERE r.destination_warehouse_id = ${warehouseId} AND r.arrived_at IS NULL AND o.status = 'Shipped'
    `;

    const parkedCount = parkedTrucks.length;
    const inboundCount = inboundTrucks.length;
    const occupiedSpots = parkedCount;
    const availableSpots = Math.max(0, truckCapacity - occupiedSpots);
    const isFull = occupiedSpots >= truckCapacity;

    return {
      warehouse_id: warehouseId,
      truck_capacity: truckCapacity,
      parked_count: parkedCount,
      inbound_count: inboundCount,
      occupied_spots: occupiedSpots,
      available_spots: availableSpots,
      is_full: isFull,
      parked_trucks: parkedTrucks,
      inbound_trucks: inboundTrucks,
      incoming_routes: incomingRoutes,
    };
  },
  checkParkingAvailable: async (warehouseId: string, truckId?: string) => {
    const status = await warehouses.getParkingStatus(warehouseId);
    if (!status) return { allowed: false, reason: "Warehouse not found" };

    if (truckId) {
      const alreadyParked = status.parked_trucks.some((t: any) => t.id === truckId);
      if (alreadyParked) {
        return { allowed: true, status };
      }
    }

    if (status.is_full) {
      return {
        allowed: false,
        reason: `Warehouse ${warehouseId} has reached maximum truck parking capacity (${status.parked_count}/${status.truck_capacity} spots occupied)`,
        status,
      };
    }
    return { allowed: true, status };
  },
  update: (id: string, warehouse: {
    location?: any;
    size?: any;
    volume_max?: number;
    has_refrigeration?: number;
    fuel_price?: number;
    truck_capacity?: number;
  }) => {
    const capacity = warehouse.truck_capacity !== undefined ? Number(warehouse.truck_capacity) : 5;
    return pg_conn`
      UPDATE warehouses
      SET location = ${typeof warehouse.location === 'string' ? warehouse.location : JSON.stringify(warehouse.location)}, 
          size = ${typeof warehouse.size === 'string' ? warehouse.size : JSON.stringify(warehouse.size)}, 
          volume_max = ${warehouse.volume_max}, 
          has_refrigeration = ${warehouse.has_refrigeration}, 
          fuel_price = ${warehouse.fuel_price},
          truck_capacity = ${capacity}
      WHERE id = ${id}
      RETURNING *
    `;
  },
};

export const trucks = {
  ...createBaseRepo("trucks"),
  byModel: (model: string) => pg_conn`SELECT * FROM trucks WHERE model = ${model}`,
  update: async (id: string, truck: {
    model?: string;
    speed?: number;
    is_valid?: number;
    size?: any;
    volume_max?: number;
    weight_max?: number;
    has_refrigeration?: number;
    fuel_capacity?: number;
    fuel_current?: number;
    fuel_consumption?: number;
    current_warehouse_id?: string | null;
    destination_warehouse_id?: string | null;
    origin_warehouse_id?: string | null;
  }) => {
    // If moving truck to a new warehouse, verify parking capacity
    if (truck.current_warehouse_id) {
      const check = await warehouses.checkParkingAvailable(truck.current_warehouse_id, id);
      if (!check.allowed) {
        throw new Error(check.reason || "Warehouse parking is full");
      }
    }

    return pg_conn`
      UPDATE trucks
      SET model = COALESCE(${truck.model}, model), 
          speed = COALESCE(${truck.speed}, speed), 
          is_valid = COALESCE(${truck.is_valid}, is_valid), 
          size = ${truck.size !== undefined ? (typeof truck.size === 'string' ? truck.size : JSON.stringify(truck.size)) : pg_conn`size`}, 
          volume_max = COALESCE(${truck.volume_max}, volume_max), 
          weight_max = COALESCE(${truck.weight_max}, weight_max), 
          has_refrigeration = COALESCE(${truck.has_refrigeration}, has_refrigeration), 
          fuel_capacity = COALESCE(${truck.fuel_capacity}, fuel_capacity), 
          fuel_current = COALESCE(${truck.fuel_current}, fuel_current), 
          fuel_consumption = COALESCE(${truck.fuel_consumption}, fuel_consumption), 
          current_warehouse_id = ${truck.current_warehouse_id !== undefined ? truck.current_warehouse_id : pg_conn`current_warehouse_id`}
      WHERE id = ${id}
      RETURNING *
    `;
  },
};

export const suppliers = createBaseRepo("suppliers");

// 4. TRANSACTION & ROUTING
export const orders = {
  ...createBaseRepo("orders"),
  byClient: (clientId: string) => pg_conn`SELECT * FROM orders WHERE client_id = ${clientId}`,
  items: (orderId: string) => pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`,
  routes: (orderId: string) => pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId}`,
  costs: (orderId: string) => pg_conn`SELECT * FROM freight_cost WHERE order_id = ${orderId}`,
  calculateDistance: async (orderId: string, originWarehouseId?: string) => {
    const orderRes = await pg_conn`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!orderRes || orderRes.length === 0) throw new Error("Order not found");
    const order = orderRes[0];

    let whId = originWarehouseId;
    if (!whId) {
      const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
      whId = routes[0]?.warehouse_id || "WH-001";
    }

    const whRes = await pg_conn`SELECT * FROM warehouses WHERE id = ${whId}`;
    const warehouse = whRes && whRes.length > 0 ? whRes[0] : null;

    const wCoords = parseLocationCoords(warehouse?.location, -22.3842, -43.1311);
    const oCoords = parseLocationCoords(order.final_destination, -22.4123, -42.9656);

    const distanceKm = await calculateDistanceInDb(wCoords.lat, wCoords.lon, oCoords.lat, oCoords.lon);
    await orders.updateDistance(orderId, distanceKm);

    return {
      order_id: orderId,
      distance_km: distanceKm,
      warehouse_id: whId,
      origin_coords: wCoords,
      destination_coords: oCoords,
    };
  },
  create: (order: { id: string; client_id: string; final_destination: string; time_limit: string; price: number; status?: string }) =>
    pg_conn`
      INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
      VALUES (${order.id}, ${order.client_id}, ${order.final_destination}, ${order.time_limit}, ${order.price}, ${order.status || 'Pending'})
      RETURNING *
    `,
  addItem: (item: { order_id: string; product_id: string; quantity: number }) =>
    pg_conn`
      INSERT INTO orders_items (order_id, product_id, quantity)
      VALUES (${item.order_id}, ${item.product_id}, ${item.quantity})
      RETURNING *
    `,
  updateDistance: (orderId: string, distanceKm: number) =>
    pg_conn`
      UPDATE orders 
      SET distance_km = ${distanceKm} 
      WHERE id = ${orderId}
      RETURNING *
    `,
  calculateETA: async (
    orderId: string,
    options?: {
      minSpeed?: number;
      maxSpeed?: number;
      avgSpeed?: number;
      departureTime?: string;
      originWarehouseId?: string;
      truckId?: string;
    }
  ) => {
    const orderRes = await pg_conn`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!orderRes || orderRes.length === 0) throw new Error("Order not found");
    const order = orderRes[0];

    // Find route steps & origin warehouse
    const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
    let originWhId = options?.originWarehouseId || routes[0]?.warehouse_id || "WH-001";
    const whRes = await pg_conn`SELECT * FROM warehouses WHERE id = ${originWhId}`;
    const warehouse = whRes && whRes.length > 0 ? whRes[0] : null;

    // Find assigned truck
    let truckId = options?.truckId || routes.find((r: any) => r.truck_id)?.truck_id;
    let truckData: any = null;
    if (truckId) {
      const tRes = await pg_conn`SELECT * FROM trucks WHERE id = ${truckId}`;
      if (tRes && tRes.length > 0) truckData = tRes[0];
    }
    if (!truckData) {
      const allTrucks = await pg_conn`SELECT * FROM trucks LIMIT 1`;
      truckData = allTrucks[0];
    }

    // 1. Determine Distance
    let distanceKm = Number(order.distance_km || 0);
    if (distanceKm <= 0) {
      const wCoords = parseLocationCoords(warehouse?.location, -22.3842, -43.1311);
      const oCoords = parseLocationCoords(order.final_destination, -22.4123, -42.9656);
      distanceKm = await calculateDistanceInDb(wCoords.lat, wCoords.lon, oCoords.lat, oCoords.lon);
      await orders.updateDistance(orderId, distanceKm);
    }

    // 2. Speed Limits
    // Smallest reasonable speed (e.g. 40.0 km/h for heavy commercial trucks in regional/urban terrain)
    const minSpeed = options?.minSpeed !== undefined ? Number(options.minSpeed) : 40.0;
    // Maximum speed the truck can travel (from truck profile or 85.0 km/h)
    const maxSpeed = options?.maxSpeed !== undefined ? Number(options.maxSpeed) : Number(truckData?.speed || 85.0);
    // Nominal / Expected speed
    const avgSpeed = options?.avgSpeed !== undefined ? Number(options.avgSpeed) : Math.round(((minSpeed + maxSpeed) / 2) * 10) / 10;

    // 3. Driver Working Hours Regulation: Max 8 hours driving per day (Brazilian CLT / Transport Standard)
    // For every 8 hours of driving time accumulated, a mandatory daily rest stop of 16 hours is incurred.
    const computeTransitWithDriverRest = (speedKmH: number) => {
      const effectiveSpeed = Math.max(1, speedKmH);
      const drivingHours = distanceKm / effectiveSpeed;
      
      // Number of mandatory 16-hour rest periods triggered by exceeding 8h driving blocks
      const full8HourBlocks = Math.floor((drivingHours - 0.001) / 8);
      const restPeriodsCount = Math.max(0, full8HourBlocks);
      const restHours = restPeriodsCount * 16;
      const totalTransitHours = drivingHours + restHours;

      return {
        speed: speedKmH,
        drivingHours: Math.round(drivingHours * 100) / 100,
        restPeriodsCount,
        restHours: Math.round(restHours * 100) / 100,
        totalTransitHours: Math.round(totalTransitHours * 100) / 100,
      };
    };

    const fastCase = computeTransitWithDriverRest(maxSpeed);     // Min transit time (max speed)
    const slowCase = computeTransitWithDriverRest(minSpeed);     // Max transit time (min speed)
    const avgCase = computeTransitWithDriverRest(avgSpeed);       // Expected transit time

    // 4. Departure and Arrival Timestamps
    const departureStr = options?.departureTime || new Date().toISOString();
    const departureMs = new Date(departureStr).getTime();

    const etaMinMs = departureMs + fastCase.totalTransitHours * 3600 * 1000;
    const etaMaxMs = departureMs + slowCase.totalTransitHours * 3600 * 1000;
    const etaAvgMs = departureMs + avgCase.totalTransitHours * 3600 * 1000;

    const etaMin = new Date(etaMinMs).toISOString().replace("T", " ").slice(0, 19);
    const etaMax = new Date(etaMaxMs).toISOString().replace("T", " ").slice(0, 19);
    const etaExpected = new Date(etaAvgMs).toISOString().replace("T", " ").slice(0, 19);

    // 5. Update order route step estimated_time with expected ETA if route exists
    if (routes.length > 0) {
      try {
        await pg_conn`
          UPDATE orders_route 
          SET estimated_time = ${etaExpected}
          WHERE order_id = ${orderId} AND step = ${routes[routes.length - 1].step}
        `;
      } catch {
        /* ignore */
      }
    }

    // 6. Check compliance against deadline (order.time_limit)
    let isOnTime = true;
    let complianceStatus: "on_time" | "at_risk" | "overdue" = "on_time";
    if (order.time_limit) {
      const deadlineMs = new Date(order.time_limit).getTime();
      if (!isNaN(deadlineMs)) {
        if (etaMaxMs <= deadlineMs) {
          complianceStatus = "on_time";
          isOnTime = true;
        } else if (etaAvgMs <= deadlineMs) {
          complianceStatus = "at_risk";
          isOnTime = true;
        } else {
          complianceStatus = "overdue";
          isOnTime = false;
        }
      }
    }

    return {
      order_id: orderId,
      distance_km: distanceKm,
      min_speed_kmh: minSpeed,
      max_speed_kmh: maxSpeed,
      avg_speed_kmh: avgSpeed,
      driving_hours_min: fastCase.drivingHours,
      driving_hours_max: slowCase.drivingHours,
      driving_hours_avg: avgCase.drivingHours,
      rest_hours_min: fastCase.restHours,
      rest_hours_max: slowCase.restHours,
      rest_hours_avg: avgCase.restHours,
      rest_periods_count: avgCase.restPeriodsCount,
      total_transit_hours_min: fastCase.totalTransitHours,
      total_transit_hours_max: slowCase.totalTransitHours,
      total_transit_hours_avg: avgCase.totalTransitHours,
      departure_time: departureStr,
      eta_min: etaMin,
      eta_max: etaMax,
      eta_expected: etaExpected,
      time_limit: order.time_limit,
      is_on_time: isOnTime,
      compliance_status: complianceStatus,
    };
  },
};

export const orders_route = {
  ...createBaseRepo("orders_route"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`,
  create: async (routeStep: {
    order_id: string;
    step: number;
    warehouse_id?: string | null;
    truck_id?: string | null;
    destination_warehouse_id?: string | null;
    estimated_time?: string | null;
    arrived_at?: string | null;
  }) => {
    if (routeStep.destination_warehouse_id) {
      const check = await warehouses.checkParkingAvailable(routeStep.destination_warehouse_id, routeStep.truck_id || undefined);
      if (!check.allowed) {
        throw new Error(check.reason || "Destination warehouse parking is full");
      }
    }
    return pg_conn`
      INSERT INTO orders_route (order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time, arrived_at)
      VALUES (${routeStep.order_id}, ${routeStep.step}, ${routeStep.warehouse_id || null}, ${routeStep.truck_id || null}, ${routeStep.destination_warehouse_id || null}, ${routeStep.estimated_time || null}, ${routeStep.arrived_at || null})
      RETURNING *
    `;
  },
  update: async (orderId: string, step: number, routeStep: {
    warehouse_id?: string | null;
    truck_id?: string | null;
    destination_warehouse_id?: string | null;
    estimated_time?: string | null;
    arrived_at?: string | null;
  }) => {
    if (routeStep.destination_warehouse_id) {
      const check = await warehouses.checkParkingAvailable(routeStep.destination_warehouse_id, routeStep.truck_id || undefined);
      if (!check.allowed) {
        throw new Error(check.reason || "Destination warehouse parking is full");
      }
    }
    return pg_conn`
      UPDATE orders_route
      SET warehouse_id = ${routeStep.warehouse_id !== undefined ? routeStep.warehouse_id : pg_conn`warehouse_id`},
          truck_id = ${routeStep.truck_id !== undefined ? routeStep.truck_id : pg_conn`truck_id`},
          destination_warehouse_id = ${routeStep.destination_warehouse_id !== undefined ? routeStep.destination_warehouse_id : pg_conn`destination_warehouse_id`},
          estimated_time = ${routeStep.estimated_time !== undefined ? routeStep.estimated_time : pg_conn`estimated_time`},
          arrived_at = ${routeStep.arrived_at !== undefined ? routeStep.arrived_at : pg_conn`arrived_at`}
      WHERE order_id = ${orderId} AND step = ${step}
      RETURNING *
    `;
  },
  delete: (orderId: string, step: number) =>
    pg_conn`DELETE FROM orders_route WHERE order_id = ${orderId} AND step = ${step} RETURNING *`,
};

export const supplyRoutes = {
  ...createBaseRepo("supplies_route"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM supplies_route WHERE order_id = ${orderId}`,
  bySupplier: (supplierId: string) => pg_conn`SELECT * FROM supplies_route WHERE supplier_id = ${supplierId}`,
};

export const freightCosts = {
  ...createBaseRepo("freight_cost"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM freight_cost WHERE order_id = ${orderId}`,
  calculateAndSave: async (
    orderId: string,
    options?: {
      driverWage?: number;
      fuelPrice?: number;
      distanceKm?: number;
      truckId?: string;
      driverId?: string;
    }
  ) => {
    const orderRes = await pg_conn`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!orderRes || orderRes.length === 0) throw new Error("Order not found");
    const order = orderRes[0];

    // 1. Determine all warehouses the order goes through
    const routeSteps = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
    const warehouseIdSet = new Set<string>();
    for (const step of routeSteps) {
      if (step.warehouse_id) warehouseIdSet.add(step.warehouse_id);
      if (step.destination_warehouse_id) warehouseIdSet.add(step.destination_warehouse_id);
    }
    if (warehouseIdSet.size === 0) {
      warehouseIdSet.add("WH-001");
    }
    const warehouseIds = Array.from(warehouseIdSet);

    // 2. Average gas price in warehouses passed through
    const avgFuelPrice =
      options?.fuelPrice !== undefined
        ? options.fuelPrice
        : await warehouses.getAverageGasPrice(warehouseIds);

    // 3. Driver wage
    const driverWage =
      options?.driverWage !== undefined
        ? options.driverWage
        : await users.getDriverWage(options?.driverId);

    // 4. Truck consumption, speed, wear rate
    let truckId = options?.truckId || routeSteps.find((s: any) => s.truck_id)?.truck_id;
    let truckData: any = null;
    if (truckId) {
      const tRes = await pg_conn`SELECT * FROM trucks WHERE id = ${truckId}`;
      if (tRes && tRes.length > 0) truckData = tRes[0];
    }
    if (!truckData) {
      const allTrucks = await pg_conn`SELECT * FROM trucks LIMIT 1`;
      truckData = allTrucks[0];
    }

    const consumption = Number(truckData?.fuel_consumption ?? 0.35);
    const speed = Number(truckData?.speed ?? 80.0);
    const wearRate = Number(truckData?.wear_rate ?? 0.15);

    // 5. Distance in km (calculated in DB if missing)
    let distanceKm = options?.distanceKm;
    if (distanceKm === undefined || distanceKm === null || distanceKm <= 0) {
      if (order.distance_km !== null && order.distance_km !== undefined && Number(order.distance_km) > 0) {
        distanceKm = Number(order.distance_km);
      } else {
        const calc = await orders.calculateDistance(orderId, warehouseIds[0]);
        distanceKm = calc.distance_km;
      }
    }

    // 6. Cost calculations
    const fuelLiters = distanceKm * consumption;
    const fuelCost = Math.round(fuelLiters * avgFuelPrice * 100) / 100;

    const travelHours = distanceKm / (speed > 0 ? speed : 80.0);
    const laborCost = Math.round(travelHours * driverWage * 100) / 100;

    const maintenanceCost = Math.round(distanceKm * wearRate * 100) / 100;
    const totalCost = Math.round((fuelCost + laborCost + maintenanceCost) * 100) / 100;

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19);

    // 7. Save to freight_cost table in PostgreSQL
    const saved = await pg_conn`
      INSERT INTO freight_cost (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at)
      VALUES (${orderId}, ${fuelCost}, ${laborCost}, ${maintenanceCost}, ${totalCost}, ${nowStr})
      ON CONFLICT (order_id) DO UPDATE SET
        fuel_cost = EXCLUDED.fuel_cost,
        labor_cost = EXCLUDED.labor_cost,
        maintenance_cost = EXCLUDED.maintenance_cost,
        total_cost = EXCLUDED.total_cost,
        calculated_at = EXCLUDED.calculated_at
      RETURNING *
    `;

    return {
      ...saved[0],
      distance_km: distanceKm,
      avg_fuel_price: avgFuelPrice,
      driver_wage: driverWage,
      warehouses_passed: warehouseIds,
      fuel_liters: Math.round(fuelLiters * 100) / 100,
      travel_hours: Math.round(travelHours * 100) / 100,
      fuel_cost: fuelCost,
      labor_cost: laborCost,
      maintenance_cost: maintenanceCost,
      total_cost: totalCost,
    };
  },
};

export const monthlyPerformance = {
  all: async () => {
    try {
      const res = await pg_conn`SELECT * FROM monthly_performance ORDER BY month ASC`;
      if (res && res.length > 0) return res;
    } catch {
      /* fallback if table doesn't exist */
    }
    return [
      { month: "Jan", full_month: "January 2026", revenue: 34500, costs: 14200, profit: 20300, fuel_cost: 5800, labor_cost: 6200, maintenance_cost: 2200, orders_count: 42, is_poi: 1, poi: "Fleet Modernization & Route Optimization Launched" },
      { month: "Feb", full_month: "February 2026", revenue: 29800, costs: 12900, profit: 16900, fuel_cost: 5100, labor_cost: 5900, maintenance_cost: 1900, orders_count: 38, is_poi: 0, poi: null },
      { month: "Mar", full_month: "March 2026", revenue: 43200, costs: 18100, profit: 25100, fuel_cost: 7400, labor_cost: 8100, maintenance_cost: 2600, orders_count: 56, is_poi: 1, poi: "Q1 Peak Volume & Strategic Enterprise Client Onboarding" },
      { month: "Apr", full_month: "April 2026", revenue: 37800, costs: 16500, profit: 21300, fuel_cost: 6700, labor_cost: 7300, maintenance_cost: 2500, orders_count: 48, is_poi: 0, poi: null },
      { month: "May", full_month: "May 2026", revenue: 41500, costs: 17200, profit: 24300, fuel_cost: 7000, labor_cost: 7600, maintenance_cost: 2600, orders_count: 51, is_poi: 0, poi: null },
      { month: "Jun", full_month: "June 2026", revenue: 51000, costs: 21800, profit: 29200, fuel_cost: 9100, labor_cost: 9500, maintenance_cost: 3200, orders_count: 64, is_poi: 1, poi: "Cold Storage Facility Expansion (Nova Friburgo Hub)" },
      { month: "Jul", full_month: "July 2026", revenue: 46200, costs: 19400, profit: 26800, fuel_cost: 8000, labor_cost: 8600, maintenance_cost: 2800, orders_count: 59, is_poi: 0, poi: null },
      { month: "Aug", full_month: "August 2026", revenue: 49500, costs: 20500, profit: 29000, fuel_cost: 8500, labor_cost: 9000, maintenance_cost: 3000, orders_count: 62, is_poi: 0, poi: null },
      { month: "Sep", full_month: "September 2026", revenue: 55800, costs: 23200, profit: 32600, fuel_cost: 9800, labor_cost: 10100, maintenance_cost: 3300, orders_count: 71, is_poi: 1, poi: "Automated Freight Dispatch & Smart Route Planning Integration" },
      { month: "Oct", full_month: "October 2026", revenue: 52100, costs: 21900, profit: 30200, fuel_cost: 9200, labor_cost: 9600, maintenance_cost: 3100, orders_count: 66, is_poi: 0, poi: null },
      { month: "Nov", full_month: "November 2026", revenue: 58900, costs: 24800, profit: 34100, fuel_cost: 10300, labor_cost: 10800, maintenance_cost: 3700, orders_count: 78, is_poi: 0, poi: null },
      { month: "Dec", full_month: "December 2026", revenue: 68400, costs: 27900, profit: 40500, fuel_cost: 11800, labor_cost: 12000, maintenance_cost: 4100, orders_count: 89, is_poi: 1, poi: "Record Holiday Delivery Peak & Highest Annual Operating Margin" },
    ];
  },
};

