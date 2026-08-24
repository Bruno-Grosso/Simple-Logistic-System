-- Get all freight costs
SELECT * FROM freight_cost;

-- Get freight costs by order ID
SELECT * FROM freight_cost WHERE order_id = $1;

-- Insert or update freight cost calculation
INSERT INTO freight_cost (order_id, fuel_cost, labor_cost, maintenance_cost, total_cost, calculated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (order_id) DO UPDATE SET
  fuel_cost = EXCLUDED.fuel_cost,
  labor_cost = EXCLUDED.labor_cost,
  maintenance_cost = EXCLUDED.maintenance_cost,
  total_cost = EXCLUDED.total_cost,
  calculated_at = EXCLUDED.calculated_at
RETURNING *;

-- Get average gas price across warehouses along route for an order
SELECT AVG(w.fuel_price) as avg_gas_price, COUNT(w.id) as warehouses_count
FROM warehouses w
WHERE w.id IN (
  SELECT DISTINCT warehouse_id FROM orders_route WHERE order_id = $1 AND warehouse_id IS NOT NULL
  UNION
  SELECT DISTINCT destination_warehouse_id FROM orders_route WHERE order_id = $1 AND destination_warehouse_id IS NOT NULL
);

-- Get driver wage for assigned truck driver or average driver wage
SELECT COALESCE(
  (SELECT wage FROM users WHERE id = $1 AND role = 'truck_driver'),
  (SELECT AVG(wage) FROM users WHERE role = 'truck_driver'),
  45.0
) as driver_wage;
