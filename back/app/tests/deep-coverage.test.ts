import { test, expect, describe, afterAll } from "vitest";
import postgres from "postgres";
import { testFetch } from "./test-utils";
import * as controller from "../src/controller";
import {
  calculateMultiStopRoute,
  calculateQuickPickOrders,
  haversineDistanceKm,
  distancePointToSegmentKm,
  minDistanceToRouteKm,
  decodePolyline6,
} from "../src/routes";

const pg_conn = postgres("postgresql://postgres:postgres@localhost:5432/postgres");

afterAll(async () => {
  await pg_conn.end();
});

describe("Deep Coverage Suite - Edge Cases & Handlers", () => {
  // 1. Order Route Steps Lifecycle (POST, PUT, DELETE)
  describe("Order Route Steps API", () => {
    test("POST /orders/:id/route, PUT /orders/:id/route/:step, DELETE /orders/:id/route/:step", async () => {
      const orderId = `ORD-TEST-DCOV-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        // Create test order first
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            client_id: "USR-004",
            final_destination: "Rua Teste 100, Petrópolis - RJ",
            time_limit: "2026-06-01",
            price: 250,
            status: "Pending",
          }),
        });

        const stepNum = 1;

        // 1. Create a route step
        const postRes = await testFetch(`/orders/${orderId}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: stepNum,
            warehouse_id: "WH-001",
            truck_id: "TRK-001",
            driver_id: "USR-003",
            destination_warehouse_id: "WH-002",
          }),
        });
        expect(postRes.status).toBe(201);
        const postData = (await postRes.json()) as any;
        expect(postData.success).toBe(true);
        expect(postData.route.step).toBe(stepNum);

        // 2. Update the route step
        const putRes = await testFetch(`/orders/${orderId}/route/${stepNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination_warehouse_id: "WH-003",
          }),
        });
        expect(putRes.status).toBe(200);
        const putData = (await putRes.json()) as any;
        expect(putData.success).toBe(true);

        // 3. Delete the route step
        const delRes = await testFetch(`/orders/${orderId}/route/${stepNum}`, {
          method: "DELETE",
        });
        expect(delRes.status).toBe(200);
        const delData = (await delRes.json()) as any;
        expect(delData.success).toBe(true);

        // 4. Update order status
        const statusRes = await testFetch(`/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Shipped" }),
        });
        expect(statusRes.status).toBe(200);
        const statusData = (await statusRes.json()) as any;
        expect(statusData.success).toBe(true);
        expect(statusData.order.status).toBe("Shipped");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_items WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM supplies_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${orderId}`;
      }
    });

    test("PUT /orders/:id validates invalid status", async () => {
      const res = await testFetch("/orders/ORD-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "InvalidStatusXYZ" }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });
  });

  // 2. Warehouse Stock Deletion & Empty ID validation
  describe("Warehouse & Resource Edge Cases", () => {
    test("DELETE /warehouses/:id/stock/:productId deletes stock record", async () => {
      // First ensure a record exists
      await testFetch("/warehouses/WH-003/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: "PROD-004", quantity: 5 }),
      });

      const delRes = await testFetch("/warehouses/WH-003/stock/PROD-004", {
        method: "DELETE",
      });
      expect(delRes.status).toBe(200);
      const data = (await delRes.json()) as any;
      expect(data.success).toBe(true);
    });

    test("GET /products/ (empty ID) returns 400", async () => {
      const res = await testFetch("/products/");
      expect(res.status).toBe(400);
    });

    test("GET /warehouses/ (empty ID) returns 400", async () => {
      const res = await testFetch("/warehouses/");
      expect(res.status).toBe(400);
    });
  });

  // 3. Reports & Analytics Period and Warehouse Filters
  describe("Reports & Analytics Filters", () => {
    test("GET /reports/delivery-costs with warehouseId and period filters", async () => {
      const resWeek = await testFetch("/reports/delivery-costs?period=week&warehouseId=WH-001");
      expect(resWeek.status).toBe(200);
      const dataWeek = (await resWeek.json()) as any;
      expect(dataWeek.period).toBe("week");
      expect(dataWeek.orders).toBeDefined();

      const resMonth = await testFetch("/reports/delivery-costs?period=month");
      expect(resMonth.status).toBe(200);

      const resYear = await testFetch("/reports/delivery-costs?period=year");
      expect(resYear.status).toBe(200);
    });

    test("GET /monthly-performance with warehouseId and period filters", async () => {
      const res = await testFetch("/monthly-performance?period=month&warehouseId=WH-001");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /reports/delivery-costs/csv generates downloadable CSV report with filters", async () => {
      const res = await testFetch("/reports/delivery-costs/csv?period=month&warehouseId=WH-001");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const csv = await res.text();
      expect(csv).toContain("Order ID");
      expect(csv).toContain("Net Operating Margin");
    });
  });

  // 4. Multi-Stop & Quick Pick Edge Cases & Validation
  describe("Routes Multi-Stop Validation", () => {
    test("POST /routes/multi-stop without orderIds returns 400", async () => {
      const res = await testFetch("/routes/multi-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [] }),
      });
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain("At least one orderId is required");
    });

    test("GET /routes/multi-stop without orderIds returns 400", async () => {
      const res = await testFetch("/routes/multi-stop");
      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
    });

    test("calculateMultiStopRoute throws on duplicate order IDs", async () => {
      await expect(
        calculateMultiStopRoute({
          orderIds: ["ORD-001", "ORD-001"],
        })
      ).rejects.toThrow("Duplicate orders detected");
    });

    test("calculateMultiStopRoute throws on empty orderIds array", async () => {
      await expect(
        calculateMultiStopRoute({
          orderIds: [],
        })
      ).rejects.toThrow("At least one orderId is required");
    });

    test("calculateQuickPickOrders handles custom anchor order", async () => {
      const result = await calculateQuickPickOrders({
        warehouseId: "WH-001",
        maxOrders: 2,
        anchorOrderId: "ORD-001",
        roundTrip: true,
      });
      expect(result).toBeDefined();
      expect(result.quick_pick).toBe(true);
      expect(result.selected_order_ids.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Geometric, Polyline and Spatial Calculations
  describe("Spatial & Routing Math Calculations", () => {
    test("decodePolyline6 accurately decodes Valhalla precision 6 polyline", () => {
      // Known polyline for Petropolis to Teresopolis points
      const points = decodePolyline6("`~o~F~`~o@_c@_c@");
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
      expect(typeof points[0][0]).toBe("number");
      expect(typeof points[0][1]).toBe("number");
    });

    test("distancePointToSegmentKm computes distance to segment correctly", () => {
      // Point directly perpendicular to a horizontal segment
      const dist = distancePointToSegmentKm(
        [-22.385, -43.131],
        [-22.384, -43.135],
        [-22.384, -43.125]
      );
      expect(dist).toBeGreaterThan(0);
      expect(dist).toBeLessThan(1.0);
    });

    test("minDistanceToRouteKm correctly identifies closest point along route corridor", () => {
      const corridor: [number, number][] = [
        [-22.3842, -43.1311],
        [-22.3900, -43.1000],
        [-22.4000, -43.0500],
        [-22.4123, -42.9656],
      ];
      // Target point close to first leg
      const dist = minDistanceToRouteKm([-22.3850, -43.1300], corridor);
      expect(dist).toBeGreaterThanOrEqual(0);
      expect(dist).toBeLessThan(1.0);
    });

    test("haversineDistanceKm returns 0 for identical coordinates", () => {
      const dist = haversineDistanceKm(-22.4123, -42.9656, -22.4123, -42.9656);
      expect(dist).toBe(0);
    });
  });

  // 6. Direct Controller Freight Cost Calculation
  describe("Freight Cost Calculations", () => {
    test("freightCosts.calculateAndSave calculates fuel, labor, and maintenance accurately", async () => {
      const cost = await controller.freightCosts.calculateAndSave("ORD-001", {
        driverWage: 60.0,
        fuelPrice: 6.1,
        distanceKm: 45.0,
      });
      expect(cost).toBeDefined();
      expect(cost.fuel_cost).toBeGreaterThan(0);
      expect(cost.labor_cost).toBeGreaterThan(0);
      expect(cost.total_cost).toBeCloseTo(cost.fuel_cost + cost.labor_cost + cost.maintenance_cost, 2);
    });
  });
});
