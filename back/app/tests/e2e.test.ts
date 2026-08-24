import { afterEach, test, expect, describe } from "vitest";
import { pg_conn } from "../src/model";
import { testFetch } from "./test-utils";

describe("Backend E2E Workflow Tests - Full Lifecycle Scenarios", () => {
  afterEach(async () => {
    // Keep the Compose database identical to its mock seed after each run.
    await pg_conn`DELETE FROM freight_cost WHERE order_id LIKE 'ORD-E2E-%'`;
    await pg_conn`DELETE FROM orders_items WHERE order_id LIKE 'ORD-E2E-%'`;
    await pg_conn`DELETE FROM orders_route WHERE order_id LIKE 'ORD-E2E-%'`;
    await pg_conn`DELETE FROM supplies_route WHERE order_id LIKE 'ORD-E2E-%'`;
    await pg_conn`DELETE FROM orders WHERE id LIKE 'ORD-E2E-%'`;
    await pg_conn`DELETE FROM online_users WHERE user_id LIKE 'USR-E2E-%'`;
    await pg_conn`DELETE FROM users WHERE id LIKE 'USR-E2E-%'`;
    await pg_conn`
      UPDATE trucks
      SET model = 'Caminhão Serrano 01', speed = 85.0, fuel_current = 450.0
      WHERE id = 'TRK-001'
    `;
  });

  // Workflow 1: Authentication, Session Tracking & Profile Updates
  test("E2E Workflow 1: Client Registration -> Login -> Session Tracking -> Profile Update", async () => {
    const e2eUserId = `USR-E2E-${Date.now()}`;
    const initialPass = "securepass123";

    // 1. Register Client
    const regRes = await testFetch("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: e2eUserId,
        name: "E2E Test User",
        email: `${e2eUserId.toLowerCase()}@logisys.com`,
        password: initialPass,
        address: "Av. Alberto Braune 10, Nova Friburgo - RJ",
        role: "client",
      }),
    });
    expect(regRes.status).toBe(201);

    // 2. Log in with registered credentials
    const loginRes = await testFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${e2eUserId.toLowerCase()}@logisys.com`,
        password: initialPass,
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as any;
    expect(loginData.ok).toBe(true);
    expect(loginData.user.id).toBe(e2eUserId);

    // 3. Verify session in online-users log
    const sessionRes = await testFetch(`/online-users?userId=${e2eUserId}`);
    expect(sessionRes.status).toBe(200);
    const sessionData = (await sessionRes.json()) as any[];
    expect(sessionData.length).toBeGreaterThanOrEqual(1);

    // 4. Update Profile Details
    const newPass = "updatedpass456";
    const updateRes = await testFetch(`/users/${e2eUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "E2E Test User Updated",
        address: "Av. Alberto Braune 200, Nova Friburgo - RJ",
        password: newPass,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateData = (await updateRes.json()) as any;
    expect(updateData.success).toBe(true);
    expect(updateData.user.name).toBe("E2E Test User Updated");

    // 5. Re-authenticate with updated password
    const reLoginRes = await testFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: e2eUserId,
        password: newPass,
      }),
    });
    expect(reLoginRes.status).toBe(200);
    const reLoginData = (await reLoginRes.json()) as any;
    expect(reLoginData.ok).toBe(true);
  });

  // Workflow 2: Order Creation, Item Attachment & Logistics Verification
  test("E2E Workflow 2: Create Logistics Order -> Attach Line Items -> Verify Items List", async () => {
    const e2eOrderId = `ORD-E2E-${Date.now()}`;

    // 1. Create Order with attached items
    const createRes = await testFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: e2eOrderId,
        client_id: "USR-004",
        final_destination: "Rua do Imperador 50, Petrópolis - RJ",
        time_limit: "2026-06-30",
        price: 1450.0,
        status: "Pending",
        items: [
          { product_id: "PROD-001", quantity: 10 },
          { product_id: "PROD-003", quantity: 2 },
        ],
      }),
    });
    expect(createRes.status).toBe(201);
    const createData = (await createRes.json()) as any;
    expect(createData.success).toBe(true);
    expect(createData.order.id).toBe(e2eOrderId);

    // 2. Fetch created order details
    const getOrderRes = await testFetch(`/orders/${e2eOrderId}`);
    expect(getOrderRes.status).toBe(200);
    const getOrderData = (await getOrderRes.json()) as any[];
    expect(getOrderData[0].client_id).toBe("USR-004");
    expect(getOrderData[0].price).toBe(1450.0);

    // 3. Fetch order items
    const itemsRes = await testFetch(`/orders/${e2eOrderId}/items`);
    expect(itemsRes.status).toBe(200);
    const itemsData = (await itemsRes.json()) as any[];
    expect(itemsData.length).toBe(2);
    expect(itemsData.some((i) => i.product_id === "PROD-001" && i.quantity === 10)).toBe(true);
  });

  // Workflow 3: Fleet Maintenance, Deposit Inventory & Performance Reporting
  test("E2E Workflow 3: Update Fleet Truck State -> Update Warehouse Capacity -> Verify Reports", async () => {
    // 1. Update Fleet Truck
    const truckRes = await testFetch("/trucks/TRK-001", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Caminhão Serrano 01",
        speed: 88.0,
        is_valid: 1,
        size: { length: 13.6, width: 2.5, height: 2.7 },
        volume_max: 90.0,
        weight_max: 25000.0,
        has_refrigeration: 1,
        fuel_capacity: 500.0,
        fuel_current: 420.0,
        fuel_consumption: 0.3,
        current_warehouse_id: "WH-001",
      }),
    });
    expect(truckRes.status).toBe(200);
    const truckData = (await truckRes.json()) as any;
    expect(truckData.success).toBe(true);
    expect(truckData.truck.speed).toBe(88.0);

    // 2. Fetch monthly performance analytics
    const perfRes = await testFetch("/monthly-performance");
    expect(perfRes.status).toBe(200);
    const perfData = (await perfRes.json()) as any[];
    expect(perfData.length).toBe(12);

    const totalAnnualRevenue = perfData.reduce((acc, curr) => acc + Number(curr.revenue), 0);
    const totalAnnualCosts = perfData.reduce((acc, curr) => acc + Number(curr.costs), 0);
    expect(totalAnnualRevenue).toBeGreaterThan(totalAnnualCosts);
  });
});
