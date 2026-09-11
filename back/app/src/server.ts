import { pg_conn } from "./model";
import * as controller from "./controller";
import { converterCoordenadas, converterEndereco } from "./geocoding";
import { handleRoutes as prototypeRoutes } from "./routes";

function toCsvRow(cells: any[]): string {
  return cells
    .map((c) => {
      if (c === null || c === undefined) return '""';
      const str = String(c).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(",");
}

const innerFetchHandler = async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (path === "/geocode" && method === "GET") {
    const address = url.searchParams.get("address");
    if (!address?.trim()) {
      return Response.json({ success: false, error: "Address parameter is required" }, { status: 400 });
    }

    const result = await converterEndereco(address);
    if (typeof result === "string") {
      return Response.json({ success: false, error: result }, { status: 502 });
    }
    return Response.json({ success: true, ...result });
  }

  if (path === "/reverse-geocode" && method === "GET") {
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");
    if (!lat?.trim() || !lon?.trim()) {
      return Response.json({ success: false, error: "Latitude and longitude parameters are required" }, { status: 400 });
    }

    const result = await converterCoordenadas(lat, lon);
    if (typeof result === "string") {
      return Response.json({ success: false, error: result }, { status: 502 });
    }
    return Response.json({ success: true, ...result });
  }

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
  if (path === "/employees" && method === "POST") {
    try {
      const body = await req.json() as { name: string; email?: string; password: string; address?: string; role: string; wage?: number; warehouse_id?: string | null; is_active?: number };
      const validRoles = ["warehouse_worker", "truck_driver", "dispatcher", "inventory_manager", "maintenance_technician", "admin"];
      if (!body.name || !body.password || !validRoles.includes(body.role)) {
        return Response.json({ success: false, error: "Name, password, and a valid employee role are required" }, { status: 400 });
      }
      const employee = await controller.users.createEmployee(body as any);
      return Response.json({ success: true, employee }, { status: 201 });
    } catch (error: any) {
      return Response.json({ success: false, error: error.message || "Could not create employee" }, { status: 400 });
    }
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
  if (path.startsWith("/users/") && method === "DELETE") {
    const id = path.split("/")[2];
    if (!id) return new Response("User ID required", { status: 400 });
    try {
      const deleted = await controller.users.delete(id);
      if (!deleted?.length) return new Response("User not found", { status: 404 });
      return Response.json({ success: true });
    } catch (error: any) {
      return Response.json({ success: false, error: error.message || "Employee cannot be removed while assigned to records" }, { status: 400 });
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
  if (path === "/products" && method === "POST") {
    try {
      const body = await req.json();
      if (!body.name || body.price === undefined) {
        return new Response("Product name and price are required", { status: 400 });
      }
      const id = body.id || `PRD-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
      const created = await controller.products.create({
        id,
        name: body.name,
        price: Number(body.price),
        is_cold: Number(body.is_cold ? 1 : 0),
        is_fragile: Number(body.is_fragile ? 1 : 0),
        expire_date: body.expire_date || null,
        size: body.size ?? { length: 0.5, width: 0.5, height: 0.5 },
        volume: Number(body.volume ?? 1),
        weight: Number(body.weight ?? 1),
      });
      return Response.json({ success: true, product: created[0] }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating product:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
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
      if (!updated?.length) return new Response("Product not found", { status: 404 });
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
  if (path.startsWith("/warehouses/") && (method === "POST" || method === "PUT" || method === "DELETE")) {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Warehouse ID required", { status: 400 });

    if (parts[3] === "stock" && (method === "PUT" || method === "POST")) {
      try {
        const body = await req.json();
        if (!body.product_id || body.quantity === undefined) {
          return new Response("product_id and quantity are required", { status: 400 });
        }
        const updated = await controller.warehouses.upsertStock(id, body.product_id, Number(body.quantity));
        return Response.json({ success: true, stock: updated[0] });
      } catch (error: any) {
        console.error("Error updating warehouse stock:", error);
        return new Response(error.message || "Internal Server Error", { status: 500 });
      }
    }

    if (parts[3] === "stock" && method === "DELETE") {
      const productId = parts[4];
      if (!productId) return new Response("Product ID required", { status: 400 });
      try {
        await controller.warehouses.deleteStock(id, productId);
        return Response.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting warehouse stock:", error);
        return new Response(error.message || "Internal Server Error", { status: 500 });
      }
    }

    if (parts[3] === "check-parking" && method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { truck_id?: string };
      const check = await controller.warehouses.checkParkingAvailable(id, body.truck_id);
      return Response.json(check, { status: check.allowed ? 200 : 400 });
    }

    if (!parts[3] && method === "PUT") {
      try {
        const body = await req.json();
        const updated = await controller.warehouses.update(id, body);
        if (!updated?.length) return new Response("Warehouse not found", { status: 404 });
        return Response.json({ success: true, warehouse: updated[0] });
      } catch (error: any) {
        console.error("Error updating warehouse:", error);
        return new Response(error.message || "Internal Server Error", { status: 500 });
      }
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
  if (path === "/trucks/cargo" && method === "GET") {
    return Response.json(await controller.trucks.cargo());
  }
  if (path.startsWith("/trucks/") && method === "GET") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Truck ID required", { status: 400 });

    if (parts[3] === "cargo") {
      return Response.json(await controller.trucks.cargo(id));
    }

    if (parts[3] === "routes" && parts[4] === "multi-stop") {
      const assignedRoutes = await pg_conn`
        SELECT DISTINCT order_id FROM orders_route WHERE truck_id = ${id}
      `;
      const orderIds = assignedRoutes.map((r: any) => r.order_id);
      if (orderIds.length === 0) {
        return Response.json({
          success: true,
          message: "No orders currently assigned to this truck",
          truck_id: id,
          stops: [],
        });
      }
      const { calculateMultiStopRoute } = await import("./routes");
      const multiRoute = await calculateMultiStopRoute({
        orderIds,
        truckId: id,
      });
      return Response.json(multiRoute);
    }

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
      if (!updated?.length) return new Response("Truck not found", { status: 404 });
      return Response.json({ success: true, truck: updated[0] });
    } catch (error: any) {
      console.error("Error updating truck:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }

  // 4. TRANSACTION & ROUTING LAYER
  if (path === "/orders" && method === "GET") {
    const clientId = url.searchParams.get("clientId");
    const driverId = url.searchParams.get("driverId");
    const warehouseId = url.searchParams.get("warehouseId");
    if (clientId) return Response.json(await controller.orders.byClient(clientId));
    if (driverId) return Response.json(await controller.orders.byDriver(driverId));
    if (warehouseId) return Response.json(await controller.orders.byWarehouse(warehouseId));
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

      if (body.status === "Shipped") {
        await controller.orders.deductStockForOrder(body.id, true);
      } else if (body.status === "Delivered") {
        await controller.orders.deductStockForOrder(body.id, false);
      }

      return Response.json({ success: true, order: newOrder[0] }, { status: 201 });
    } catch (error: any) {
      console.error("Error creating order:", error);
      return new Response(error.message || "Internal Server Error", { status: 500 });
    }
  }
  if (path === "/orders/export/csv" && method === "GET") {
    const allOrders = await controller.orders.all();
    const allUsers = await controller.users.all();
    const allWarehouses = await controller.warehouses.all();
    const allRoutes = await controller.orders_route.all();

    const userMap = new Map<string, any>();
    allUsers.forEach((u: any) => userMap.set(u.id, u));
    const whMap = new Map<string, any>();
    allWarehouses.forEach((w: any) => whMap.set(w.id, w));

    const rows: string[] = [
      toCsvRow([
        "Order ID",
        "Client ID",
        "Client Name",
        "Destination",
        "Deadline",
        "Status",
        "Price (BRL)",
        "Distance (km)",
        "Origin Warehouse",
        "Truck ID",
        "Driver ID",
      ]),
    ];

    for (const order of allOrders) {
      const client = userMap.get(order.client_id);
      const routes = allRoutes.filter((r: any) => r.order_id === order.id).sort((a: any, b: any) => a.step - b.step);
      const firstRoute = routes[0];
      const wh = firstRoute?.warehouse_id ? whMap.get(firstRoute.warehouse_id) : null;
      let destStr = order.final_destination;
      try {
        const parsed = JSON.parse(order.final_destination);
        if (parsed?.label) destStr = parsed.label;
      } catch {}

      rows.push(
        toCsvRow([
          order.id,
          order.client_id,
          client?.name || `Client ${order.client_id}`,
          destStr,
          order.time_limit,
          order.status,
          Number(order.price || 0).toFixed(2),
          Number(order.distance_km || 0).toFixed(1),
          wh?.location?.label || firstRoute?.warehouse_id || "WH-001",
          firstRoute?.truck_id || "Unassigned",
          firstRoute?.driver_id || "Unassigned",
        ])
      );
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
      },
    });
  }

  if (path.startsWith("/orders/") && method === "GET") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });

    if (parts[3] === "manifest.csv") {
      const orderRes = await controller.orders.byId(id);
      if (!orderRes || orderRes.length === 0) return new Response("Order not found", { status: 404 });
      const order = orderRes[0];

      const clientRes = await controller.users.byId(order.client_id);
      const client = clientRes[0];
      const itemsRes = await controller.orders.items(id);
      const productsRes = await controller.products.all();
      const productMap = new Map<string, any>();
      productsRes.forEach((p: any) => productMap.set(p.id, p));

      const routes = await controller.orders_route.byOrder(id);
      const firstRoute = routes[0];
      const truckRes = firstRoute?.truck_id ? await controller.trucks.byId(firstRoute.truck_id) : [];
      const driverRes = firstRoute?.driver_id ? await controller.users.byId(firstRoute.driver_id) : [];
      const whRes = firstRoute?.warehouse_id ? await controller.warehouses.byId(firstRoute.warehouse_id) : [];

      let destStr = order.final_destination;
      try {
        const parsed = JSON.parse(order.final_destination);
        if (parsed?.label) destStr = parsed.label;
      } catch {}

      const lines: string[] = [
        toCsvRow(["LOGISYS SHIPPING MANIFEST & FREIGHT BILL"]),
        toCsvRow(["Generated At", new Date().toISOString().replace("T", " ").slice(0, 19)]),
        toCsvRow(["Order ID", order.id]),
        toCsvRow(["Order Status", order.status]),
        toCsvRow(["Client Name", client?.name || order.client_id]),
        toCsvRow(["Client Contact", client?.email || "N/A"]),
        toCsvRow(["Final Destination", destStr]),
        toCsvRow(["Delivery Deadline", order.time_limit]),
        toCsvRow(["Declared Order Price (BRL)", Number(order.price || 0).toFixed(2)]),
        toCsvRow([]),
        toCsvRow(["LOGISTICS & FLEET ASSIGNMENT"]),
        toCsvRow(["Origin Warehouse", whRes[0]?.location?.label || firstRoute?.warehouse_id || "WH-001"]),
        toCsvRow(["Assigned Truck", truckRes[0] ? `${truckRes[0].model} (${truckRes[0].id})` : "Unassigned"]),
        toCsvRow(["Assigned Driver", driverRes[0] ? `${driverRes[0].name} (${driverRes[0].id})` : "Unassigned"]),
        toCsvRow(["Estimated Arrival (ETA)", firstRoute?.estimated_time || "Pending dispatch"]),
        toCsvRow([]),
        toCsvRow(["CARGO ITEMS MANIFEST"]),
        toCsvRow([
          "Product ID",
          "Product Name",
          "Quantity",
          "Unit Price (BRL)",
          "Subtotal (BRL)",
          "Weight (kg)",
          "Volume (m3)",
          "Refrigerated",
          "Fragile",
        ]),
      ];

      let totalWeight = 0;
      let totalVolume = 0;
      let totalQuantity = 0;

      for (const item of itemsRes) {
        const prod = productMap.get(item.product_id);
        const qty = Number(item.quantity || 1);
        const price = Number(prod?.price || 0);
        const subtotal = qty * price;
        const weight = qty * Number(prod?.weight || 0);
        const volume = qty * Number(prod?.volume || 0);

        totalQuantity += qty;
        totalWeight += weight;
        totalVolume += volume;

        lines.push(
          toCsvRow([
            item.product_id,
            prod?.name || item.product_id,
            qty,
            price.toFixed(2),
            subtotal.toFixed(2),
            weight.toFixed(2),
            volume.toFixed(3),
            prod?.is_cold ? "YES" : "NO",
            prod?.is_fragile ? "YES" : "NO",
          ])
        );
      }

      lines.push(toCsvRow([]));
      lines.push(toCsvRow(["TOTALS & MANIFEST SIGN-OFF"]));
      lines.push(toCsvRow(["Total Cargo Quantity", totalQuantity]));
      lines.push(toCsvRow(["Total Cargo Weight (kg)", totalWeight.toFixed(2)]));
      lines.push(toCsvRow(["Total Cargo Volume (m3)", totalVolume.toFixed(3)]));
      lines.push(toCsvRow(["Total Value (BRL)", Number(order.price || 0).toFixed(2)]));
      lines.push(toCsvRow(["Dispatcher Signature", "___________________________________"]));
      lines.push(toCsvRow(["Carrier/Driver Signature", "___________________________________"]));
      lines.push(toCsvRow(["Receiver Signature", "___________________________________"]));

      const csvContent = "\uFEFF" + lines.join("\r\n");
      return new Response(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="shipping-manifest-${order.id}.csv"`,
        },
      });
    }
    
    if (parts[3] === "items") return Response.json(await controller.orders.items(id));
    if (parts[3] === "route") return Response.json(await controller.orders.routes(id));
    if (parts[3] === "cost") return Response.json(await controller.orders.costs(id));
    if (parts[3] === "eta") {
      try {
        const eta = await controller.orders.calculateETA(id);
        return Response.json({ success: true, ...eta });
      } catch (error: any) {
        return Response.json({ success: false, error: error.message || "Failed to calculate ETA" }, { status: 400 });
      }
    }
    
    const result = await controller.orders.byId(id);
    if (!result || result.length === 0) return new Response("Order not found", { status: 404 });
    return Response.json(result);
  }
  if (path.startsWith("/orders/") && method === "POST") {
    const parts = path.split("/");
    const id = parts[2];
    if (!id) return new Response("Order ID required", { status: 400 });

    if (parts[3] === "calculate-eta") {
      try {
        const body = (await req.json().catch(() => ({}))) as {
          minSpeed?: number;
          maxSpeed?: number;
          avgSpeed?: number;
          departureTime?: string;
          originWarehouseId?: string;
          truckId?: string;
        };
        const etaResult = await controller.orders.calculateETA(id, body);
        return Response.json({ success: true, ...etaResult });
      } catch (error: any) {
        console.error("Error calculating order ETA:", error);
        return Response.json({ success: false, error: error.message || "Failed to calculate ETA" }, { status: 400 });
      }
    }

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
          driver_id: body.driver_id,
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

    if (!parts[3]) {
      const body = await req.json().catch(() => ({})) as { status?: string };
      const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled", "Canceled"];
      if (!body.status || !validStatuses.includes(body.status)) {
        return Response.json({ success: false, error: "A valid order status is required" }, { status: 400 });
      }
      // Older database installations use the SQL spelling "Canceled", while
      // the UI consistently exposes "Cancelled".
      const databaseStatus = body.status === "Cancelled" ? "Canceled" : body.status;
      const updated = await controller.orders.updateStatus(id, databaseStatus as "Pending" | "Shipped" | "Delivered" | "Canceled");
      if (!updated?.length) return new Response("Order not found", { status: 404 });
      return Response.json({ success: true, order: updated[0] });
    }

    if (parts[3] === "route") {
      const step = Number(parts[4] || 1);
      try {
        const body = await req.json();
        const updated = await controller.orders_route.update(id, step, body);
        if (!updated?.length) return new Response("Order route step not found", { status: 404 });
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
  if (path === "/reports/delivery-costs" && method === "GET") {
    const warehouseId = url.searchParams.get("warehouseId") || undefined;
    return Response.json(await controller.reports.getDeliveryCostReport(warehouseId));
  }

  // --- REPORTS DELIVERY COSTS CSV EXPORT ---
  if (path === "/reports/delivery-costs/csv" && method === "GET") {
    const warehouseId = url.searchParams.get("warehouseId") || undefined;
    const report = await controller.reports.getDeliveryCostReport(warehouseId);

    const rows: string[] = [
      toCsvRow([
        "Order ID",
        "Client ID",
        "Client Name",
        "Destination",
        "Origin Warehouse",
        "Status",
        "Distance (km)",
        "Revenue (BRL)",
        "Fuel Cost (BRL)",
        "Labor Cost (BRL)",
        "Maintenance Cost (BRL)",
        "Total Delivery Cost (BRL)",
        "Net Operating Margin (BRL)",
        "Margin (%)",
      ]),
    ];

    for (const o of report.orders) {
      let destStr = o.destination || "—";
      try {
        const parsed = typeof o.destination === "string" ? JSON.parse(o.destination) : o.destination;
        if (parsed?.label) destStr = parsed.label;
      } catch {}

      let whStr = o.origin_warehouse_id || "—";
      if (o.origin_warehouse_label) {
        if (typeof o.origin_warehouse_label === "object") {
          whStr = o.origin_warehouse_label.label || o.origin_warehouse_id || "—";
        } else if (typeof o.origin_warehouse_label === "string") {
          try {
            const parsed = JSON.parse(o.origin_warehouse_label);
            whStr = parsed?.label || o.origin_warehouse_label;
          } catch {
            whStr = o.origin_warehouse_label;
          }
        }
      }

      rows.push(
        toCsvRow([
          o.order_id,
          o.client_id,
          o.client_name,
          destStr,
          whStr,
          o.status,
          Number(o.distance_km || 0).toFixed(1),
          Number(o.revenue || 0).toFixed(2),
          Number(o.fuel_cost || 0).toFixed(2),
          Number(o.labor_cost || 0).toFixed(2),
          Number(o.maintenance_cost || 0).toFixed(2),
          Number(o.total_delivery_cost || 0).toFixed(2),
          Number(o.net_margin || 0).toFixed(2),
          Number(o.margin_percent || 0).toFixed(1) + "%",
        ])
      );
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="delivery-costs-report-${Date.now()}.csv"`,
      },
    });
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
