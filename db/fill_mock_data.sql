-- Comprehensive Mock data for Simple Logistics System
-- Covers ALL tables in the schema
-- Clears existing data first

DELETE FROM truck_maintenance;
DELETE FROM truck_performance_history;
DELETE FROM freight_cost;
DELETE FROM work_log;
DELETE FROM truck_driver;
DELETE FROM refuel_log;
DELETE FROM fuel_price;
DELETE FROM fuel_station;
DELETE FROM supply_route;
DELETE FROM order_route;
DELETE FROM stock_history;
DELETE FROM stock;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM session;
DELETE FROM employee;
DELETE FROM users;
DELETE FROM truck;
DELETE FROM deposit;
DELETE FROM supplier;
DELETE FROM product;

-- 1. Product (8 entries)
INSERT INTO product (id, name, is_cold, is_fragile, expire_date, price, size, volume, weight) VALUES
('PROD-001', 'Fresh Milk', 1, 0, '2026-04-10', 3.50, '10x10x20', 0.002, 1.0),
('PROD-002', 'Crystal Vase', 0, 1, NULL, 45.00, '30x30x40', 0.036, 2.5),
('PROD-003', 'Smartphone X', 0, 0, NULL, 899.99, '15x8x2', 0.00024, 0.2),
('PROD-004', 'Frozen Pizza', 1, 0, '2026-09-20', 5.99, '30x30x3', 0.0027, 0.5),
('PROD-005', 'Office Chair', 0, 0, NULL, 120.00, '60x60x100', 0.36, 12.0),
('PROD-006', 'Gaming Laptop', 0, 1, NULL, 1500.00, '40x30x5', 0.006, 3.0),
('PROD-007', 'Red Wine Box', 0, 1, '2028-12-31', 80.00, '30x20x30', 0.018, 9.0),
('PROD-008', 'Industrial Drill', 0, 0, NULL, 250.00, '40x15x25', 0.015, 5.5);

-- 2. Supplier (3 entries)
INSERT INTO supplier (id, name, address, latitude, longitude) VALUES
('SUP-001', 'Global Tech Corp', '123 Tech Way, San Jose, CA', 37.3382, -121.8863),
('SUP-002', 'Fresh Farms Ltd', '456 Farm Road, Yakima, WA', 46.6021, -120.5059),
('SUP-003', 'Euro Imports', '789 Harbor Dr, Miami, FL', 25.7617, -80.1918);

-- 3. Deposit (3 entries)
INSERT INTO deposit (id, location, size, volume_actual, volume_max, has_refrigeration) VALUES
('WH-001', 'New York Central Hub', '100x100x10', 0.36, 100000.0, 1),
('WH-002', 'Los Angeles West Depot', '50x50x8', 0.0, 20000.0, 0),
('WH-003', 'Chicago Midwest Center', '80x60x10', 0.0, 48000.0, 1);

-- 4. Users (10 entries)
INSERT INTO users (id, name, work_position, password, address, role) VALUES
('USR-001', 'Alice Admin', 'System Administrator', 'admin123', '123 Admin St, NY', 'admin'),
('USR-002', 'Bob Worker', 'Warehouse Operator', 'bobpass', '456 Warehouse Ln, NY', 'worker'),
('USR-003', 'Charlie Driver', 'Senior Truck Driver', 'trucker1', '789 Road Dr, NJ', 'worker'),
('USR-004', 'David Client', 'Procurement Manager', 'client789', '101 Customer Ave, PA', 'client'),
('USR-005', 'Eve Client', 'Individual Buyer', 'evepass', '202 Buyer Rd, CT', 'client'),
('USR-006', 'Frank Driver', 'Junior Driver', 'frank123', '333 Elm St, NY', 'worker'),
('USR-007', 'Grace Worker', 'Stock Clerk', 'gracepass', '444 Oak St, IL', 'worker'),
('USR-008', 'Henry Client', 'Store Owner', 'henry789', '555 Market St, TX', 'client'),
('USR-009', 'Ivy Client', 'Tech Startup', 'ivypass', '666 Cloud St, CA', 'client'),
('USR-010', 'Jack Worker', 'Maintenance Tech', 'jackpass', '777 Bolt Ave, CA', 'worker');

-- 5. Employee (5 entries)
INSERT INTO employee (id, user_id, is_able, deposit_id, max_work_hours_per_day, hourly_cost) VALUES
('EMP-001', 'USR-002', 1, 'WH-001', 8.0, 25.0),
('EMP-002', 'USR-003', 1, 'WH-001', 10.0, 30.0),
('EMP-003', 'USR-006', 1, 'WH-002', 10.0, 28.0),
('EMP-004', 'USR-007', 1, 'WH-003', 8.0, 22.0),
('EMP-005', 'USR-010', 1, 'WH-002', 8.0, 35.0);

