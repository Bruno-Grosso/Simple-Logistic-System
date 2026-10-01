import { beforeEach, describe, expect, test, vi } from "vitest";

const { updateStatus, updateRoute, updateUser } = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  updateRoute: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../src/controller", () => ({
  orders: { updateStatus },
  orders_route: { update: updateRoute },
  users: { update: updateUser },
}));

import { fetchHandler } from "../src/server";

describe("order update HTTP contract", () => {
  beforeEach(() => {
    updateStatus.mockReset();
    updateRoute.mockReset();
    updateUser.mockReset();
  });

  test("persists an employee being marked inactive", async () => {
    updateUser.mockResolvedValue([{ id: "USR-003", is_active: 0 }]);

    const response = await fetchHandler(new Request("http://localhost/users/USR-003", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: 0 }),
    }));

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("USR-003", { is_active: 0 });
    await expect(response.json()).resolves.toMatchObject({ success: true, user: { is_active: 0 } });
  });

  test("accepts the UI's Cancelled status and writes the schema's Canceled value", async () => {
    updateStatus.mockResolvedValue([{ id: "ORD-101", status: "Canceled" }]);

    const response = await fetchHandler(new Request("http://localhost/orders/ORD-101", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Cancelled" }),
    }));

    expect(response.status).toBe(200);
    expect(updateStatus).toHaveBeenCalledWith("ORD-101", "Canceled");
    await expect(response.json()).resolves.toMatchObject({ success: true, order: { id: "ORD-101" } });
  });

  test("rejects an unsupported order status before calling the controller", async () => {
    const response = await fetchHandler(new Request("http://localhost/orders/ORD-101", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "In transit" }),
    }));

    expect(response.status).toBe(400);
    expect(updateStatus).not.toHaveBeenCalled();
  });

  test("reports a missing route step instead of returning a false success", async () => {
    updateRoute.mockResolvedValue([]);

    const response = await fetchHandler(new Request("http://localhost/orders/ORD-101/route/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ truck_id: "TRK-001", driver_id: "USR-003" }),
    }));

    expect(response.status).toBe(404);
    expect(updateRoute).toHaveBeenCalledWith("ORD-101", 1, { truck_id: "TRK-001", driver_id: "USR-003" });
  });
});
