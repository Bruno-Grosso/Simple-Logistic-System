SELECT product_id, COUNT(truck_id) AS total_trucks, SUM(quantity) AS total_quantity FROM trucks_cargo GROUP BY product_id;
