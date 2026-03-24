SELECT product_id, COUNT(warehouse_id) AS total_warehouses, SUM(quantity) AS total_quantity FROM warehouses_stock GROUP BY product_id;
