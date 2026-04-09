//REALLY BE CAREFUL TO CHECK THE ARQUIVES PATH!!! FIX IT IF IN YOUR PC THE PATH IS DIFFERENT!

LOAD CSV WITH HEADERS FROM 'file:///users.csv' AS row
MERGE (u:User {id: row.id})
SET u.name = row.name,
    u.password = row.password,
    u.address = row.address,
    u.role = row.role;

LOAD CSV WITH HEADERS FROM 'file:///online_users.csv' AS row
MERGE (s:Session {id: row.session_id})
SET s.login = datetime(replace(row.time_login, ' ', 'T')),
    s.last_activity = datetime(replace(row.time_last_activity, ' ', 'T'))
WITH s, row
MATCH (u:User {id: row.user_id})
MERGE (u)-[:HAS_SESSION]->(s);

LOAD CSV WITH HEADERS FROM 'file:///products.csv' AS row
MERGE (p:Product {id: row.id})
SET p.name = row.name,
    p.refrigeration = toBoolean(row.refrigeration),
    p.fragile = toBoolean(row.fragile),
    p.weight = toFloat(row.weight),
    p.length = toFloat(row.length),
    p.width = toFloat(row.width),
    p.height = toFloat(row.height),
    p.volume = toFloat(row.volume),
    p.price = toFloat(row.price),
    p.expire_date = CASE WHEN row.expire_date IS NOT NULL AND row.expire_date <> ''
                    THEN date(row.expire_date)
                    ELSE null END;

LOAD CSV WITH HEADERS FROM 'file:///warehouses.csv' AS row
MERGE (w:Warehouse {id: row.id})
SET w.address = row.address,
    w.latitude = toFloat(row.latitude),
    w.longitude = toFloat(row.longitude),
    w.refrigeration = toBoolean(row.refrigeration),
    w.volume_current = toFloat(row.volume_current),
    w.volume_max = toFloat(row.volume_max),
    w.fuel_price = toFloat(row.fuel_price),
    w.length = toFloat(row.length),
    w.width = toFloat(row.width),
    w.height = toFloat(row.height);

LOAD CSV WITH HEADERS FROM 'file:///warehouse_cargo.csv' AS row
MATCH (w:Warehouse {id: row.id})
MATCH (p:Product {id: row.product_id})
MERGE (w)-[r:STOCKS]->(p)
SET r.quantity = toInteger(row.quantity),
    r.volume_occupied = toFloat(row.volume_occupied),
    r.arrived = CASE WHEN row.arrived IS NOT NULL AND row.arrived <> ''
                THEN date(row.arrived)
                ELSE null END;

LOAD CSV WITH HEADERS FROM 'file:///truck_model.csv' AS row
MERGE (tm:TruckModel {id: row.id})
SET tm.weight_max = toFloat(row.weight_max),
    tm.volume_max = toFloat(row.volume_max),
    tm.fuel_capacity = toFloat(row.fuel_capacity),
    tm.fuel_consumption = toFloat(row.fuel_consumption),
    tm.refrigeration = toBoolean(row.refrigeration),
    tm.speed = toFloat(row.speed),
    tm.length = toFloat(row.length),
    tm.width = toFloat(row.width),
    tm.height = toFloat(row.height);

LOAD CSV WITH HEADERS FROM 'file:///trucks.csv' AS row
MERGE (t:Truck {id: row.id})
SET t.is_valid = toBoolean(row.is_valid),
    t.is_delivering = toBoolean(row.is_delivering),
    t.volume_current = toFloat(row.volume_current),
    t.weight_current = toFloat(row.weight_current),
    t.current_latitude = toFloat(row.current_latitude),
    t.current_longitude = toFloat(row.current_longitude),
    t.time_expected = CASE WHEN row.time_expected IS NOT NULL AND row.time_expected <> ''
                      THEN datetime(replace(row.time_expected, ' ', 'T'))
                      ELSE null END,
    t.fuel_current = toFloat(row.fuel_current),
    t.maintenance_level = toInteger(row.maintenance)
WITH t, row
MATCH (tm:TruckModel {id: row.model_id})
MERGE (t)-[:IS_MODEL]->(tm);

LOAD CSV WITH HEADERS FROM 'file:///trucks.csv' AS row
WHERE row.origin IS NOT NULL AND row.origin <> ''
MATCH (t:Truck {id: row.id})
MATCH (wo:Warehouse {id: row.origin})
MERGE (t)-[:STARTS_AT]->(wo);

