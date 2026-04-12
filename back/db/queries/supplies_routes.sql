-- Get all supply routes
SELECT * FROM supplies_routes;

-- Get supply routes by order ID
SELECT * FROM supplies_routes WHERE order_id = $1;

-- Get supply routes by supplier ID
SELECT * FROM supplies_routes WHERE supplier_id = $1;
