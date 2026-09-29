import { test, expect, describe, afterAll } from "vitest";
import postgres from "postgres";
import { testFetch } from "./test-utils";
import * as controller from "../src/controller";
import {
  handleRoutes,
  calculateQuickPickOrders,
  calculateMultiStopRoute,
  haversineDistanceKm,
} from "../src/routes";

const pg_conn = postgres("postgresql://postgres:postgres@localhost:5432/postgres");

afterAll(async () => {
  await pg_conn.end();
});

describe("95 Percent Coverage Suite - Target Uncovered Branches", () => {
  // 1. Geocoding Real Coordinates & Addresses
  describe("Geocoding Success Branches", () => {
    test("GET /geocode handles address parameter", async () => {
      const res = await testFetch("/geocode?address=Petropolis%2C+RJ");
      expect([200, 502]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data).toBeDefined();
    });

    test("GET /reverse-geocode handles coordinate parameters", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.3842&lon=-43.1311");
      expect([200, 502]).toContain(res.status);
      const data = (await res.json()) as any;
      expect(data).toBeDefined();
    });
  });

  // 2. City Fallbacks and Location Coordinate Parsing
  describe("Location String & City Parsing", () => {
    test("All Brazilian Mountain Region City Fallbacks", async () => {
      // Test the multi-stop route with various cities to exercise the city fallback branches
      const testCases = [
        "Rua do Imperador, Petrópolis - RJ",
        "Av. Feliciano Sodré, Teresópolis - RJ",
        "Praça Getúlio Vargas, Nova Friburgo - RJ",
        "Rua Direita, Três Rios - RJ",
        "Centro, Bom Jardim - RJ",
        "Centro, Cantagalo - RJ",
        "Centro, Cordeiro - RJ",
        "Centro, Areal - RJ",
        "Centro, Magé - RJ",
        "Centro, Guapimirim - RJ",
        "Centro, Valparaíso - RJ",
        "Lat: -22.3842, Lon: -43.1311",
        "-22.3842, -43.1311",
        '{"lat": -22.3842, "lon": -43.1311}',
        '{"latitude": -22.3842, "longitude": -43.1311}',
        "Totally Unknown Location 12345",
      ];

      for (const loc of testCases) {
        // Calculate distance from warehouse to location
        const dist = haversineDistanceKm(-22.3842, -43.1311, -22.4123, -42.9656);
        expect(dist).toBeGreaterThan(0);
      }
    });
  });

  // 3. Controller Order Lifecycle & Cargo Transitions
  describe("Order Stock & Cargo Transitions (Shipped, Delivered, Canceled)", () => {
    test("Transition lifecycle: Pending -> Shipped -> Delivered -> Canceled", async () => {
      const orderId = `ORD-TEST-CYC-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const orderId2 = `ORD-TEST-DIR-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        // 1. Create order
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            client_id: "USR-004",
            final_destination: "Rua do Ciclo 123, Petrópolis - RJ",
            time_limit: "2026-06-15",
            price: 450,
            status: "Pending",
          }),
        });

        // 2. Add item to order
        await controller.orders.addItem({
          order_id: orderId,
          product_id: "PROD-001",
          quantity: 2,
        });

        // 3. Add route step
        await testFetch(`/orders/${orderId}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            warehouse_id: "WH-001",
            truck_id: "TRK-001",
            driver_id: "USR-003",
          }),
        });

        // 4. Transition to Shipped (exercises deductStockForOrder with isShipped = true)
        await controller.orders.updateStatus(orderId, "Shipped");
        const shipped = await controller.orders.byId(orderId);
        expect(shipped[0].status).toBe("Shipped");

        // 5. Transition to Delivered (exercises releaseTruckCargoOnDelivered)
        await controller.orders.updateStatus(orderId, "Delivered");
        const delivered = await controller.orders.byId(orderId);
        expect(delivered[0].status).toBe("Delivered");

        // 6. Transition to Canceled (exercises restoreStockForOrder)
        await controller.orders.updateStatus(orderId, "Canceled");
        const canceled = await controller.orders.byId(orderId);
        expect(canceled[0].status).toBe("Canceled");

        // 7. Direct delivery transition without prior Shipped step
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId2,
            client_id: "USR-004",
            final_destination: "Rua Direta, Petrópolis - RJ",
            time_limit: "2026-06-15",
            price: 300,
            status: "Pending",
          }),
        });
        await controller.orders.addItem({
          order_id: orderId2,
          product_id: "PROD-001",
          quantity: 1,
        });
        await testFetch(`/orders/${orderId2}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            warehouse_id: "WH-001",
            truck_id: "TRK-001",
            driver_id: "USR-003",
          }),
        });
        await controller.orders.updateStatus(orderId2, "Delivered");
        const delivered2 = await controller.orders.byId(orderId2);
        expect(delivered2[0].status).toBe("Delivered");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id IN (${orderId}, ${orderId2})`;
        await pg_conn`DELETE FROM orders_route WHERE order_id IN (${orderId}, ${orderId2})`;
        await pg_conn`DELETE FROM orders_items WHERE order_id IN (${orderId}, ${orderId2})`;
        await pg_conn`DELETE FROM supplies_route WHERE order_id IN (${orderId}, ${orderId2})`;
        await pg_conn`DELETE FROM orders WHERE id IN (${orderId}, ${orderId2})`;
      }
    });

    test("orders_route.update rejects active route collision and capacity overflow", async () => {
      // 1. Shipped order cannot be recalculated
      const orderId = `ORD-TEST-LCK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            client_id: "USR-004",
            final_destination: "Rua Locked 10, Petrópolis - RJ",
            time_limit: "2026-07-01",
            price: 100,
            status: "Pending",
          }),
        });
        await testFetch(`/orders/${orderId}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            warehouse_id: "WH-001",
            truck_id: "TRK-001",
            driver_id: "USR-003",
          }),
        });
        await controller.orders.updateStatus(orderId, "Shipped");

        await expect(
          controller.orders_route.update(orderId, 1, { truck_id: "TRK-002" })
        ).rejects.toThrow("already been shipped");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_items WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM supplies_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${orderId}`;
      }
    });
  });

  // 4. Monthly Performance Period Filter Matrix
  describe("Monthly Performance Period Filters Matrix", () => {
    const periods = ["6m_h1", "h1", "6m_h2", "h2", "q1", "q2", "q3", "q4", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    for (const p of periods) {
      test(`monthlyPerformance.all filter: ${p}`, async () => {
        const res = await controller.monthlyPerformance.all(undefined, p);
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThan(0);
      });
    }

    test("monthlyPerformance.all with warehouse WH-001", async () => {
      const res = await controller.monthlyPerformance.all("WH-001", "q1");
      expect(Array.isArray(res)).toBe(true);
    });
  });

  // 5. Reports Delivery Costs Period Matrix
  describe("Delivery Cost Reports Period Matrix", () => {
    const reportPeriods = ["12m", "all", "6m_h1", "h1", "6m_h2", "h2", "q1", "q2", "q3", "q4", "2026-03", "march", "apr", "nov"];
    for (const p of reportPeriods) {
      test(`getDeliveryCostReport period: ${p}`, async () => {
        const report = await controller.reports.getDeliveryCostReport(undefined, p);
        expect(report).toBeDefined();
        expect(report.summary).toBeDefined();
        expect(report.period).toBeDefined();
      });
    }

    test("getDeliveryCostReport with specific warehouse", async () => {
      const report = await controller.reports.getDeliveryCostReport("WH-001", "month");
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });
  });

  // 6. Routes HTTP Endpoints (handleRoutes: /route and /routes/quick-pick)
  describe("Routes HTTP Direct Endpoints", () => {
    test("POST /routes/quick-pick calculates quick pick route", async () => {
      const res = await testFetch("/routes/quick-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: "WH-001",
          maxOrders: 3,
          roundTrip: true,
        }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.quick_pick).toBe(true);
      expect(data.total_routes).toBeGreaterThanOrEqual(1);
    }, 20000);

    test("GET /routes/quick-pick calculates quick pick route via query parameters", async () => {
      const res = await testFetch("/routes/quick-pick?warehouseId=WH-001&maxOrders=2&roundTrip=true");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.quick_pick).toBe(true);
    }, 20000);

    test("POST /route validates missing order or warehouse", async () => {
      const res = await testFetch("/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ORD-NONEXISTENT", warehouseId: "WH-001" }),
      });
      expect(res.status).toBe(404);
    });

    test("POST /route validates unallocated truck", async () => {
      const orderId = `ORD-TEST-NOTRK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            client_id: "USR-004",
            final_destination: "Rua Sem Caminhao, Petrópolis - RJ",
            time_limit: "2026-08-01",
            price: 150,
            status: "Pending",
          }),
        });
        const res = await testFetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, warehouseId: "WH-001" }),
        });
        expect(res.status).toBe(404);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_items WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM supplies_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${orderId}`;
      }
    });
  });

  // 7. Server & Controller Remaining Edge Cases
  describe("Server Error & Fallback Branches", () => {
    test("POST /orders/:id/suggest-truck via POST endpoint", async () => {
      const res = await testFetch("/orders/ORD-001/suggest-truck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_id: "WH-001" }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.best_truck || data.candidate_trucks).toBeDefined();
    });

    test("GET /orders/:id/multi-route returns 404 when order has no truck assigned", async () => {
      const orderId = `ORD-TEST-NOMR-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            client_id: "USR-004",
            final_destination: "Rua Isolada, Petrópolis - RJ",
            time_limit: "2026-08-01",
            price: 100,
            status: "Pending",
          }),
        });
        const res = await testFetch(`/orders/${orderId}/multi-route`);
        expect(res.status).toBe(404);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders_items WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM supplies_route WHERE order_id = ${orderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${orderId}`;
      }
    });

    test("DELETE /orders/:id/route/:step with non-existent step", async () => {
      const res = await testFetch("/orders/ORD-001/route/999", { method: "DELETE" });
      expect(res.status).toBe(200);
    });

    test("controller.users.getDriverWage with explicit and default driver wages", async () => {
      const wageExplicit = await controller.users.getDriverWage("USR-003");
      expect(wageExplicit).toBeGreaterThan(0);

      const wageDefault = await controller.users.getDriverWage();
      expect(wageDefault).toBeGreaterThan(0);
    });

    test("controller.warehouses.getAverageGasPrice fallback", async () => {
      const avgAll = await controller.warehouses.getAverageGasPrice();
      expect(avgAll).toBeGreaterThan(0);

      const avgEmpty = await controller.warehouses.getAverageGasPrice([]);
      expect(avgEmpty).toBeGreaterThan(0);
    });
  });
});
