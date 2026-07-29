import { pg_conn } from "./model";

/**
 * Functional factory for basic CRUD operations.
 * Returns an object with functions (functors) to execute on routes.
 * Aligned with @back/db/dbdocumentation.md
 */
const createBaseRepo = (table: string) => ({
  all: () => pg_conn`SELECT * FROM ${pg_conn(table)}`,
  byId: (id: string) => pg_conn`SELECT * FROM ${pg_conn(table)} WHERE id = ${id}`,
  byField: (field: string) => (value: string | number | boolean) => 
    pg_conn`SELECT * FROM ${pg_conn(table)} WHERE ${pg_conn(field)} = ${value}`,
});

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
  update: (id: string, product: {
    name: string;
    price: number;
    is_cold: number;
    is_fragile: number;
    expire_date: string | null;
    size: any;
    volume: number;
    weight: number;
  }) =>
    pg_conn`
      UPDATE products
      SET name = ${product.name}, price = ${product.price}, is_cold = ${product.is_cold}, 
          is_fragile = ${product.is_fragile}, expire_date = ${product.expire_date}, 
          size = ${typeof product.size === 'string' ? product.size : JSON.stringify(product.size)}, 
          volume = ${product.volume}, weight = ${product.weight}
      WHERE id = ${id}
      RETURNING *
    `,
};

// 3. INFRASTRUCTURE & FLEET
export const warehouses = {
  ...createBaseRepo("warehouses"),
  stock: (warehouseId: string) => 
    pg_conn`SELECT * FROM warehouses_stock WHERE warehouse_id = ${warehouseId}`,
  update: (id: string, warehouse: {
    location: any;
    size: any;
    volume_max: number;
    has_refrigeration: number;
    fuel_price: number;
  }) =>
    pg_conn`
      UPDATE warehouses
      SET location = ${typeof warehouse.location === 'string' ? warehouse.location : JSON.stringify(warehouse.location)}, 
          size = ${typeof warehouse.size === 'string' ? warehouse.size : JSON.stringify(warehouse.size)}, 
          volume_max = ${warehouse.volume_max}, 
          has_refrigeration = ${warehouse.has_refrigeration}, 
          fuel_price = ${warehouse.fuel_price}
      WHERE id = ${id}
      RETURNING *
    `,
};

export const trucks = {
  ...createBaseRepo("trucks"),
  byModel: (model: string) => pg_conn`SELECT * FROM trucks WHERE model = ${model}`,
  update: (id: string, truck: {
    model: string;
    speed: number;
    is_valid: number;
    size: any;
    volume_max: number;
    weight_max: number;
    has_refrigeration: number;
    fuel_capacity: number;
    fuel_current: number;
    fuel_consumption: number;
    current_warehouse_id: string | null;
  }) =>
    pg_conn`
      UPDATE trucks
      SET model = ${truck.model}, speed = ${truck.speed}, is_valid = ${truck.is_valid}, 
          size = ${typeof truck.size === 'string' ? truck.size : JSON.stringify(truck.size)}, 
          volume_max = ${truck.volume_max}, weight_max = ${truck.weight_max}, 
          has_refrigeration = ${truck.has_refrigeration}, fuel_capacity = ${truck.fuel_capacity}, 
          fuel_current = ${truck.fuel_current}, fuel_consumption = ${truck.fuel_consumption}, 
          current_warehouse_id = ${truck.current_warehouse_id}
      WHERE id = ${id}
      RETURNING *
    `,
};

export const suppliers = createBaseRepo("suppliers");

// 4. TRANSACTION & ROUTING
export const orders = {
  ...createBaseRepo("orders"),
  byClient: (clientId: string) => pg_conn`SELECT * FROM orders WHERE client_id = ${clientId}`,
  items: (orderId: string) => pg_conn`SELECT * FROM orders_items WHERE order_id = ${orderId}`,
  routes: (orderId: string) => pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId}`,
  costs: (orderId: string) => pg_conn`SELECT * FROM freight_cost WHERE order_id = ${orderId}`,
  create: (order: { id: string; client_id: string; final_destination: string; time_limit: string; price: number; status?: string }) =>
    pg_conn`
      INSERT INTO orders (id, client_id, final_destination, time_limit, price, status)
      VALUES (${order.id}, ${order.client_id}, ${order.final_destination}, ${order.time_limit}, ${order.price}, ${order.status || 'Pending'})
      RETURNING *
    `,
  addItem: (item: { order_id: string; product_id: string; quantity: number }) =>
    pg_conn`
      INSERT INTO orders_items (order_id, product_id, quantity)
      VALUES (${item.order_id}, ${item.product_id}, ${item.quantity})
      RETURNING *
    `,
};

export const orders_route = {
  ...createBaseRepo("orders_route"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM orders_route WHERE order_id = ${orderId}`,
};

export const supplyRoutes = {
  ...createBaseRepo("supplies_route"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM supplies_route WHERE order_id = ${orderId}`,
  bySupplier: (supplierId: string) => pg_conn`SELECT * FROM supplies_route WHERE supplier_id = ${supplierId}`,
};

export const freightCosts = {
  ...createBaseRepo("freight_cost"),
  byOrder: (orderId: string) => pg_conn`SELECT * FROM freight_cost WHERE order_id = ${orderId}`,
};
