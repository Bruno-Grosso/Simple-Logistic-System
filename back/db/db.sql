-- Logistics System Schema aligned with dbdocumentation.md

CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    is_cold INTEGER NOT NULL DEFAULT 0,
    is_fragile INTEGER NOT NULL DEFAULT 0,
    expire_date TEXT, -- YYYY-MM-DD
    size JSON,
    volume REAL NOT NULL,
    weight REAL NOT NULL
);

CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE warehouses (
    id TEXT PRIMARY KEY,
    location JSON, -- Using JSON for coordinates as per documentation
    size JSON,
    volume_current REAL NOT NULL DEFAULT 0,
    volume_max REAL NOT NULL,
    has_refrigeration INTEGER NOT NULL DEFAULT 0,
    fuel_price REAL NOT NULL DEFAULT 0
);

CREATE TABLE warehouses_stock (
    warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (warehouse_id, product_id)
);

CREATE TABLE trucks (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    speed REAL NOT NULL,
    is_valid INTEGER NOT NULL DEFAULT 1,
    is_delivering INTEGER NOT NULL DEFAULT 0,
    size JSON,
    volume_current REAL NOT NULL DEFAULT 0,
    volume_max REAL NOT NULL,
    weight_current REAL NOT NULL DEFAULT 0,
    weight_max REAL NOT NULL,
    has_refrigeration INTEGER NOT NULL DEFAULT 0,
    current_warehouse_id TEXT REFERENCES warehouses(id),
    origin_warehouse_id TEXT REFERENCES warehouses(id),
    destination_warehouse_id TEXT REFERENCES warehouses(id),
    estimated_time TEXT, -- YYYY-MM-DD HH:MM:SS
    fuel_capacity REAL NOT NULL,
    fuel_current REAL NOT NULL,
    fuel_consumption REAL NOT NULL,
    truck_maintenance INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    address JSON, -- Documentation says geographic coordinates
    role TEXT CHECK(role IN ('admin','warehouse_worker','truck_driver','client'))
);

CREATE TABLE online_users (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    login_time TEXT NOT NULL,
    last_activity TEXT NOT NULL
);

CREATE TABLE trucks_cargo (
    truck_id TEXT NOT NULL REFERENCES trucks(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (truck_id, product_id)
);

CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES users(id),
    final_destination TEXT NOT NULL,
    time_limit TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    status TEXT CHECK(status IN ('Pending','Shipped','Delivered','Canceled')) DEFAULT 'Pending',
    supplier_id TEXT REFERENCES suppliers(id),
    supplier_delivery INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders_items (
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE orders_route (
    order_id TEXT NOT NULL REFERENCES orders(id),
    step INTEGER NOT NULL,
    warehouse_id TEXT REFERENCES warehouses(id),
    truck_id TEXT REFERENCES trucks(id),
    destination_warehouse_id TEXT REFERENCES warehouses(id),
    estimated_time TEXT,
    arrived_at TEXT,
    PRIMARY KEY (order_id, step)
);

CREATE TABLE supplies_route (
    order_id TEXT NOT NULL REFERENCES orders(id),
    supplier_id TEXT NOT NULL REFERENCES suppliers(id),
    truck_id TEXT REFERENCES trucks(id),
    estimated_departure TEXT,
    estimated_arrival TEXT,
    actual_arrival TEXT,
    PRIMARY KEY (order_id, supplier_id)
);

CREATE TABLE freight_cost (
    order_id TEXT PRIMARY KEY REFERENCES orders(id),
    fuel_cost REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    maintenance_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    calculated_at TEXT NOT NULL
);

-- Indexes as specified in documentation
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_online_users_user ON online_users(user_id);
CREATE INDEX idx_stock_product ON warehouses_stock(product_id);
CREATE INDEX idx_stock_warehouse ON warehouses_stock(warehouse_id);
CREATE INDEX idx_orders_route_order ON orders_route(order_id);
CREATE INDEX idx_orders_route_truck ON orders_route(truck_id);
CREATE INDEX idx_cargo_truck ON trucks_cargo(truck_id);
