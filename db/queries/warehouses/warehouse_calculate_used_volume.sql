SELECT ws.warehouse_id, SUM(ws.quantity * p.volume) AS used_volume FROM warehouses_stock ws JOIN products p ON p.id = ws.product_id GROUP BY ws.warehouse_id;
