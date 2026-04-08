-- Comprehensive Mock data for Simple Logistics System
-- Aligned with the schema in db/database.sql

-- 1. Products (8 entries)
INSERT INTO products (id, name, is_cold, is_fragile, expire_date, price, size, volume, weight) VALUES
('PROD-001', 'Fresh Milk', 1, 0, '2026-04-10', 3.50, '10x10x20', 0.002, 1.0),
('PROD-002', 'Crystal Vase', 0, 1, NULL, 45.00, '30x30x40', 0.036, 2.5),
('PROD-003', 'Smartphone X', 0, 0, NULL, 899.99, '15x8x2', 0.00024, 0.2),
('PROD-004', 'Frozen Pizza', 1, 0, '2026-09-20', 5.99, '30x30x3', 0.0027, 0.5),
('PROD-005', 'Office Chair', 0, 0, NULL, 120.00, '60x60x100', 0.36, 12.0),
('PROD-006', 'Gaming Laptop', 0, 1, NULL, 1500.00, '40x30x5', 0.006, 3.0),
('PROD-007', 'Red Wine Box', 0, 1, '2028-12-31', 80.00, '30x20x30', 0.018, 9.0),
('PROD-008', 'Industrial Drill', 0, 0, NULL, 250.00, '40x15x25', 0.015, 5.5);

-- 2. Suppliers (3 entries)
INSERT INTO suppliers (id, name, location) VALUES
('SUP-001', 'Global Tech Corp', '123 Tech Way, San Jose, CA'),
('SUP-002', 'Fresh Farms Ltd', '456 Farm Road, Yakima, WA'),
('SUP-003', 'Euro Imports', '789 Harbor Dr, Miami, FL');

-- 3. Warehouses (3 entries)
INSERT INTO warehouses (id, location, size, volume_current, volume_max, has_refrigeration, fuel_price) VALUES
('WH-001', 'New York Central Hub', '100x100x10', 0.36, 100000.0, 1, 1.25),
('WH-002', 'Los Angeles West Depot', '50x50x8', 0.0, 20000.0, 0, 1.35),
('WH-003', 'Chicago Midwest Center', '80x60x10', 0.0, 48000.0, 1, 1.30);

-- 4. Users (10 entries)
-- role CHECK(role IN ('admin','warehouse_worker','truck_driver','client'))
INSERT INTO users (id, name, password, address, role) VALUES
('USR-001', 'Alice Admin', 'admin123', '123 Admin St, NY', 'admin'),
('USR-002', 'Bob Worker', 'bobpass', '456 Warehouse Ln, NY', 'warehouse_worker'),
('USR-003', 'Charlie Driver', 'trucker1', '789 Road Dr, NJ', 'truck_driver'),
('USR-004', 'David Client', 'client789', '101 Customer Ave, PA', 'client'),
('USR-005', 'Eve Client', 'evepass', '202 Buyer Rd, CT', 'client'),
('USR-006', 'Frank Driver', 'frank123', '333 Elm St, NY', 'truck_driver'),
('USR-007', 'Grace Worker', 'gracepass', '444 Oak St, IL', 'warehouse_worker'),
('USR-008', 'Henry Client', 'henry789', '555 Market St, TX', 'client'),
('USR-009', 'Ivy Client', 'ivypass', '666 Cloud St, CA', 'client'),
('USR-010', 'Jack Worker', 'jackpass', '777 Bolt Ave, CA', 'warehouse_worker');

-- 5. Trucks (4 entries)
-- Truck 1: Parked at WH-001
INSERT INTO trucks (id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current, weight_max, has_refrigeration, current_warehouse_id, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance) VALUES
('TRK-001', 'Volvo FH16', 85.0, 1, 0, '13.6x2.5x2.7', 0.0, 90.0, 0.0, 25000.0, 1, 'WH-001', 500.0, 450.0, 0.3, 2);

-- Truck 2: Delivering from WH-001 to WH-002
INSERT INTO trucks (id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current, weight_max, has_refrigeration, current_warehouse_id, origin_warehouse_id, destination_warehouse_id, estimated_time, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance) VALUES
('TRK-002', 'Scania R500', 80.0, 1, 1, '13.6x2.5x2.7', 0.036, 90.0, 2.5, 25000.0, 0, NULL, 'WH-001', 'WH-002', '2026-03-26 14:00:00', 600.0, 300.0, 0.35, 1);

