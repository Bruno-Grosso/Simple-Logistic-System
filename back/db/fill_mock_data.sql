-- Updated Mock data for Simple Logistics System
-- Aligned with the schema in db/db.sql and dbdocumentation.md

-- 1. Products (8 entries)
INSERT INTO products (id, name, is_cold, is_fragile, expire_date, price, size, volume, weight) VALUES
('PROD-001', 'Fresh Milk', 1, 0, '2026-04-10', 3.50, '{"length":10,"width":10,"height":20}', 0.002, 1.0),
('PROD-002', 'Crystal Vase', 0, 1, NULL, 45.00, '{"length":30,"width":30,"height":40}', 0.036, 2.5),
('PROD-003', 'Smartphone X', 0, 0, NULL, 899.99, '{"length":15,"width":8,"height":2}', 0.00024, 0.2),
('PROD-004', 'Frozen Pizza', 1, 0, '2026-09-20', 5.99, '{"length":30,"width":30,"height":3}', 0.0027, 0.5),
('PROD-005', 'Office Chair', 0, 0, NULL, 120.00, '{"length":60,"width":60,"height":100}', 0.36, 12.0),
('PROD-006', 'Gaming Laptop', 0, 1, NULL, 1500.00, '{"length":40,"width":30,"height":5}', 0.006, 3.0),
('PROD-007', 'Red Wine Box', 0, 1, '2028-12-31', 80.00, '{"length":30,"width":20,"height":30}', 0.018, 9.0),
('PROD-008', 'Industrial Drill', 0, 0, NULL, 250.00, '{"length":40,"width":15,"height":25}', 0.015, 5.5);

-- 2. Suppliers (3 entries)
INSERT INTO suppliers (id, name, location) VALUES
('SUP-001', 'Horta Serrana Hortifruti', 'Av. Feliciano Sodré, Teresópolis, RJ'),
('SUP-002', 'Queijaria Suíça Friburgo', 'Circuito Terê-Fri, Nova Friburgo, RJ'),
('SUP-003', 'Distribuidora Imperial', 'Rua do Imperador, Petrópolis, RJ');

-- 3. Warehouses (3 entries)
INSERT INTO warehouses (id, location, size, volume_current, volume_max, has_refrigeration, fuel_price, truck_capacity) VALUES
('WH-001', '{"latitude":-22.3842,"longitude":-43.1311,"label":"Petrópolis Hub (Itaipava)"}', '{"length":100,"width":100,"height":10}', 0.36, 100000.0, 1, 5.89, 5),
('WH-002', '{"latitude":-22.4350,"longitude":-42.9800,"label":"Teresópolis Depot (Alto)"}', '{"length":50,"width":50,"height":8}', 0.0, 20000.0, 0, 6.15, 2),
('WH-003', '{"latitude":-22.3000,"longitude":-42.5400,"label":"Nova Friburgo Facility (Olaria)"}', '{"length":80,"width":60,"height":10}', 0.0, 48000.0, 1, 5.95, 4);

