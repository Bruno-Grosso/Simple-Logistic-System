import { pg_conn } from "./model";
import * as controller from "./controller";
import { handleRoutes as prototypeRoutes } from "./routes";

const innerFetchHandler = async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // 0. Maintain prototype and original routes
  if (path === "/status") {
    const tables = await pg_conn`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    return Response.json(tables);
  }
  if (path === "/db-name") {
    const dbName = await pg_conn`SELECT current_database()`;
    return Response.json(dbName[0]);
  }

  const protoRes = await prototypeRoutes(req);
  if (protoRes) return protoRes;

  // 1. IDENTITY & ACCESS LAYER
  if (path === "/login" && method === "POST") {
    try {
      const body = await req.json() as { email?: string; username?: string; id?: string; password?: string };
      const identityInput = body.email || body.username || body.id || "";
      const passwordInput = body.password || "";

      if (!identityInput || !passwordInput) {
        return Response.json({ ok: false, success: false, error: "Missing email/username or password" }, { status: 400 });
      }

      const loginResult = await controller.users.login(identityInput, passwordInput);
      if (!loginResult) {
        return Response.json({ ok: false, success: false, error: "Invalid credentials" }, { status: 401 });
      }

      return Response.json({ ok: true, success: true, ...loginResult });
    } catch (error: any) {
      console.error("Error during login:", error);
      return Response.json({ ok: false, success: false, error: "Internal server error" }, { status: 500 });
    }
  }
  if (path === "/clients" && method === "POST") {
    try {
      const body = await req.json();
      const client = await controller.users.createClient(body);
      return Response.json({ ok: true, success: true, client }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating client:", error);
      return Response.json({ ok: false, error: error.message || "Internal server error" }, { status: 500 });
    }
  }
  if (path === "/users" && method === "GET") {
    const role = url.searchParams.get("role");
    if (role) return Response.json(await controller.users.byRole(role));
    return Response.json(await controller.users.all());
  }
  if (path === "/users/drivers" && method === "GET") {
    return Response.json(await controller.users.drivers());
  }
  if (path.startsWith("/users/") && method === "GET") {
    const id = path.split("/")[2];
    if (!id) return new Response("User ID required", { status: 400 });
    const result = await controller.users.byId(id);
    if (!result || result.length === 0) return new Response("User not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/users/") && method === "PUT") {
    const id = path.split("/")[2];
    if (!id) return new Response("User ID required", { status: 400 });
    try {
      const body = await req.json();
      const updated = await controller.users.update(id, body);
      if (!updated || updated.length === 0) {
        return new Response("User not found", { status: 404 });
      }
      return Response.json({ success: true, user: updated[0] });
    } catch (error: any) {
      console.error("Error updating user:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }
  if (path === "/online-users" && method === "GET") {
    const userId = url.searchParams.get("userId");
    if (userId) return Response.json(await controller.onlineUsers.byUser(userId));
    return Response.json(await controller.onlineUsers.all());
  }

  // 2. PRODUCT & INVENTORY LAYER
  if (path === "/products" && method === "GET") {
    const name = url.searchParams.get("name");
    if (name) return Response.json(await controller.products.searchByName(name));
    return Response.json(await controller.products.all());
  }
  if (path.startsWith("/products/") && method === "GET") {
    const id = path.split("/")[2];
    if (!id) return new Response("Product ID required", { status: 400 });
    const result = await controller.products.byId(id);
    if (!result || result.length === 0) return new Response("Product not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/products/") && method === "PUT") {
    const id = path.split("/")[2];
    if (!id) return new Response("Product ID required", { status: 400 });
    try {
      const body = await req.json();
      const updated = await controller.products.update(id, body);
      return Response.json({ success: true, product: updated[0] });
    } catch (error: any) {
      console.error("Error updating product:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }

  // 3. INFRASTRUCTURE & FLEET LAYER
  if (path === "/warehouses" && method === "GET") {
    return Response.json(await controller.warehouses.all());
  }
  if (path === "/warehouses/average-gas-price" && method === "GET") {
    const ids = url.searchParams.get("ids")?.split(",").map((s) => s.trim()).filter(Boolean);
    const avgPrice = await controller.warehouses.getAverageGasPrice(ids);
    return Response.json({ avg_gas_price: avgPrice, warehouses_count: ids?.length ?? 0 });
  }
  if (path.startsWith("/warehouses/") && method === "GET") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Warehouse ID required", { status: 400 });
    
    if (parts[3] === "stock") return Response.json(await controller.warehouses.stock(id));
    if (parts[3] === "parking") {
      const parkingStatus = await controller.warehouses.getParkingStatus(id);
      if (!parkingStatus) return new Response("Warehouse not found", { status: 404 });
      return Response.json(parkingStatus);
    }
    
    const result = await controller.warehouses.byId(id);
    if (!result || result.length === 0) return new Response("Warehouse not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/warehouses/") && method === "POST") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Warehouse ID required", { status: 400 });

    if (parts[3] === "check-parking") {
      const body = (await req.json().catch(() => ({}))) as { truck_id?: string };
      const check = await controller.warehouses.checkParkingAvailable(id, body.truck_id);
      return Response.json(check, { status: check.allowed ? 200 : 400 });
    }
  }
  if (path.startsWith("/warehouses/") && method === "PUT") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Warehouse ID required", { status: 400 });
    try {
      const body = await req.json();
      const updated = await controller.warehouses.update(id, body);
      return Response.json({ success: true, warehouse: updated[0] });
    } catch (error: any) {
      console.error("Error updating warehouse:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }
  if (path === "/suppliers" && method === "GET") {
    return Response.json(await controller.suppliers.all());
  }
  if (path.startsWith("/suppliers/") && method === "GET") {
    const id = path.split("/")[2];
    if (!id) return new Response("Supplier ID required", { status: 400 });
    const result = await controller.suppliers.byId(id);
    if (!result || result.length === 0) return new Response("Supplier not found", { status: 404 });
    return Response.json(result);
  }
  if (path === "/trucks" && method === "GET") {
    const model = url.searchParams.get("model");
    if (model) return Response.json(await controller.trucks.byModel(model));
    return Response.json(await controller.trucks.all());
  }
  if (path.startsWith("/trucks/") && method === "GET") {
    const id = path.split("/")[2];
    if (!id) return new Response("Truck ID required", { status: 400 });
    const result = await controller.trucks.byId(id);
    if (!result || result.length === 0) return new Response("Truck not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/trucks/") && method === "PUT") {
    const id = path.split("/")[2];
    if (!id) return new Response("Truck ID required", { status: 400 });
    try {
      const body = await req.json();
      const updated = await controller.trucks.update(id, body);
      return Response.json({ success: true, truck: updated[0] });
    } catch (error: any) {
      console.error("Error updating truck:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }

  // 4. TRANSACTION & ROUTING LAYER
  if (path === "/orders" && method === "GET") {
    const clientId = url.searchParams.get("clientId");
    if (clientId) return Response.json(await controller.orders.byClient(clientId));
    return Response.json(await controller.orders.all());
  }
  if (path === "/orders" && method === "POST") {
    try {
      const body = await req.json() as {
        id: string;
        client_id: string;
        final_destination: string;
        time_limit: string;
        price: number;
        status?: string;
        items?: Array<{ product_id: string; quantity: number }>;
      };

      if (!body.id || !body.client_id || !body.final_destination || !body.time_limit) {
        return new Response("Missing required fields for order creation", { status: 400 });
      }

      const newOrder = await controller.orders.create({
        id: body.id,
        client_id: body.client_id,
        final_destination: body.final_destination,
        time_limit: body.time_limit,
        price: body.price || 0,
        status: body.status || "Pending"
      });

      if (body.items && Array.isArray(body.items)) {
        for (const item of body.items) {
          await controller.orders.addItem({
            order_id: body.id,
            product_id: item.product_id,
            quantity: item.quantity
          });
        }
      }

      return Response.json({ success: true, order: newOrder[0] }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }
  if (path.startsWith("/orders/") && method === "GET") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });
    
    if (parts[3] === "items") return Response.json(await controller.orders.items(id));
    if (parts[3] === "route") return Response.json(await controller.orders.routes(id));
    if (parts[3] === "cost") return Response.json(await controller.orders.costs(id));
    
    const result = await controller.orders.byId(id);
    if (!result || result.length === 0) return new Response("Order not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/orders/") && method === "POST") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });

    if (parts[3] === "calculate-cost") {
      try {
        const body = (await req.json().catch(() => ({}))) as {
          driverWage?: number;
          fuelPrice?: number;
          distanceKm?: number;
          truckId?: string;
          driverId?: string;
        };
        const costResult = await controller.freightCosts.calculateAndSave(id, body);
        return Response.json({ success: true, ...costResult });
      } catch (error: any) {
        console.error("Error calculating freight cost:", error);
        return Response.json({ success: false, error: error.message || "Failed to calculate freight cost" }, { status: 400 });
      }
    }

    if (parts[3] === "calculate-distance") {
      try {
        const body = (await req.json().catch(() => ({}))) as { warehouse_id?: string };
        const distResult = await controller.orders.calculateDistance(id, body?.warehouse_id);
        return Response.json({ success: true, ...distResult });
      } catch (error: any) {
        console.error("Error calculating distance in DB:", error);
        return Response.json({ success: false, error: error.message || "Failed to calculate distance" }, { status: 400 });
      }
    }

    if (parts[3] === "route") {
      try {
        const body = await req.json();
        const step = body.step !== undefined ? Number(body.step) : 1;
        const newRoute = await controller.orders_route.create({
          order_id: id,
          step,
          warehouse_id: body.warehouse_id,
          truck_id: body.truck_id,
          destination_warehouse_id: body.destination_warehouse_id,
          estimated_time: body.estimated_time,
          arrived_at: body.arrived_at,
        });
        return Response.json({ success: true, route: newRoute[0] }, { status: 201 });
      } catch (error: any) {
        console.error("Error creating order route:", error);
        return Response.json({ success: false, error: error.message || "Failed to create route" }, { status: 400 });
      }
    }
  }
  if (path.startsWith("/orders/") && method === "PUT") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });

    if (parts[3] === "route") {
      const step = Number(parts[4] || 1);
      try {
        const body = await req.json();
        const updated = await controller.orders_route.update(id, step, body);
        return Response.json({ success: true, route: updated[0] });
      } catch (error: any) {
        console.error("Error updating order route:", error);
        return Response.json({ success: false, error: error.message || "Failed to update route" }, { status: 400 });
      }
    }
  }
  if (path.startsWith("/orders/") && method === "DELETE") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });

    if (parts[3] === "route") {
      const step = Number(parts[4] || 1);
      try {
        await controller.orders_route.delete(id, step);
        return Response.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting order route:", error);
        return Response.json({ success: false, error: error.message || "Failed to delete route" }, { status: 400 });
      }
    }
  }
  if (path === "/orders-route" && method === "GET") {
    const orderId = url.searchParams.get("orderId");
    if (orderId) return Response.json(await controller.orders_route.byOrder(orderId));
    return Response.json(await controller.orders_route.all());
  }
  if (path === "/supplies-route" && method === "GET") {
    const orderId = url.searchParams.get("orderId");
    if (orderId) return Response.json(await controller.supplyRoutes.byOrder(orderId));
    const supplierId = url.searchParams.get("supplierId");
    if (supplierId) return Response.json(await controller.supplyRoutes.bySupplier(supplierId));
    return Response.json(await controller.supplyRoutes.all());
  }
  if (path === "/freight-cost" && method === "GET") {
    const orderId = url.searchParams.get("orderId");
    if (orderId) return Response.json(await controller.freightCosts.byOrder(orderId));
    return Response.json(await controller.freightCosts.all());
  }
  if (path === "/monthly-performance" && method === "GET") {
    return Response.json(await controller.monthlyPerformance.all());
  }

  return new Response("Not found", { status: 404 });
};

const fetchHandler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const res = await innerFetchHandler(req);
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
};

export { fetchHandler };
