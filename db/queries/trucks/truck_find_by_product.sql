SELECT t.id, t.model, tc.quantity FROM trucks t JOIN trucks_cargo tc ON t.id = tc.truck_id WHERE tc.product_id = ?;
