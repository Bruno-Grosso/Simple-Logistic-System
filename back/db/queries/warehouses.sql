-- Get all warehouses
SELECT * FROM warehouses;

-- Get warehouse by ID
SELECT * FROM warehouses WHERE id = $1;

-- Get warehouse stock by warehouse ID
SELECT * FROM warehouses_stock WHERE warehouse_id = $1;

-- Get average gas price across warehouses
SELECT AVG(fuel_price) as avg_fuel_price FROM warehouses;

-- Update warehouse fuel price
UPDATE warehouses SET fuel_price = $2 WHERE id = $1 RETURNING *;
