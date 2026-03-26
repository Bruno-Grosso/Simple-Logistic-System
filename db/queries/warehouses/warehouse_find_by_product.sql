SELECT w.id, w.location, ws.quantity FROM warehouses w JOIN warehouses_stock ws ON w.id = ws.warehouse_id WHERE ws.product_id = ?;
