SELECT DISTINCT w.id, w.location FROM warehouses w JOIN warehouses_stock ws ON w.id = ws.warehouse_id JOIN products p ON p.id = ws.product_id WHERE p.is_fragile = 1;
