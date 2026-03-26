SELECT w.* FROM warehouses w LEFT JOIN warehouses_stock ws ON w.id = ws.warehouse_id WHERE ws.product_id IS NULL;
