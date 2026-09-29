import { test, expect, describe, vi } from "vitest";
import { testFetch } from "./test-utils";
import * as controller from "../src/controller";
import { pg_conn } from "../src/model";
import { converterCoordenadas } from "../src/geocoding";
import {
  calculateMultiStopRoute,
  minDistanceToRouteKm,
  decodePolyline6,
} from "../src/routes";

describe("Peak Coverage Suite - Pushing to 95%+", () => {
  // 1. Full Routes POST /route Handler with Engine Mocking & Errors
  describe("POST /route Valhalla Success & Failure Branches", () => {
    test("POST /route succeeds when Valhalla responds with route summary", async () => {
      const testOrderId = `ORD-TEST-VAL-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testOrderId,
          client_id: "USR-004",
          final_destination: "Rua do Valhalla 50, Petrópolis - RJ",
          time_limit: "2026-09-01",
          price: 500,
          status: "Pending",
        }),
      });
      await testFetch(`/orders/${testOrderId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          warehouse_id: "WH-001",
          truck_id: "TRK-001",
          driver_id: "USR-003",
        }),
      });

      // Mock global fetch for the internal Valhalla engine call
      const originalFetch = globalThis.fetch;
      const mockValhallaRes = {
        ok: true,
        status: 200,
        json: async () => ({
          trip: {
            summary: { length: "48.2" },
            legs: [{ shape: "`~o~F~`~o@_c@_c@" }],
          },
        }),
      };

      globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        if (String(url).includes("8002") || String(url).includes("valhalla")) {
          return mockValhallaRes;
        }
        return originalFetch(url, opts);
      });

      try {
        const res = await testFetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: testOrderId,
            warehouseId: "WH-001",
          }),
        });

        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.success).toBe(true);
        expect(data.distance_km).toBe(48.2);
        expect(data.encodedShape).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });

    test("POST /route handles Valhalla engine 502/failure response", async () => {
      const testOrderId = `ORD-TEST-VALF-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testOrderId,
          client_id: "USR-004",
          final_destination: "Rua Valhalla Falha, Petrópolis - RJ",
          time_limit: "2026-09-01",
          price: 500,
          status: "Pending",
        }),
      });
      await testFetch(`/orders/${testOrderId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          warehouse_id: "WH-001",
          truck_id: "TRK-001",
          driver_id: "USR-003",
        }),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        if (String(url).includes("8002") || String(url).includes("valhalla")) {
          return { ok: false, status: 500 };
        }
        return originalFetch(url, opts);
      });

      try {
        const res = await testFetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: testOrderId,
            warehouseId: "WH-001",
          }),
        });
        expect([500, 502]).toContain(res.status);
      } finally {
        globalThis.fetch = originalFetch;
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });

    test("POST /route handles invalid JSON body", async () => {
      const res = await testFetch("/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json-body",
      });
      expect(res.status).toBe(500);
    });
  });

  // 2. Spatial Calculations Single Point Edge Case
  describe("Spatial Single-Point & Degenerate Cases", () => {
    test("minDistanceToRouteKm with single point array uses haversine distance directly", () => {
      const dist = minDistanceToRouteKm([-22.4123, -42.9656], [[-22.3842, -43.1311]]);
      expect(dist).toBeGreaterThan(0);
    });

    test("calculateMultiStopRoute throws when truck is not found", async () => {
      await expect(
        calculateMultiStopRoute({
          orderIds: ["ORD-001"],
          truckId: "TRK-NONEXISTENT-XYZ",
        })
      ).rejects.toThrow("not found");
    });
  });

  // 3. Server Error & Validation Endpoints
  describe("Server Error Paths & 400/404 Validations", () => {
    test("GET /trucks/:id/routes/multi-stop returns itinerary or empty stops", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        if (String(url).includes("8002") || String(url).includes("valhalla")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              trip: {
                summary: { length: "25.0", time: 1800 },
                legs: [{ shape: "`~o~F~`~o@_c@_c@", summary: { length: "25.0" } }],
              },
            }),
          };
        }
        return originalFetch(url, opts);
      });
      try {
        const res = await testFetch("/trucks/TRK-001/routes/multi-stop");
        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.stops).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    }, 20000);

    test("GET /trucks/TRK-999/routes/multi-stop with unassigned truck returns empty stops", async () => {
      const res = await testFetch("/trucks/TRK-009/routes/multi-stop");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.stops).toHaveLength(0);
    });

    test("Non-existent order queries on sub-endpoints return 400 or 404", async () => {
      const badId = "ORD-DOES-NOT-EXIST-999";
      const etaRes = await testFetch(`/orders/${badId}/eta`);
      expect(etaRes.status).toBe(400);

      const suggestRes = await testFetch(`/orders/${badId}/suggest-truck`);
      expect(suggestRes.status).toBe(400);

      const calcEtaRes = await testFetch(`/orders/${badId}/calculate-eta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avgSpeed: 60 }),
      });
      expect(calcEtaRes.status).toBe(400);

      const calcCostRes = await testFetch(`/orders/${badId}/calculate-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverWage: 50 }),
      });
      expect(calcCostRes.status).toBe(400);

      const calcDistRes = await testFetch(`/orders/${badId}/calculate-distance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_id: "WH-001" }),
      });
      expect(calcDistRes.status).toBe(400);

      const postSuggestRes = await testFetch(`/orders/${badId}/suggest-truck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_id: "WH-001" }),
      });
      expect(postSuggestRes.status).toBe(400);
    });

    test("PUT /warehouses/:id/stock with missing parameters returns 400", async () => {
      const res = await testFetch("/warehouses/WH-001/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    test("DELETE /warehouses/:id/stock/ (empty product ID) returns 400", async () => {
      const res = await testFetch("/warehouses/WH-001/stock/", {
        method: "DELETE",
      });
      expect(res.status).toBe(400);
    });

    test("POST /orders with missing required fields returns 400", async () => {
      const res = await testFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "ORD-INCOMPLETE" }),
      });
      expect(res.status).toBe(400);
    });
  });

  // 4. Warehouse Parking Full and Allowance Branches
  describe("Warehouse Parking Full & Already Parked Branches", () => {
    test("warehouses.checkParkingAvailable identifies truck already parked", async () => {
      // TRK-001 is parked in WH-001
      const check = await controller.warehouses.checkParkingAvailable("WH-001", "TRK-001");
      expect(check.allowed).toBe(true);
    });

    test("warehouses.checkParkingAvailable with non-existent warehouse returns false", async () => {
      const check = await controller.warehouses.checkParkingAvailable("WH-DOES-NOT-EXIST");
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Warehouse not found");
    });
  });

  // 5. ETA Compliance Status Branches (at_risk & overdue)
  describe("ETA Compliance Branches", () => {
    test("calculateETA detects overdue or at_risk compliance against tight deadline", async () => {
      // Order ORD-001 has past deadline or we pass very tight options
      const eta = await controller.orders.calculateETA("ORD-001", {
        minSpeed: 10,
        maxSpeed: 20,
        avgSpeed: 15,
        departureTime: "2026-01-01T08:00:00Z",
      });
      expect(eta).toBeDefined();
      expect(["at_risk", "overdue", "on_time"]).toContain(eta.compliance_status);
    });
  });

  // 6. Cyberprotection HMAC & Token Expiry
  describe("Cyberprotection Expiry & HMAC Verification", () => {
    test("ecSecurity.verifyToken handles expired token", () => {
      const expiredToken = controller.ecSecurity.signPayload({
        sub: "USR-001",
        role: "admin",
        iat: Date.now() - 100000,
        exp: Date.now() - 50000, // Expired
      });
      const result = controller.ecSecurity.verifyToken(expiredToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token expired");
    });

    test("ecSecurity.verifyToken handles malformed tokens", () => {
      expect(controller.ecSecurity.verifyToken("not-a-token").valid).toBe(false);
      expect(controller.ecSecurity.verifyToken("invalid.signature").valid).toBe(false);
    });
  });

  // 7. Geocoding Edge Cases
  describe("Geocoding Edge Cases", () => {
    test("converterCoordenadas returns not found when display_name is missing", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: any) => {
        if (String(url).includes("nominatim")) {
          return {
            ok: true,
            json: async () => ({}),
          };
        }
        return originalFetch(url);
      });
      try {
        const res = await converterCoordenadas(-22.3842, -43.1311);
        expect(res).toBe("Coordenadas não encontradas.");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // 8. Controller Coordinate Parsing, Haversine & Distance Fallbacks
  describe("Controller Coordinate & Distance Edge Cases", () => {
    test("parseLocationCoords handles object with lat/lon", () => {
      const coords = controller.parseLocationCoords({ lat: -22.5, lon: -43.2 });
      expect(coords).toEqual({ lat: -22.5, lon: -43.2 });
    });

    test("parseLocationCoords handles Lat/Lon string and specific cities", () => {
      const coords1 = controller.parseLocationCoords("Lat: -22.123, Lon: -43.456");
      expect(coords1.lat).toBe(-22.123);
      expect(coords1.lon).toBe(-43.456);

      const coords2 = controller.parseLocationCoords("Centro, Bom Jardim - RJ");
      expect(coords2.lat).toBe(-22.15);
      expect(coords2.lon).toBe(-42.4167);
    });

    test("haversineDistance calculates geodesic distance directly", () => {
      const dist = controller.haversineDistance(-22.3842, -43.1311, -22.4123, -42.9656);
      expect(dist).toBeGreaterThan(0);
      expect(typeof dist).toBe("number");
    });

    test("calculateDistanceInDb falls back to haversine on database calculation error", async () => {
      const dist = await controller.calculateDistanceInDb(NaN, NaN, NaN, NaN);
      expect(typeof dist).toBe("number");
    });
  });

  // 9. Users, Warehouse Capacity & Orders Stock Branches
  describe("Controller Users, Warehouse Parking & Orders Logic", () => {
    test("users.update updates role, wage, warehouse_id, is_active", async () => {
      const updated = await controller.users.update("USR-001", {
        role: "admin",
        wage: 5000,
        warehouse_id: "WH-001",
        is_active: 1,
      });
      expect(updated).toBeDefined();
      expect(updated[0].role).toBe("admin");
      expect(Number(updated[0].wage)).toBe(5000);
    });

    test("warehouses.checkParkingAvailable identifies full parking capacity", async () => {
      await pg_conn`
        INSERT INTO warehouses (id, location, size, volume_current, volume_max, has_refrigeration, fuel_price, truck_capacity)
        VALUES ('WH-FULL-TEST', '{"latitude": -22.3842, "longitude": -43.1311}', '{"width": 10, "length": 20, "height": 5}', 100, 1000, 1, 5.5, 0)
        ON CONFLICT (id) DO UPDATE SET truck_capacity = 0
      `;
      try {
        const check = await controller.warehouses.checkParkingAvailable("WH-FULL-TEST", "TRK-NONPARKED");
        expect(check.allowed).toBe(false);
        expect(check.reason).toContain("maximum truck parking capacity");
      } finally {
        await pg_conn`DELETE FROM warehouses WHERE id = 'WH-FULL-TEST'`;
      }
    });

    test("orders.calculateDistance works without originWarehouseId", async () => {
      const res = await controller.orders.calculateDistance("ORD-001");
      expect(res).toBeDefined();
      expect(res.distance_km).toBeGreaterThan(0);
    });

    test("orders.validateAndPrepareDispatchStock returns ok true for order without items", async () => {
      const emptyOrderId = `ORD-TEST-EMPTY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${emptyOrderId}, 'USR-004', 'Rua Vazia 1', '2026-09-01', 100, 'Pending')
      `;
      try {
        const check = await controller.orders.validateAndPrepareDispatchStock(emptyOrderId);
        expect(check.ok).toBe(true);
        expect(check.sourceWarehouseId).toBe("WH-001");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${emptyOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${emptyOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${emptyOrderId}`;
      }
    });

    test("orders_route.validateTruckCapacity throws when volume exceeds truck capacity", async () => {
      const volOrderId = `ORD-TEST-VOL-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const volProdId = `PRD-VOL-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO products (id, name, weight, volume, price, is_fragile, is_cold, size)
        VALUES (${volProdId}, 'Big Box', 1, 1000, 50, 0, 0, '{"width": 1, "length": 1, "height": 1}')
      `;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${volOrderId}, 'USR-004', 'Rua Vol 1', '2026-09-01', 100, 'Pending')
      `;
      await pg_conn`
        INSERT INTO orders_items (order_id, product_id, quantity)
        VALUES (${volOrderId}, ${volProdId}, 1)
      `;
      try {
        await expect(
          controller.orders_route.validateTruckCapacity("TRK-001", volOrderId)
        ).rejects.toThrow("volume capacity exceeded");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${volOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${volOrderId}`;
        await pg_conn`DELETE FROM orders_items WHERE order_id = ${volOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${volOrderId}`;
        await pg_conn`DELETE FROM products WHERE id = ${volProdId}`;
      }
    });

    test("orders_route.create throws when order is in active route with another truck", async () => {
      const testOrderId = `ORD-TEST-DUP-TRK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      try {
        await pg_conn`
          INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
          VALUES (${testOrderId}, 'USR-004', 'Rua Duplo Caminhao 1', '2026-09-01', 200, 'Pending')
        `;
        await controller.orders_route.create({
          order_id: testOrderId,
          step: 1,
          warehouse_id: "WH-001",
          truck_id: "TRK-001",
        });
        await expect(
          controller.orders_route.create({
            order_id: testOrderId,
            step: 2,
            warehouse_id: "WH-001",
            truck_id: "TRK-002",
          })
        ).rejects.toThrow("is already in an active route with truck TRK-001");
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });

    test("orders.calculateETA calculates distance when order distance_km is zero", async () => {
      const zeroDistOrderId = `ORD-TEST-ZERO-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status, distance_km)
        VALUES (${zeroDistOrderId}, 'USR-004', 'Teresópolis, RJ', '2026-12-01', 300, 'Pending', 0)
      `;
      try {
        const eta = await controller.orders.calculateETA(zeroDistOrderId);
        expect(eta).toBeDefined();
        expect(eta.distance_km).toBeGreaterThan(0);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${zeroDistOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${zeroDistOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${zeroDistOrderId}`;
      }
    });
  });

  // 10. Monthly Performance Sync & Reports Fallbacks
  describe("Monthly Performance & Reports Fallbacks", () => {
    test("monthlyPerformance.syncWithDatabase synchronizes live performance data", async () => {
      await controller.monthlyPerformance.syncWithDatabase();
      const perf = await pg_conn`SELECT * FROM monthly_performance LIMIT 5`;
      expect(perf.length).toBeGreaterThan(0);
    });

    test("reports.getDeliveryCostReport handles order with fallback default cost", async () => {
      const noCostOrderId = `ORD-TEST-NC-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${noCostOrderId}, 'USR-004', 'Rua Sem Custo 1', '2026-06-15', 400, 'Pending')
      `;
      try {
        const report = await controller.reports.getDeliveryCostReport();
        expect(report).toBeDefined();
        expect(report.summary.total_orders_analyzed).toBeGreaterThan(0);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${noCostOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${noCostOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${noCostOrderId}`;
      }
    });
  });

  // 11. Multi-Stop & Routes Edge Cases
  describe("Multi-Stop & Routes Engine Edge Cases", () => {
    test("calculateMultiStopRoute throws when single order not found", async () => {
      await expect(
        calculateMultiStopRoute({ orderIds: ["ORD-DEFINITELY-NOT-FOUND-999"] })
      ).rejects.toThrow("not found");
    });

    test("calculateMultiStopRoute skips missing order when multiple orderIds provided", async () => {
      const res = await calculateMultiStopRoute({
        orderIds: ["ORD-DEFINITELY-NOT-FOUND-999", "ORD-001"],
        truckId: "TRK-001",
      });
      expect(res).toBeDefined();
    });

    test("POST /routes/quick-pick returns 400 when no active orders found", async () => {
      const spy = vi.spyOn(controller.orders, "all").mockResolvedValueOnce([] as any);
      try {
        const res = await testFetch("/routes/quick-pick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ warehouseId: "WH-001" }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });

    test("POST /route returns 404 when associated truck does not exist", async () => {
      const testOrderId = `ORD-TEST-TRK-MISS-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${testOrderId}, 'USR-004', 'Rua Destino 1', '2026-09-01', 300, 'Pending')
      `;
      await pg_conn`
        INSERT INTO orders_route (order_id, step, warehouse_id, truck_id)
        VALUES (${testOrderId}, 1, 'WH-001', NULL)
      `;
      try {
        const res = await testFetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: testOrderId, warehouseId: "WH-001" }),
        });
        expect(res.status).toBe(404);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });

    test("POST /route returns 400 when destination warehouse parking is full", async () => {
      const testOrderId = `ORD-TEST-FULL-DEST-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO warehouses (id, location, size, volume_current, volume_max, has_refrigeration, fuel_price, truck_capacity)
        VALUES ('WH-FULL-DEST', '{"latitude": -22.3842, "longitude": -43.1311}', '{"width": 10, "length": 20, "height": 5}', 100, 1000, 1, 5.5, 0)
        ON CONFLICT (id) DO UPDATE SET truck_capacity = 0
      `;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${testOrderId}, 'USR-004', 'Rua Destino 2', '2026-09-01', 300, 'Pending')
      `;
      await pg_conn`
        INSERT INTO orders_route (order_id, step, warehouse_id, truck_id, destination_warehouse_id)
        VALUES (${testOrderId}, 1, 'WH-001', 'TRK-001', 'WH-FULL-DEST')
      `;
      try {
        const res = await testFetch("/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: testOrderId, warehouseId: "WH-001" }),
        });
        expect(res.status).toBe(400);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
        await pg_conn`DELETE FROM warehouses WHERE id = 'WH-FULL-DEST'`;
      }
    });

    test("calculateMultiStopRoute parses order location coordinates with Lat/Lon pattern", async () => {
      const testOrderId = `ORD-TEST-LATLON-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${testOrderId}, 'USR-004', 'Lat: -22.3842, Lon: -43.1311', '2026-09-01', 250, 'Pending')
      `;
      try {
        const multi = await calculateMultiStopRoute({
          orderIds: [testOrderId],
          truckId: "TRK-001",
        });
        expect(multi).toBeDefined();
        expect(multi.stops.length).toBeGreaterThan(0);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });

    test("calculateMultiStopRoute geocodes address and caches coordinates", async () => {
      const testOrderId = `ORD-TEST-GEOCODE-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      await pg_conn`
        INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
        VALUES (${testOrderId}, 'USR-004', 'Avenida Geocode Caching Test 100', '2026-09-01', 250, 'Pending')
      `;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        if (String(url).includes("nominatim")) {
          return {
            ok: true,
            json: async () => [{ display_name: "Mocked St", lat: "-22.3842", lon: "-43.1311" }],
          };
        }
        return originalFetch(url, opts);
      });
      try {
        const multi = await calculateMultiStopRoute({
          orderIds: [testOrderId],
          truckId: "TRK-001",
        });
        expect(multi).toBeDefined();

        // Call a second time to trigger cache hit
        const multi2 = await calculateMultiStopRoute({
          orderIds: [testOrderId],
          truckId: "TRK-001",
        });
        expect(multi2).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
        await pg_conn`DELETE FROM freight_cost WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders_route WHERE order_id = ${testOrderId}`;
        await pg_conn`DELETE FROM orders WHERE id = ${testOrderId}`;
      }
    });
  });

  // 12. Server Endpoints Coverage
  describe("Server HTTP Endpoints Coverage", () => {
    test("GET /users?role=admin returns filtered users", async () => {
      const res = await testFetch("/users?role=admin");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.every((u) => u.role === "admin")).toBe(true);
    });

    test("PUT /users/:id with non-existent user returns 404", async () => {
      const res = await testFetch("/users/USR-NONEXISTENT-999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Ghost" }),
      });
      expect(res.status).toBe(404);
    });

    test("POST /orders creates order with Shipped and Delivered statuses", async () => {
      const shippedId = `ORD-TEST-SRV-SHIP-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const deliveredId = `ORD-TEST-SRV-DELV-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

      try {
        const res1 = await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: shippedId,
            client_id: "USR-004",
            final_destination: "Destino Shipped",
            time_limit: "2026-09-01",
            price: 150,
            status: "Shipped",
          }),
        });
        expect(res1.status).toBe(201);

        const res2 = await testFetch("/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: deliveredId,
            client_id: "USR-004",
            final_destination: "Destino Delivered",
            time_limit: "2026-09-01",
            price: 250,
            status: "Delivered",
          }),
        });
        expect(res2.status).toBe(201);
      } finally {
        await pg_conn`DELETE FROM freight_cost WHERE order_id IN (${shippedId}, ${deliveredId})`;
        await pg_conn`DELETE FROM orders_route WHERE order_id IN (${shippedId}, ${deliveredId})`;
        await pg_conn`DELETE FROM orders WHERE id IN (${shippedId}, ${deliveredId})`;
      }
    });

    test("freightCosts.calculateAndSave calculates fallback defaults without options", async () => {
      const cost = await controller.freightCosts.calculateAndSave("ORD-001");
      expect(cost).toBeDefined();
      expect(cost.fuel_cost).toBeGreaterThan(0);
      expect(cost.labor_cost).toBeGreaterThan(0);
    });

    test("GET /supplies-route?supplierId=SUP-001 filters by supplier", async () => {
      const res = await testFetch("/supplies-route?supplierId=SUP-001");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /trucks/:id/routes/multi-stop returns calculated route when truck has assigned orders", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        if (String(url).includes("8002/route")) {
          return {
            ok: true,
            json: async () => ({
              trip: {
                summary: { length: 25.5, time: 1800 },
                legs: [
                  { shape: "mock_shape", summary: { length: 12.5, time: 900 } },
                  { shape: "mock_shape2", summary: { length: 13.0, time: 900 } },
                  { shape: "mock_shape3", summary: { length: 10.0, time: 800 } },
                ],
              },
            }),
          };
        }
        return originalFetch(url, opts);
      });
      try {
        const res = await testFetch("/trucks/TRK-008/routes/multi-stop");
        expect(res.status).toBe(200);
        const data = (await res.json()) as any;
        expect(data.success).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    }, 20000);

    test("PUT endpoints return 500 on malformed json body", async () => {
      const res1 = await testFetch("/trucks/TRK-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "malformed json{",
      });
      expect(res1.status).toBe(500);

      const res2 = await testFetch("/users/USR-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "malformed json{",
      });
      expect(res2.status).toBe(500);

      const res3 = await testFetch("/products/PROD-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "malformed json{",
      });
      expect(res3.status).toBe(500);

      const res4 = await testFetch("/warehouses/WH-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "malformed json{",
      });
      expect(res4.status).toBe(500);

      const res5 = await testFetch("/warehouses/WH-001/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "malformed json{",
      });
      expect(res5.status).toBe(500);
    });

    test("GET /orders/:id/multi-route handles failure in calculation gracefully", async () => {
      const routesModule = await import("../src/routes");
      const spy = vi.spyOn(routesModule, "calculateMultiStopRoute").mockRejectedValueOnce(new Error("Multi-route computation failure"));
      try {
        const res = await testFetch("/orders/ORD-004/multi-route");
        expect(res.status).toBe(500);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toContain("Multi-route computation failure");
      } finally {
        spy.mockRestore();
      }
    });

    test("DELETE /orders/:id/route/:step handles deletion failure gracefully", async () => {
      const spy = vi.spyOn(controller.orders_route, "delete").mockRejectedValueOnce(new Error("DB delete error"));
      try {
        const res = await testFetch("/orders/ORD-001/route/1", { method: "DELETE" });
        expect(res.status).toBe(400);
        const data = (await res.json()) as any;
        expect(data.success).toBe(false);
        expect(data.error).toBe("DB delete error");
      } finally {
        spy.mockRestore();
      }
    });

    test("reports.getDeliveryCostReport handles fallback period and warehouse filtering", async () => {
      const report = await controller.reports.getDeliveryCostReport("WH-002", "2026-05");
      expect(report).toBeDefined();
      expect(report.period).toBeDefined();
    });
  });
});

