SELECT truck_id, COUNT(product_id) AS total_products, SUM(quantity) AS total_quantity FROM trucks_cargo GROUP BY truck_id;
