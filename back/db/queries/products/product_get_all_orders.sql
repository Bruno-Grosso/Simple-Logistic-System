SELECT oi.order_id, oi.quantity, p.id, p.name FROM orders_items oi JOIN products p ON p.id = oi.product_id;
