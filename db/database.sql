-- ======================================================
--                  WORK IN PROGRESS
-- ======================================================

-- Stores warehouse locations
CREATE TABLE deposit (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    size TEXT,
    volume_actual REAL DEFAULT 0,
    volume_max REAL,
    has_refrigeration INTEGER DEFAULT 0 CHECK (has_refrigeration IN (0,1))
);

-- Vehicle fleet data; tracks current status and physical load
CREATE TABLE truck (
    id TEXT PRIMARY KEY,
    model TEXT,
    size TEXT,

    volume_actual REAL DEFAULT 0,
    volume_max REAL,
    weight_actual REAL DEFAULT 0,
    weight_max REAL,

    estimated_time TEXT,
    is_delivering INTEGER DEFAULT 0 CHECK (is_delivering IN (0,1)),
    is_valid INTEGER DEFAULT 1 CHECK (is_valid IN (0,1)),
    is_traveling INTEGER DEFAULT 0 CHECK (is_traveling IN (0,1)),

    current_deposit_id TEXT,
    origin_deposit_id TEXT,
    destination_deposit_id TEXT,
    home_deposit_id TEXT,

    has_refrigeration INTEGER DEFAULT 0 CHECK (has_refrigeration IN (0,1)),
    speed REAL,

    -- Fuel system
    fuel_capacity REAL,
    fuel_current REAL DEFAULT 0,
    fuel_consumption REAL,

    -- Wear system (percentage 0–100)
    wear_percentage REAL DEFAULT 0 CHECK (wear_percentage >= 0 AND wear_percentage <= 100),
    wear_rate REAL,

    FOREIGN KEY (current_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (origin_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (destination_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (home_deposit_id) REFERENCES deposit(id),

    -- Fuel integrity (NULL-safe)
    CHECK (
        fuel_current >= 0 AND
        (fuel_capacity IS NULL OR fuel_current <= fuel_capacity)
    ),

    -- Ensures truck is either traveling OR located at a deposit (not both)
    CHECK (
        (
            is_traveling = 1 
            AND origin_deposit_id IS NOT NULL 
            AND destination_deposit_id IS NOT NULL
            AND current_deposit_id IS NULL
        )
        OR
        (
            is_traveling = 0 
            AND current_deposit_id IS NOT NULL
            AND origin_deposit_id IS NULL
            AND destination_deposit_id IS NULL
        )
    )
);

-- Catalog of products
CREATE TABLE product (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_cold INTEGER DEFAULT 0 CHECK (is_cold IN (0,1)),
    is_fragile INTEGER DEFAULT 0 CHECK (is_fragile IN (0,1)),
    expire_date TEXT,
    price REAL,
    size TEXT,
    volume REAL,
    weight REAL
);

-- System users including clients and internal staff
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    work_position TEXT,
    password TEXT NOT NULL,
    address TEXT,
    role TEXT CHECK(role IN ('admin','worker','client')) NOT NULL
);

-- Sessions for multi-user authentication
CREATE TABLE session (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    login_time TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Customer orders and delivery requirements
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    final_destination TEXT,
    sender_id TEXT,
    receiver_id TEXT,
    time_limit TEXT,
    price REAL DEFAULT 0,

    -- Controlled status (prevents invalid values)
    status TEXT CHECK (status IN ('Pending','Shipped','Delivered','Cancelled')) DEFAULT 'Pending',

    client_id TEXT NOT NULL,

    -- Supplier (step 0)
    supplier_id TEXT,
    supplier_delivery INTEGER DEFAULT 0 CHECK (supplier_delivery IN (0,1)),

    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id)
);

-- Order items connecting products to specific orders
CREATE TABLE order_items (
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),

    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id)
);

-- Inventory Tracking: Connects products to their physical location
CREATE TABLE stock (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),

    deposit_id TEXT,
    truck_id TEXT,
    order_id TEXT,

    arrived_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

    -- Ensures inventory is in exactly ONE place
    CHECK (
        (deposit_id IS NOT NULL AND truck_id IS NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NOT NULL)
    )
);

