import { test, expect } from "vitest";
import { testFetch } from "./test-utils";

test("Transactions: GET /orders returns all orders", async () => {
  const res = await testFetch("/orders");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(5);
});

test("Transactions: GET /orders/:id returns specific order", async () => {
  const res = await testFetch("/orders/ORD-001");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].id).toBe("ORD-001");
  expect(data[0].status).toBe("Pending");
});

test("Transactions: GET /orders?clientId=USR-004", async () => {
  const res = await testFetch("/orders?clientId=USR-004");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(data.every((o) => o.client_id === "USR-004")).toBe(true);
});

test("Transactions: GET /orders/:id/items", async () => {
  const res = await testFetch("/orders/ORD-004/items");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBe(2);
  expect(data.some((i) => i.product_id === "PROD-006")).toBe(true);
});

test("Transactions: GET /orders/:id/route", async () => {
  const res = await testFetch("/orders/ORD-002/route");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].warehouse_id).toBe("WH-001");
  expect(data[0].destination_warehouse_id).toBe("WH-002");
});

test("Transactions: GET /orders/:id/cost", async () => {
  const res = await testFetch("/orders/ORD-003/cost");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].total_cost).toBe(70.0);
  // Business logic check: total = fuel + labor + maintenance
  expect(data[0].total_cost).toBe(
    data[0].fuel_cost + data[0].labor_cost + data[0].maintenance_cost,
  );
});

test("Transactions: GET /supplies-route returns all supply routes", async () => {
  const res = await testFetch("/supplies-route");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
});

test("Transactions: GET /supplies-route?orderId=ORD-001", async () => {
  const res = await testFetch("/supplies-route?orderId=ORD-001");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].supplier_id).toBe("SUP-002");
});

test("Transactions: GET /supplies-route?supplierId=SUP-002", async () => {
  const res = await testFetch("/supplies-route?supplierId=SUP-002");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.some((r) => r.order_id === "ORD-001")).toBe(true);
});

test("Transactions: GET /freight-cost returns all costs", async () => {
  const res = await testFetch("/freight-cost");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
});

test("Transactions: GET /freight-cost?orderId=ORD-002", async () => {
  const res = await testFetch("/freight-cost?orderId=ORD-002");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data[0].order_id).toBe("ORD-002");
  expect(data[0].total_cost).toBe(495.0);
});

test("Transactions: GET /orders/ (empty ID) returns 400", async () => {
  const res = await testFetch("/orders/");
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("Order ID required");
});

test("Transactions: GET /orders/INVALID returns 404", async () => {
  const res = await testFetch("/orders/INVALID-ID");
  expect(res.status).toBe(404);
  const text = await res.text();
  expect(text).toBe("Order not found");
});

test("Transactions: GET /orders/INVALID/items returns empty", async () => {
  const res = await testFetch("/orders/INVALID-ID/items");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data).toHaveLength(0);
});

test("Transactions: GET /supplies-route filtering with no results", async () => {
  const res = await testFetch("/supplies-route?orderId=ORD-999");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data).toHaveLength(0);
});

test("Transactions: GET /freight-cost filtering with no results", async () => {
  const res = await testFetch("/freight-cost?orderId=ORD-999");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data).toHaveLength(0);
});

test("Transactions: POST /orders/:id/calculate-distance calculates distance in DB", async () => {
  const res = await testFetch("/orders/ORD-001/calculate-distance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ warehouse_id: "WH-001" }),
  });
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.success).toBe(true);
  expect(data.distance_km).toBeGreaterThan(0);
  expect(data.order_id).toBe("ORD-001");
  expect(data.origin_coords).toBeDefined();
  expect(data.destination_coords).toBeDefined();
});

test("Transactions: GET /warehouses/average-gas-price calculates avg price across warehouses", async () => {
  const res = await testFetch("/warehouses/average-gas-price?ids=WH-001,WH-002");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.avg_gas_price).toBeGreaterThan(5.0);
  expect(data.warehouses_count).toBe(2);
});

test("Transactions: GET /users/drivers returns drivers with hourly wages", async () => {
  const res = await testFetch("/users/drivers");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any[];
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(data.some((d) => d.name.includes("Charlie") && d.wage > 0)).toBe(true);
});

test("Transactions: POST /orders/:id/calculate-cost calculates & saves cost considering wage & warehouse gas prices", async () => {
  const res = await testFetch("/orders/ORD-001/calculate-cost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      driverWage: 55.0,
      fuelPrice: 6.0,
      distanceKm: 100.0,
    }),
  });
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.success).toBe(true);
  expect(data.order_id).toBe("ORD-001");
  expect(data.fuel_cost).toBeGreaterThan(0);
  expect(data.labor_cost).toBeGreaterThan(0);
  expect(data.maintenance_cost).toBeGreaterThan(0);
  expect(data.total_cost).toBe(
    Math.round((data.fuel_cost + data.labor_cost + data.maintenance_cost) * 100) / 100,
  );
  expect(data.avg_fuel_price).toBe(6.0);
  expect(data.driver_wage).toBe(55.0);
  expect(data.distance_km).toBe(100.0);

  // Verify persistence in freight_cost
  const costCheck = await testFetch("/orders/ORD-001/cost");
  expect(costCheck.status).toBe(200);
  const savedCosts = (await costCheck.json()) as any[];
  expect(savedCosts.length).toBeGreaterThan(0);
  expect(savedCosts[0].total_cost).toBe(data.total_cost);
});

