SELECT tc.truck_id, tc.product_id, tc.quantity, p.name FROM trucks_cargo tc JOIN products p ON p.id = tc.product_id WHERE tc.truck_id = ?;
