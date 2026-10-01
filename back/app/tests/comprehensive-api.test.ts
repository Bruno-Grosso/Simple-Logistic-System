import { test, expect, describe } from "vitest";
import { testFetch } from "./test-utils";
import * as controller from "../src/controller";

describe("Comprehensive API & Controller Coverage Suite", () => {
  // 1. CORS Preflight & Base Server Endpoints
  describe("CORS & System Endpoints", () => {
    test("OPTIONS preflight returns 204 with CORS headers", async () => {
      const res = await testFetch("/orders", { method: "OPTIONS" });
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("OPTIONS");
    });

    test("GET /status returns tables information", async () => {
      const res = await testFetch("/status");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /db-name returns current database name", async () => {
      const res = await testFetch("/db-name");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    test("GET /unknown-endpoint returns 404", async () => {
      const res = await testFetch("/non-existent-random-route");
      expect(res.status).toBe(404);
    });
  });

  // 2. Geocoding Endpoints
  describe("Geocoding Endpoints", () => {
    test("GET /geocode without address parameter returns 400", async () => {
      const res = await testFetch("/geocode");
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain("Address parameter is required");
    });

    test("GET /reverse-geocode without lat/lon parameters returns 400", async () => {
      const res = await testFetch("/reverse-geocode?lat=-22.9");
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain("Latitude and longitude parameters are required");
    });
  });

  // 3. Cyberprotection & Auth Verification
  describe("Cyberprotection & Auth Endpoints", () => {
    test("GET /auth/ec-public-key returns ECDSA public key", async () => {
      const res = await testFetch("/auth/ec-public-key");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.algorithm).toContain("ECDSA");
      expect(data.publicKey).toContain("BEGIN PUBLIC KEY");
    });

    test("POST /auth/ec-verify without token returns 400", async () => {
      const res = await testFetch("/auth/ec-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
    });

    test("POST /auth/ec-verify with valid generated token passes", async () => {
      const token = controller.ecSecurity.signPayload({
        sub: "USR-001",
        role: "admin",
        iat: Date.now(),
        exp: Date.now() + 60000,
      });
      const res = await testFetch("/auth/ec-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.valid).toBe(true);
      expect(data.payload.sub).toBe("USR-001");
    });

    test("POST /auth/ec-verify with invalid token returns 401", async () => {
      const res = await testFetch("/auth/ec-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid.tampered.token" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
      expect(data.valid).toBe(false);
    });

    test("POST /login validates empty fields", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.ok).toBe(false);
    });
  });

  // 4. Users, Drivers & Clients
  describe("Users & Clients Management", () => {
    test("GET /users/drivers returns all truck drivers", async () => {
      const res = await testFetch("/users/drivers");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.every((u) => u.role === "truck_driver")).toBe(true);
    });

    test("POST /clients creates client and validates payload", async () => {
      const clientId = `CLI-TEST-${Date.now().toString().slice(-4)}`;
      const res = await testFetch("/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clientId,
          name: "Test Client Corporation",
          email: `${clientId.toLowerCase()}@clientcorp.com`,
          password: "password123",
          address: "Rua do Teste 123, Rio de Janeiro - RJ",
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.client.id).toBe(clientId);

      // Clean up
      await testFetch(`/users/${clientId}`, { method: "DELETE" });
    });

    test("POST /employees validates required fields", async () => {
      const res = await testFetch("/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Incomplete" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.success).toBe(false);
    });

    test("DELETE /users/non-existent-user returns 404", async () => {
      const res = await testFetch("/users/USR-NON-EXISTENT-XYZ", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });

  // 5. Products Layer
  describe("Products API", () => {
    test("GET /products returns products list", async () => {
      const res = await testFetch("/products");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("GET /products?name=filters by name", async () => {
      const res = await testFetch("/products?name=Vacina");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("POST /products validates required name and price", async () => {
      const res = await testFetch("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      expect(res.status).toBe(400);
    });

    test("POST, GET, PUT product lifecycle", async () => {
      const testProdId = `PRD-T${Date.now().toString().slice(-4)}`;
      // 1. Create
      const createRes = await testFetch("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testProdId,
          name: "Temporary Test Syringe",
          price: 15.5,
          is_cold: 1,
          is_fragile: 0,
          volume: 0.05,
          weight: 0.1,
        }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json() as any;
      expect(created.success).toBe(true);

      // 2. Fetch by ID
      const getRes = await testFetch(`/products/${testProdId}`);
      expect(getRes.status).toBe(200);
      const fetched = await getRes.json() as any[];
      expect(fetched[0].name).toBe("Temporary Test Syringe");

      // 3. Update
      const putRes = await testFetch(`/products/${testProdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Temporary Test Syringe",
          price: 18.0,
          is_cold: 1,
          is_fragile: 0,
          expire_date: null,
          size: { length: 0.1, width: 0.1, height: 0.1 },
          volume: 0.05,
          weight: 0.1,
        }),
      });
      expect(putRes.status).toBe(200);
      const updated = await putRes.json() as any;
      expect(Number(updated.product.price)).toBe(18.0);
    });

    test("GET /products/INVALID returns 404", async () => {
      const res = await testFetch("/products/PRD-UNKNOWN-999");
      expect(res.status).toBe(404);
    });
  });

  // 6. Warehouses & Parking Layer
  describe("Warehouses & Parking API", () => {
    test("GET /warehouses returns deposit list", async () => {
      const res = await testFetch("/warehouses");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test("GET /warehouses/average-gas-price computes average across warehouses", async () => {
      const res = await testFetch("/warehouses/average-gas-price?ids=WH-001,WH-002");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.avg_gas_price).toBeGreaterThan(0);
      expect(data.warehouses_count).toBe(2);
    });

    test("GET /warehouses/:id returns deposit details", async () => {
      const res = await testFetch("/warehouses/WH-001");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(data[0].id).toBe("WH-001");
    });

    test("GET /warehouses/:id/stock returns warehouse stock items", async () => {
      const res = await testFetch("/warehouses/WH-001/stock");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /warehouses/:id/parking returns parking utilization status", async () => {
      const res = await testFetch("/warehouses/WH-001/parking");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.warehouse_id).toBe("WH-001");
      expect(data.truck_capacity).toBeGreaterThanOrEqual(1);
      expect(data.occupied_spots).toBeDefined();
    });

    test("POST /warehouses/:id/check-parking evaluates parking availability", async () => {
      const res = await testFetch("/warehouses/WH-001/check-parking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truck_id: "TRK-001" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.allowed).toBeDefined();
      expect(data.status).toBeDefined();
    });

    test("PUT /warehouses/:id/stock updates stock quantity", async () => {
      const res = await testFetch("/warehouses/WH-002/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: "PROD-002", quantity: 45 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
    });
  });

  // 7. Suppliers & Trucks
  describe("Suppliers & Trucks API", () => {
    test("GET /suppliers returns suppliers", async () => {
      const res = await testFetch("/suppliers");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /suppliers/:id returns supplier details", async () => {
      const res = await testFetch("/suppliers/SUP-001");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(data[0].id).toBe("SUP-001");
    });

    test("GET /trucks/cargo returns cargo summaries across trucks", async () => {
      const res = await testFetch("/trucks/cargo");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    test("GET /trucks/:id/cargo returns cargo summary for specific truck", async () => {
      const res = await testFetch("/trucks/TRK-001/cargo");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    test("PUT /trucks/:id updates truck attributes", async () => {
      const res = await testFetch("/trucks/TRK-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "Caminhão Serrano 01",
          speed: 85,
          is_valid: 1,
          volume_max: 90,
          weight_max: 25000,
          has_refrigeration: 1,
          fuel_capacity: 400,
          fuel_current: 350,
          fuel_consumption: 2.5,
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.truck.id).toBe("TRK-001");
      expect(data.truck.model).toBe("Caminhão Serrano 01");
    });
  });

  // 8. Orders, Routes & Logistics Calculations
  describe("Orders & Logistics Calculations", () => {
    test("GET /orders supports client, driver, and warehouse filters", async () => {
      const resClient = await testFetch("/orders?clientId=USR-004");
      expect(resClient.status).toBe(200);

      const resDriver = await testFetch("/orders?driverId=USR-003");
      expect(resDriver.status).toBe(200);

      const resWarehouse = await testFetch("/orders?warehouseId=WH-001");
      expect(resWarehouse.status).toBe(200);
    });

    test("GET /orders/:id/items returns items manifest", async () => {
      const res = await testFetch("/orders/ORD-001/items");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /orders/:id/route returns route steps", async () => {
      const res = await testFetch("/orders/ORD-001/route");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /orders/:id/cost returns freight cost breakdown", async () => {
      const res = await testFetch("/orders/ORD-001/cost");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /orders/:id/eta calculates estimated arrival time", async () => {
      const res = await testFetch("/orders/ORD-001/eta");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.eta_expected || data.total_transit_hours_avg).toBeDefined();
    });

    test("GET /orders/:id/suggest-truck suggests best matching truck", async () => {
      const res = await testFetch("/orders/ORD-001/suggest-truck");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.best_truck || data.candidate_trucks).toBeDefined();
    });

    test("POST /orders/:id/calculate-eta calculates ETA with custom parameters", async () => {
      const res = await testFetch("/orders/ORD-001/calculate-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avgSpeed: 70, minSpeed: 50, maxSpeed: 90 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.eta_expected || data.total_transit_hours_avg).toBeDefined();
    });

    test("POST /orders/:id/calculate-cost calculates freight cost with custom parameters", async () => {
      const res = await testFetch("/orders/ORD-001/calculate-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverWage: 45, fuelPrice: 5.89 }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.total_cost).toBeGreaterThan(0);
    });

    test("POST /orders/:id/calculate-distance calculates route distance", async () => {
      const res = await testFetch("/orders/ORD-001/calculate-distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_id: "WH-001" }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.distance_km).toBeGreaterThan(0);
    });

    test("GET /orders-route returns all route steps", async () => {
      const res = await testFetch("/orders-route");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /supplies-route returns supply routes", async () => {
      const res = await testFetch("/supplies-route");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /freight-cost returns all freight cost records", async () => {
      const res = await testFetch("/freight-cost");
      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /monthly-performance and /reports/delivery-costs", async () => {
      const perfRes = await testFetch("/monthly-performance");
      expect(perfRes.status).toBe(200);
      const perfData = await perfRes.json() as any[];
      expect(Array.isArray(perfData)).toBe(true);

      const repRes = await testFetch("/reports/delivery-costs");
      expect(repRes.status).toBe(200);
      const repData = await repRes.json() as any;
      expect(repData.orders).toBeDefined();
      expect(repData.summary).toBeDefined();
    });
  });
});