test("Transactions: GET /orders/:id/eta returns ETA window and transit calculation", async () => {
  const res = await testFetch("/orders/ORD-002/eta");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.success).toBe(true);
  expect(data.order_id).toBe("ORD-002");
  expect(data.distance_km).toBeGreaterThan(0);
  expect(data.min_speed_kmh).toBe(40.0);
  expect(data.max_speed_kmh).toBeGreaterThanOrEqual(80.0);
  expect(data.driving_hours_min).toBeLessThan(data.driving_hours_max);
  expect(data.eta_min).toBeDefined();
  expect(data.eta_max).toBeDefined();
  expect(data.eta_expected).toBeDefined();
});

test("Transactions: POST /orders/:id/calculate-eta incorporates min/max speeds & driver 8h max driving rule", async () => {
  const resLong = await testFetch("/orders/ORD-001/calculate-eta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      minSpeed: 50.0,
      maxSpeed: 80.0,
      departureTime: "2026-03-25T08:00:00",
    }),
  });
  expect(resLong.status).toBe(200);
  const dataLong = (await resLong.json()) as any;
  expect(dataLong.success).toBe(true);
  expect(dataLong.min_speed_kmh).toBe(50.0);
  expect(dataLong.max_speed_kmh).toBe(80.0);
  expect(dataLong.avg_speed_kmh).toBe(65.0);
  expect(dataLong.eta_min).toBeDefined();
  expect(dataLong.eta_max).toBeDefined();
  expect(dataLong.eta_expected).toBeDefined();
  expect(dataLong.compliance_status).toBeDefined();
});

test("Transactions: GET /reports/delivery-costs returns aggregated summary and per-order delivery cost breakdown", async () => {
  const res = await testFetch("/reports/delivery-costs");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.summary).toBeDefined();
  expect(data.summary.total_orders_analyzed).toBeGreaterThanOrEqual(1);
  expect(data.summary.total_delivery_cost).toBeGreaterThan(0);
  expect(data.summary.total_fuel_cost).toBeGreaterThan(0);
  expect(data.summary.total_labor_cost).toBeGreaterThan(0);
  expect(data.summary.total_maintenance_cost).toBeGreaterThan(0);
  expect(data.summary.avg_cost_per_km).toBeGreaterThan(0);
  expect(data.orders).toBeInstanceOf(Array);
  expect(data.orders.length).toBeGreaterThan(0);

  const firstOrder = data.orders[0];
  expect(firstOrder.order_id).toBeDefined();
  expect(firstOrder.total_delivery_cost).toBeGreaterThan(0);
  expect(firstOrder.net_margin).toBeDefined();
  expect(firstOrder.fuel_cost).toBeGreaterThanOrEqual(0);
  expect(firstOrder.labor_cost).toBeGreaterThanOrEqual(0);
});

test("Transactions: GET /reports/delivery-costs?warehouseId=WH-001 filters by warehouse", async () => {
  const res = await testFetch("/reports/delivery-costs?warehouseId=WH-001");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;
  expect(data.warehouse_id).toBe("WH-001");
  expect(data.summary).toBeDefined();
  expect(data.orders).toBeInstanceOf(Array);
});

test("Transactions: delivery-cost report summary equals its per-order cost breakdown", async () => {
  const res = await testFetch("/reports/delivery-costs");
  expect(res.status).toBe(200);
  const data = (await res.json()) as any;

  const totals = data.orders.reduce(
    (acc: { delivery: number; fuel: number; labor: number; maintenance: number; distance: number }, order: any) => ({
      delivery: acc.delivery + Number(order.total_delivery_cost),
      fuel: acc.fuel + Number(order.fuel_cost),
      labor: acc.labor + Number(order.labor_cost),
      maintenance: acc.maintenance + Number(order.maintenance_cost),
      distance: acc.distance + Number(order.distance_km),
    }),
    { delivery: 0, fuel: 0, labor: 0, maintenance: 0, distance: 0 },
  );

  expect(data.summary.total_orders_analyzed).toBe(data.orders.length);
  expect(data.summary.total_delivery_cost).toBeCloseTo(totals.delivery, 2);
  expect(data.summary.total_fuel_cost).toBeCloseTo(totals.fuel, 2);
  expect(data.summary.total_labor_cost).toBeCloseTo(totals.labor, 2);
  expect(data.summary.total_maintenance_cost).toBeCloseTo(totals.maintenance, 2);
  expect(data.summary.total_distance_km).toBeCloseTo(totals.distance, 1);
});