-- Prevent duplicate logical stock entries
CREATE UNIQUE INDEX idx_stock_unique 
ON stock(product_id, deposit_id, truck_id, order_id);

-- Historical tracking of stock movements
CREATE TABLE stock_history (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),

    deposit_id TEXT,
    truck_id TEXT,
    order_id TEXT,

    moved_by TEXT,
    moved_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (moved_by) REFERENCES users(id),

    CHECK (
        (deposit_id IS NOT NULL AND truck_id IS NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NOT NULL)
    )
);

-- Tracking the journey of an order
CREATE TABLE order_route (
    order_id TEXT NOT NULL,
    step INTEGER NOT NULL CHECK (step > 0),
    deposit_id TEXT,
    truck_id TEXT,
    estimated_time TEXT,
    arrived_at TEXT,

    PRIMARY KEY (order_id, step),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),

    -- Must reference at least a truck or deposit
    CHECK (deposit_id IS NOT NULL OR truck_id IS NOT NULL)
);

-- Suppliers (external origin)
CREATE TABLE supplier (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL
);

-- Step 0 route (supplier to system)
CREATE TABLE supply_route (
    order_id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    truck_id TEXT,
    estimated_departure TEXT,
    estimated_arrival TEXT,
    actual_arrival TEXT,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id)
);

-- Fuel stations
CREATE TABLE fuel_station (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    latitude REAL,
    longitude REAL,
    is_partner INTEGER DEFAULT 0 CHECK (is_partner IN (0,1))
);

-- Fuel price history
CREATE TABLE fuel_price (
    station_id TEXT,
    price_per_liter REAL NOT NULL,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (station_id, recorded_at),
    FOREIGN KEY (station_id) REFERENCES fuel_station(id) ON DELETE CASCADE
);

-- Index for fast latest price lookup
CREATE INDEX idx_fuel_price_latest 
ON fuel_price(station_id, recorded_at DESC);

-- Refueling events (no redundant total_price)
CREATE TABLE refuel_log (
    id TEXT PRIMARY KEY,
    truck_id TEXT NOT NULL,
    station_id TEXT NOT NULL,
    liters REAL NOT NULL,
    price_per_liter REAL NOT NULL,
    refueled_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (truck_id) REFERENCES truck(id),
    FOREIGN KEY (station_id) REFERENCES fuel_station(id)
);

-- Staff assignments
CREATE TABLE employee (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    is_able INTEGER DEFAULT 1 CHECK (is_able IN (0,1)),
    deposit_id TEXT,
    max_work_hours_per_day REAL,
    hourly_cost REAL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id)
);

-- Multi-driver assignment
CREATE TABLE truck_driver (
    truck_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (truck_id, employee_id),
    FOREIGN KEY (truck_id) REFERENCES truck(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
);

-- Work history
CREATE TABLE work_log (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    truck_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,

    FOREIGN KEY (employee_id) REFERENCES employee(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id)
);

-- Cost tracking (calculated in backend)
CREATE TABLE freight_cost (
    order_id TEXT PRIMARY KEY,
    fuel_cost REAL DEFAULT 0,
    labor_cost REAL DEFAULT 0,
    maintenance_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Truck performance snapshots
CREATE TABLE truck_performance_history (
    id TEXT PRIMARY KEY,
    truck_id TEXT NOT NULL,
    total_distance REAL DEFAULT 0,
    fuel_consumed REAL DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,
    wear_percentage REAL,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (truck_id) REFERENCES truck(id) ON DELETE CASCADE
);

-- Maintenance history
CREATE TABLE truck_maintenance (
    id TEXT PRIMARY KEY,
    truck_id TEXT NOT NULL,
    type TEXT,
    description TEXT,
    cost REAL,
    wear_before REAL,
    wear_after REAL,
    performed_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (truck_id) REFERENCES truck(id) ON DELETE CASCADE,
    CHECK (cost >= 0)
);

-- Performance indexes
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_deposit ON stock(deposit_id);
CREATE INDEX idx_stock_truck ON stock(truck_id);

CREATE INDEX idx_order_route_order ON order_route(order_id);
CREATE INDEX idx_truck_driver_truck ON truck_driver(truck_id);
