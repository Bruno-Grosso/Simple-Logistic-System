-- Get all orders
SELECT * FROM orders;

-- Get order by ID
SELECT * FROM orders WHERE id = $1;

-- Get orders by client ID
SELECT * FROM orders WHERE client_id = $1;

-- Update order distance in km from Valhalla or DB calculation
UPDATE orders 
SET distance_km = $2 
WHERE id = $1
RETURNING *;

-- Calculate geodesic distance in km using DB Haversine function
SELECT calculate_distance_km($1, $2, $3, $4) AS distance_km;
