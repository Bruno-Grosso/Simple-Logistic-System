import { test, expect, describe } from "vitest";
import * as controller from "../src/controller";

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
      const res = await controller.trucks.byModel("Volvo FH16");
      expect(res.length).toBeGreaterThanOrEqual(1);
      expect(res[0].model).toBe("Volvo FH16");
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
});