-- 4. Users (10 entries)
INSERT INTO users (id, name, password, address, role, wage) VALUES
('USR-001', 'Alice Admin', 'admin123', '{"address": "Rua do Imperador, Centro, Petrópolis - RJ"}', 'admin', 65.0),
('USR-002', 'Bob Worker', 'bobpass', '{"address": "Estrada União e Indústria, Itaipava, Petrópolis - RJ"}', 'warehouse_worker', 42.0),
('USR-003', 'Charlie Driver', 'trucker1', '{"address": "Av. Alberto Braune, Centro, Nova Friburgo - RJ"}', 'truck_driver', 55.0),
('USR-004', 'David Client', 'client789', '{"address": "Av. Reta da Várzea, Várzea, Teresópolis - RJ"}', 'client', 0.0),
('USR-005', 'Eve Client', 'evepass', '{"address": "Rua Monte Líbano, Centro, Nova Friburgo - RJ"}', 'client', 0.0),
('USR-006', 'Frank Driver', 'frank123', '{"address": "Estrada Terê-Fri, Km 12, Teresópolis - RJ"}', 'truck_driver', 50.0),
('USR-007', 'Grace Worker', 'gracepass', '{"address": "Rua General Osório, Centro, Nova Friburgo - RJ"}', 'warehouse_worker', 40.0),
('USR-008', 'Henry Client', 'henry789', '{"address": "Rua Visconde de Uruguai, Cachoeiras de Macacu - RJ"}', 'client', 0.0),
('USR-009', 'Ivy Client', 'ivypass', '{"address": "Av. Dedo de Deus, Guapimirim - RJ"}', 'client', 0.0),
('USR-010', 'Jack Worker', 'jackpass', '{"address": "Rua Cel. Veiga, Petrópolis - RJ"}', 'warehouse_worker', 38.0);

-- 5. Trucks (4 entries)
INSERT INTO trucks (id, model, speed, is_valid, is_delivering, size, volume_current, volume_max, weight_current, weight_max, has_refrigeration, current_warehouse_id, fuel_capacity, fuel_current, fuel_consumption, truck_maintenance) VALUES
('TRK-001', 'Volvo FH16', 85.0, 1, 0, '{"length":13.6,"width":2.5,"height":2.7}', 0.0, 90.0, 0.0, 25000.0, 1, 'WH-001', 500.0, 450.0, 0.3, 2),
('TRK-002', 'Scania R500', 80.0, 1, 1, '{"length":13.6,"width":2.5,"height":2.7}', 0.036, 90.0, 2.5, 25000.0, 0, NULL, 600.0, 300.0, 0.35, 1),
('TRK-003', 'MAN TGX', 82.0, 1, 0, '{"length":13.6,"width":2.5,"height":2.7}', 0.0, 90.0, 0.0, 25000.0, 1, 'WH-003', 550.0, 500.0, 0.32, 0),
('TRK-004', 'Iveco S-Way', 75.0, 1, 0, '{"length":12,"width":2.4,"height":2.5}', 0.0, 72.0, 0.0, 18000.0, 0, 'WH-002', 400.0, 380.0, 0.28, 1);

UPDATE trucks SET origin_warehouse_id = 'WH-001', destination_warehouse_id = 'WH-002', estimated_time = '2026-03-26 14:00:00' WHERE id = 'TRK-002';

-- 6. Warehouses Stock (5 entries)
INSERT INTO warehouses_stock (warehouse_id, product_id, quantity) VALUES
('WH-001', 'PROD-005', 10),
('WH-003', 'PROD-008', 50),
('WH-001', 'PROD-001', 100),
('WH-002', 'PROD-004', 20),
('WH-003', 'PROD-002', 5);

-- 7. Orders (5 entries)
INSERT INTO orders (id, client_id, final_destination, time_limit, price, status, supplier_id, supplier_delivery) VALUES
('ORD-001', 'USR-004', 'Av. Reta da Várzea, Várzea, Teresópolis - RJ', '2026-03-30', 50.00, 'Pending', 'SUP-002', 0),
('ORD-002', 'USR-005', 'Rua Monte Líbano, Centro, Nova Friburgo - RJ', '2026-03-28', 950.00, 'Shipped', 'SUP-001', 1),
('ORD-003', 'USR-004', 'Av. Reta da Várzea, Várzea, Teresópolis - RJ', '2026-03-20', 15.00, 'Delivered', NULL, 1),
('ORD-004', 'USR-008', 'Rua Visconde de Uruguai, Cachoeiras de Macacu - RJ', '2026-04-05', 2400.00, 'Pending', 'SUP-003', 0),
('ORD-005', 'USR-009', 'Av. Dedo de Deus, Guapimirim - RJ', '2026-04-02', 120.00, 'Canceled', NULL, 1);

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
