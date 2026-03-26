SELECT oi.order_id, oi.quantity, o.client_id, o.status FROM orders_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = ?;
