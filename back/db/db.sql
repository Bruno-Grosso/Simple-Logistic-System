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
    fuel_price REAL NOT NULL DEFAULT 0,
    truck_capacity INTEGER NOT NULL DEFAULT 5
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
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    address JSON, -- Documentation says geographic coordinates
    role TEXT CHECK(role IN ('admin','warehouse_worker','truck_driver','client','worker','dispatcher','inventory_manager','maintenance_technician','manager')),
    warehouse_id TEXT REFERENCES warehouses(id),
    wage REAL NOT NULL DEFAULT 45.0,
    is_active INTEGER NOT NULL DEFAULT 1
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
    supplier_delivery INTEGER NOT NULL DEFAULT 0,
    distance_km REAL
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
    driver_id TEXT REFERENCES users(id),
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

-- Geodesic distance calculation function (Haversine formula in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN 6371.0 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        ))
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE monthly_performance (
    id SERIAL PRIMARY KEY,
    warehouse_id TEXT,
    month TEXT NOT NULL,
    full_month TEXT NOT NULL,
    revenue REAL NOT NULL DEFAULT 0,
    costs REAL NOT NULL DEFAULT 0,
    profit REAL NOT NULL DEFAULT 0,
    fuel_cost REAL NOT NULL DEFAULT 0,
    labor_cost REAL NOT NULL DEFAULT 0,
    maintenance_cost REAL NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    is_poi INTEGER NOT NULL DEFAULT 0,
    poi TEXT
);

INSERT INTO monthly_performance (warehouse_id, month, full_month, revenue, costs, profit, fuel_cost, labor_cost, maintenance_cost, orders_count, is_poi, poi)
SELECT 
  w.wh, m.month, m.full_month,
  round((m.rev * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  round((m.costs * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  round(((m.rev - m.costs) * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  round((m.fuel * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  round((m.labor * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  round((m.maint * COALESCE(w.mult, 1.0))::numeric, 2)::real,
  GREATEST(1, round((m.orders * COALESCE(w.mult, 1.0))::numeric))::integer,
  m.is_poi, m.poi
FROM (
  VALUES 
    (NULL::text, 1.0::real),
    ('WH-001'::text, 0.5::real),
    ('WH-002'::text, 0.25::real),
    ('WH-003'::text, 0.25::real),
    ('WH-004'::text, 0.25::real),
    ('WH-005'::text, 0.25::real),
    ('WH-006'::text, 0.25::real)
) AS w(wh, mult)
CROSS JOIN (
  VALUES 
    ('Jan', 'January 2026', 34500, 14200, 5800, 6200, 2200, 42, 1, 'Fleet Modernization & Route Optimization Launched'),
    ('Feb', 'February 2026', 29800, 12900, 5100, 5900, 1900, 38, 0, NULL),
    ('Mar', 'March 2026', 43200, 18100, 7400, 8100, 2600, 56, 1, 'Q1 Peak Volume & Strategic Enterprise Client Onboarding'),
    ('Apr', 'April 2026', 37800, 16500, 6700, 7300, 2500, 48, 0, NULL),
    ('May', 'May 2026', 41500, 17200, 7000, 7600, 2600, 51, 0, NULL),
    ('Jun', 'June 2026', 51000, 21800, 9100, 9500, 3200, 64, 1, 'Cold Storage Facility Expansion (Nova Friburgo Hub)'),
    ('Jul', 'July 2026', 46200, 19400, 8000, 8600, 2800, 59, 0, NULL),
    ('Aug', 'August 2026', 49500, 20500, 8500, 9000, 3000, 62, 0, NULL),
    ('Sep', 'September 2026', 55800, 23200, 9800, 10100, 3300, 71, 1, 'Automated Freight Dispatch & Smart Route Planning Integration'),
    ('Oct', 'October 2026', 52100, 21900, 9200, 9600, 3100, 66, 0, NULL),
    ('Nov', 'November 2026', 58900, 24800, 10300, 10800, 3700, 78, 0, NULL),
    ('Dec', 'December 2026', 68400, 27900, 11800, 12000, 4100, 89, 1, 'Record Holiday Delivery Peak & Highest Annual Operating Margin')
) AS m(month, full_month, rev, costs, fuel, labor, maint, orders, is_poi, poi);

