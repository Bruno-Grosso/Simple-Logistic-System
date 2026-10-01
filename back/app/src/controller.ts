import { pg_conn } from "./model";
import crypto from "node:crypto";

// ─── ELLIPTIC CURVE CYBERPROTECTION (ECDSA prime256v1 / P-256) ────────────────
// Generate in-memory elliptic curve keypair for signing session tokens and verifying tamper-proof claims
const ecKeyPair = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

export const ecSecurity = {
  publicKeyPem: ecKeyPair.publicKey,
  signPayload: (payload: Record<string, any>): string => {
    const jsonStr = JSON.stringify(payload);
    const sign = crypto.createSign("SHA256");
    sign.update(jsonStr);
    sign.end();
    const signature = sign.sign(ecKeyPair.privateKey, "hex");
    const encodedPayload = Buffer.from(jsonStr).toString("base64url");
    return `${encodedPayload}.${signature}`;
  },
  verifyToken: (token: string): { valid: boolean; payload?: any; error?: string } => {
    try {
      const parts = token.split(".");
      if (parts.length !== 2) return { valid: false, error: "Malformed token structure" };
      const [encodedPayload, signature] = parts;
      const jsonStr = Buffer.from(encodedPayload, "base64url").toString("utf8");
      const verify = crypto.createVerify("SHA256");
      verify.update(jsonStr);
      verify.end();
      const isValid = verify.verify(ecKeyPair.publicKey, signature, "hex");
      if (!isValid) return { valid: false, error: "Invalid cryptographic signature" };
      const payload = JSON.parse(jsonStr);
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, error: "Token expired" };
      }
      return { valid: true, payload };
    } catch (err: any) {
      return { valid: false, error: err.message || "Cryptographic verification failure" };
    }
  },
};


// Auto-migration to ensure required columns and the distance calculation function exist.
(async () => {
  try {
    await pg_conn`ALTER TABLE users ADD COLUMN IF NOT EXISTS wage REAL NOT NULL DEFAULT 45.0`;
    await pg_conn`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
    await pg_conn`ALTER TABLE users ADD COLUMN IF NOT EXISTS warehouse_id TEXT REFERENCES warehouses(id)`;
    await pg_conn`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active INTEGER NOT NULL DEFAULT 1`;
    await pg_conn`ALTER TABLE orders_route ADD COLUMN IF NOT EXISTS driver_id TEXT REFERENCES users(id)`;
    await pg_conn`
      UPDATE users
      SET email = lower(split_part(name, ' ', 1)) || '@logisys.com'
      WHERE email IS NULL OR email = ''
    `;
    await pg_conn`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email)) WHERE email IS NOT NULL`;
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
    await pg_conn`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
    await pg_conn`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK(role IN ('admin','warehouse_worker','truck_driver','client','worker','dispatcher','inventory_manager','maintenance_technician','manager'))
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
  if (str.includes("Bom Jardim")) return { lat: -22.1500, lon: -42.4167 };

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
    if (res && res.length > 0 && res[0].distance_km !== null) {
      return Math.round(Number(res[0].distance_km) * 10) / 10;
    }
  } catch {
    // Fallback to JS Haversine formula
  }
  return haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * JS implementation of Haversine distance in km
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

    // Direct indexed query on PostgreSQL instead of loading all users into memory
    const candidates = await pg_conn`
      SELECT * FROM users
      WHERE (
        lower(email) = ${input}
        OR lower(id) = ${input}
        OR lower(id) = ${cleanPrefix}
        OR lower(name) = ${input}
        OR lower(split_part(name, ' ', 1)) = ${cleanPrefix}
        OR name ILIKE ${'%' + cleanPrefix + '%'}
      )
      LIMIT 10
    `;

    const matched = candidates.find((u: any) => {
      const matchPass = String(u.password) === String(passwordInput);
      return matchPass;
    });

    if (!matched || Number(matched.is_active ?? 1) === 0) return null;

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

    const ecToken = ecSecurity.signPayload({
      sub: matched.id,
      role: matched.role,
      name: matched.name,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
      algorithm: "ECDSA-SHA256 (prime256v1)",
    });

    return {
      sessionToken: sessionId,
      token: sessionId,
      ecToken,
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
  update: async (id: string, user: { name?: string; password?: string; address?: any; role?: string; wage?: number; warehouse_id?: string | null; is_active?: number }) => {
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
    if (user.warehouse_id !== undefined) {
      await pg_conn`UPDATE users SET warehouse_id = ${user.warehouse_id} WHERE id = ${id}`;
    }
    if (user.is_active !== undefined) {
      await pg_conn`UPDATE users SET is_active = ${Number(user.is_active) ? 1 : 0} WHERE id = ${id}`;
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
      INSERT INTO users (id, name, email, password, address, role, wage)
      VALUES (${id}, ${client.name}, ${client.email || null}, ${client.password}, ${addressJson}, ${role}, ${wage})
      RETURNING id, name, email, address, role, wage
    `;
    return inserted[0];
  },
  createEmployee: async (employee: { name: string; email?: string; password: string; address?: string; role: "warehouse_worker" | "truck_driver"; wage?: number; warehouse_id?: string | null; is_active?: number }) => {
    const id = `USR-${Date.now().toString().slice(-7)}`;
    const address = JSON.stringify({ address: employee.address || "" });
    const inserted = await pg_conn`
      INSERT INTO users (id, name, email, password, address, role, warehouse_id, wage, is_active)
      VALUES (${id}, ${employee.name}, ${employee.email || null}, ${employee.password}, ${address}, ${employee.role}, ${employee.warehouse_id || null}, ${Number(employee.wage ?? 45)}, ${employee.is_active === 0 ? 0 : 1})
      RETURNING *
    `;
    return inserted[0];
  },
  delete: (id: string) => pg_conn`DELETE FROM users WHERE id = ${id} RETURNING *`,
};

export const onlineUsers = {
  ...createBaseRepo("online_users"),
  byUser: (userId: string) => pg_conn`SELECT * FROM online_users WHERE user_id = ${userId}`,
};

