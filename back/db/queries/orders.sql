-- Get all orders
SELECT * FROM orders;

-- Get order by ID
SELECT * FROM orders WHERE id = $1;

-- Get orders by client ID
SELECT * FROM orders WHERE client_id = $1;

-- Update order distance in km from Valhalla
UPDATE orders 
SET distance_km = $1 
WHERE id = $2;
