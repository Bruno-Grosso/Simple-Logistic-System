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
  if (path === "/users" && method === "GET") {
    const role = url.searchParams.get("role");
    if (role) return Response.json(await controller.users.byRole(role));
    return Response.json(await controller.users.all());
  }
  if (path.startsWith("/users/") && method === "GET") {
    const id = path.split("/")[2];
    if (!id) return new Response("User ID required", { status: 400 });
    const result = await controller.users.byId(id);
    if (!result || result.length === 0) return new Response("User not found", { status: 404 });
    return Response.json(result);
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
  if (path.startsWith("/warehouses/") && method === "GET") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Warehouse ID required", { status: 400 });
    
    if (parts[3] === "stock") return Response.json(await controller.warehouses.stock(id));
    
    const result = await controller.warehouses.byId(id);
    if (!result || result.length === 0) return new Response("Warehouse not found", { status: 404 });
    return Response.json(result);
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
