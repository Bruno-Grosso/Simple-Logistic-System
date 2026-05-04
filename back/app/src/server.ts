import { pg_conn } from "./model";
import * as controller from "./controller";
import { handleRoutes as prototypeRoutes } from "./routes";

const server = Bun.serve({
  port: 8080,
  async fetch(req) {
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
      return Response.json(await controller.users.byId(id));
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
      return Response.json(await controller.products.byId(id));
    }

    // 3. INFRASTRUCTURE & FLEET LAYER
    if (path === "/warehouses" && method === "GET") {
      return Response.json(await controller.warehouses.all());
    }
    if (path.startsWith("/warehouses/") && method === "GET") {
      const parts = path.split("/");
      const id = parts[2];
      if (parts[3] === "stock") return Response.json(await controller.warehouses.stock(id));
      return Response.json(await controller.warehouses.byId(id));
    }
    if (path === "/suppliers" && method === "GET") {
      return Response.json(await controller.suppliers.all());
    }
    if (path.startsWith("/suppliers/") && method === "GET") {
      const id = path.split("/")[2];
      return Response.json(await controller.suppliers.byId(id));
    }
    if (path === "/trucks" && method === "GET") {
      const model = url.searchParams.get("model");
      if (model) return Response.json(await controller.trucks.byModel(model));
      return Response.json(await controller.trucks.all());
    }
    if (path.startsWith("/trucks/") && method === "GET") {
      const id = path.split("/")[2];
      return Response.json(await controller.trucks.byId(id));
    }

    // 4. TRANSACTION & ROUTING LAYER
    if (path === "/orders" && method === "GET") {
      const clientId = url.searchParams.get("clientId");
      if (clientId) return Response.json(await controller.orders.byClient(clientId));
      return Response.json(await controller.orders.all());
    }
    if (path.startsWith("/orders/") && method === "GET") {
      const parts = path.split("/");
      const id = parts[2];
      if (parts[3] === "items") return Response.json(await controller.orders.items(id));
      if (parts[3] === "route") return Response.json(await controller.orders.routes(id));
      if (parts[3] === "cost") return Response.json(await controller.orders.costs(id));
      return Response.json(await controller.orders.byId(id));
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

    return new Response("Not found", { status: 404 });
  },
});

export { server };