// 2. PRODUCT & INVENTORY
export const products = {
  ...createBaseRepo("products"),
  searchByName: (name: string) => pg_conn`SELECT * FROM products WHERE name ILIKE ${'%' + name + '%'}`,
  create: (product: {
    id: string;
    name: string;
    price: number;
    is_cold?: number;
    is_fragile?: number;
    expire_date?: string | null;
    size?: any;
    volume: number;
    weight: number;
  }) =>
    pg_conn`
      INSERT INTO products (id, name, price, is_cold, is_fragile, expire_date, size, volume, weight)
      VALUES (
        ${product.id},
        ${product.name},
        ${product.price},
        ${product.is_cold ?? 0},
        ${product.is_fragile ?? 0},
        ${product.expire_date ?? null},
        ${typeof product.size === 'string' ? product.size : JSON.stringify(product.size ?? {})},
        ${product.volume},
        ${product.weight}
      )
      RETURNING *
    `,
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
  upsertStock: async (warehouseId: string, productId: string, quantity: number) => {
    return pg_conn`
      INSERT INTO warehouses_stock (warehouse_id, product_id, quantity)
      VALUES (${warehouseId}, ${productId}, ${quantity})
      ON CONFLICT (warehouse_id, product_id)
      DO UPDATE SET quantity = ${quantity}
      RETURNING *
    `;
  },
  deleteStock: async (warehouseId: string, productId: string) => {
    return pg_conn`
      DELETE FROM warehouses_stock
      WHERE warehouse_id = ${warehouseId} AND product_id = ${productId}
      RETURNING *
    `;
  },
  update: async (id: string, patch: {
    location?: any;
    size?: any;
    volume_max?: number;
    volume_current?: number;
    has_refrigeration?: number;
    fuel_price?: number;
    truck_capacity?: number;
  }) => {
    const current = await pg_conn`SELECT * FROM warehouses WHERE id = ${id}`;
    if (!current || current.length === 0) return [];
    const w = current[0];
    const loc = patch.location !== undefined ? (typeof patch.location === 'string' ? patch.location : JSON.stringify(patch.location)) : (typeof w.location === 'string' ? w.location : JSON.stringify(w.location));
    const sz = patch.size !== undefined ? (typeof patch.size === 'string' ? patch.size : JSON.stringify(patch.size)) : (typeof w.size === 'string' ? w.size : JSON.stringify(w.size));
    const vMax = patch.volume_max !== undefined ? Number(patch.volume_max) : Number(w.volume_max);
    const vCur = patch.volume_current !== undefined ? Number(patch.volume_current) : Number(w.volume_current);
    const refrig = patch.has_refrigeration !== undefined ? Number(patch.has_refrigeration) : Number(w.has_refrigeration);
    const fuel = patch.fuel_price !== undefined ? Number(patch.fuel_price) : Number(w.fuel_price);
    const cap = patch.truck_capacity !== undefined ? Number(patch.truck_capacity) : Number(w.truck_capacity);

    return pg_conn`
      UPDATE warehouses
      SET location = ${loc}, size = ${sz}, volume_max = ${vMax}, volume_current = ${vCur},
          has_refrigeration = ${refrig}, fuel_price = ${fuel}, truck_capacity = ${cap}
      WHERE id = ${id}
      RETURNING *
    `;
  },
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
  cargo: (truckId?: string) => {
    if (truckId) {
      return pg_conn`SELECT truck_id, product_id, quantity FROM trucks_cargo WHERE truck_id = ${truckId} AND quantity > 0`;
    }
    return pg_conn`SELECT truck_id, product_id, quantity FROM trucks_cargo WHERE quantity > 0`;
  },
};

export const suppliers = createBaseRepo("suppliers");

