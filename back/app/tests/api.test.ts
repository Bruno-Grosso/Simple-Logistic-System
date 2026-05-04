import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:8080";

test("Integration: GET /users returns actual DB users", async () => {
  const res = await fetch(`${BASE_URL}/users`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toBeArray();
  expect(data.length).toBeGreaterThanOrEqual(10);
});

test("Integration: GET /users?role=admin", async () => {
  const res = await fetch(`${BASE_URL}/users?role=admin`);
  const data = await res.json();
  expect(data[0].role).toBe("admin");
});

test("Integration: GET /products search", async () => {
  const res = await fetch(`${BASE_URL}/products?name=Milk`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data[0].name).toContain("Fresh Milk");
});

test("Integration: GET /warehouses/:id/stock", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/WH-001/stock`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toBeArray();
  expect(data[0].warehouse_id).toBe("WH-001");
});

test("Integration: GET /orders/:id/route", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-002/route`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data[0].order_id).toBe("ORD-002");
  expect(data[0].step).toBe(1);
});

test("Integration: GET /orders/:id/items", async () => {
  const res = await fetch(`${BASE_URL}/orders/ORD-001/items`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toBeArray();
  expect(data.some((item: any) => item.product_id === "PROD-001")).toBe(true);
});

test("Integration: GET /freight-cost?orderId=ORD-002", async () => {
  const res = await fetch(`${BASE_URL}/freight-cost?orderId=ORD-002`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data[0].order_id).toBe("ORD-002");
  expect(data[0].total_cost).toBe(495.0);
});

test("Integration: GET /trucks filtered by model", async () => {
  const res = await fetch(`${BASE_URL}/trucks?model=Volvo FH16`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data[0].id).toBe("TRK-001");
});

test("Integration: 404 for non-existent route", async () => {
  const res = await fetch(`${BASE_URL}/not-real`);
  expect(res.status).toBe(404);
});
