-- Get all warehouses
SELECT * FROM warehouses;

-- Get warehouse by ID
SELECT * FROM warehouses WHERE id = $1;

-- Get warehouse stock by warehouse ID
SELECT * FROM warehouses_stocks WHERE warehouse_id = $1;
