// USERS
LOAD CSV WITH HEADERS FROM 'file:///users.csv' AS row
MERGE (u:User {id: trim(toString(row.id))})
SET u.name = row.name, u.password = row.password, u.address = row.address, u.role = row.role;

// PRODUCTS
LOAD CSV WITH HEADERS FROM 'file:///products.csv' AS row
MERGE (p:Product {id: trim(toString(row.id))})
SET p.name = row.name,
    p.refrigeration = CASE WHEN toLower(trim(row.refrigeration)) IN ['true','1','yes'] THEN true ELSE false END,
    p.fragile = CASE WHEN toLower(trim(row.fragile)) IN ['true','1','yes'] THEN true ELSE false END,
    p.weight = toFloat(row.weight),
    p.length = toFloat(row.length), p.width = toFloat(row.width), p.height = toFloat(row.height),
    p.volume = toFloat(row.volume), // Mantido conforme original, mas note o risco de inconsistência
    p.price = toFloat(row.price),
    p.expire_date = CASE WHEN trim(row.expire_date) IS NOT NULL AND trim(row.expire_date) <> ''
                    THEN date(trim(row.expire_date)) ELSE null END;

// WAREHOUSES
LOAD CSV WITH HEADERS FROM 'file:///warehouses.csv' AS row
MERGE (w:Warehouse {id: trim(toString(row.id))})
SET w.address = row.address,
    w.location = point({latitude: toFloat(row.latitude), longitude: toFloat(row.longitude)}),
    w.refrigeration = CASE WHEN toLower(trim(row.refrigeration)) IN ['true','1','yes'] THEN true ELSE false END,
    w.volume_current = toFloat(row.volume_current),
    w.volume_max = toFloat(row.volume_max),
    w.fuel_price = toFloat(row.fuel_price),
    w.length = toFloat(row.length), w.width = toFloat(row.width), w.height = toFloat(row.height);

// TRUCK MODELS
LOAD CSV WITH HEADERS FROM 'file:///truck_model.csv' AS row
MERGE (tm:TruckModel {id: trim(toString(row.id))})
SET tm.name = row.name,
    tm.weight_max = toFloat(row.weight_max),
    tm.volume_max = toFloat(row.volume_max),
    tm.fuel_capacity = toFloat(row.fuel_capacity),
    tm.fuel_consumption = toFloat(row.fuel_consumption),
    tm.refrigeration = CASE WHEN toLower(trim(row.refrigeration)) IN ['true','1','yes'] THEN true ELSE false END,
    tm.speed = toFloat(row.speed),
    tm.length = toFloat(row.length), tm.width = toFloat(row.width), tm.height = toFloat(row.height);

// TRUCKS
LOAD CSV WITH HEADERS FROM 'file:///trucks.csv' AS row
MERGE (t:Truck {id: trim(toString(row.id))})
SET t.is_valid = CASE WHEN toLower(trim(row.is_valid)) IN ['true','1','yes'] THEN true ELSE false END,
    t.is_delivering = CASE WHEN toLower(trim(row.is_delivering)) IN ['true','1','yes'] THEN true ELSE false END,
    t.volume_current = toFloat(row.volume_current),
    t.weight_current = toFloat(row.weight_current),
    t.current_location = point({latitude: toFloat(row.current_latitude), longitude: toFloat(row.current_longitude)}),
    t.fuel_current = toFloat(row.fuel_current),
    t.maintenance_level = toInteger(row.maintenance),
    t.time_expected = CASE WHEN row.time_expected IS NOT NULL AND trim(row.time_expected) <> ''
                      THEN datetime(replace(trim(row.time_expected), ' ', 'T')) ELSE null END;

// SUPPLIERS
LOAD CSV WITH HEADERS FROM 'file:///suppliers.csv' AS row
MERGE (s:Supplier {id: trim(toString(row.id))})
SET s.name = row.name, s.location = row.location;

// ORDERS
LOAD CSV WITH HEADERS FROM 'file:///orders.csv' AS row
MERGE (o:Order {id: trim(toString(row.id))})
SET o.price = toFloat(row.price),
    o.status = row.status,
    o.destination_address = row.destination_address,
    o.supplier_delivered = CASE WHEN toLower(trim(row.supplier_delivered)) IN ['true','1','yes'] THEN true ELSE false END,
    o.time_limit = CASE WHEN trim(row.time_limit) IS NOT NULL AND trim(row.time_limit) <> ''
                   THEN datetime(replace(trim(row.time_limit), ' ', 'T')) ELSE null END,
    o.time_expected = CASE WHEN trim(row.time_expected) IS NOT NULL AND trim(row.time_expected) <> ''
                      THEN datetime(replace(trim(row.time_expected), ' ', 'T')) ELSE null END;
