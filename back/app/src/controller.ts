import { pg_conn } from "./model";

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
        address: matched.address,
      },
    };
  },
  update: async (id: string, user: { name?: string; password?: string; address?: any; role?: string }) => {
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

    const setClauses: string[] = [];
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

    const updated = await pg_conn`SELECT * FROM users WHERE id = ${id}`;
    return updated;
  },
  createClient: async (client: { id?: string; name: string; email?: string; password: string; address?: string; role?: string }) => {
    const id = client.id || `USR-${Math.floor(100 + Math.random() * 900)}`;
    const role = client.role || "client";
    const addressJson = JSON.stringify({ address: client.address || "" });
    const inserted = await pg_conn`
      INSERT INTO users (id, name, password, address, role)
      VALUES (${id}, ${client.name}, ${client.password}, ${addressJson}, ${role})
      RETURNING id, name, address, role
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

