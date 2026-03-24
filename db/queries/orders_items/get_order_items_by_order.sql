SELECT order_id, product_id, quantity FROM orders_items WHERE order_id = ? ORDER BY product_id ASC;
