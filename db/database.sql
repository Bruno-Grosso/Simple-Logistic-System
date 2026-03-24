-- Catalog of products
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL,
    
    is_cold INTEGER DEFAULT 0 CHECK (is_cold IN (0,1)),
    is_fragile INTEGER DEFAULT 0 CHECK (is_fragile IN (0,1)),
    expire_date TEXT, --NULL if not expirable
    
    size TEXT,
    volume REAL,
    weight REAL
);

-- Suppliers (external origin)
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT
);

-- Warehouse informations
CREATE TABLE warehouses (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,

    --capacity
    size TEXT,
    volume_current REAL DEFAULT 0 CHECK (volume_current >= 0),
    volume_max REAL,
    has_refrigeration INTEGER DEFAULT 0 CHECK (has_refrigeration IN (0,1)),
    
    fuel_price REAL CHECK (fuel_price >= 0),
    CHECK (volume_current <= volume_max)
);

CREATE TABLE warehouses_stock (
    warehouse_id TEXT,
    product_id TEXT,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    
    PRIMARY KEY (warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Vehicle fleet data
CREATE TABLE trucks (
    id TEXT PRIMARY KEY,
    model TEXT,
    speed REAL,

    is_valid INTEGER DEFAULT 1 CHECK (is_valid IN (0,1)),
    is_delivering INTEGER DEFAULT 0 CHECK (is_delivering IN (0,1)),

    --capacity    
    size TEXT,
    volume_current REAL DEFAULT 0,
    volume_max REAL,
    weight_current REAL DEFAULT 0,
    weight_max REAL,
    has_refrigeration INTEGER DEFAULT 0 CHECK (has_refrigeration IN (0,1)),

    current_warehouse_id TEXT, --NULL if delivering
    
    --delivering informations(NULL if not delivering)
    estimated_time TEXT,
    origin_warehouse_id TEXT,
    destination_warehouse_id TEXT,

    -- Fuel system
    fuel_capacity REAL,
    fuel_current REAL DEFAULT 0 CHECK (fuel_current >= 0 AND (fuel_capacity IS NULL OR fuel_current <= fuel_capacity)),
    fuel_consumption REAL,

    truck_maintenance INTEGER, --number of times
    
    FOREIGN KEY (current_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id),

    -- Ensures truck is either delivering OR located at a deposit (not both)
    CHECK(
        (is_delivering = 1 AND origin_warehouse_id IS NOT NULL AND destination_warehouse_id IS NOT NULL AND current_warehouse_id IS NULL)
        OR
        (is_delivering = 0 AND current_warehouse_id IS NOT NULL AND origin_warehouse_id IS NULL AND destination_warehouse_id IS NULL)
    ),
    CHECK (volume_current <= volume_max),
    CHECK (weight_current <= weight_max)
);

-- System users including clients and internal staff
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    address TEXT, --location
    role TEXT CHECK(role IN ('admin','warehouse_worker','truck_driver','client')) NOT NULL
);

CREATE TABLE online_users (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    login_time TEXT DEFAULT CURRENT_TIMESTAMP, --the time the user made the login
    last_activity TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trucks_cargo (
    truck_id TEXT,
    
    product_id TEXT,
    quantity INTEGER,

    PRIMARY KEY (truck_id, product_id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Customer orders and delivery requirements
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    
    client_id TEXT NOT NULL, --the sender
    final_destination TEXT, --the reciever
    
    time_limit TEXT,
    price REAL DEFAULT 0,

    -- Controlled status (prevents invalid values)
    status TEXT CHECK (status IN ('Pending','Shipped','Delivered','Cancelled')) DEFAULT 'Pending',

    -- Supplier (step 0)
    supplier_id TEXT, --the store that the sender bought
    supplier_delivery INTEGER DEFAULT 0 CHECK (supplier_delivery IN (0,1)), --if already is in our stocks

    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Order items connecting products to specific orders
CREATE TABLE orders_items (
    order_id TEXT NOT NULL,
    
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),

    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tracking the journey of an order
CREATE TABLE orders_route (
    order_id TEXT NOT NULL,
    step INTEGER NOT NULL CHECK (step > 0),
    
    warehouse_id TEXT,
    truck_id TEXT,

    --if its going to other warehouse. Else NULL
    destination_warehouse_id TEXT,
    
    estimated_time TEXT,
    arrived_at TEXT,

    PRIMARY KEY (order_id, step),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id),

    -- Must reference at least a truck or deposit
    CHECK (warehouse_id IS NOT NULL OR truck_id IS NOT NULL)
);

CREATE TABLE supplies_route (
    order_id TEXT,
    supplier_id TEXT NOT NULL,
    truck_id TEXT,
    
    estimated_departure TEXT,
    estimated_arrival TEXT,
    actual_arrival TEXT,

    PRIMARY KEY (order_id, supplier_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

-- Cost tracking (calculated in backend)
CREATE TABLE freight_cost (
    order_id TEXT PRIMARY KEY,
    
    fuel_cost REAL DEFAULT 0,
    labor_cost REAL DEFAULT 0,
    maintenance_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
);

--Indexing
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_online_users_user ON online_users(user_id);
CREATE INDEX idx_stock_product ON warehouses_stock(product_id);
CREATE INDEX idx_stock_warehouse ON warehouses_stock(warehouse_id);
CREATE INDEX idx_orders_route_order ON orders_route(order_id);
CREATE INDEX idx_orders_route_truck ON orders_route(truck_id);
CREATE INDEX idx_cargo_truck ON trucks_cargo(truck_id);
