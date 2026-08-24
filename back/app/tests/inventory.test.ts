import { test, expect } from "vitest";
import { testFetch } from "./test-utils";

test("Inventory: GET /products returns all products", async () => {
  const res = await testFetch("/products");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThanOrEqual(8);
});

test("Inventory: GET /products/:id returns specific product", async () => {
  const res = await testFetch("/products/PROD-001");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].id).toBe("PROD-001");
  expect(data[0].name).toBe("Fresh Milk");
  expect(data[0].is_cold).toBe(1);
});

test("Inventory: GET /products?name=search", async () => {
  const res = await testFetch("/products?name=Laptop");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].name).toBe("Gaming Laptop");
});

test("Inventory: GET /suppliers returns all suppliers", async () => {
  const res = await testFetch("/suppliers");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(3);
});

test("Inventory: GET /suppliers/:id returns specific supplier", async () => {
  const res = await testFetch("/suppliers/SUP-003");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].id).toBe("SUP-003");
  expect(typeof data[0].name).toBe("string");
});

test("Inventory: GET /products/ (empty ID) returns 400", async () => {
  const res = await testFetch("/products/");
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Product ID required");
});

test("Inventory: GET /suppliers/ (empty ID) returns 400", async () => {
  const res = await testFetch("/suppliers/");
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Supplier ID required");
});

test("Inventory: GET /products search with no results", async () => {
  const res = await testFetch("/products?name=NonExistentProduct");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data).toHaveLength(0);
});

test("Inventory: GET /suppliers/INVALID returns 404", async () => {
  const res = await testFetch("/suppliers/INVALID-ID");
  expect(res.status).toBe(404);
  const text = await res.text();
  expect(text).toBe("Supplier not found");
});
