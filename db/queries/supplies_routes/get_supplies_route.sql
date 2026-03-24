SELECT order_id, supplier_id, truck_id, estimated_departure, estimated_arrival, actual_arrival FROM supplies_route WHERE order_id = ? AND supplier_id = ?;
