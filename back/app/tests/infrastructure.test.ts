import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:8080";

test("Infrastructure: GET /warehouses returns all warehouses", async () => {
  const res = await fetch(`${BASE_URL}/warehouses`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(3);
});

test("Infrastructure: GET /warehouses/:id returns Chicago Hub", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/WH-003`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].id).toBe("WH-003");
  expect(data[0].has_refrigeration).toBe(1);
});

test("Infrastructure: GET /warehouses/:id/stock", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/WH-001/stock`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toBeArray();
  // PROD-005 and PROD-001 are in WH-001
  expect(data.some(s => s.product_id === "PROD-005")).toBe(true);
  expect(data.find(s => s.product_id === "PROD-005").quantity).toBe(10);
});

test("Infrastructure: GET /trucks returns all trucks", async () => {
  const res = await fetch(`${BASE_URL}/trucks`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.length).toBeGreaterThanOrEqual(4);
});

test("Infrastructure: GET /trucks/:id returns Volvo FH16", async () => {
  const res = await fetch(`${BASE_URL}/trucks/TRK-001`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].model).toBe("Volvo FH16");
  expect(data[0].current_warehouse_id).toBe("WH-001");
});

test("Infrastructure: GET /trucks?model=Scania", async () => {
  const res = await fetch(`${BASE_URL}/trucks?model=Scania R500`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].id).toBe("TRK-002");
  expect(data[0].is_delivering).toBe(1);
});

test("Infrastructure: GET /warehouses/ (empty ID) returns 400", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/`);
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Warehouse ID required");
});

test("Infrastructure: GET /trucks/ (empty ID) returns 400", async () => {
  const res = await fetch(`${BASE_URL}/trucks/`);
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Truck ID required");
});

test("Infrastructure: GET /warehouses/INVALID returns 404", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/INVALID-ID`);
  expect(res.status).toBe(404);
  const text = await res.text();
  expect(text).toBe("Warehouse not found");
});

test("Infrastructure: GET /warehouses/INVALID/stock returns empty", async () => {
  const res = await fetch(`${BASE_URL}/warehouses/INVALID-ID/stock`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});

test("Infrastructure: GET /trucks model filtering with no results", async () => {
  const res = await fetch(`${BASE_URL}/trucks?model=NonExistentModel`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});
