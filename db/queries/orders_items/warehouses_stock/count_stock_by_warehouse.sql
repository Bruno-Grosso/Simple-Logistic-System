SELECT warehouse_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM warehouses_stock GROUP BY warehouse_id;
