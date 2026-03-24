SELECT order_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM orders_items GROUP BY order_id;
