import { test, expect, describe } from "vitest";
import { testFetch } from "./test-utils";

describe("Backend Integration Tests - HTTP Endpoints & Router Layer", () => {
  // 1. Auth & Login Integration
  describe("POST /login", () => {
    test("POST /login: returns ok and sessionToken for valid credentials", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alice@logisys.com", password: "admin123" }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.id).toBe("USR-001");
    });

    test("POST /login: returns 401 for invalid password", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alice@logisys.com", password: "bad" }),
      });
      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(false);
      expect(data.error).toBe("Invalid credentials");
    });

    test("POST /login: returns 400 when missing email/password", async () => {
      const res = await testFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alice@logisys.com" }),
      });
      expect(res.status).toBe(400);
    });
  });

  // 2. Client Registration Integration
  describe("POST /clients", () => {
    test("POST /clients: registers a new client user", async () => {
      const testId = `USR-TEST-${Date.now()}`;
      const res = await testFetch("/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testId,
          name: "Integration Test Client",
          email: "testclient@logisys.com",
          password: "password123",
          address: "Rua Teste 100, Petrópolis - RJ",
          role: "client",
        }),
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.client.id).toBe(testId);
    });
  });

  // 3. Products & Warehouses Integration
  describe("PUT /products/:id & PUT /warehouses/:id", () => {
    test("PUT /products/:id: updates product pricing and refrigerated status", async () => {
      const res = await testFetch("/products/PROD-002", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Crystal Vase Premium",
          price: 49.99,
          is_cold: 0,
          is_fragile: 1,
          expire_date: null,
          size: { length: 30, width: 30, height: 40 },
          volume: 0.036,
          weight: 2.5,
        }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.product.price).toBe(49.99);

      // Revert change
      await testFetch("/products/PROD-002", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Crystal Vase",
          price: 45.0,
          is_cold: 0,
          is_fragile: 1,
          expire_date: null,
          size: { length: 30, width: 30, height: 40 },
          volume: 0.036,
          weight: 2.5,
        }),
      });
    });

    test("PUT /warehouses/:id: updates fuel price and capacity", async () => {
      const res = await testFetch("/warehouses/WH-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { latitude: -22.3842, longitude: -43.1311, label: "Petrópolis Hub" },
          size: { length: 100, width: 100, height: 10 },
          volume_max: 120000.0,
          has_refrigeration: 1,
          fuel_price: 6.15,
        }),
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.warehouse.fuel_price).toBe(6.15);

      // Revert change
      await testFetch("/warehouses/WH-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { latitude: -22.3842, longitude: -43.1311, label: "Petrópolis Hub (Itaipava)" },
          size: { length: 100, width: 100, height: 10 },
          volume_max: 100000.0,
          has_refrigeration: 1,
          fuel_price: 5.89,
        }),
      });
    });
  });

  // 4. Reports & Performance Analytics Integration
  describe("GET /monthly-performance", () => {
    test("GET /monthly-performance: returns 12-month metrics and POIs", async () => {
      const res = await testFetch("/monthly-performance");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any[];
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(12);
      expect(data[0]).toHaveProperty("revenue");
      expect(data[0]).toHaveProperty("costs");
      expect(data[0]).toHaveProperty("profit");
    });
  });

  // 5. System Status Endpoints Integration
  describe("System Infrastructure & CORS", () => {
    test("GET /status: returns database tables array", async () => {
      const res = await testFetch("/status");
      expect(res.status).toBe(200);
      const data = (await res.json()) as any[];
      expect(Array.isArray(data)).toBe(true);
    });

    test("GET /db-name: returns active database identifier", async () => {
      const res = await testFetch("/db-name");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
    });

    test("OPTIONS preflight: handles CORS preflight request with 204", async () => {
      const res = await testFetch("/login", {
        method: "OPTIONS",
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    test("GET /non-existent-route: returns 404", async () => {
      const res = await testFetch("/non-existent-route");
      expect(res.status).toBe(404);
    });
  });
});
