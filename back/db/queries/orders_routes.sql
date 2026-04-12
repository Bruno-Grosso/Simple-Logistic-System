-- Get all routes for an order
SELECT * FROM orders_routes WHERE order_id = $1;

-- Get all routes for a truck
SELECT * FROM orders_routes WHERE truck_id = $1;
