SELECT p.id, p.name, ws.quantity FROM warehouses_stock ws JOIN products p ON p.id = ws.product_id WHERE ws.warehouse_id = ?;
