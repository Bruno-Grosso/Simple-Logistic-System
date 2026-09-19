import { test, expect, describe } from "vitest";
import * as controller from "../src/controller";
import {
  haversineDistanceKm,
  distancePointToSegmentKm,
  minDistanceToRouteKm,
  decodePolyline6,
  calculateQuickPickOrders,
} from "../src/routes";

describe("Backend Unit Tests - Controller & Model Logic", () => {
  // 1. Identity & User Unit Tests
  describe("Users Controller", () => {
    test("users.login: authenticates with valid email and password", async () => {
      const result = await controller.users.login("alice@logisys.com", "admin123");
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("USR-001");
      expect(result?.user.name).toBe("Alice Admin");
      expect(result?.user.role).toBe("admin");
      expect(result?.token).toBeDefined();
    });

    test("users.login: authenticates with user ID prefix", async () => {
      const result = await controller.users.login("USR-002", "bobpass");
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe("USR-002");
      expect(result?.user.role).toBe("warehouse_worker");
    });

    test("users.login: rejects invalid password", async () => {
      const result = await controller.users.login("alice@logisys.com", "wrongpassword");
      expect(result).toBeNull();
    });

    test("users.login: rejects non-existent user", async () => {
      const result = await controller.users.login("unknown@logisys.com", "pass123");
      expect(result).toBeNull();
    });

    test("users.byRole: filters users correctly", async () => {
      const drivers = await controller.users.byRole("truck_driver");
      expect(Array.isArray(drivers)).toBe(true);
      expect(drivers.every((u: any) => u.role === "truck_driver")).toBe(true);
    });

    test("users.update: updates user name and address", async () => {
      const updated = await controller.users.update("USR-004", {
        name: "David Client Updated",
        address: "Av. Reta da Várzea 500, Teresópolis - RJ",
      });
      expect(updated[0].name).toBe("David Client Updated");

      // Revert change
      await controller.users.update("USR-004", {
        name: "David Client",
        address: "Av. Reta da Várzea, Várzea, Teresópolis - RJ",
      });
    });
  });

  // 2. Products & Inventory Unit Tests
  describe("Products Controller", () => {
    test("products.all: returns products list", async () => {
      const items = await controller.products.all();
      expect(items.length).toBeGreaterThanOrEqual(8);
    });

    test("products.searchByName: searches case-insensitively", async () => {
      const res = await controller.products.searchByName("milk");
      expect(res.some((p: any) => p.name === "Fresh Milk")).toBe(true);
    });

    test("products.update: modifies product attributes", async () => {
      const updated = await controller.products.update("PROD-001", {
        name: "Fresh Milk",
        price: 3.99,
        is_cold: 1,
        is_fragile: 0,
        expire_date: "2026-05-01",
        size: { length: 10, width: 10, height: 20 },
        volume: 0.002,
        weight: 1.0,
      });
      expect(updated[0].price).toBe(3.99);

      // Revert change
      await controller.products.update("PROD-001", {
        name: "Fresh Milk",
        price: 3.5,
        is_cold: 1,
        is_fragile: 0,
        expire_date: "2026-04-10",
        size: { length: 10, width: 10, height: 20 },
        volume: 0.002,
        weight: 1.0,
      });
    });
  });

  // 3. Infrastructure & Fleet Unit Tests
  describe("Warehouses & Trucks Controllers", () => {
    test("warehouses.all: returns deposits list", async () => {
      const whs = await controller.warehouses.all();
      expect(whs.length).toBeGreaterThanOrEqual(3);
    });

    test("warehouses.stock: returns stock items for warehouse", async () => {
      const stock = await controller.warehouses.stock("WH-001");
      expect(Array.isArray(stock)).toBe(true);
      expect(stock.some((s: any) => s.product_id === "PROD-001")).toBe(true);
    });

    test("trucks.byModel: filters fleet trucks by model", async () => {
      const res = await controller.trucks.byModel("Caminhão Serrano 01");
      expect(res.length).toBeGreaterThanOrEqual(1);
      expect(res[0].model).toBe("Caminhão Serrano 01");
    });

    test("orders.suggestOptimalTruck: returns optimal truck with valid score, driver and capacity", async () => {
      const suggestion = await controller.orders.suggestOptimalTruck("ORD-002");
      expect(suggestion).toBeDefined();
      expect(suggestion.best_truck).toBeDefined();
      expect(suggestion.best_truck?.truck_id).toBeDefined();
      expect(suggestion.best_truck?.score).toBeGreaterThan(0);
      expect(suggestion.suggested_driver).toBeDefined();
      expect(suggestion.candidate_trucks?.length).toBeGreaterThan(0);
      expect(suggestion.requirements).toBeDefined();
    });

    test("orders.suggestOptimalTruck: respects cold-chain and weight limitations", async () => {
      const suggestion = await controller.orders.suggestOptimalTruck("ORD-002", "WH-001");
      expect(suggestion.warehouse_id).toBe("WH-001");
      expect(suggestion.best_truck?.remaining_weight).toBeGreaterThanOrEqual(suggestion.order_load.totalWeight);
      if (suggestion.requirements.requires_cold) {
        expect(suggestion.best_truck?.has_refrigeration).toBe(true);
      }
    });
  });

  // 4. Monthly Performance Analytics Unit Tests
  describe("Monthly Performance Controller", () => {
    test("monthlyPerformance.all: returns 12 months data with revenue and profit", async () => {
      const perf = await controller.monthlyPerformance.all();
      expect(perf).toHaveLength(12);
      expect(perf[0].month).toBe("Jan");
      expect(perf[0].revenue).toBeGreaterThan(0);
      expect(perf[0].profit).toBe(perf[0].revenue - perf[0].costs);
    });
  });

  // 5. Elliptic Curve Cyberprotection Unit Tests (ECDSA P-256)
  describe("Elliptic Curve Cyberprotection (ECDSA prime256v1)", () => {
    test("signs payload and verifies successfully with public key", () => {
      const payload = { sub: "USR-001", role: "admin", exp: Date.now() + 60000 };
      const token = controller.ecSecurity.signPayload(payload);
      expect(token).toBeDefined();
      expect(token).toContain(".");

      const verified = controller.ecSecurity.verifyToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.payload.sub).toBe("USR-001");
      expect(verified.payload.role).toBe("admin");
    });

    test("detects tampered payload and rejects signature", () => {
      const payload = { sub: "USR-004", role: "client", exp: Date.now() + 60000 };
      const token = controller.ecSecurity.signPayload(payload);
      const [encodedPayload, signature] = token.split(".");

      // Tamper payload to elevate privilege to admin
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: "USR-004", role: "admin" })).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${signature}`;

      const verified = controller.ecSecurity.verifyToken(tamperedToken);
      expect(verified.valid).toBe(false);
      expect(verified.error).toMatch(/signature/i);
    });

    test("rejects expired elliptic-curve token", () => {
      const expiredPayload = { sub: "USR-001", role: "admin", exp: Date.now() - 1000 };
      const token = controller.ecSecurity.signPayload(expiredPayload);
      const verified = controller.ecSecurity.verifyToken(token);
      expect(verified.valid).toBe(false);
      expect(verified.error).toMatch(/expired/i);
    });
  });

  // 6. Route Corridor Proximity & Quick Pick (Valhalla Multi-Stop Routing)
  describe("Route Corridor Proximity & Valhalla Quick Pick", () => {
    test("haversineDistanceKm: computes distance between coordinates", () => {
      // Distance between identical points is 0
      expect(haversineDistanceKm(-22.3842, -43.1311, -22.3842, -43.1311)).toBe(0);

      // Known distance: Petrópolis (-22.3842, -43.1311) to Teresópolis (-22.4123, -42.9656) is ~17.3 km
      const dist = haversineDistanceKm(-22.3842, -43.1311, -22.4123, -42.9656);
      expect(dist).toBeGreaterThan(16.5);
      expect(dist).toBeLessThan(18.5);
    });

    test("distancePointToSegmentKm: computes perpendicular distance to a line segment", () => {
      const segA: [number, number] = [0, 0];
      const segB: [number, number] = [0, 2];

      // Point directly on the segment
      expect(distancePointToSegmentKm([0, 1], segA, segB)).toBe(0);

      // Point perpendicular to segment midpoint: 1 degree latitude offset (~111 km)
      const distPerp = distancePointToSegmentKm([1, 1], segA, segB);
      expect(distPerp).toBeGreaterThan(110);
      expect(distPerp).toBeLessThan(112);

      // Point before segment start: should clamp to segA
      const distBefore = distancePointToSegmentKm([0, -1], segA, segB);
      const distToA = haversineDistanceKm(0, -1, 0, 0);
      expect(distBefore).toBe(distToA);

      // Point after segment end: should clamp to segB
      const distAfter = distancePointToSegmentKm([0, 3], segA, segB);
      const distToB = haversineDistanceKm(0, 3, 0, 2);
      expect(distAfter).toBe(distToB);
    });

    test("minDistanceToRouteKm: measures distance from order to ANY point along a route polyline", () => {
      // Route polyline with 3 waypoints: [(0,0), (0,1), (0,2)]
      const routePoints: [number, number][] = [
        [0, 0],
        [0, 1],
        [0, 2],
      ];

      // Order sitting right on the route
      expect(minDistanceToRouteKm([0, 0.5], routePoints)).toBe(0);
      expect(minDistanceToRouteKm([0, 1.8], routePoints)).toBe(0);

      // Order close to middle segment vs order far away
      const nearDist = minDistanceToRouteKm([0.05, 1.0], routePoints);
      const farDist = minDistanceToRouteKm([0.5, 1.0], routePoints);
      expect(nearDist).toBeLessThan(farDist);

      // Empty route fallback
      expect(minDistanceToRouteKm([0, 0], [])).toBe(99999);
    });

    test("decodePolyline6: decodes Valhalla precision-6 polylines into GPS coordinates", () => {
      const encoded = "xagui@nnogqA??";
      const coords = decodePolyline6(encoded);
      expect(Array.isArray(coords)).toBe(true);
      expect(coords.length).toBeGreaterThan(0);
      coords.forEach(([lat, lon]) => {
        expect(typeof lat).toBe("number");
        expect(typeof lon).toBe("number");
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lon)).toBe(true);
      });
    });

    test("calculateQuickPickOrders: auto-selects corridor-proximate orders and computes route", async () => {
      const result = await calculateQuickPickOrders({
        warehouseId: "WH-001",
        maxOrders: 3,
        roundTrip: true,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.quick_pick).toBe(true);
      expect(result.anchor_order_id).toBeDefined();
      expect(result.selected_order_ids.length).toBeLessThanOrEqual(3);
      expect(result.selected_order_ids[0]).toBe(result.anchor_order_id);
      expect(result.stops.length).toBe(result.selected_order_ids.length);
      expect(result.corridor_scored_candidates).toBeDefined();

      // Scored candidates must be sorted ascending by distance to route corridor
      const candidates = result.corridor_scored_candidates;
      for (let i = 1; i < candidates.length; i++) {
        expect(candidates[i].distance_to_route_km).toBeGreaterThanOrEqual(
          candidates[i - 1].distance_to_route_km
        );
      }
    }, 60000); // 60s — Nominatim geocoding calls for all candidate orders
  });
});
