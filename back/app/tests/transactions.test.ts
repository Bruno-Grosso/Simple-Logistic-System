import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:8080";

test("Transactions: GET /orders returns all orders", async () => {
  const res = await fetch(`${BASE_URL}/orders`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(5);
});

test("Transactions: GET /orders/:id returns specific order", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-001`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].id).toBe("ORD-001");
  expect(data[0].status).toBe("Pending");
});

test("Transactions: GET /orders?clientId=USR-004", async () => {
  const res = await fetch(`${BASE_URL}/orders?clientId=USR-004`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(data.every(o => o.client_id === "USR-004")).toBe(true);
});

test("Transactions: GET /orders/:id/items", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-004/items`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBe(2);
  expect(data.some(i => i.product_id === "PROD-006")).toBe(true);
});

test("Transactions: GET /orders/:id/route", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-002/route`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].warehouse_id).toBe("WH-001");
  expect(data[0].destination_warehouse_id).toBe("WH-002");
});

test("Transactions: GET /orders/:id/cost", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-003/cost`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].total_cost).toBe(70.0);
  // Business logic check: total = fuel + labor + maintenance
  expect(data[0].total_cost).toBe(data[0].fuel_cost + data[0].labor_cost + data[0].maintenance_cost);
});

test("Transactions: GET /supplies-route returns all supply routes", async () => {
  const res = await fetch(`${BASE_URL}/supplies-route`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
});

test("Transactions: GET /supplies-route?orderId=ORD-001", async () => {
  const res = await fetch(`${BASE_URL}/supplies-route?orderId=ORD-001`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].supplier_id).toBe("SUP-002");
});

test("Transactions: GET /supplies-route?supplierId=SUP-002", async () => {
  const res = await fetch(`${BASE_URL}/supplies-route?supplierId=SUP-002`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.some(r => r.order_id === "ORD-001")).toBe(true);
});

test("Transactions: GET /freight-cost returns all costs", async () => {
  const res = await fetch(`${BASE_URL}/freight-cost`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
});

test("Transactions: GET /freight-cost?orderId=ORD-002", async () => {
  const res = await fetch(`${BASE_URL}/freight-cost?orderId=ORD-002`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].order_id).toBe("ORD-002");
  expect(data[0].total_cost).toBe(495.0);
});

test("Transactions: GET /orders/ (empty ID) returns 400", async () => {
  const res = await fetch(`${BASE_URL}/orders/`);
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Order ID required");
});

test("Transactions: GET /orders/INVALID returns 404", async () => {
  const res = await fetch(`${BASE_URL}/orders/INVALID-ID`);
  expect(res.status).toBe(404);
  const text = await res.text();
  expect(text).toBe("Order not found");
});

test("Transactions: GET /orders/INVALID/items returns empty", async () => {
  const res = await fetch(`${BASE_URL}/orders/INVALID-ID/items`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});

test("Transactions: GET /supplies-route filtering with no results", async () => {
  const res = await fetch(`${BASE_URL}/supplies-route?orderId=ORD-999`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});

test("Transactions: GET /freight-cost filtering with no results", async () => {
  const res = await fetch(`${BASE_URL}/freight-cost?orderId=ORD-999`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});
