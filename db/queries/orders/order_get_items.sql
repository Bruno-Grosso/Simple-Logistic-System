SELECT oi.order_id, oi.product_id, oi.quantity, p.name FROM orders_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?;