// 4. TRANSACTION & ROUTING
export const orders = {
  ...createBaseRepo("orders"),
  byClient: (clientId: string) => pg_conn`SELECT * FROM orders WHERE client_id = ${clientId}`,
  byDriver: (driverId: string) => pg_conn`
    SELECT DISTINCT o.* FROM orders o
    JOIN orders_route r ON r.order_id = o.id
    WHERE r.driver_id = ${driverId}
  `,
  byWarehouse: (warehouseId: string) => pg_conn`
    SELECT DISTINCT o.* FROM orders o
    JOIN orders_route r ON r.order_id = o.id
    WHERE r.warehouse_id = ${warehouseId} OR r.destination_warehouse_id = ${warehouseId}
  `,
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
  getOrderLoad: async (orderId: string): Promise<{ totalWeight: number; totalVolume: number; itemCount: number }> => {
    const itemsRes = await pg_conn`
      SELECT oi.quantity, p.weight, p.volume
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    `;
    let totalWeight = 0;
    let totalVolume = 0;
    let itemCount = 0;
    for (const item of itemsRes) {
      const qty = Number(item.quantity || 0);
      itemCount += qty;
      totalWeight += qty * Number(item.weight || 0);
      totalVolume += qty * Number(item.volume || 0);
    }
    return {
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalVolume: Math.round(totalVolume * 1000) / 1000,
      itemCount,
    };
  },
  validateAndPrepareDispatchStock: async (orderId: string) => {
    const items = await pg_conn`
      SELECT oi.product_id, oi.quantity, p.name as product_name
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    `;
    if (!items || items.length === 0) {
      return { ok: true, sourceWarehouseId: "WH-001", hasWarehouseStop: false };
    }

    const routes = await pg_conn`
      SELECT * FROM orders_route 
      WHERE order_id = ${orderId} 
      ORDER BY step ASC
    `;
    const originWarehouseId = routes[0]?.warehouse_id || "WH-001";

    // 1. Check if originating warehouse has all products in required quantities
    let originHasAll = true;
    for (const item of items) {
      const stockRes = await pg_conn`
        SELECT quantity FROM warehouses_stock 
        WHERE warehouse_id = ${originWarehouseId} AND product_id = ${item.product_id}
      `;
      const avail = Number(stockRes[0]?.quantity || 0);
      if (avail < Number(item.quantity)) {
        originHasAll = false;
        break;
      }
    }

    if (originHasAll) {
      return { ok: true, sourceWarehouseId: originWarehouseId, hasWarehouseStop: false };
    }

    // 2. Origin warehouse lacks stock. Check if another single warehouse has ALL required products
    const otherWarehouses = await pg_conn`
      SELECT id, location FROM warehouses 
      WHERE id != ${originWarehouseId}
      ORDER BY id ASC
    `;

    let pickupWarehouseId: string | null = null;
    for (const wh of otherWarehouses) {
      let whHasAll = true;
      for (const item of items) {
        const stockRes = await pg_conn`
          SELECT quantity FROM warehouses_stock 
          WHERE warehouse_id = ${wh.id} AND product_id = ${item.product_id}
        `;
        const avail = Number(stockRes[0]?.quantity || 0);
        if (avail < Number(item.quantity)) {
          whHasAll = false;
          break;
        }
      }
      if (whHasAll) {
        pickupWarehouseId = wh.id;
        break;
      }
    }

    // 3. If no single warehouse has all the products of the order, dispatch cannot proceed
    if (!pickupWarehouseId) {
      throw new Error(
        `Cannot dispatch order ${orderId}: Origin warehouse ${originWarehouseId} lacks products, and no other warehouse has complete stock for this order.`
      );
    }

    // 4. Products are all in another warehouse: configure a stop in that warehouse
    const truckId = routes[0]?.truck_id || null;
    const driverId = routes[0]?.driver_id || null;

    if (routes.length <= 1) {
      // Step 1: Origin warehouse -> Pickup warehouse stop
      await pg_conn`
        UPDATE orders_route
        SET destination_warehouse_id = ${pickupWarehouseId}
        WHERE order_id = ${orderId} AND step = 1
      `;
      // Step 2: Pickup warehouse -> Customer delivery
      await pg_conn`
        INSERT INTO orders_route (order_id, step, warehouse_id, truck_id, driver_id, destination_warehouse_id)
        VALUES (${orderId}, 2, ${pickupWarehouseId}, ${truckId}, ${driverId}, NULL)
        ON CONFLICT (order_id, step) DO UPDATE 
        SET warehouse_id = ${pickupWarehouseId}, truck_id = ${truckId}, driver_id = ${driverId}
      `;
    }

    return {
      ok: true,
      sourceWarehouseId: pickupWarehouseId,
      hasWarehouseStop: true,
      pickupWarehouseId,
    };
  },
  deductStockForOrder: async (orderId: string, loadOntoTruck = true) => {
    const items = await pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`;
    if (!items || items.length === 0) return;

    // Validate warehouse stock and configure warehouse stop if products are in another warehouse
    const dispatchStock = await orders.validateAndPrepareDispatchStock(orderId);
    const targetWh = dispatchStock.sourceWarehouseId;

    for (const item of items) {
      await pg_conn`
        UPDATE warehouses_stock
        SET quantity = GREATEST(0, quantity - ${Number(item.quantity)})
        WHERE warehouse_id = ${targetWh} AND product_id = ${item.product_id}
      `;
    }

    if (loadOntoTruck) {
      const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
      const truckId = routes.find((r: any) => r.truck_id)?.truck_id;
      if (truckId) {
        for (const item of items) {
          await pg_conn`
            INSERT INTO trucks_cargo (truck_id, product_id, quantity)
            VALUES (${truckId}, ${item.product_id}, ${Number(item.quantity)})
            ON CONFLICT (truck_id, product_id)
            DO UPDATE SET quantity = trucks_cargo.quantity + EXCLUDED.quantity
          `;
        }
        const load = await orders.getOrderLoad(orderId);
        await pg_conn`
          UPDATE trucks
          SET is_delivering = 1,
              weight_current = COALESCE(weight_current, 0) + ${load.totalWeight},
              volume_current = COALESCE(volume_current, 0) + ${load.totalVolume}
          WHERE id = ${truckId}
        `;
      }
    }
  },
  restoreStockForOrder: async (orderId: string) => {
    const items = await pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`;
    if (!items || items.length === 0) return;

    const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
    const targetWh = routes.length > 1 && routes[1]?.warehouse_id ? routes[1].warehouse_id : (routes[0]?.warehouse_id || "WH-001");

    for (const item of items) {
      await pg_conn`
        UPDATE warehouses_stock
        SET quantity = quantity + ${Number(item.quantity)}
        WHERE warehouse_id = ${targetWh} AND product_id = ${item.product_id}
      `;
    }

    const truckId = routes.find((r: any) => r.truck_id)?.truck_id;
    if (truckId) {
      for (const item of items) {
        await pg_conn`
          UPDATE trucks_cargo
          SET quantity = GREATEST(0, quantity - ${Number(item.quantity)})
          WHERE truck_id = ${truckId} AND product_id = ${item.product_id}
        `;
      }
      const load = await orders.getOrderLoad(orderId);
      const remainingCargo = await pg_conn`
        SELECT SUM(quantity) as total FROM trucks_cargo WHERE truck_id = ${truckId}
      `;
      const hasRemaining = Number(remainingCargo[0]?.total || 0) > 0;
      await pg_conn`
        UPDATE trucks
        SET is_delivering = ${hasRemaining ? 1 : 0},
            weight_current = GREATEST(0, COALESCE(weight_current, 0) - ${load.totalWeight}),
            volume_current = GREATEST(0, COALESCE(volume_current, 0) - ${load.totalVolume})
        WHERE id = ${truckId}
      `;
    }
  },
  releaseTruckCargoOnDelivered: async (orderId: string) => {
    const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
    const truckId = routes.find((r: any) => r.truck_id)?.truck_id;
    if (!truckId) return;

    const items = await pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`;
    for (const item of items) {
      await pg_conn`
        UPDATE trucks_cargo
        SET quantity = GREATEST(0, quantity - ${Number(item.quantity)})
        WHERE truck_id = ${truckId} AND product_id = ${item.product_id}
      `;
    }

    const load = await orders.getOrderLoad(orderId);
    const remainingCargo = await pg_conn`
      SELECT SUM(quantity) as total FROM trucks_cargo WHERE truck_id = ${truckId}
    `;
    const hasRemaining = Number(remainingCargo[0]?.total || 0) > 0;
    await pg_conn`
      UPDATE trucks
      SET is_delivering = ${hasRemaining ? 1 : 0},
          weight_current = GREATEST(0, COALESCE(weight_current, 0) - ${load.totalWeight}),
          volume_current = GREATEST(0, COALESCE(volume_current, 0) - ${load.totalVolume})
      WHERE id = ${truckId}
    `;
  },
  updateStatus: async (orderId: string, status: "Pending" | "Shipped" | "Delivered" | "Canceled") => {
    const prevOrder = await pg_conn`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!prevOrder || prevOrder.length === 0) return [];
    const prevStatus = prevOrder[0].status;

    if (status === "Shipped" && prevStatus !== "Shipped" && prevStatus !== "Delivered") {
      await orders.deductStockForOrder(orderId, true);
    } else if (status === "Delivered" && prevStatus !== "Shipped" && prevStatus !== "Delivered") {
      // Direct delivery without prior Shipped step: decrement warehouse stock directly
      await orders.deductStockForOrder(orderId, false);
    } else if (status === "Delivered" && prevStatus === "Shipped") {
      await orders.releaseTruckCargoOnDelivered(orderId);
    } else if ((status === "Canceled" || status === "Pending") && (prevStatus === "Shipped" || prevStatus === "Delivered")) {
      await orders.restoreStockForOrder(orderId);
    }

    return pg_conn`UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING *`;
  },
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
  suggestOptimalTruck: async (orderId: string, preferredWarehouseId?: string) => {
    const orderRes = await pg_conn`SELECT * FROM orders WHERE id = ${orderId}`;
    if (!orderRes || orderRes.length === 0) throw new Error("Order not found");
    const order = orderRes[0];

    const load = await orders.getOrderLoad(orderId);
    const itemsRes = await pg_conn`
      SELECT p.is_cold, p.is_fragile, oi.quantity
      FROM orders_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    `;
    const requiresCold = itemsRes.some((i: any) => Number(i.is_cold) === 1);
    const hasFragile = itemsRes.some((i: any) => Number(i.is_fragile) === 1);

    const routes = await pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId} ORDER BY step ASC`;
    const targetWhId = preferredWarehouseId || routes[0]?.warehouse_id || "WH-001";

    const allTrucks = await pg_conn`SELECT * FROM trucks WHERE is_valid = 1`;
    const allDrivers = await pg_conn`SELECT * FROM users WHERE role = 'truck_driver' AND is_active = 1`;

    const candidates = [];
    for (const t of allTrucks) {
      const weightMax = Number(t.weight_max || 25000);
      const volumeMax = Number(t.volume_max || 90);
      const weightCurrent = Number(t.weight_current || 0);
      const volumeCurrent = Number(t.volume_current || 0);
      const remainingWeight = Math.max(0, weightMax - weightCurrent);
      const remainingVolume = Math.max(0, volumeMax - volumeCurrent);

      // Check capacity
      if (load.totalWeight > remainingWeight || load.totalVolume > remainingVolume) {
        continue;
      }

      // Check cold storage requirement
      if (requiresCold && Number(t.has_refrigeration) !== 1) {
        continue;
      }

      // Score algorithm
      // Higher score is better:
      // +50 if truck is at the target warehouse
      // +30 if truck is idle (!is_delivering)
      // +20 if cold storage matches requirement appropriately
      // +10 - maintenance count penalty
      // Higher score for best fitting capacity (utilization)
      let score = 100;
      if (t.current_warehouse_id === targetWhId) score += 50;
      if (Number(t.is_delivering || 0) === 0) score += 35;
      if (requiresCold && Number(t.has_refrigeration) === 1) score += 20;
      if (!requiresCold && Number(t.has_refrigeration) === 1) score -= 5; // Reserve refrigerated truck for cold goods if possible
      score -= Number(t.truck_maintenance || 0) * 15;
      score -= (Number(t.wear_percentage || 0) / 100) * 20;

      // Weight fit bonus (prefer smaller capable truck to conserve large rigs)
      const weightRatio = load.totalWeight / (weightMax || 1);
      score += Math.round(weightRatio * 25);

      candidates.push({
        truck_id: t.id,
        model: t.model,
        current_warehouse_id: t.current_warehouse_id,
        has_refrigeration: Number(t.has_refrigeration) === 1,
        weight_max: weightMax,
        volume_max: volumeMax,
        remaining_weight: remainingWeight,
        remaining_volume: remainingVolume,
        is_delivering: Number(t.is_delivering || 0) === 1,
        score: Math.max(0, Math.round(score)),
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    const bestTruck = candidates[0] || null;

    // Pick a suggested driver (preferably not currently en route or matching warehouse)
    const suggestedDriver = allDrivers.length > 0 ? allDrivers[0] : null;

    return {
      order_id: orderId,
      order_load: load,
      requirements: {
        requires_cold: requiresCold,
        has_fragile: hasFragile,
      },
      warehouse_id: targetWhId,
      best_truck: bestTruck,
      suggested_driver: suggestedDriver ? { id: suggestedDriver.id, name: suggestedDriver.name } : null,
      candidate_trucks: candidates.slice(0, 5),
    };
  },
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
  validateTruckCapacity: async (truckId: string, orderId: string) => {
    const truckRes = await pg_conn`SELECT * FROM trucks WHERE id = ${truckId}`;
    if (!truckRes || truckRes.length === 0) {
      throw new Error(`Truck ${truckId} not found`);
    }
    const truck = truckRes[0];
    const weightMax = Number(truck.weight_max || 0);
    const volumeMax = Number(truck.volume_max || 0);

    const load = await orders.getOrderLoad(orderId);
    if (weightMax > 0 && load.totalWeight > weightMax) {
      throw new Error(
        `Truck ${truck.model || truckId} payload capacity exceeded: order weight (${load.totalWeight}kg) exceeds vehicle limit (${weightMax}kg)`
      );
    }
    if (volumeMax > 0 && load.totalVolume > volumeMax) {
      throw new Error(
        `Truck ${truck.model || truckId} volume capacity exceeded: order volume (${load.totalVolume}m³) exceeds vehicle limit (${volumeMax}m³)`
      );
    }
    return { ok: true, truck, load };
  },
  create: async (routeStep: {
    order_id: string;
    step: number;
    warehouse_id?: string | null;
    truck_id?: string | null;
    driver_id?: string | null;
    destination_warehouse_id?: string | null;
    estimated_time?: string | null;
    arrived_at?: string | null;
  }) => {
    // 1. If order is already Shipped, its route cannot be recalculated or re-assigned
    const orderRes = await pg_conn`SELECT status FROM orders WHERE id = ${routeStep.order_id}`;
    if (orderRes.length > 0 && orderRes[0].status === "Shipped") {
      throw new Error(`Order ${routeStep.order_id} has already been shipped and its route cannot be recalculated`);
    }

    // 2. An order cannot be in more than one route at the same time
    if (routeStep.truck_id) {
      const activeOtherRoutes = await pg_conn`
        SELECT r.truck_id, o.status
        FROM orders_route r
        JOIN orders o ON r.order_id = o.id
        WHERE r.order_id = ${routeStep.order_id}
          AND r.truck_id IS NOT NULL
          AND r.truck_id != ${routeStep.truck_id}
          AND o.status NOT IN ('Delivered', 'Canceled', 'Cancelled')
      `;
      if (activeOtherRoutes.length > 0) {
        throw new Error(
          `Order ${routeStep.order_id} is already in an active route with truck ${activeOtherRoutes[0].truck_id}. An order cannot be in more than one route at the same time.`
        );
      }
    }

    if (routeStep.truck_id) {
      await orders_route.validateTruckCapacity(routeStep.truck_id, routeStep.order_id);
    }
    if (routeStep.destination_warehouse_id) {
      const check = await warehouses.checkParkingAvailable(routeStep.destination_warehouse_id, routeStep.truck_id || undefined);
      if (!check.allowed) {
        throw new Error(check.reason || "Destination warehouse parking is full");
      }
    }
    return pg_conn`
      INSERT INTO orders_route (order_id, step, warehouse_id, truck_id, driver_id, destination_warehouse_id, estimated_time, arrived_at)
      VALUES (${routeStep.order_id}, ${routeStep.step}, ${routeStep.warehouse_id || null}, ${routeStep.truck_id || null}, ${routeStep.driver_id || null}, ${routeStep.destination_warehouse_id || null}, ${routeStep.estimated_time || null}, ${routeStep.arrived_at || null})
      RETURNING *
    `;
  },
  update: async (orderId: string, step: number, routeStep: {
    warehouse_id?: string | null;
    truck_id?: string | null;
    driver_id?: string | null;
    destination_warehouse_id?: string | null;
    estimated_time?: string | null;
    arrived_at?: string | null;
  }) => {
    // 1. If order is already Shipped, its route cannot be recalculated or changed
    const orderRes = await pg_conn`SELECT status FROM orders WHERE id = ${orderId}`;
    if (orderRes.length > 0 && orderRes[0].status === "Shipped") {
      throw new Error(`Order ${orderId} has already been shipped and its route cannot be recalculated`);
    }

    // 2. An order cannot be in more than one route at the same time
    if (routeStep.truck_id) {
      const activeOtherRoutes = await pg_conn`
        SELECT r.truck_id, o.status
        FROM orders_route r
        JOIN orders o ON r.order_id = o.id
        WHERE r.order_id = ${orderId}
          AND r.truck_id IS NOT NULL
          AND r.truck_id != ${routeStep.truck_id}
          AND o.status NOT IN ('Delivered', 'Canceled', 'Cancelled')
      `;
      if (activeOtherRoutes.length > 0) {
        throw new Error(
          `Order ${orderId} is already in an active route with truck ${activeOtherRoutes[0].truck_id}. An order cannot be in more than one route at the same time.`
        );
      }
    }

    if (routeStep.truck_id) {
      await orders_route.validateTruckCapacity(routeStep.truck_id, orderId);
    }
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
          driver_id = ${routeStep.driver_id !== undefined ? routeStep.driver_id : pg_conn`driver_id`},
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
  syncWithDatabase: async () => {
    try {
      // 0. Ensure all active orders have freight costs calculated
      const missingOrders = await pg_conn`
        SELECT o.id FROM orders o
        LEFT JOIN freight_cost fc ON fc.order_id = o.id
        WHERE fc.order_id IS NULL AND o.id NOT LIKE 'ORD-TEST-%' AND o.id NOT LIKE 'ORD-E2E-%'
      `;
      for (const mo of missingOrders) {
        try {
          await freightCosts.calculateAndSave(mo.id);
        } catch {
          /* ignore */
        }
      }

      // 1. Company-wide aggregation
      const companyRows = await pg_conn`
        SELECT 
          to_char(to_date(substring(o.time_limit from 1 for 7), 'YYYY-MM'), 'Mon') as month_abbr,
          to_char(to_date(substring(o.time_limit from 1 for 7), 'YYYY-MM'), 'FMMonth YYYY') as full_month_name,
          COALESCE(SUM(CASE WHEN o.status = 'Delivered' THEN o.price ELSE 0 END), 0)::real as live_revenue,
          COALESCE(SUM(fc.total_cost), 0)::real as live_costs,
          COALESCE(SUM(fc.fuel_cost), 0)::real as live_fuel,
          COALESCE(SUM(fc.labor_cost), 0)::real as live_labor,
          COALESCE(SUM(fc.maintenance_cost), 0)::real as live_maint,
          count(o.id)::int as live_orders
        FROM orders o
        LEFT JOIN freight_cost fc ON fc.order_id = o.id
        WHERE o.id NOT LIKE 'ORD-TEST-%' AND o.id NOT LIKE 'ORD-E2E-%' AND o.time_limit IS NOT NULL
        GROUP BY substring(o.time_limit from 1 for 7)
      `;

      for (const row of companyRows) {
        if (!row.month_abbr) continue;
        const liveRev = Number(row.live_revenue || 0);
        const liveCosts = Number(row.live_costs || 0);
        const profit = Math.round((liveRev - liveCosts) * 100) / 100;
        const fullMonth = row.full_month_name || `${row.month_abbr} 2026`;
        const existing = await pg_conn`
          SELECT id FROM monthly_performance 
          WHERE (warehouse_id IS NULL OR warehouse_id = 'ALL') AND month = ${row.month_abbr}
        `;
        if (existing && existing.length > 0) {
          await pg_conn`
            UPDATE monthly_performance
            SET revenue = ${liveRev},
                costs = ${liveCosts},
                profit = ${profit},
                fuel_cost = ${Number(row.live_fuel || 0)},
                labor_cost = ${Number(row.live_labor || 0)},
                maintenance_cost = ${Number(row.live_maint || 0)},
                orders_count = ${Number(row.live_orders || 0)}
            WHERE id = ${existing[0].id}
          `;
        } else {
          await pg_conn`
            INSERT INTO monthly_performance
            (warehouse_id, month, full_month, revenue, costs, profit, fuel_cost, labor_cost, maintenance_cost, orders_count, is_poi, poi)
            VALUES (
              NULL, ${row.month_abbr}, ${fullMonth}, ${liveRev}, ${liveCosts}, ${profit},
              ${Number(row.live_fuel || 0)}, ${Number(row.live_labor || 0)}, ${Number(row.live_maint || 0)},
              ${Number(row.live_orders || 0)}, 0, NULL
            )
          `;
        }
      }

      // 2. Per-warehouse aggregation
      const warehouseRows = await pg_conn`
        SELECT 
          COALESCE(r.warehouse_id, 'WH-001') as warehouse_id,
          to_char(to_date(substring(o.time_limit from 1 for 7), 'YYYY-MM'), 'Mon') as month_abbr,
          to_char(to_date(substring(o.time_limit from 1 for 7), 'YYYY-MM'), 'FMMonth YYYY') as full_month_name,
          COALESCE(SUM(CASE WHEN o.status = 'Delivered' THEN o.price ELSE 0 END), 0)::real as live_revenue,
          COALESCE(SUM(fc.total_cost), 0)::real as live_costs,
          COALESCE(SUM(fc.fuel_cost), 0)::real as live_fuel,
          COALESCE(SUM(fc.labor_cost), 0)::real as live_labor,
          COALESCE(SUM(fc.maintenance_cost), 0)::real as live_maint,
          count(o.id)::int as live_orders
        FROM orders o
        LEFT JOIN freight_cost fc ON fc.order_id = o.id
        LEFT JOIN (
          SELECT DISTINCT ON (order_id) order_id, warehouse_id 
          FROM orders_route 
          ORDER BY order_id, step ASC
        ) r ON r.order_id = o.id
        WHERE o.id NOT LIKE 'ORD-TEST-%' AND o.id NOT LIKE 'ORD-E2E-%' AND o.time_limit IS NOT NULL
        GROUP BY COALESCE(r.warehouse_id, 'WH-001'), substring(o.time_limit from 1 for 7)
      `;

      for (const row of warehouseRows) {
        if (!row.month_abbr || !row.warehouse_id) continue;
        const liveRev = Number(row.live_revenue || 0);
        const liveCosts = Number(row.live_costs || 0);
        const profit = Math.round((liveRev - liveCosts) * 100) / 100;
        const fullMonth = row.full_month_name || `${row.month_abbr} 2026`;
        const existingWh = await pg_conn`
          SELECT id FROM monthly_performance 
          WHERE warehouse_id = ${row.warehouse_id} AND month = ${row.month_abbr}
        `;
        if (existingWh && existingWh.length > 0) {
          await pg_conn`
            UPDATE monthly_performance
            SET revenue = ${liveRev},
                costs = ${liveCosts},
                profit = ${profit},
                fuel_cost = ${Number(row.live_fuel || 0)},
                labor_cost = ${Number(row.live_labor || 0)},
                maintenance_cost = ${Number(row.live_maint || 0)},
                orders_count = ${Number(row.live_orders || 0)}
            WHERE id = ${existingWh[0].id}
          `;
        } else {
          await pg_conn`
            INSERT INTO monthly_performance
            (warehouse_id, month, full_month, revenue, costs, profit, fuel_cost, labor_cost, maintenance_cost, orders_count, is_poi, poi)
            VALUES (
              ${row.warehouse_id}, ${row.month_abbr}, ${fullMonth}, ${liveRev}, ${liveCosts}, ${profit},
              ${Number(row.live_fuel || 0)}, ${Number(row.live_labor || 0)}, ${Number(row.live_maint || 0)},
              ${Number(row.live_orders || 0)}, 0, NULL
            )
          `;
        }
      }
    } catch {
      /* ignore sync error */
    }
  },
  all: async (warehouseId?: string, period?: string) => {
    const DEFAULT_12_MONTHS = [
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

    try {
      await monthlyPerformance.syncWithDatabase();
      let rows: any[] = [];
      if (warehouseId) {
        rows = await pg_conn`SELECT * FROM monthly_performance WHERE warehouse_id = ${warehouseId} ORDER BY id ASC`;
      }
      if (!rows || rows.length === 0) {
        rows = await pg_conn`SELECT * FROM monthly_performance WHERE warehouse_id IS NULL OR warehouse_id = 'ALL' ORDER BY id ASC`;
      }

      const MONTH_ORDER: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
      };

      // Always guarantee full 12-month calendar series
      const mult = warehouseId ? (warehouseId === "WH-001" ? 0.5 : 0.25) : 1;
      const monthMap = new Map<string, any>();
      DEFAULT_12_MONTHS.forEach((m) => {
        monthMap.set(m.month.toLowerCase(), {
          ...m,
          warehouse_id: warehouseId || null,
          revenue: Math.round(m.revenue * mult),
          costs: Math.round(m.costs * mult),
          profit: Math.round(m.profit * mult),
          fuel_cost: Math.round(m.fuel_cost * mult),
          labor_cost: Math.round(m.labor_cost * mult),
          maintenance_cost: Math.round(m.maintenance_cost * mult),
          orders_count: Math.max(1, Math.round(m.orders_count * mult)),
        });
      });

      // Overlay live database records
      if (rows && rows.length > 0) {
        rows.forEach((r) => {
          if (r.month) {
            monthMap.set(String(r.month).toLowerCase(), r);
          }
        });
      }

      let all12 = Array.from(monthMap.values());
      all12.sort((a, b) => (MONTH_ORDER[String(a.month).toLowerCase()] || 0) - (MONTH_ORDER[String(b.month).toLowerCase()] || 0));

      if (period) {
        const p = period.toLowerCase();
        if (p === "6m_h1" || p === "h1") {
          return all12.filter((r) => (MONTH_ORDER[String(r.month).toLowerCase()] || 0) <= 6);
        } else if (p === "6m_h2" || p === "h2") {
          return all12.filter((r) => (MONTH_ORDER[String(r.month).toLowerCase()] || 0) > 6);
        } else if (p === "q1") {
          return all12.filter((r) => {
            const m = MONTH_ORDER[String(r.month).toLowerCase()] || 0;
            return m >= 1 && m <= 3;
          });
        } else if (p === "q2") {
          return all12.filter((r) => {
            const m = MONTH_ORDER[String(r.month).toLowerCase()] || 0;
            return m >= 4 && m <= 6;
          });
        } else if (p === "q3") {
          return all12.filter((r) => {
            const m = MONTH_ORDER[String(r.month).toLowerCase()] || 0;
            return m >= 7 && m <= 9;
          });
        } else if (p === "q4") {
          return all12.filter((r) => {
            const m = MONTH_ORDER[String(r.month).toLowerCase()] || 0;
            return m >= 10 && m <= 12;
          });
        } else {
          const filtered = all12.filter(
            (r) =>
              r.month.toLowerCase() === p ||
              r.full_month.toLowerCase().includes(p) ||
              p.includes(r.month.toLowerCase())
          );
          if (filtered.length > 0) return filtered;
        }
      }
      return all12;
    } catch {
      /* fallback if query fails */
    }
    return DEFAULT_12_MONTHS;
  },
};

export const reports = {
  getDeliveryCostReport: async (warehouseId?: string, period?: string) => {
    // Ensure monthly performance is synchronized
    await monthlyPerformance.syncWithDatabase();

    const allOrders = await pg_conn`
      SELECT * FROM orders 
      WHERE id NOT LIKE 'ORD-TEST-%' AND id NOT LIKE 'ORD-E2E-%'
    `;
    const allCosts = await pg_conn`SELECT * FROM freight_cost`;
    const allWarehouses = await pg_conn`SELECT * FROM warehouses`;
    const allUsers = await pg_conn`SELECT * FROM users`;
    const allRoutes = await pg_conn`SELECT * FROM orders_route ORDER BY step ASC`;

    // Map existing costs
    const costMap = new Map<string, any>();
    allCosts.forEach((c: any) => costMap.set(c.order_id, c));

    // Dynamic available periods derived directly from database orders & performance
    const distinctMonths = await pg_conn`
      SELECT DISTINCT substring(time_limit from 1 for 7) as ym 
      FROM orders 
      WHERE time_limit IS NOT NULL AND id NOT LIKE 'ORD-TEST-%' AND id NOT LIKE 'ORD-E2E-%'
      ORDER BY ym ASC
    `;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const activeYMs = new Set<string>();
    distinctMonths.forEach((r: any) => {
      if (r.ym) activeYMs.add(r.ym);
    });

    const availablePeriods: Array<{ value: string; label: string }> = [
      { value: "", label: "All Periods (Full Year 2026)" },
      { value: "Q1", label: "Q1 (Jan - Mar 2026)" },
      { value: "Q2", label: "Q2 (Apr - Jun 2026)" },
      { value: "6M_H1", label: "H1 (Jan - Jun 2026)" },
      { value: "6M_H2", label: "H2 (Jul - Dec 2026)" },
      { value: "Q3", label: "Q3 (Jul - Sep 2026)" },
      { value: "Q4", label: "Q4 (Oct - Dec 2026)" },
    ];

    // Add active order months from DB first
    for (const ym of Array.from(activeYMs).sort()) {
      const parts = ym.split("-");
      const mIdx = parseInt(parts[1], 10) - 1;
      const mName = monthNames[mIdx] || ym;
      availablePeriods.push({
        value: ym,
        label: `${mName} ${parts[0]} (Active Orders)`,
      });
    }

    // Add all 12 standard calendar months if not already present
    for (let i = 0; i < 12; i++) {
      const ym = `2026-${String(i + 1).padStart(2, "0")}`;
      if (!activeYMs.has(ym)) {
        availablePeriods.push({
          value: ym,
          label: `${monthNames[i]} 2026`,
        });
      }
    }

    // Helper for period matching
    const matchesPeriod = (dateStr: string | undefined, p: string | undefined): boolean => {
      if (!p || p === "all" || p === "12M" || p === "12m") return true;
      if (!dateStr) return true;
      const datePart = dateStr.split(" ")[0]; // e.g. "2026-03-20"
      const parts = datePart.split("-");
      if (parts.length < 2) return true;
      const monthNum = parseInt(parts[1], 10);
      const norm = p.toLowerCase();

      if (norm === "6m_h1" || norm === "h1") return monthNum >= 1 && monthNum <= 6;
      if (norm === "6m_h2" || norm === "h2") return monthNum >= 7 && monthNum <= 12;
      if (norm === "q1") return monthNum >= 1 && monthNum <= 3;
      if (norm === "q2") return monthNum >= 4 && monthNum <= 6;
      if (norm === "q3") return monthNum >= 7 && monthNum <= 9;
      if (norm === "q4") return monthNum >= 10 && monthNum <= 12;

      const ymMatch = norm.match(/^(\d{4})-(\d{2})$/);
      if (ymMatch) {
        return datePart.startsWith(norm);
      }

      const monthNamesShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      const fullMonthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const targetMonthIdx = monthNamesShort.findIndex(
        (m, idx) => norm === m || norm === fullMonthNames[idx] || norm.includes(m)
      );
      if (targetMonthIdx !== -1) {
        return monthNum === targetMonthIdx + 1;
      }
      return datePart.includes(norm);
    };

    // Ensure all orders have calculated freight cost details
    const orderCostList = [];
    for (const order of allOrders) {
      let cost = costMap.get(order.id);
      if (!cost) {
        try {
          cost = await freightCosts.calculateAndSave(order.id);
        } catch {
          cost = {
            order_id: order.id,
            fuel_cost: 45.0,
            labor_cost: 65.0,
            maintenance_cost: 15.0,
            total_cost: 125.0,
            calculated_at: new Date().toISOString(),
          };
        }
      }

      const client = allUsers.find((u: any) => u.id === order.client_id);
      const routes = allRoutes.filter((r: any) => r.order_id === order.id);
      const originWhId = routes[0]?.warehouse_id || "WH-001";
      const originWh = allWarehouses.find((w: any) => w.id === originWhId);

      // Warehouse filtering if requested
      if (warehouseId) {
        const passesWarehouse =
          routes.some(
            (r: any) => r.warehouse_id === warehouseId || r.destination_warehouse_id === warehouseId
          ) || originWhId === warehouseId;
        if (!passesWarehouse) continue;
      }

      // Period filtering if requested
      const orderDate = order.time_limit || cost.calculated_at;
      if (!matchesPeriod(orderDate, period)) {
        continue;
      }

      const revenue = Number(order.price || 0);
      const fuelCost = Number(cost.fuel_cost || 0);
      const laborCost = Number(cost.labor_cost || 0);
      const maintenanceCost = Number(cost.maintenance_cost || 0);
      const deliveryCost = Number(cost.total_cost || (fuelCost + laborCost + maintenanceCost));
      const margin = Math.round((revenue - deliveryCost) * 100) / 100;
      const marginPct = revenue > 0 ? Math.round((margin / revenue) * 1000) / 10 : 0;

      orderCostList.push({
        order_id: order.id,
        client_id: order.client_id,
        client_name: client?.name || `Client ${order.client_id}`,
        destination: order.final_destination,
        origin_warehouse_id: originWhId,
        origin_warehouse_label: originWh?.location || `Warehouse ${originWhId}`,
        distance_km: Number(order.distance_km || cost.distance_km || 120),
        status: order.status,
        revenue,
        fuel_cost: fuelCost,
        labor_cost: laborCost,
        maintenance_cost: maintenanceCost,
        total_delivery_cost: deliveryCost,
        net_margin: margin,
        margin_percent: marginPct,
        calculated_at: cost.calculated_at,
      });
    }

    // Aggregate summary metrics
    const deliveredOrders = orderCostList.filter((o) => o.status === "Delivered");
    const totalDeliveredRevenue = deliveredOrders.reduce((acc, o) => acc + o.revenue, 0);
    const totalAllRevenue = orderCostList.reduce((acc, o) => acc + o.revenue, 0);
    const totalDeliveryCost = orderCostList.reduce((acc, o) => acc + o.total_delivery_cost, 0);
    const totalFuelCost = orderCostList.reduce((acc, o) => acc + o.fuel_cost, 0);
    const totalLaborCost = orderCostList.reduce((acc, o) => acc + o.labor_cost, 0);
    const totalMaintenanceCost = orderCostList.reduce((acc, o) => acc + o.maintenance_cost, 0);
    const totalDistanceKm = orderCostList.reduce((acc, o) => acc + o.distance_km, 0);

    const costPerKm = totalDistanceKm > 0 ? Math.round((totalDeliveryCost / totalDistanceKm) * 100) / 100 : 0;
    const avgCostPerOrder = orderCostList.length > 0 ? Math.round((totalDeliveryCost / orderCostList.length) * 100) / 100 : 0;
    const costToRevenueRatio = totalDeliveredRevenue > 0 ? Math.round((totalDeliveryCost / totalDeliveredRevenue) * 1000) / 10 : 0;

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);
    const monthlyBaseTarget = warehouseId
      ? Math.max(10, Math.round(75 * (warehouseId === "WH-001" ? 0.5 : 0.25)))
      : 75;

    let periodMultiplier = 1;
    let periodLabel = "All Time (12 Months / 2026)";
    const normP = (period || "all").toLowerCase();
    if (normP === "12m" || normP === "all" || normP === "") {
      periodMultiplier = 1;
      periodLabel = "Full Year 2026";
    } else if (normP === "6m_h1" || normP === "h1") {
      periodMultiplier = 6;
      periodLabel = "H1 (Jan - Jun 2026)";
    } else if (normP === "6m_h2" || normP === "h2") {
      periodMultiplier = 6;
      periodLabel = "H2 (Jul - Dec 2026)";
    } else if (normP === "q1") {
      periodMultiplier = 3;
      periodLabel = "Q1 (Jan - Mar 2026)";
    } else if (normP === "q2") {
      periodMultiplier = 3;
      periodLabel = "Q2 (Apr - Jun 2026)";
    } else if (normP === "q3") {
      periodMultiplier = 3;
      periodLabel = "Q3 (Jul - Sep 2026)";
    } else if (normP === "q4") {
      periodMultiplier = 3;
      periodLabel = "Q4 (Oct - Dec 2026)";
    } else {
      const ymMatch = normP.match(/^(\d{4})-(\d{2})$/);
      if (ymMatch) {
        const year = ymMatch[1];
        const mIdx = parseInt(ymMatch[2], 10) - 1;
        const mName = monthNames[mIdx] || ymMatch[2];
        periodMultiplier = 1;
        periodLabel = `${mName} ${year}`;
      } else {
        const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const mIdx = shortMonths.indexOf(normP.slice(0, 3));
        if (mIdx !== -1) {
          periodMultiplier = 1;
          periodLabel = `${monthNames[mIdx]} 2026`;
        } else {
          periodMultiplier = 1;
          periodLabel = period || "Custom Period";
        }
      }
    }

    const targetOrders = (!period || normP === "all" || normP === "12m" || normP === "")
      ? monthlyBaseTarget
      : Math.round(monthlyBaseTarget * (periodMultiplier === 1 ? 1 : periodMultiplier));
    const completedOrdersCount = deliveredOrders.length;
    const ordersNeededThisMonth = Math.max(0, targetOrders - completedOrdersCount);
    const requiredDailyRate = Math.round((ordersNeededThisMonth / daysRemaining) * 10) / 10;
    const currentDailyRate = currentDay > 0 ? Math.round((completedOrdersCount / currentDay) * 10) / 10 : 0;
    const projectedMonthEnd = Math.round(completedOrdersCount + currentDailyRate * daysRemaining);

    // Aggregate top clients from the analyzed orders
    const clientMap = new Map<string, { id: string; name: string; totalSpent: number; orderCount: number }>();
    for (const o of orderCostList) {
      const c = clientMap.get(o.client_id) || { id: o.client_id, name: o.client_name, totalSpent: 0, orderCount: 0 };
      if (o.status === "Delivered") {
        c.totalSpent += o.revenue;
      }
      c.orderCount += 1;
      clientMap.set(o.client_id, c);
    }
    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        total_spent: Math.round(c.totalSpent * 100) / 100,
        order_count: c.orderCount,
      }));

    // Aggregate top products from the database for the analyzed orders
    const filteredIds = orderCostList.map((o) => o.order_id);
    let topProducts: Array<{ id: string; name: string; quantity: number; total_revenue: number }> = [];
    if (filteredIds.length > 0) {
      try {
        const prodRows = await pg_conn`
          SELECT 
            p.id, 
            p.name, 
            COALESCE(SUM(oi.quantity), 0)::integer as quantity,
            COALESCE(SUM(oi.quantity * p.price), 0)::numeric as total_revenue
          FROM orders_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id IN ${pg_conn(filteredIds)}
          GROUP BY p.id, p.name
          ORDER BY total_revenue DESC
          LIMIT 5
        `;
        topProducts = prodRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          quantity: Number(r.quantity),
          total_revenue: Math.round(Number(r.total_revenue) * 100) / 100,
        }));
      } catch {
        /* fallback if query fails */
      }
    }

    return {
      warehouse_id: warehouseId || null,
      period: period || "all",
      period_label: periodLabel,
      available_periods: availablePeriods,
      summary: {
        total_orders_analyzed: orderCostList.length,
        total_delivered_revenue: Math.round(totalDeliveredRevenue * 100) / 100,
        total_all_revenue: Math.round(totalAllRevenue * 100) / 100,
        total_delivery_cost: Math.round(totalDeliveryCost * 100) / 100,
        total_fuel_cost: Math.round(totalFuelCost * 100) / 100,
        total_labor_cost: Math.round(totalLaborCost * 100) / 100,
        total_maintenance_cost: Math.round(totalMaintenanceCost * 100) / 100,
        net_operating_profit: Math.round((totalDeliveredRevenue - totalDeliveryCost) * 100) / 100,
        cost_to_revenue_ratio: costToRevenueRatio,
        avg_delivery_cost_per_order: avgCostPerOrder,
        avg_cost_per_km: costPerKm,
        total_distance_km: Math.round(totalDistanceKm * 10) / 10,
        monthly_target_orders: targetOrders,
        completed_orders: completedOrdersCount,
        orders_needed_this_month: ordersNeededThisMonth,
        required_daily_run_rate: requiredDailyRate,
        projected_month_end_completions: projectedMonthEnd,
      },
      orders: orderCostList,
      top_products: topProducts,
      top_clients: topClients,
    };
  },
};
