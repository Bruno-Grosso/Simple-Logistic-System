import { pg_conn } from "./model";

// ── Types ──────────────────────────────────────────────────────────────────

type Body = Record<string, any>;

// ── Helpers ────────────────────────────────────────────────────────────────

async function getBody(req: Request): Promise<Body | null> {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
    return body;
  } catch {
    return null;
  }
}

const ok       = (data: unknown, status = 200) => Response.json(data, { status });
const created  = (data: unknown)               => Response.json(data, { status: 201 });
const notFound = (msg = "Not found")           => Response.json({ error: msg }, { status: 404 });
const badReq   = (msg = "Bad request")         => Response.json({ error: msg }, { status: 400 });
const unauth   = (msg = "Unauthorized")        => Response.json({ error: msg }, { status: 401 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Returns 400 if id is not a valid UUID — avoids Postgres cast errors */
function validateId(id: string): Response | null {
  return isUUID(id) ? null : badReq(`Invalid UUID: ${id}`);
}

/** Validates that both lat and lng are finite numbers within valid ranges */
function validateLatLng(lat: unknown, lng: unknown): string | null {
  if (typeof lat !== "number" || !isFinite(lat)) return "lat must be a finite number";
  if (typeof lng !== "number" || !isFinite(lng)) return "lng must be a finite number";
  if (lat < -90  || lat > 90)  return "lat must be between -90 and 90";
  if (lng < -180 || lng > 180) return "lng must be between -180 and 180";
  return null;
}

const VALID_ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"] as const;
const VALID_STEP_TYPES     = ["Transit", "Storage"] as const;
const VALID_ROLES          = ["admin", "warehouse_worker", "truck_driver", "client"] as const;

// Column lists used with pg_conn.unsafe() — never user-supplied, always static
const WAREHOUSE_COLS =
  "id, address, refrigeration, volume_current, volume_max, fuel_price, length, width, height, " +
  "ST_AsGeoJSON(location)::json AS location";

const TRUCK_COLS =
  "t.id, t.model_id, t.is_valid, t.is_delivering, t.volume_current, t.weight_current, t.fuel_current, " +
  "t.maintenance_level, t.estimated_time, t.origin_id, t.destination_id, " +
  "ST_AsGeoJSON(t.current_location)::json AS current_location, " +
  "ST_AsGeoJSON(t.destination_location)::json AS destination_location, " +
  "tm.name AS model_name, tm.volume_max, tm.weight_max, tm.fuel_capacity, tm.fuel_consumption, tm.refrigeration, tm.speed";

// ── Order business logic ───────────────────────────────────────────────────

async function insertOrderItems(
  orderId: string,
  items: { product_id: string; quantity: number }[]
): Promise<string | null> {
  for (const item of items) {
    if (!isUUID(item.product_id))
      return `Invalid product_id UUID: ${item.product_id}`;
    if (!Number.isInteger(item.quantity) || item.quantity <= 0)
      return `quantity must be a positive integer (got ${item.quantity})`;

    await pg_conn`
      INSERT INTO orders_items (order_id, product_id, quantity)
      VALUES (${orderId}, ${item.product_id}, ${item.quantity})
    `;
  }
  return null;
}

async function recalcOrderPrice(orderId: string): Promise<void> {
  await pg_conn`
    UPDATE orders
    SET price = (
      SELECT COALESCE(SUM(p.price * oi.quantity), 0)
      FROM orders_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ${orderId}
    )
    WHERE id = ${orderId}
  `;
}

// ── Main router ────────────────────────────────────────────────────────────

export async function handleRoutes(req: Request): Promise<Response> {
  const url    = new URL(req.url);
  const path   = url.pathname;
  const method = req.method;

  try {

    // ── AUTH ───────────────────────────────────────────────────────────────

    // POST /auth/login
    if (path === "/auth/login" && method === "POST") {
      const body = await getBody(req);
      if (!body?.email || !body?.password)
        return badReq("email and password are required");

      const [user] = await pg_conn`
        SELECT id, name, email, role
        FROM users
        WHERE email    = ${body.email}
          AND password = crypt(${body.password}, password)
      `;
      if (!user) return unauth("Invalid credentials");

      const [session] = await pg_conn`
        INSERT INTO online_users (user_id) VALUES (${user.id})
        RETURNING session_id, login_time
      `;
      return created({ user, session_id: session.session_id });
    }

    // POST /auth/logout
    if (path === "/auth/logout" && method === "POST") {
      const body = await getBody(req);
      if (!body?.session_id)       return badReq("session_id is required");
      if (!isUUID(body.session_id)) return badReq("session_id must be a valid UUID");

      await pg_conn`DELETE FROM online_users WHERE session_id = ${body.session_id}`;
      return ok({ message: "Logged out" });
    }

    // ── USERS ──────────────────────────────────────────────────────────────

    // GET /users
    if (path === "/users" && method === "GET") {
      const users = await pg_conn`
        SELECT id, name, email, address, role FROM users ORDER BY name
      `;
      return ok(users);
    }

    // POST /users
    if (path === "/users" && method === "POST") {
      const body = await getBody(req);
      const missing = ["name", "email", "password", "role"].filter(k => !body?.[k]);
      if (missing.length) return badReq(`Missing fields: ${missing.join(", ")}`);
      if (!(VALID_ROLES as readonly string[]).includes(body!.role))
        return badReq(`role must be one of: ${VALID_ROLES.join(", ")}`);

      const [user] = await pg_conn`
        INSERT INTO users (name, email, password, address, role)
        VALUES (
          ${body!.name},
          ${body!.email},
          crypt(${body!.password}, gen_salt('bf')),
          ${body!.address ?? null},
          ${body!.role}
        )
        RETURNING id, name, email, address, role
      `;
      return created(user);
    }

    const userMatch = path.match(/^\/users\/([^/]+)$/);
    if (userMatch) {
      const id    = userMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /users/:id
      if (method === "GET") {
        const [user] = await pg_conn`
          SELECT id, name, email, address, role FROM users WHERE id = ${id}
        `;
        return user ? ok(user) : notFound("User not found");
      }

      // PUT /users/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");
        if (body.role && !(VALID_ROLES as readonly string[]).includes(body.role))
          return badReq(`role must be one of: ${VALID_ROLES.join(", ")}`);

        const [user] = await pg_conn`
          UPDATE users SET
            name     = COALESCE(${body.name     ?? null}, name),
            email    = COALESCE(${body.email    ?? null}, email),
            address  = COALESCE(${body.address  ?? null}, address),
            role     = COALESCE(${body.role     ?? null}, role),
            password = CASE
              WHEN ${body.password ?? null} IS NOT NULL
                THEN crypt(${body.password}, gen_salt('bf'))
              ELSE password
            END
          WHERE id = ${id}
          RETURNING id, name, email, address, role
        `;
        return user ? ok(user) : notFound("User not found");
      }

      // DELETE /users/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM users WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "User deleted" }) : notFound("User not found");
      }
    }

    // ── PRODUCTS ───────────────────────────────────────────────────────────

    // GET /products
    if (path === "/products" && method === "GET") {
      const products = await pg_conn`SELECT * FROM products ORDER BY name`;
      return ok(products);
    }

    // POST /products
    if (path === "/products" && method === "POST") {
      const body    = await getBody(req);
      const required = ["name", "price", "length", "width", "height", "volume", "weight"];
      const missing  = required.filter(k => body?.[k] == null);
      if (missing.length) return badReq(`Missing fields: ${missing.join(", ")}`);

      const [product] = await pg_conn`
        INSERT INTO products (name, price, refrigeration, fragile, expire_date, length, width, height, volume, weight)
        VALUES (
          ${body!.name},
          ${body!.price},
          ${body!.refrigeration ?? false},
          ${body!.fragile       ?? false},
          ${body!.expire_date   ?? null},
          ${body!.length},
          ${body!.width},
          ${body!.height},
          ${body!.volume},
          ${body!.weight}
        )
        RETURNING *
      `;
      return created(product);
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const id    = productMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /products/:id
      if (method === "GET") {
        const [product] = await pg_conn`SELECT * FROM products WHERE id = ${id}`;
        return product ? ok(product) : notFound("Product not found");
      }

      // PUT /products/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");

        const [product] = await pg_conn`
          UPDATE products SET
            name          = COALESCE(${body.name          ?? null}, name),
            price         = COALESCE(${body.price         ?? null}, price),
            refrigeration = COALESCE(${body.refrigeration ?? null}, refrigeration),
            fragile       = COALESCE(${body.fragile       ?? null}, fragile),
            expire_date   = COALESCE(${body.expire_date   ?? null}, expire_date),
            length        = COALESCE(${body.length        ?? null}, length),
            width         = COALESCE(${body.width         ?? null}, width),
            height        = COALESCE(${body.height        ?? null}, height),
            volume        = COALESCE(${body.volume        ?? null}, volume),
            weight        = COALESCE(${body.weight        ?? null}, weight)
          WHERE id = ${id}
          RETURNING *
        `;
        return product ? ok(product) : notFound("Product not found");
      }

      // DELETE /products/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM products WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Product deleted" }) : notFound("Product not found");
      }
    }

    // ── SUPPLIERS ──────────────────────────────────────────────────────────

    // GET /suppliers
    if (path === "/suppliers" && method === "GET") {
      const suppliers = await pg_conn`SELECT * FROM suppliers ORDER BY name`;
      return ok(suppliers);
    }

    // POST /suppliers
    if (path === "/suppliers" && method === "POST") {
      const body = await getBody(req);
      if (!body?.name || !body?.location) return badReq("name and location are required");

      const [supplier] = await pg_conn`
        INSERT INTO suppliers (name, location) VALUES (${body.name}, ${body.location})
        RETURNING *
      `;
      return created(supplier);
    }

    const supplierMatch = path.match(/^\/suppliers\/([^/]+)$/);
    if (supplierMatch) {
      const id    = supplierMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /suppliers/:id
      if (method === "GET") {
        const [supplier] = await pg_conn`SELECT * FROM suppliers WHERE id = ${id}`;
        return supplier ? ok(supplier) : notFound("Supplier not found");
      }

      // PUT /suppliers/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");

        const [supplier] = await pg_conn`
          UPDATE suppliers SET
            name     = COALESCE(${body.name     ?? null}, name),
            location = COALESCE(${body.location ?? null}, location)
          WHERE id = ${id}
          RETURNING *
        `;
        return supplier ? ok(supplier) : notFound("Supplier not found");
      }

      // DELETE /suppliers/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM suppliers WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Supplier deleted" }) : notFound("Supplier not found");
      }
    }

    // ── WAREHOUSES ─────────────────────────────────────────────────────────

    // GET /warehouses
    if (path === "/warehouses" && method === "GET") {
      const warehouses = await pg_conn`
        SELECT ${pg_conn.unsafe(WAREHOUSE_COLS)} FROM warehouses ORDER BY address
      `;
      return ok(warehouses);
    }

    // POST /warehouses
    if (path === "/warehouses" && method === "POST") {
      const body    = await getBody(req);
      const required = ["address", "lat", "lng", "volume_max", "fuel_price", "length", "width", "height"];
      const missing  = required.filter(k => body?.[k] == null);
      if (missing.length) return badReq(`Missing fields: ${missing.join(", ")}`);

      const geoErr = validateLatLng(body!.lat, body!.lng);
      if (geoErr) return badReq(geoErr);

      const [wh] = await pg_conn`
        INSERT INTO warehouses (address, location, volume_max, refrigeration, fuel_price, length, width, height)
        VALUES (
          ${body!.address},
          ST_SetSRID(ST_MakePoint(${body!.lng}, ${body!.lat}), 4326),
          ${body!.volume_max},
          ${body!.refrigeration ?? false},
          ${body!.fuel_price},
          ${body!.length},
          ${body!.width},
          ${body!.height}
        )
        RETURNING ${pg_conn.unsafe(WAREHOUSE_COLS)}
      `;
      return created(wh);
    }

    // GET /warehouses/:id/stock  — must come before /warehouses/:id
    const warehouseStockMatch = path.match(/^\/warehouses\/([^/]+)\/stock$/);
    if (warehouseStockMatch && method === "GET") {
      const idErr = validateId(warehouseStockMatch[1]);
      if (idErr) return idErr;

      const stock = await pg_conn`
        SELECT ws.product_id, p.name, p.price, p.refrigeration,
               p.fragile, p.volume, p.weight, ws.quantity
        FROM warehouses_stocks ws
        JOIN products p ON p.id = ws.product_id
        WHERE ws.warehouse_id = ${warehouseStockMatch[1]}
        ORDER BY p.name
      `;
      return ok(stock);
    }

    const warehouseMatch = path.match(/^\/warehouses\/([^/]+)$/);
    if (warehouseMatch) {
      const id    = warehouseMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /warehouses/:id
      if (method === "GET") {
        const [wh] = await pg_conn`
          SELECT ${pg_conn.unsafe(WAREHOUSE_COLS)} FROM warehouses WHERE id = ${id}
        `;
        return wh ? ok(wh) : notFound("Warehouse not found");
      }

      // PUT /warehouses/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");

        if (body.lat != null || body.lng != null) {
          const geoErr = validateLatLng(body.lat, body.lng);
          if (geoErr) return badReq(geoErr);
        }

        // Split into two queries to avoid interpolating geo fragments into pg_conn template
        const [wh] = body.lat != null
          ? await pg_conn`
              UPDATE warehouses SET
                address       = COALESCE(${body.address       ?? null}, address),
                fuel_price    = COALESCE(${body.fuel_price    ?? null}, fuel_price),
                volume_max    = COALESCE(${body.volume_max    ?? null}, volume_max),
                refrigeration = COALESCE(${body.refrigeration ?? null}, refrigeration),
                length        = COALESCE(${body.length        ?? null}, length),
                width         = COALESCE(${body.width         ?? null}, width),
                height        = COALESCE(${body.height        ?? null}, height),
                location      = ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)
              WHERE id = ${id}
              RETURNING ${pg_conn.unsafe(WAREHOUSE_COLS)}
            `
          : await pg_conn`
              UPDATE warehouses SET
                address       = COALESCE(${body.address       ?? null}, address),
                fuel_price    = COALESCE(${body.fuel_price    ?? null}, fuel_price),
                volume_max    = COALESCE(${body.volume_max    ?? null}, volume_max),
                refrigeration = COALESCE(${body.refrigeration ?? null}, refrigeration),
                length        = COALESCE(${body.length        ?? null}, length),
                width         = COALESCE(${body.width         ?? null}, width),
                height        = COALESCE(${body.height        ?? null}, height)
              WHERE id = ${id}
              RETURNING ${pg_conn.unsafe(WAREHOUSE_COLS)}
            `;
        return wh ? ok(wh) : notFound("Warehouse not found");
      }

      // DELETE /warehouses/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM warehouses WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Warehouse deleted" }) : notFound("Warehouse not found");
      }
    }

    // ── TRUCK MODELS ───────────────────────────────────────────────────────

    // GET /truck-models
    if (path === "/truck-models" && method === "GET") {
      const models = await pg_conn`SELECT * FROM truck_models ORDER BY name`;
      return ok(models);
    }

    // POST /truck-models
    if (path === "/truck-models" && method === "POST") {
      const body    = await getBody(req);
      const required = ["name", "weight_max", "volume_max", "fuel_capacity", "fuel_consumption", "speed", "length", "width", "height"];
      const missing  = required.filter(k => body?.[k] == null);
      if (missing.length) return badReq(`Missing fields: ${missing.join(", ")}`);

      const [model] = await pg_conn`
        INSERT INTO truck_models
          (name, weight_max, volume_max, fuel_capacity, fuel_consumption, refrigeration, speed, length, width, height)
        VALUES (
          ${body!.name},
          ${body!.weight_max},
          ${body!.volume_max},
          ${body!.fuel_capacity},
          ${body!.fuel_consumption},
          ${body!.refrigeration ?? false},
          ${body!.speed},
          ${body!.length},
          ${body!.width},
          ${body!.height}
        )
        RETURNING *
      `;
      return created(model);
    }

    const truckModelMatch = path.match(/^\/truck-models\/([^/]+)$/);
    if (truckModelMatch) {
      const id    = truckModelMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /truck-models/:id
      if (method === "GET") {
        const [model] = await pg_conn`SELECT * FROM truck_models WHERE id = ${id}`;
        return model ? ok(model) : notFound("Truck model not found");
      }

      // PUT /truck-models/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");

        const [model] = await pg_conn`
          UPDATE truck_models SET
            name             = COALESCE(${body.name             ?? null}, name),
            weight_max       = COALESCE(${body.weight_max       ?? null}, weight_max),
            volume_max       = COALESCE(${body.volume_max       ?? null}, volume_max),
            fuel_capacity    = COALESCE(${body.fuel_capacity    ?? null}, fuel_capacity),
            fuel_consumption = COALESCE(${body.fuel_consumption ?? null}, fuel_consumption),
            refrigeration    = COALESCE(${body.refrigeration    ?? null}, refrigeration),
            speed            = COALESCE(${body.speed            ?? null}, speed),
            length           = COALESCE(${body.length           ?? null}, length),
            width            = COALESCE(${body.width            ?? null}, width),
            height           = COALESCE(${body.height           ?? null}, height)
          WHERE id = ${id}
          RETURNING *
        `;
        return model ? ok(model) : notFound("Truck model not found");
      }

      // DELETE /truck-models/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM truck_models WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Truck model deleted" }) : notFound("Truck model not found");
      }
    }

    // ── TRUCKS ─────────────────────────────────────────────────────────────

    // GET /trucks
    if (path === "/trucks" && method === "GET") {
      const trucks = await pg_conn`
        SELECT ${pg_conn.unsafe(TRUCK_COLS)}
        FROM trucks t JOIN truck_models tm ON tm.id = t.model_id
        ORDER BY tm.name
      `;
      return ok(trucks);
    }

    // POST /trucks
    if (path === "/trucks" && method === "POST") {
      const body = await getBody(req);
      if (!body?.model_id)        return badReq("model_id is required");
      if (!isUUID(body.model_id)) return badReq("model_id must be a valid UUID");

      const [truck] = await pg_conn`
        INSERT INTO trucks (model_id) VALUES (${body.model_id})
        RETURNING id, model_id, is_valid, is_delivering, fuel_current, maintenance_level
      `;
      return created(truck);
    }

    // GET /trucks/:id/cargo  — must come before /trucks/:id
    const truckCargoMatch = path.match(/^\/trucks\/([^/]+)\/cargo$/);
    if (truckCargoMatch && method === "GET") {
      const idErr = validateId(truckCargoMatch[1]);
      if (idErr) return idErr;

      const cargo = await pg_conn`
        SELECT tc.product_id, p.name, p.volume, p.weight,
               p.refrigeration, p.fragile, tc.quantity
        FROM trucks_cargos tc
        JOIN products p ON p.id = tc.product_id
        WHERE tc.truck_id = ${truckCargoMatch[1]}
      `;
      return ok(cargo);
    }

    const truckMatch = path.match(/^\/trucks\/([^/]+)$/);
    if (truckMatch) {
      const id    = truckMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      // GET /trucks/:id
      if (method === "GET") {
        const [truck] = await pg_conn`
          SELECT ${pg_conn.unsafe(TRUCK_COLS)}
          FROM trucks t JOIN truck_models tm ON tm.id = t.model_id
          WHERE t.id = ${id}
        `;
        return truck ? ok(truck) : notFound("Truck not found");
      }

      // PUT /trucks/:id
      if (method === "PUT") {
        const body = await getBody(req);
        if (!body) return badReq("Invalid JSON body");

        if (body.lat != null || body.lng != null) {
          const geoErr = validateLatLng(body.lat, body.lng);
          if (geoErr) return badReq(geoErr);
        }

        // Split to avoid geo-fragment interpolation
        const [truck] = body.lat != null
          ? await pg_conn`
              UPDATE trucks SET
                is_valid          = COALESCE(${body.is_valid          ?? null}, is_valid),
                is_delivering     = COALESCE(${body.is_delivering     ?? null}, is_delivering),
                fuel_current      = COALESCE(${body.fuel_current      ?? null}, fuel_current),
                maintenance_level = COALESCE(${body.maintenance_level ?? null}, maintenance_level),
                estimated_time    = COALESCE(${body.estimated_time    ?? null}, estimated_time),
                origin_id         = COALESCE(${body.origin_id         ?? null}, origin_id),
                destination_id    = COALESCE(${body.destination_id    ?? null}, destination_id),
                current_location  = ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)
              WHERE id = ${id}
              RETURNING id, model_id, is_valid, is_delivering, fuel_current, maintenance_level
            `
          : await pg_conn`
              UPDATE trucks SET
                is_valid          = COALESCE(${body.is_valid          ?? null}, is_valid),
                is_delivering     = COALESCE(${body.is_delivering     ?? null}, is_delivering),
                fuel_current      = COALESCE(${body.fuel_current      ?? null}, fuel_current),
                maintenance_level = COALESCE(${body.maintenance_level ?? null}, maintenance_level),
                estimated_time    = COALESCE(${body.estimated_time    ?? null}, estimated_time),
                origin_id         = COALESCE(${body.origin_id         ?? null}, origin_id),
                destination_id    = COALESCE(${body.destination_id    ?? null}, destination_id)
              WHERE id = ${id}
              RETURNING id, model_id, is_valid, is_delivering, fuel_current, maintenance_level
            `;
        return truck ? ok(truck) : notFound("Truck not found");
      }

      // DELETE /trucks/:id
      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM trucks WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Truck deleted" }) : notFound("Truck not found");
      }
    }

    // ── ORDERS ─────────────────────────────────────────────────────────────

    // GET /orders
    if (path === "/orders" && method === "GET") {
      const clientId = url.searchParams.get("client_id");
      const status   = url.searchParams.get("status");

      if (clientId && !isUUID(clientId)) return badReq("client_id must be a valid UUID");
      if (status && !(VALID_ORDER_STATUSES as readonly string[]).includes(status))
        return badReq(`status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`);

      const orders = await pg_conn`
        SELECT o.*, u.name AS client_name,
               ST_AsGeoJSON(o.destination_location)::json AS destination_location
        FROM orders o
        JOIN users u ON u.id = o.client_id
        WHERE (${clientId ?? null} IS NULL OR o.client_id = ${clientId ?? null}::uuid)
          AND (${status   ?? null} IS NULL OR o.status     = ${status   ?? null})
        ORDER BY o.time_limit DESC NULLS LAST
      `;
      return ok(orders);
    }

    // POST /orders
    if (path === "/orders" && method === "POST") {
      const body = await getBody(req);
      if (!body?.client_id)       return badReq("client_id is required");
      if (!isUUID(body.client_id)) return badReq("client_id must be a valid UUID");
      if (!Array.isArray(body.items) || !body.items.length)
        return badReq("items must be a non-empty array");

      // Enforce DB constraint: exactly one destination
      const dests = [body.final_destination, body.destination_warehouse_id, body.destination_location]
        .filter(v => v != null);
      if (dests.length !== 1)
        return badReq("Provide exactly one of: final_destination, destination_warehouse_id, destination_location");

      if (body.destination_location) {
        const geoErr = validateLatLng(body.destination_location?.lat, body.destination_location?.lng);
        if (geoErr) return badReq(geoErr);
      }

      const [order] = body.destination_location
        ? await pg_conn`
            INSERT INTO orders (client_id, destination_location, time_limit, supplier_id, supplier_delivery)
            VALUES (
              ${body.client_id},
              ST_SetSRID(ST_MakePoint(${body.destination_location.lng}, ${body.destination_location.lat}), 4326),
              ${body.time_limit ?? null}, ${body.supplier_id ?? null}, ${body.supplier_delivery ?? false}
            )
            RETURNING *
          `
        : body.destination_warehouse_id
        ? await pg_conn`
            INSERT INTO orders (client_id, destination_warehouse_id, time_limit, supplier_id, supplier_delivery)
            VALUES (
              ${body.client_id}, ${body.destination_warehouse_id},
              ${body.time_limit ?? null}, ${body.supplier_id ?? null}, ${body.supplier_delivery ?? false}
            )
            RETURNING *
          `
        : await pg_conn`
            INSERT INTO orders (client_id, final_destination, time_limit, supplier_id, supplier_delivery)
            VALUES (
              ${body.client_id}, ${body.final_destination},
              ${body.time_limit ?? null}, ${body.supplier_id ?? null}, ${body.supplier_delivery ?? false}
            )
            RETURNING *
          `;

      const itemErr = await insertOrderItems(order.id, body.items);
      if (itemErr) {
        await pg_conn`DELETE FROM orders WHERE id = ${order.id}`;
        return badReq(itemErr);
      }

      await recalcOrderPrice(order.id);
      const [final] = await pg_conn`SELECT * FROM orders WHERE id = ${order.id}`;
      return created(final);
    }

    // PUT /orders/:id/route/:step/arrive  — most specific, must come first
    const arriveMatch = path.match(/^\/orders\/([^/]+)\/route\/(\d+)\/arrive$/);
    if (arriveMatch && method === "PUT") {
      const idErr = validateId(arriveMatch[1]);
      if (idErr) return idErr;

      const step = parseInt(arriveMatch[2], 10);
      if (!Number.isFinite(step) || step <= 0) return badReq("step must be a positive integer");

      const [row] = await pg_conn`
        UPDATE orders_routes SET arrived_at = NOW()
        WHERE order_id = ${arriveMatch[1]} AND step = ${step}
        RETURNING *
      `;
      return row ? ok(row) : notFound("Route step not found");
    }

    // GET|POST /orders/:id/route
    const orderRouteMatch = path.match(/^\/orders\/([^/]+)\/route$/);
    if (orderRouteMatch) {
      const orderId = orderRouteMatch[1];
      const idErr   = validateId(orderId);
      if (idErr) return idErr;

      if (method === "GET") {
        const steps = await pg_conn`
          SELECT
            r.step, r.step_type, r.estimated_time, r.arrived_at,
            r.warehouse_id,   w.address  AS warehouse_address,
            r.destination_warehouse_id, dw.address AS destination_warehouse_address,
            r.truck_id,
            ST_AsGeoJSON(r.destination_location)::json AS destination_location
          FROM orders_routes r
          LEFT JOIN warehouses w  ON w.id  = r.warehouse_id
          LEFT JOIN warehouses dw ON dw.id = r.destination_warehouse_id
          WHERE r.order_id = ${orderId}
          ORDER BY r.step
        `;
        return ok(steps);
      }

      if (method === "POST") {
        const body = await getBody(req);
        if (body?.step == null || !body?.step_type) return badReq("step and step_type are required");
        if (!(VALID_STEP_TYPES as readonly string[]).includes(body.step_type))
          return badReq(`step_type must be one of: ${VALID_STEP_TYPES.join(", ")}`);

        // Enforce DB constraint: exactly one destination
        const hasDstWh  = body.destination_warehouse_id != null;
        const hasDstLoc = body.destination_location     != null;
        if (hasDstWh === hasDstLoc)
          return badReq("Provide exactly one of: destination_warehouse_id, destination_location");

        if (hasDstLoc) {
          const geoErr = validateLatLng(body.destination_location?.lat, body.destination_location?.lng);
          if (geoErr) return badReq(geoErr);
        }

        const [step] = hasDstWh
          ? await pg_conn`
              INSERT INTO orders_routes
                (order_id, step, step_type, warehouse_id, truck_id, destination_warehouse_id, estimated_time)
              VALUES (
                ${orderId}, ${body.step}, ${body.step_type},
                ${body.warehouse_id ?? null}, ${body.truck_id ?? null},
                ${body.destination_warehouse_id}, ${body.estimated_time ?? null}
              )
              RETURNING *
            `
          : await pg_conn`
              INSERT INTO orders_routes
                (order_id, step, step_type, warehouse_id, truck_id, destination_location, estimated_time)
              VALUES (
                ${orderId}, ${body.step}, ${body.step_type},
                ${body.warehouse_id ?? null}, ${body.truck_id ?? null},
                ST_SetSRID(ST_MakePoint(${body.destination_location.lng}, ${body.destination_location.lat}), 4326),
                ${body.estimated_time ?? null}
              )
              RETURNING *
            `;
        return created(step);
      }
    }

    // PUT /orders/:id/status
    const orderStatusMatch = path.match(/^\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && method === "PUT") {
      const idErr = validateId(orderStatusMatch[1]);
      if (idErr) return idErr;

      const body = await getBody(req);
      if (!body?.status) return badReq("status is required");
      if (!(VALID_ORDER_STATUSES as readonly string[]).includes(body.status))
        return badReq(`status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`);

      const [order] = await pg_conn`
        UPDATE orders SET status = ${body.status}
        WHERE id = ${orderStatusMatch[1]}
        RETURNING *
      `;
      return order ? ok(order) : notFound("Order not found");
    }

    // GET|DELETE /orders/:id
    const orderMatch = path.match(/^\/orders\/([^/]+)$/);
    if (orderMatch) {
      const id    = orderMatch[1];
      const idErr = validateId(id);
      if (idErr) return idErr;

      if (method === "GET") {
        const [order] = await pg_conn`
          SELECT o.*, u.name AS client_name,
                 ST_AsGeoJSON(o.destination_location)::json AS destination_location
          FROM orders o JOIN users u ON u.id = o.client_id
          WHERE o.id = ${id}
        `;
        if (!order) return notFound("Order not found");

        const items = await pg_conn`
          SELECT oi.product_id, p.name, p.price, oi.quantity
          FROM orders_items oi JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ${id}
        `;
        return ok({ ...order, items });
      }

      if (method === "DELETE") {
        const result = await pg_conn`DELETE FROM orders WHERE id = ${id} RETURNING id`;
        return result.length ? ok({ message: "Order deleted" }) : notFound("Order not found");
      }
    }

    // ── SUPPLIES ROUTES ────────────────────────────────────────────────────

    // GET /supplies-routes
    if (path === "/supplies-routes" && method === "GET") {
      const orderId = url.searchParams.get("order_id");
      if (orderId && !isUUID(orderId)) return badReq("order_id must be a valid UUID");

      const routes = await pg_conn`
        SELECT sr.*, s.name AS supplier_name,
               w.address AS destination_warehouse_address,
               ST_AsGeoJSON(sr.destination_location)::json AS destination_location
        FROM supplies_routes sr
        JOIN suppliers s ON s.id = sr.supplier_id
        LEFT JOIN warehouses w ON w.id = sr.destination_warehouse_id
        WHERE (${orderId ?? null} IS NULL OR sr.order_id = ${orderId ?? null}::uuid)
        ORDER BY sr.estimated_departure
      `;
      return ok(routes);
    }

    // POST /supplies-routes
    if (path === "/supplies-routes" && method === "POST") {
      const body = await getBody(req);
      if (!body?.order_id || !body?.supplier_id)
        return badReq("order_id and supplier_id are required");
      if (!isUUID(body.order_id))    return badReq("order_id must be a valid UUID");
      if (!isUUID(body.supplier_id)) return badReq("supplier_id must be a valid UUID");

      const hasDstWh  = body.destination_warehouse_id != null;
      const hasDstLoc = body.destination_location     != null;
      if (hasDstWh === hasDstLoc)
        return badReq("Provide exactly one of: destination_warehouse_id, destination_location");

      if (hasDstLoc) {
        const geoErr = validateLatLng(body.destination_location?.lat, body.destination_location?.lng);
        if (geoErr) return badReq(geoErr);
      }

      const [route] = hasDstWh
        ? await pg_conn`
            INSERT INTO supplies_routes
              (order_id, supplier_id, truck_id, destination_warehouse_id, estimated_departure, estimated_arrival)
            VALUES (
              ${body.order_id}, ${body.supplier_id}, ${body.truck_id ?? null},
              ${body.destination_warehouse_id},
              ${body.estimated_departure ?? null}, ${body.estimated_arrival ?? null}
            )
            RETURNING *
          `
        : await pg_conn`
            INSERT INTO supplies_routes
              (order_id, supplier_id, truck_id, destination_location, estimated_departure, estimated_arrival)
            VALUES (
              ${body.order_id}, ${body.supplier_id}, ${body.truck_id ?? null},
              ST_SetSRID(ST_MakePoint(${body.destination_location.lng}, ${body.destination_location.lat}), 4326),
              ${body.estimated_departure ?? null}, ${body.estimated_arrival ?? null}
            )
            RETURNING *
          `;
      return created(route);
    }

    // PUT /supplies-routes/:id/arrive
    const supplyArriveMatch = path.match(/^\/supplies-routes\/([^/]+)\/arrive$/);
    if (supplyArriveMatch && method === "PUT") {
      const idErr = validateId(supplyArriveMatch[1]);
      if (idErr) return idErr;

      const [route] = await pg_conn`
        UPDATE supplies_routes SET actual_arrival = NOW()
        WHERE id = ${supplyArriveMatch[1]}
        RETURNING *
      `;
      return route ? ok(route) : notFound("Supply route not found");
    }

    // ── FREIGHT COSTS ──────────────────────────────────────────────────────

    // GET /freight-costs/:order_id
    const freightMatch = path.match(/^\/freight-costs\/([^/]+)$/);
    if (freightMatch && method === "GET") {
      const idErr = validateId(freightMatch[1]);
      if (idErr) return idErr;

      const costs = await pg_conn`
        SELECT * FROM freights_costs
        WHERE order_id = ${freightMatch[1]}
        ORDER BY calculated_at DESC
      `;
      return ok(costs);
    }

    // POST /freight-costs
    if (path === "/freight-costs" && method === "POST") {
      const body = await getBody(req);
      if (!body?.order_id)        return badReq("order_id is required");
      if (!isUUID(body.order_id)) return badReq("order_id must be a valid UUID");

      const fuel  = Number(body.fuel_cost        ?? 0);
      const labor = Number(body.labor_cost       ?? 0);
      const maint = Number(body.maintenance_cost ?? 0);
      if ([fuel, labor, maint].some(n => isNaN(n) || n < 0))
        return badReq("fuel_cost, labor_cost and maintenance_cost must be non-negative numbers");

      const [cost] = await pg_conn`
        INSERT INTO freights_costs (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost)
        VALUES (${body.order_id}, ${fuel}, ${labor}, ${maint}, ${fuel + labor + maint})
        RETURNING *
      `;
      return created(cost);
    }

    // ── SESSIONS ───────────────────────────────────────────────────────────

    // GET /sessions
    if (path === "/sessions" && method === "GET") {
      const sessions = await pg_conn`
        SELECT ou.session_id, ou.login_time, ou.last_activity,
               u.id AS user_id, u.name, u.email, u.role
        FROM online_users ou JOIN users u ON u.id = ou.user_id
        ORDER BY ou.last_activity DESC
      `;
      return ok(sessions);
    }

    // PUT /sessions/:session_id/ping
    const pingMatch = path.match(/^\/sessions\/([^/]+)\/ping$/);
    if (pingMatch && method === "PUT") {
      const idErr = validateId(pingMatch[1]);
      if (idErr) return idErr;

      const [session] = await pg_conn`
        UPDATE online_users SET last_activity = NOW()
        WHERE session_id = ${pingMatch[1]}
        RETURNING session_id, last_activity
      `;
      return session ? ok(session) : notFound("Session not found");
    }

    // ── 404 ────────────────────────────────────────────────────────────────

    return new Response("Not found", { status: 404 });

  } catch (e) {
    console.error("[handleRoutes]", e);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