-- 6. Truck (4 entries)
-- Truck 1: Parked at WH-001
INSERT INTO truck (id, model, size, volume_actual, volume_max, weight_actual, weight_max, estimated_time, is_delivering, is_valid, is_traveling, current_deposit_id, has_refrigeration, speed, fuel_capacity, fuel_current, fuel_consumption, wear_percentage, wear_rate) VALUES
('TRK-001', 'Volvo FH16', '13.6x2.5x2.7', 0.0, 90.0, 0.0, 25000.0, NULL, 0, 1, 0, 'WH-001', 1, 85.0, 500.0, 450.0, 0.3, 5.0, 0.01);

-- Truck 2: Traveling from WH-001 to WH-002
INSERT INTO truck (id, model, size, volume_actual, volume_max, weight_actual, weight_max, estimated_time, is_delivering, is_valid, is_traveling, origin_deposit_id, destination_deposit_id, has_refrigeration, speed, fuel_capacity, fuel_current, fuel_consumption, wear_percentage, wear_rate) VALUES
('TRK-002', 'Scania R500', '13.6x2.5x2.7', 0.036, 90.0, 2.5, 25000.0, '2026-03-26 14:00:00', 1, 1, 1, 'WH-001', 'WH-002', 0, 80.0, 600.0, 300.0, 0.35, 12.0, 0.02);

-- Truck 3: Parked at WH-003
INSERT INTO truck (id, model, size, volume_actual, volume_max, weight_actual, weight_max, estimated_time, is_delivering, is_valid, is_traveling, current_deposit_id, has_refrigeration, speed, fuel_capacity, fuel_current, fuel_consumption, wear_percentage, wear_rate) VALUES
('TRK-003', 'MAN TGX', '13.6x2.5x2.7', 0.0, 90.0, 0.0, 25000.0, NULL, 0, 1, 0, 'WH-003', 1, 82.0, 550.0, 500.0, 0.32, 2.0, 0.015);

-- Truck 4: Invalid/Maintenance
INSERT INTO truck (id, model, size, volume_actual, volume_max, weight_actual, weight_max, estimated_time, is_delivering, is_valid, is_traveling, current_deposit_id, has_refrigeration, speed, fuel_capacity, fuel_current, fuel_consumption, wear_percentage, wear_rate) VALUES
('TRK-004', 'Iveco S-Way', '12x2.4x2.5', 0.0, 72.0, 0.0, 18000.0, NULL, 0, 0, 0, 'WH-002', 0, 75.0, 400.0, 50.0, 0.28, 95.0, 0.05);

-- 7. Truck Driver Assignment (3 entries)
INSERT INTO truck_driver (truck_id, employee_id, assigned_at) VALUES
('TRK-001', 'EMP-002', '2026-03-25 08:00:00'),
('TRK-002', 'EMP-003', '2026-03-24 10:00:00'),
('TRK-003', 'EMP-002', '2026-03-25 12:00:00');

-- 8. Orders (5 entries)
INSERT INTO orders (id, final_destination, sender_id, receiver_id, time_limit, price, status, client_id, supplier_id, supplier_delivery) VALUES
('ORD-001', '101 Customer Ave, PA', 'USR-004', 'USR-005', '2026-03-30', 50.00, 'Pending', 'USR-004', 'SUP-002', 0),
('ORD-002', '202 Buyer Rd, CT', 'USR-005', 'USR-004', '2026-03-28', 950.00, 'Shipped', 'USR-005', 'SUP-001', 1),
('ORD-003', '101 Customer Ave, PA', 'USR-004', 'USR-004', '2026-03-20', 15.00, 'Delivered', 'USR-004', NULL, 1),
('ORD-004', '555 Market St, TX', 'USR-008', 'USR-008', '2026-04-05', 2400.00, 'Pending', 'USR-008', 'SUP-003', 0),
('ORD-005', '666 Cloud St, CA', 'USR-009', 'USR-009', '2026-04-02', 120.00, 'Cancelled', 'USR-009', NULL, 1);

-- 9. Order Items (8 entries)
INSERT INTO order_items (order_id, product_id, quantity) VALUES
('ORD-001', 'PROD-001', 5),
('ORD-002', 'PROD-003', 1),
('ORD-002', 'PROD-002', 1),
('ORD-003', 'PROD-004', 2),
('ORD-004', 'PROD-006', 2),
('ORD-004', 'PROD-007', 10),
('ORD-005', 'PROD-005', 1),
('ORD-001', 'PROD-004', 3);