LOAD CSV WITH HEADERS FROM 'file:///trucks.csv' AS row
WHERE row.destination IS NOT NULL AND row.destination <> ''
MATCH (t:Truck {id: row.id})
MATCH (wd:Warehouse {id: row.destination})
MERGE (t)-[:HEADING_TO]->(wd);

LOAD CSV WITH HEADERS FROM 'file:///truck_cargo.csv' AS row
MATCH (t:Truck {id: row.id})
MATCH (p:Product {id: row.product_id})
MERGE (t)-[r:CARRIES]->(p)
SET r.quantity = toInteger(row.quantity),
    r.volume_occupied = toFloat(row.volume_occupied),
    r.weight_occupied = toFloat(row.weight_occupied),
    r.arrived_at = CASE WHEN row.arrived IS NOT NULL AND row.arrived <> ''
                   THEN datetime(replace(row.arrived, ' ', 'T'))
                   ELSE null END;

LOAD CSV WITH HEADERS FROM 'file:///suppliers.csv' AS row
MERGE (s:Supplier {id: row.id})
SET s.name = row.name,
    s.location = row.location
WITH s, row
WHERE row.destination IS NOT NULL AND row.destination <> ''
MATCH (w:Warehouse {id: row.destination})
MERGE (s)-[r:SUPPLIES_TO]->(w)
SET r.time_departed = CASE WHEN row.time_departed IS NOT NULL AND row.time_departed <> ''
                      THEN datetime(replace(row.time_departed, ' ', 'T'))
                      ELSE null END,
    r.expected_arrival = CASE WHEN row.time_arrived_estimated IS NOT NULL AND row.time_arrived_estimated <> ''
                         THEN datetime(replace(row.time_arrived_estimated, ' ', 'T'))
                         ELSE null END;

LOAD CSV WITH HEADERS FROM 'file:///orders.csv' AS row
MERGE (o:Order {id: row.id})
SET o.price = toFloat(row.price),
    o.status = row.status,
    o.time_limit = CASE WHEN row.time_limit IS NOT NULL AND row.time_limit <> ''
                   THEN datetime(replace(row.time_limit, ' ', 'T'))
                   ELSE null END,
    o.time_expected = CASE WHEN row.time_expected IS NOT NULL AND row.time_expected <> ''
                      THEN datetime(replace(row.time_expected, ' ', 'T'))
                      ELSE null END,
    o.destination_address = row.destination_address,
    o.supplier_delivered = toBoolean(row.supplier_delivered)
WITH o, row
MATCH (u:User {id: row.client_id})
MERGE (u)-[:PLACED]->(o)
WITH o, row
MATCH (s:Supplier {id: row.supplier_id})
MERGE (s)-[:SUPPLIES_ORDER]->(o)
WITH o, row
WHERE row.truck_id IS NOT NULL AND row.truck_id <> ''
MATCH (t:Truck {id: row.truck_id})
MERGE (t)-[:DELIVERING]->(o);

LOAD CSV WITH HEADERS FROM 'file:///order_route.csv' AS row
WHERE row.order_id IS NOT NULL AND row.order_id <> ''
AND row.warehouse_id IS NOT NULL AND row.warehouse_id <> ''
AND row.stop_order IS NOT NULL AND row.stop_order <> ''
MATCH (o:Order {id: row.order_id})
MATCH (w:Warehouse {id: row.warehouse_id})
MERGE (o)-[r:STOPS_AT]->(w)
SET r.stop_order = toInteger(row.stop_order);

LOAD CSV WITH HEADERS FROM 'file:///order_items.csv' AS row
MATCH (o:Order {id: row.order_id})
MATCH (p:Product {id: row.product_id})
MERGE (o)-[i:HAS_ITEM]->(p)
ON CREATE SET i.quantity = toInteger(row.quantity),
              i.price_at_sale = toFloat(row.price);

LOAD CSV WITH HEADERS FROM 'file:///freights.csv' AS row
MATCH (o:Order {id: row.order_id})
MERGE (f:Freight {id: row.id})
SET f.cost_fuel = toFloat(row.cost_fuel),
    f.cost_labor = toFloat(row.cost_labor),
    f.cost_extra = toFloat(row.cost_extra),
    f.cost_total = toFloat(row.cost_total),
    f.departure_calculated = CASE WHEN row.calculated IS NOT NULL AND row.calculated <> ''
                             THEN datetime(replace(row.calculated, ' ', 'T'))
                             ELSE null END
MERGE (o)-[:HAS_FREIGHT]->(f);
