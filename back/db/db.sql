--Using PostgreSQL

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin','warehouse_worker','truck_driver','client'))
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    refrigeration BOOLEAN NOT NULL DEFAULT FALSE,
    fragile BOOLEAN NOT NULL DEFAULT FALSE,
    expire_date DATE,
    length DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION NOT NULL,
    weight DOUBLE PRECISION NOT NULL
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    volume_current DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (volume_current >= 0),
    volume_max DOUBLE PRECISION NOT NULL,
    refrigeration BOOLEAN NOT NULL DEFAULT FALSE,
    fuel_price NUMERIC(10,2) NOT NULL CHECK (fuel_price >= 0),
    length DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    CHECK (volume_current <= volume_max)
);

CREATE TABLE warehouses_stocks (
    warehouse_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE truck_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    weight_max DOUBLE PRECISION NOT NULL,
    volume_max DOUBLE PRECISION NOT NULL,
    fuel_capacity DOUBLE PRECISION NOT NULL,
    fuel_consumption DOUBLE PRECISION NOT NULL,
    refrigeration BOOLEAN NOT NULL DEFAULT FALSE,
    speed DOUBLE PRECISION NOT NULL,
    length DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL
);

CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES truck_models(id),
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    is_delivering BOOLEAN NOT NULL DEFAULT FALSE,
    volume_current DOUBLE PRECISION NOT NULL DEFAULT 0,
    weight_current DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_location GEOGRAPHY(Point, 4326),
    estimated_time TIMESTAMP,
    origin_id UUID REFERENCES warehouses(id),
    destination_id UUID REFERENCES warehouses(id),
    destination_location GEOGRAPHY(Point, 4326),
    fuel_current DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (fuel_current >= 0),
    maintenance_level INT NOT NULL DEFAULT 0,
    CHECK (
        (destination_id IS NOT NULL AND destination_location IS NULL)
        OR
        (destination_id IS NULL AND destination_location IS NOT NULL)
    )
);

CREATE TABLE online_users (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trucks_cargos (
    truck_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (truck_id, product_id),
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    final_destination TEXT,
    destination_warehouse_id UUID REFERENCES warehouses(id),
    destination_location GEOGRAPHY(Point, 4326),
    time_limit TIMESTAMP,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('Pending','Shipped','Delivered','Cancelled')) DEFAULT 'Pending',
    supplier_id UUID REFERENCES suppliers(id),
    supplier_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (
        (final_destination IS NOT NULL AND destination_warehouse_id IS NULL AND destination_location IS NULL)
        OR
        (final_destination IS NULL AND destination_warehouse_id IS NOT NULL AND destination_location IS NULL)
        OR
        (final_destination IS NULL AND destination_warehouse_id IS NULL AND destination_location IS NOT NULL)
    )
);

CREATE TABLE orders_items (
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL CHECK(quantity > 0),
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders_routes (
    order_id UUID NOT NULL,
    step INT NOT NULL CHECK (step > 0),
    step_type TEXT NOT NULL CHECK(step_type IN ('Transit','Storage')),
    warehouse_id UUID REFERENCES warehouses(id),
    truck_id UUID REFERENCES trucks(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    destination_location GEOGRAPHY(Point, 4326),
    estimated_time TIMESTAMP,
    arrived_at TIMESTAMP,
    PRIMARY KEY (order_id, step),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CHECK (
        (destination_warehouse_id IS NOT NULL AND destination_location IS NULL)
        OR
        (destination_warehouse_id IS NULL AND destination_location IS NOT NULL)
    )
);

CREATE TABLE supplies_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    truck_id UUID REFERENCES trucks(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    destination_location GEOGRAPHY(Point, 4326),
    estimated_departure TIMESTAMP,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    CHECK (
        (destination_warehouse_id IS NOT NULL AND destination_location IS NULL)
        OR
        (destination_warehouse_id IS NULL AND destination_location IS NOT NULL)
    )
);

CREATE TABLE freights_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    fuel_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    maintenance_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_online_users_user ON online_users(user_id);
CREATE INDEX idx_stock_product ON warehouses_stocks(product_id);
CREATE INDEX idx_stock_warehouse ON warehouses_stocks(warehouse_id);
CREATE INDEX idx_orders_route_order ON orders_routes(order_id);
CREATE INDEX idx_orders_route_truck ON orders_routes(truck_id);
CREATE INDEX idx_cargo_truck ON trucks_cargos(truck_id);
