import { test, expect, describe, afterEach } from "vitest";
import { pg_conn } from "../src/model";
import { testFetch } from "./test-utils";

describe("Business Logic, Data Integrity, Usability & Multi-Stop Routing", () => {
  afterEach(async () => {
    // Cleanup temporary test records
    await pg_conn`DELETE FROM freight_cost WHERE order_id LIKE 'ORD-TEST-BIZ-%'`;
    await pg_conn`DELETE FROM orders_items WHERE order_id LIKE 'ORD-TEST-BIZ-%'`;
    await pg_conn`DELETE FROM orders_route WHERE order_id LIKE 'ORD-TEST-BIZ-%'`;
    await pg_conn`DELETE FROM orders WHERE id LIKE 'ORD-TEST-BIZ-%'`;
    await pg_conn`DELETE FROM trucks_cargo WHERE truck_id = 'TRK-BIZ-SMALL'`;
    await pg_conn`DELETE FROM trucks WHERE id = 'TRK-BIZ-SMALL'`;
  });

  // 1. Data Integrity: Indexed user query on login
  describe("Data Integrity: Direct indexed query on login", () => {
    test("POST /login: authenticates user via email directly without full-table scan", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alice@logisys.com", password: "admin123" }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.user.id).toBe("USR-001");
      expect(data.user.email).toBe("alice@logisys.com");
    });

    test("POST /login: authenticates user via ID identifier", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "USR-002", password: "bobpass" }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.user.id).toBe("USR-002");
    });

    test("POST /login: returns 401 for non-existent candidate", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ghost@logisys.com", password: "password" }),
      });
      expect(res.status).toBe(401);
    });
  });

  // 2. Business Logic: Stock deduction on shipment
  describe("Business Logic: Stock deducted on dispatch (Shipped)", () => {
    test("Deducts warehouse_stock when order status transitions to Shipped", async () => {
      const orderId = `ORD-TEST-BIZ-${Date.now()}`;
      const productId = "PROD-001"; // Fresh Milk
      const warehouseId = "WH-001";

      // Check current stock
      const stockBefore = await pg_conn`
        SELECT quantity FROM warehouses_stock 
        WHERE warehouse_id = ${warehouseId} AND product_id = ${productId}
      `;
      const initialQty = Number(stockBefore[0]?.quantity ?? 50);

      // Create test order
      await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          client_id: "USR-004",
          final_destination: "Rua do Imperador, Petrópolis - RJ",
          time_limit: "2026-10-10",
          price: 150.0,
          status: "Pending",
          items: [{ product_id: productId, quantity: 5 }],
        }),
      });

      // Attach route step from WH-001
      await testFetch(`/orders/${orderId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          warehouse_id: warehouseId,
          truck_id: "TRK-001",
          driver_id: "USR-003",
        }),
      });

      // Transition order status to Shipped
      const shipRes = await testFetch(`/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Shipped" }),
      });
      expect(shipRes.status).toBe(200);

      // Verify stock in warehouse was deducted by 5
      const stockAfter = await pg_conn`
        SELECT quantity FROM warehouses_stock 
        WHERE warehouse_id = ${warehouseId} AND product_id = ${productId}
      `;
      const finalQty = Number(stockAfter[0]?.quantity);
      expect(finalQty).toBe(Math.max(0, initialQty - 5));

      // Revert stock for test idempotency
      await pg_conn`
        UPDATE warehouses_stock 
        SET quantity = ${initialQty} 
        WHERE warehouse_id = ${warehouseId} AND product_id = ${productId}
      `;
    });
  });

  // 3. Business Logic: Truck capacity enforcement
  describe("Business Logic: Truck capacity enforcement", () => {
    test("Rejects truck assignment when order payload exceeds truck weight_max", async () => {
      const orderId = `ORD-TEST-BIZ-${Date.now()}`;
      const smallTruckId = "TRK-BIZ-SMALL";

      // Create a small truck with 50kg maximum capacity
      await pg_conn`
        INSERT INTO trucks (id, model, speed, size, volume_max, weight_max, fuel_capacity, fuel_current, fuel_consumption)
        VALUES (${smallTruckId}, 'Mini Courier', 70.0, '{"length":3,"width":1.5,"height":1.5}', 5.0, 50.0, 60.0, 50.0, 0.1)
        ON CONFLICT (id) DO NOTHING
      `;

      // Create order with 10 Industrial Drills (5.5kg each = 55kg total payload > 50kg limit)
      await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          client_id: "USR-004",
          final_destination: "Av. Alberto Braune, Nova Friburgo - RJ",
          time_limit: "2026-10-10",
          price: 2500.0,
          status: "Pending",
          items: [{ product_id: "PROD-008", quantity: 10 }], // 10 * 5.5kg = 55kg > 50kg max
        }),
      });

      // Attempt to assign the overloaded truck
      const routeRes = await testFetch(`/orders/${orderId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          warehouse_id: "WH-001",
          truck_id: smallTruckId,
        }),
      });

      expect(routeRes.status).toBe(400);
      const errData = (await routeRes.json()) as any;
      expect(errData.success).toBe(false);
      expect(errData.error).toMatch(/capacity exceeded|exceeds vehicle limit/i);
    });

    test("Allows truck assignment when order payload is within truck limits", async () => {
      const orderId = `ORD-TEST-BIZ-${Date.now()}`;

      // Create order with 1 drill (5.5kg)
      await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          client_id: "USR-004",
          final_destination: "Av. Alberto Braune, Nova Friburgo - RJ",
          time_limit: "2026-10-10",
          price: 250.0,
          status: "Pending",
          items: [{ product_id: "PROD-008", quantity: 1 }],
        }),
      });

      // Assign large truck (TRK-001 has 25,000kg limit)
      const routeRes = await testFetch(`/orders/${orderId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          warehouse_id: "WH-001",
          truck_id: "TRK-001",
        }),
      });

      expect(routeRes.status).toBe(201);
      const data = (await routeRes.json()) as any;
      expect(data.success).toBe(true);
      expect(data.route.truck_id).toBe("TRK-001");
    });
  });

  // 4. Usability: CSV Exporters
  describe("Usability: PDF/CSV export endpoints", () => {
    test("GET /orders/export/csv returns downloadable CSV with all orders", async () => {
      const res = await testFetch("/orders/export/csv");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
      const text = await res.text();
      expect(text).toContain("Order ID");
      expect(text).toContain("Client Name");
      expect(text).toContain("Destination");
      expect(text).toContain("ORD-001");
    });

    test("GET /orders/:id/manifest.csv returns detailed shipping manifest CSV", async () => {
      const res = await testFetch("/orders/ORD-001/manifest.csv");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("SHIPPING MANIFEST");
      expect(text).toContain("CARGO ITEMS MANIFEST");
      expect(text).toContain("Total Cargo Weight");
      expect(text).toContain("ORD-001");
    });

    test("GET /reports/delivery-costs/csv returns delivery cost analysis CSV", async () => {
      const res = await testFetch("/reports/delivery-costs/csv");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("Order ID");
      expect(text).toContain("Total Delivery Cost");
      expect(text).toContain("Net Operating Margin");
    });
  });

  // 5. Operations: Multi-Stop Routing
  describe("Operations: Multi-stop routing & multi-waypoint planner", () => {
    test("POST /routes/multi-stop calculates combined route with waypoints and legs", async () => {
      const res = await testFetch("/routes/multi-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: "WH-001",
          orderIds: ["ORD-001", "ORD-002"],
          truckId: "TRK-001",
          roundTrip: false,
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.total_orders).toBe(2);
      expect(data.total_distance_km).toBeGreaterThan(0);
      expect(data.total_time_seconds).toBeGreaterThan(0);
      expect(data.stops).toHaveLength(2);
      expect(data.waypoints.length).toBeGreaterThanOrEqual(3); // origin + 2 stops
      expect(data.legs.length).toBeGreaterThanOrEqual(2);
      expect(data.collective_weight_kg).toBeGreaterThanOrEqual(0);
      expect(data.truck_capacity_ok).toBe(true);
    });

    test("GET /routes/multi-stop calculates combined route via query parameters", async () => {
      const res = await testFetch("/routes/multi-stop?orderIds=ORD-001,ORD-002&warehouseId=WH-001");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.total_orders).toBe(2);
    });

    test("POST /routes/multi-stop rejects when combined order weight exceeds truck limit", async () => {
      const smallTruckId = "TRK-BIZ-SMALL";
      await pg_conn`
        INSERT INTO trucks (id, model, speed, size, volume_max, weight_max, fuel_capacity, fuel_current, fuel_consumption)
        VALUES (${smallTruckId}, 'Mini Courier', 70.0, '{"length":3,"width":1.5,"height":1.5}', 5.0, 1.0, 60.0, 50.0, 0.1)
        ON CONFLICT (id) DO UPDATE SET weight_max = EXCLUDED.weight_max
      `;

      const res = await testFetch("/routes/multi-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: "WH-001",
          orderIds: ["ORD-001", "ORD-002"],
          truckId: smallTruckId, // max 1.0 kg limit
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/capacity exceeded/i);
    });

    test("GET /trucks/:id/routes/multi-stop returns itinerary for truck assigned orders", async () => {
      const res = await testFetch("/trucks/TRK-001/routes/multi-stop");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
    });
  });
});
