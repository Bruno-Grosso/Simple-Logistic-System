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

test("Inventory: POST /products creates a new product and validates persistence", async () => {
  const productId = `PRD-TEST-${Date.now().toString().slice(-4)}`;
  const res = await testFetch("/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: productId,
      name: "Organic Coffee Beans",
      price: 49.9,
      is_cold: 0,
      is_fragile: 0,
      expire_date: "2027-12-31",
      volume: 0.05,
      weight: 1.0,
      size: { length: 0.2, width: 0.15, height: 0.1 },
    }),
  });
  expect(res.status).toBe(201);
  const data = (await res.json()) as any;
  expect(data.success).toBe(true);
  expect(data.product.id).toBe(productId);
  expect(data.product.name).toBe("Organic Coffee Beans");

  // Verify retrieval
  const getRes = await testFetch(`/products/${productId}`);
  expect(getRes.status).toBe(200);
  const fetched = (await getRes.json()) as any[];
  expect(fetched[0].name).toBe("Organic Coffee Beans");
});

test("Inventory: PUT /warehouses/:id/stock and DELETE /warehouses/:id/stock/:productId manages stock", async () => {
  const warehouseId = "WH-001";
  const productId = "PROD-001";

  // Upsert stock
  const putRes = await testFetch(`/warehouses/${warehouseId}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      quantity: 150,
    }),
  });
  expect(putRes.status).toBe(200);
  const putData = (await putRes.json()) as any;
  expect(putData.success).toBe(true);
  expect(putData.stock.quantity).toBe(150);

  // Verify stock query
  const stockRes = await testFetch(`/warehouses/${warehouseId}/stock`);
  expect(stockRes.status).toBe(200);
  const stockList = (await stockRes.json()) as any[];
  const entry = stockList.find((s) => s.product_id === productId);
  expect(entry).toBeDefined();
  expect(entry.quantity).toBe(150);

  // Reset back to original 50
  await testFetch(`/warehouses/${warehouseId}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      quantity: 50,
    }),
  });
});
