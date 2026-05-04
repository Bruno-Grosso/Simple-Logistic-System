import { pg_conn } from "./model";

/**
 * Functional factory for basic CRUD operations.
 * Returns an object with functions (functors) to execute on routes.
 */
const createBaseRepo = (table: string) => ({
  all: () => pg_conn`SELECT * FROM ${pg_conn(table)}`,
  byId: (id: string) => pg_conn`SELECT * FROM ${pg_conn(table)} WHERE id = ${id}`,
  byField: (field: string) => (value: any) => 
    pg_conn`SELECT * FROM ${pg_conn(table)} WHERE ${pg_conn(field)} = ${value}`,
});

// Layer-specific controllers as requested in documentation.md

// 1. IDENTITY & ACCESS
export const users = {
  ...createBaseRepo("users"),
  byRole: (role: string) => pg_conn`SELECT * FROM users WHERE role = ${role}`,
};

export const onlineUsers = {
  ...createBaseRepo("online_users"),
  byUser: (userId: string) => pg_conn`SELECT * FROM online_users WHERE user_id = ${userId}`,
};

// 2. PRODUCT & INVENTORY
export const products = {
  ...createBaseRepo("products"),
  searchByName: (name: string) => pg_conn`SELECT * FROM products WHERE name ILIKE ${'%' + name + '%'}`,
};

// 3. INFRASTRUCTURE & FLEET
export const warehouses = {
  ...createBaseRepo("warehouses"),
  stock: (warehouseId: string) => 
    pg_conn`SELECT * FROM warehouses_stocks WHERE warehouse_id = ${warehouseId}`,
};

export const trucks = {
  ...createBaseRepo("trucks"),
  byModel: (modelId: string) => pg_conn`SELECT * FROM trucks WHERE model_id = ${modelId}`,
};

export const suppliers = createBaseRepo("suppliers");

// 4. TRANSACTION & ROUTING
export const orders = {
  ...createBaseRepo("orders"),
  byClient: (clientId: string) => pg_conn`SELECT * FROM orders WHERE client_id = ${clientId}`,
  items: (orderId: string) => pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`,
  routes: (orderId: string) => pg_conn`SELECT * FROM orders_routes WHERE order_id = ${orderId}`,
  costs: (orderId: string) => pg_conn`SELECT * FROM freights_costs WHERE order_id = ${orderId}`,
};

export const supplyRoutes = {
  ...createBaseRepo("supplies_routes"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM supplies_routes WHERE order_id = ${orderId}`,
  bySupplier: (supplierId: string) => pg_conn`SELECT * FROM supplies_routes WHERE supplier_id = ${supplierId}`,
};

export const freightCosts = {
  ...createBaseRepo("freights_costs"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM freights_costs WHERE order_id = ${orderId}`,
};
