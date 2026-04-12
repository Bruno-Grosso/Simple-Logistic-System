-- Get all order items
SELECT * FROM orders_items;

-- Get items by order ID
SELECT * FROM orders_items WHERE order_id = $1;

-- Get items by product ID
SELECT * FROM orders_items WHERE product_id = $1;
