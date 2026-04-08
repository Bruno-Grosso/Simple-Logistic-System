SELECT ws.warehouse_id, ws.quantity, p.id, p.name FROM warehouses_stock ws JOIN products p ON p.id = ws.product_id WHERE p.id = ?;
