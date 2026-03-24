SELECT product_id, COUNT(order_id) AS total_orders, SUM(quantity) AS total_quantity FROM orders_items GROUP BY product_id;
