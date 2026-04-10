// SESSIONS -> USER
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/online_users.csv' AS row
MATCH (u:User {id: trim(toString(row.user_id))})
MERGE (s:Session {id: trim(toString(row.session_id))})
SET s.login = CASE 
        WHEN trim(row.time_login) <> '' 
        THEN datetime(replace(trim(row.time_login), ' ', 'T')) 
        ELSE null END,
    s.last_activity = CASE 
        WHEN trim(row.time_last_activity) <> '' 
        THEN datetime(replace(trim(row.time_last_activity), ' ', 'T')) 
        ELSE null END
MERGE (u)-[:HAS_SESSION]->(s);

// WAREHOUSE STOCKS PRODUCT
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/warehouse_cargo.csv' AS row
MATCH (w:Warehouse {id: trim(toString(row.id))})
MATCH (p:Product {id: trim(toString(row.product_id))})
MERGE (w)-[r:STOCKS]->(p)
SET r.quantity = toInteger(row.quantity),
    r.volume_occupied = toFloat(row.volume_occupied),
    r.arrived = CASE 
        WHEN trim(row.arrived) <> '' 
        THEN datetime(replace(trim(row.arrived), ' ', 'T')) 
        ELSE null END;

// TRUCK IS_MODEL & WAREHOUSE LINKS
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/trucks.csv' AS row
MATCH (t:Truck {id: trim(toString(row.id))})
MATCH (tm:TruckModel {id: trim(toString(row.model_id))})
MERGE (t)-[:IS_MODEL]->(tm)

WITH t, row
CALL {
    WITH t, row
    WITH t, row WHERE trim(row.origin) <> ''
    MATCH (wo:Warehouse {id: trim(toString(row.origin))})
    MERGE (t)-[:STARTS_AT]->(wo)
}

WITH t, row
CALL {
    WITH t, row
    WITH t, row WHERE trim(row.destination) <> ''
    MATCH (wd:Warehouse {id: trim(toString(row.destination))})
    MERGE (t)-[:HEADING_TO]->(wd)
};

// TRUCK CARGO
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/truck_cargo.csv' AS row
MATCH (t:Truck {id: trim(toString(row.id))})
MATCH (p:Product {id: trim(toString(row.product_id))})
MERGE (t)-[r:CARRIES]->(p)
SET r.quantity = toInteger(row.quantity),
    r.volume_occupied = toFloat(row.volume_occupied),
    r.weight_occupied = toFloat(row.weight_occupied),
    r.arrived_at = CASE 
        WHEN trim(row.arrived) <> '' 
        THEN datetime(replace(trim(row.arrived), ' ', 'T')) 
        ELSE null END;

// SUPPLIER -> WAREHOUSE
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/suppliers.csv' AS row
MATCH (s:Supplier {id: trim(toString(row.id))})
WITH s, row WHERE trim(row.destination) <> ''
MATCH (w:Warehouse {id: trim(toString(row.destination))})
MERGE (s)-[r:SUPPLIES_TO]->(w)
SET r.time_departed = CASE 
        WHEN trim(row.time_departed) <> '' 
        THEN datetime(replace(trim(row.time_departed), ' ', 'T')) 
        ELSE null END,
    r.expected_arrival = CASE 
        WHEN trim(row.time_arrived_estimated) <> '' 
        THEN datetime(replace(trim(row.time_arrived_estimated), ' ', 'T')) 
        ELSE null END;

// ORDER CONNECTIONS
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/orders.csv' AS row
MATCH (o:Order {id: trim(toString(row.id))})

WITH o, row
CALL {
    WITH o, row 
    WITH o, row WHERE trim(row.client_id) <> ''
    MATCH (u:User {id: trim(toString(row.client_id))}) 
    MERGE (u)-[:PLACED]->(o)
}

WITH o, row
CALL {
    WITH o, row 
    WITH o, row WHERE trim(row.supplier_id) <> ''
    MATCH (s:Supplier {id: trim(toString(row.supplier_id))}) 
    MERGE (s)-[:SUPPLIES_ORDER]->(o)
}

WITH o, row
CALL {
    WITH o, row 
    WITH o, row WHERE trim(row.truck_id) <> ''
    MATCH (t:Truck {id: trim(toString(row.truck_id))}) 
    MERGE (t)-[:DELIVERING]->(o)
};

// ORDER ROUTE
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/order_route.csv' AS row
MATCH (o:Order {id: trim(toString(row.order_id))})
MATCH (w:Warehouse {id: trim(toString(row.warehouse_id))})
MERGE (o)-[r:STOPS_AT]->(w)
SET r.stop_order = toInteger(row.stop_order);

// ORDER ITEMS
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/order_items.csv' AS row
MATCH (o:Order {id: trim(toString(row.order_id))})
MATCH (p:Product {id: trim(toString(row.product_id))})
MERGE (o)-[i:HAS_ITEM]->(p)
SET i.quantity = toInteger(row.quantity),
    i.price_at_sale = toFloat(row.price);

// FREIGHTS
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/back/db/data/freights.csv' AS row
MATCH (o:Order {id: trim(toString(row.order_id))})
MERGE (f:Freight {id: trim(toString(row.order_id))})
SET f.cost_fuel = toFloat(row.cost_fuel),
    f.cost_labor = toFloat(row.cost_labor),
    f.cost_extra = toFloat(row.cost_extra),
    f.cost_total = toFloat(row.cost_total),
    f.departure_calculated = CASE 
        WHEN trim(row.calculated) <> '' 
        THEN datetime(replace(trim(row.calculated), ' ', 'T')) 
        ELSE null END
MERGE (o)-[:HAS_FREIGHT]->(f);