-- Truck 3: Parked at WH-003
INSERT INTO trucks (id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current, weight_max, has_refrigeration, current_warehouse_id, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance) VALUES
('TRK-003', 'MAN TGX', 82.0, 1, 0, '13.6x2.5x2.7', 0.0, 90.0, 0.0, 25000.0, 1, 'WH-003', 550.0, 500.0, 0.32, 0);

-- Truck 4: Invalid/Maintenance
INSERT INTO trucks (id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current, weight_max, has_refrigeration, current_warehouse_id, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance) VALUES
('TRK-004', 'Iveco S-Way', 75.0, 0, 0, '12x2.4x2.5', 0.0, 72.0, 0.0, 18000.0, 0, 'WH-002', 400.0, 50.0, 0.28, 5);

-- 6. Warehouses Stock (5 entries)
INSERT INTO warehouses_stock (warehouse_id, product_id, quantity) VALUES
('WH-001', 'PROD-005', 10),
('WH-003', 'PROD-008', 50),
('WH-001', 'PROD-001', 100),
('WH-002', 'PROD-004', 20),
('WH-003', 'PROD-002', 5);

-- 7. Orders (5 entries)
INSERT INTO orders (id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery) VALUES
('ORD-001', 'USR-004', '101 Customer Ave, PA', '2026-03-30', 50.00, 'Pending', 'SUP-002', 0),
('ORD-002', 'USR-005', '202 Buyer Rd, CT', '2026-03-28', 950.00, 'Shipped', 'SUP-001', 1),
('ORD-003', 'USR-004', '101 Customer Ave, PA', '2026-03-20', 15.00, 'Delivered', NULL, 1),
('ORD-004', 'USR-008', '555 Market St, TX', '2026-04-05', 2400.00, 'Pending', 'SUP-003', 0),
('ORD-005', 'USR-009', '666 Cloud St, CA', '2026-04-02', 120.00, 'Cancelled', NULL, 1);

-- 8. Orders Items (8 entries)
INSERT INTO orders_items (order_id, product_id, quantity) VALUES
('ORD-001', 'PROD-001', 5),
('ORD-002', 'PROD-003', 1),
('ORD-002', 'PROD-002', 1),
('ORD-003', 'PROD-004', 2),
('ORD-004', 'PROD-006', 2),
('ORD-004', 'PROD-007', 10),
('ORD-005', 'PROD-005', 1),
('ORD-001', 'PROD-004', 3);

-- 9. Trucks Cargo (2 entries)
INSERT INTO trucks_cargo (truck_id, product_id, quantity) VALUES
('TRK-002', 'PROD-002', 1),
('TRK-002', 'PROD-003', 1);

-- 10. Orders Route (3 steps)
INSERT INTO orders_route (order_id, step, warehouse_id, truck_id, destination_warehouse_id, estimated_time, arrived_at) VALUES
('ORD-002', 1, 'WH-001', 'TRK-002', 'WH-002', '2026-03-26 14:00:00', NULL),
('ORD-003', 1, 'WH-001', NULL, NULL, NULL, '2026-03-19 10:00:00'),
('ORD-004', 1, 'WH-003', 'TRK-003', NULL, '2026-04-01 10:00:00', NULL);

-- 11. Supplies Route (2 entries)
INSERT INTO supplies_route (order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival) VALUES
('ORD-001', 'SUP-002', 'TRK-001', '2026-03-26 08:00:00', '2026-03-26 12:00:00', NULL),
('ORD-004', 'SUP-003', 'TRK-003', '2026-03-28 09:00:00', '2026-03-30 15:00:00', NULL);

-- 12. Freight Cost (2 entries)
INSERT INTO freight_cost (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at) VALUES
('ORD-003', 25.0, 40.0, 5.0, 70.0, '2026-03-20 11:00:00'),
('ORD-002', 150.0, 300.0, 45.0, 495.0, '2026-03-25 10:30:00');

-- 13. Online Users (3 entries)
INSERT INTO online_users (session_id, user_id, login_time, last_activity) VALUES
('SESS-001', 'USR-001', '2026-03-25 09:00:00', '2026-03-25 10:30:00'),
('SESS-002', 'USR-003', '2026-03-25 08:00:00', '2026-03-25 11:00:00'),
('SESS-003', 'USR-002', '2026-03-25 10:00:00', '2026-03-25 11:15:00');