-- 10. Stock (5 entries)
INSERT INTO stock (id, product_id, quantity, deposit_id, truck_id, order_id, arrived_at) VALUES
('STK-001', 'PROD-005', 1, 'WH-001', NULL, NULL, '2026-03-20 09:00:00'),
('STK-002', 'PROD-002', 1, NULL, 'TRK-002', 'ORD-002', '2026-03-25 10:00:00'),
('STK-003', 'PROD-008', 50, 'WH-003', NULL, NULL, '2026-03-22 15:00:00'),
('STK-004', 'PROD-001', 100, 'WH-001', NULL, NULL, '2026-03-24 08:30:00'),
('STK-005', 'PROD-003', 2, NULL, 'TRK-002', 'ORD-002', '2026-03-25 10:00:00');

-- 11. Stock History (2 entries)
INSERT INTO stock_history (id, stock_id, quantity, deposit_id, truck_id, order_id, moved_by, moved_at) VALUES
('HIST-001', 'STK-001', 1, 'WH-001', NULL, NULL, 'USR-002', '2026-03-20 09:00:00'),
('HIST-002', 'STK-002', 1, NULL, 'TRK-002', 'ORD-002', 'USR-002', '2026-03-25 10:00:00');

-- 12. Order Route (3 steps)
INSERT INTO order_route (order_id, step, deposit_id, truck_id, estimated_time, arrived_at) VALUES
('ORD-002', 1, 'WH-001', 'TRK-002', '2026-03-26 14:00:00', NULL),
('ORD-003', 1, 'WH-001', NULL, NULL, '2026-03-19 10:00:00'),
('ORD-004', 1, 'WH-003', 'TRK-003', '2026-04-01 10:00:00', NULL);

-- 13. Supply Route (2 entries)
INSERT INTO supply_route (order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival) VALUES
('ORD-001', 'SUP-002', 'TRK-001', '2026-03-26 08:00:00', '2026-03-26 12:00:00', NULL),
('ORD-004', 'SUP-003', 'TRK-003', '2026-03-28 09:00:00', '2026-03-30 15:00:00', NULL);

-- 14. Freight Cost (2 entries)
INSERT INTO freight_cost (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at) VALUES
('ORD-003', 25.0, 40.0, 5.0, 70.0, '2026-03-20 11:00:00'),
('ORD-002', 150.0, 300.0, 45.0, 495.0, '2026-03-25 10:30:00');

-- 15. Session (3 entries)
INSERT INTO session (session_id, user_id, login_time, expires_at, is_active) VALUES
('SESS-001', 'USR-001', '2026-03-25 09:00:00', '2026-03-25 17:00:00', 1),
('SESS-002', 'USR-003', '2026-03-25 08:00:00', '2026-03-25 16:00:00', 1),
('SESS-003', 'USR-002', '2026-03-25 10:00:00', '2026-03-25 18:00:00', 1);

-- 16. Fuel Station & Price (2 stations)
INSERT INTO fuel_station (id, name, location, latitude, longitude, is_partner) VALUES
('FST-001', 'Shell Central', 'Main St 1, NY', 40.7128, -74.0060, 1),
('FST-002', 'Texaco West', 'Highway 10, LA', 34.0522, -118.2437, 0);

INSERT INTO fuel_price (station_id, price_per_liter, recorded_at) VALUES
('FST-001', 1.25, '2026-03-25 07:00:00'),
('FST-002', 1.35, '2026-03-25 07:30:00');

-- 17. Refuel Log (2 entries)
INSERT INTO refuel_log (id, truck_id, station_id, liters, price_per_liter, refueled_at) VALUES
('LOG-001', 'TRK-001', 'FST-001', 150.0, 1.25, '2026-03-24 18:00:00'),
('LOG-002', 'TRK-002', 'FST-002', 200.0, 1.35, '2026-03-23 12:00:00');

-- 18. Work Log (3 entries)
INSERT INTO work_log (id, employee_id, truck_id, start_time, end_time) VALUES
('WORK-001', 'EMP-002', 'TRK-001', '2026-03-24 08:00:00', '2026-03-24 17:00:00'),
('WORK-002', 'EMP-003', 'TRK-002', '2026-03-24 09:00:00', NULL),
('WORK-003', 'EMP-004', NULL, '2026-03-25 08:00:00', NULL);

-- 19. Truck Performance History (2 entries)
INSERT INTO truck_performance_history (id, truck_id, total_distance, fuel_consumed, orders_completed, maintenance_count, wear_percentage, recorded_at) VALUES
('PERF-001', 'TRK-001', 12000.0, 3600.0, 45, 2, 5.0, '2026-03-01 00:00:00'),
('PERF-002', 'TRK-002', 8500.0, 2975.0, 30, 1, 12.0, '2026-03-01 00:00:00');

-- 20. Truck Maintenance (1 entry)
INSERT INTO truck_maintenance (id, truck_id, type, description, cost, wear_before, wear_after, performed_at) VALUES
('MAINT-001', 'TRK-004', 'Engine Overhaul', 'Major repair due to failure', 4500.0, 99.0, 15.0, '2026-03-15 10:00:00');
