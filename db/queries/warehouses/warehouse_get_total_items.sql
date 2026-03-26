SELECT warehouse_id, SUM(quantity) AS total_items FROM warehouses_stock GROUP BY warehouse_id;
