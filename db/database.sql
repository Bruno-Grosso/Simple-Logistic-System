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
    has_refrigeration INTEGER DEFAULT 0 -- Boolean (0/1)
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
    estimated_time TEXT, -- when it will finish the actual step
    is_delivering INTEGER DEFAULT 0, -- Boolean (0/1)
    speed INTEGER,
    is_valid INTEGER DEFAULT 1, -- Boolean (0/1)
    is_traveling INTEGER DEFAULT 0, -- Boolean (0/1)
    current_deposit_id TEXT,
    origin_deposit_id TEXT,
    destination_deposit_id TEXT,
    has_refrigeration INTEGER DEFAULT 0, -- Boolean (0/1)
    home_deposit_id TEXT, -- Current home base or dock

    FOREIGN KEY (current_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (origin_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (destination_deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (home_deposit_id) REFERENCES deposit(id)
);

-- Catalog of products
CREATE TABLE product (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_cold INTEGER DEFAULT 0, -- Boolean: Requires refrigeration (0/1)
    is_fragile INTEGER DEFAULT 0, -- Boolean (0/1)
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
    is_active INTEGER DEFAULT 1, -- Boolean (0/1)

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
    status TEXT DEFAULT 'Pending', -- e.g., 'Pending', 'Shipped', 'Delivered', 'Cancelled'
    client_id TEXT NOT NULL,

    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
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
-- Uses a XOR constraint to ensure an item is only in ONE place
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

    -- Ensures inventory cannot be in a truck and deposit at the same time
    CHECK (
        (deposit_id IS NOT NULL AND truck_id IS NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NOT NULL)
    ),
    
    UNIQUE(product_id, deposit_id, truck_id, order_id)
);

-- Historical tracking of stock movements
CREATE TABLE stock_history (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    deposit_id TEXT,
    truck_id TEXT,
    order_id TEXT,
    moved_by TEXT, -- which user triggered the movement
    moved_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (moved_by) REFERENCES users(id),

    -- XOR: movement must record exactly one destination
    CHECK (
        (deposit_id IS NOT NULL AND truck_id IS NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NOT NULL)
    )
);

-- Tracking the journey of an order through various deposits and trucks
CREATE TABLE order_route (
    order_id TEXT NOT NULL,
    step INTEGER NOT NULL CHECK (step > 0), -- Sequence of the stop
    deposit_id TEXT,
    truck_id TEXT,
    estimated_time TEXT,
    arrived_at TEXT,

    PRIMARY KEY (order_id, step),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),

    -- A route step must have at least a deposit or a truck recorded
    CHECK (
        deposit_id IS NOT NULL OR truck_id IS NOT NULL
    )
);

-- Staff assignments to either a warehouse or a vehicle
CREATE TABLE employee (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Links to users to avoid redundant data
    is_able INTEGER DEFAULT 1, -- Certification or health status (0/1)
    deposit_id TEXT,
    truck_id TEXT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (deposit_id) REFERENCES deposit(id),
    FOREIGN KEY (truck_id) REFERENCES truck(id),

    -- XOR constraint: Employee is assigned to a building OR a truck (or unassigned)
    CHECK (
        (deposit_id IS NOT NULL AND truck_id IS NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NOT NULL)
        OR
        (deposit_id IS NULL AND truck_id IS NULL)
    )
);
