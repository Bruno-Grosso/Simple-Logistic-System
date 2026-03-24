SELECT supplier_id, COUNT(order_id) AS total_orders FROM supplies_route GROUP BY supplier_id;
