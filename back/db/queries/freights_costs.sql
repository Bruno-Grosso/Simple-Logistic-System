-- Get all freight costs
SELECT * FROM freights_costs;

-- Get freight costs by order ID
SELECT * FROM freights_costs WHERE order_id = $1;
