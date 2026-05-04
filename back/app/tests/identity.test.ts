import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:8080";

test("Identity: GET /users returns all users", async () => {
  const res = await fetch(`${BASE_URL}/users`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toBeArray();
  expect(data.length).toBeGreaterThanOrEqual(10);
});

test("Identity: GET /users/:id returns specific user", async () => {
  const res = await fetch(`${BASE_URL}/users/USR-001`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].id).toBe("USR-001");
  expect(data[0].name).toBe("Alice Admin");
});

test("Identity: GET /users?role=admin", async () => {
  const res = await fetch(`${BASE_URL}/users?role=admin`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.every(u => u.role === "admin")).toBe(true);
  expect(data.some(u => u.id === "USR-001")).toBe(true);
});

test("Identity: GET /users?role=client", async () => {
  const res = await fetch(`${BASE_URL}/users?role=client`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data.every(u => u.role === "client")).toBe(true);
  expect(data.length).toBeGreaterThanOrEqual(4);
});

test("Identity: GET /online-users returns active sessions", async () => {
  const res = await fetch(`${BASE_URL}/online-users`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toBeArray();
  expect(data.length).toBeGreaterThanOrEqual(3);
});

test("Identity: GET /online-users?userId=USR-001", async () => {
  const res = await fetch(`${BASE_URL}/online-users?userId=USR-001`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data[0].user_id).toBe("USR-001");
  expect(data[0].session_id).toBe("SESS-001");
});

test("Identity: GET /users/INVALID returns 404", async () => {
  const res = await fetch(`${BASE_URL}/users/INVALID-ID`);
  expect(res.status).toBe(404);
  const text = await res.text();
  expect(text).toBe("User not found");
});

test("Identity: GET /users/ (empty ID) returns 400", async () => {
  const res = await fetch(`${BASE_URL}/users/`);
  expect(res.status).toBe(400);
  const text = await res.text();
  expect(text).toBe("User ID required");
});

test("Identity: GET /users/ role filtering with no results", async () => {
  const res = await fetch(`${BASE_URL}/users?role=non-existent`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});

test("Identity: GET /online-users/ user filtering with no results", async () => {
  const res = await fetch(`${BASE_URL}/online-users?userId=USR-999`);
  expect(res.status).toBe(200);
  const data = await res.json() as any[];
  expect(data).toHaveLength(0);
});
