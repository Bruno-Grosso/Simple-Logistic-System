SELECT order_id, COUNT(supplier_id) AS total_suppliers FROM supplies_route GROUP BY order_id;
