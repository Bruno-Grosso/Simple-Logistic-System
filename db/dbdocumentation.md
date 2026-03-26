# Logistics System Database Documentation

---

# TABLE: products

- **id (TEXT)**:  
  This field uniquely identifies each product in the catalog and is used to connect it with stock, orders, and truck cargo.  
  **Example of activity**: If you want to track where a specific product is stored or delivered, query using this ID.  
  **Example value**: `"prod_001"`

- **name (TEXT)**:  
  This field stores the product’s name for identification and display purposes.  
  **Example of activity**: If you want to show product listings to users, retrieve this field.  
  **Example value**: `"Milk 1L"`

- **price (REAL)**:  
  This field defines the monetary value of the product.  
  **Example of activity**: If you want to calculate the total cost of an order, multiply this value by the quantity ordered.  
  **Example value**: `2.50`

- **is_cold (INTEGER 0/1)**:  
  This field indicates whether the product requires refrigerated storage.  
  **Example of activity**: If you want to assign storage, filter warehouses or trucks that support refrigeration.  
  **Example value**: `1`

- **is_fragile (INTEGER 0/1)**:  
  This field indicates whether the product requires careful handling.  
  **Example of activity**: If you want to optimize transport safety, prioritize special handling for fragile items.  
  **Example value**: `0`

- **expire_date (TEXT YYYY-MM-DD or NULL)**:  
  This field stores the expiration date of the product, or `NULL` if it does not expire.  
  **Example of activity**: If you want to prevent shipping expired goods, compare this value with the current date.  
  **Example value**: `"2026-04-15"`

- **size (JSON)**:  
  This field defines the physical dimensions of the product (length, width, height), allowing space calculations.  
  **Example of activity**: If you want to calculate how much space a product occupies in a warehouse or truck, use this value.  
  **Example value**: `{"length":10,"width":5,"height":20}`

- **volume (REAL)**:  
  This field represents the volume of a single unit of the product.  
  **Example of activity**: Multiply by quantity to calculate total occupied space.  
  **Example value**: `1.0`

- **weight (REAL)**:  
  This field represents the weight of a single unit of the product.  
  **Example of activity**: Use this to ensure transport weight limits are not exceeded.  
  **Example value**: `1.05`
---

# TABLE: suppliers

- **id (TEXT)**:  
  This field uniquely identifies each supplier and is used to connect products and supply routes in the system.  
  **Example of activity**: If you want to trace the origin of a product or track a supplier’s deliveries, query using this ID.  
  **Example value**: `"sup_001"`

- **name (TEXT)**:  
  This field stores the supplier’s name for identification and display purposes.  
  **Example of activity**: If you want to display supplier information in the system or on invoices, retrieve this field.  
  **Example value**: `"Fresh Farms Ltd"`

- **location (TEXT)**:  
  This field stores the geographic location of the supplier, typically as a city, region, or full address.  
  **Example of activity**: If you want to estimate delivery times or calculate routes from the supplier to warehouses, use this field.  
  **Example value**: `"Berlin, Germany"`
---

# TABLE: warehouses

- **id (TEXT)**:  
  This field uniquely identifies each warehouse and is used to connect it with trucks, stock, and routes across the system.  
  **Example of activity**: If you want to retrieve all inventory stored in a specific warehouse, query using this ID.  
  **Example value**: `"wh_001"`

- **location (TEXT)**:  
  Geographic coordinates of the supplier (latitude, longitude).  
  **Example of activity**: If you want to calculate distances to delivery addresses or suppliers, use this field.  
  **Example value**: `{"latitude":48.8566,"longitude":2.3522}`  

- **size (JSON)**:  
  This field defines the physical dimensions of the warehouse using length, width, and height, allowing accurate capacity and space calculations.  
  **Example of activity**: If you want to check if a large shipment fits inside a warehouse, calculate the available volume using these values.  
  **Example value**: `{"length":100,"width":50,"height":20}`

- **volume_current (REAL)**:  
  This field stores how much volume is currently occupied inside the warehouse.  
  **Example of activity**: If you want to prevent overloading the warehouse, compare this value with `volume_max`.  
  **Example value**: `500`

- **volume_max (REAL)**:  
  This field defines the maximum storage capacity of the warehouse, typically derived from the size dimensions.  
  **Example of activity**: If you want fast validation before adding new stock, check this value instead of recalculating volume.  
  **Example value**: `1000`

- **has_refrigeration (INTEGER 0/1)**:  
  This field indicates whether the warehouse supports temperature-controlled storage.  
  **Example of activity**: If you want to store perishable goods, filter warehouses where this field is enabled.  
  **Example value**: `1`

- **fuel_price (REAL)**:  
  This field stores the cost of fuel at the warehouse location, useful for estimating transportation expenses.  
  **Example of activity**: If you want to calculate the cheapest refueling option for trucks near this warehouse, use this value.  
  **Example value**: `1.45`

---

# TABLE: warehouses_stock

- **warehouse_id (TEXT)**:  
  This field references the warehouse where the product is stored.  
  **Example of activity**: If you want to check product availability in a specific warehouse, query using this field.  
  **Example value**: `"wh_001"`

- **product_id (TEXT)**:  
  This field references the product stored in the warehouse.  
  **Example of activity**: If you want to find all warehouses storing a particular product, query using this field.  
  **Example value**: `"prod_001"`

- **quantity (INTEGER)**:  
  This field stores the number of units of the product currently available in the warehouse.  
  **Example of activity**: If you want to determine whether a warehouse can fulfill an order, compare this value with the order quantity.  
  **Example value**: `120`
---

# TABLE: trucks

- **id (TEXT)**:  
  This field uniquely identifies each truck in the fleet.  
  **Example of activity**: If you want to assign a truck to a delivery or track its cargo, query using this ID.  
  **Example value**: `"truck_001"`

- **model (TEXT)**:  
  This field stores the truck model or name.  
  **Example of activity**: If you want to check vehicle specifications or compare models, retrieve this field.  
  **Example value**: `"Volvo FH16"`

- **speed (REAL)**:  
  This field stores the average speed of the truck in km/h.  
  **Example of activity**: If you want to estimate delivery times, use this value in route calculations.  
  **Example value**: `80.0`

- **is_valid (INTEGER 0/1)**:  
  Indicates if the truck is operational.  
  **Example of activity**: If you want to filter only usable trucks for deliveries, use this field.  
  **Example value**: `1`

- **is_delivering (INTEGER 0/1)**:  
  Indicates whether the truck is currently on a delivery.  
  **Example of activity**: If you want to check which trucks are free to assign, use this field.  
  **Example value**: `0`

- **size (JSON)**:  
  This field defines the cargo dimensions of the truck.  
  **Example of activity**: If you want to verify whether cargo fits inside the truck, use this value.  
  **Example value**: `{"length":12,"width":2.5,"height":3.5}`

- **volume_current (REAL)**:  
  Current cargo volume loaded in the truck.  
  **Example of activity**: If you want to prevent overloading, compare this with `volume_max`.  
  **Example value**: `10.0`

- **volume_max (REAL)**:  
  Maximum cargo volume the truck can carry.  
  **Example of activity**: Use this to validate if the assigned cargo will fit.  
  **Example value**: `30.0`

- **weight_current (REAL)**:  
  Current cargo weight loaded in the truck.  
  **Example of activity**: If you want to ensure transport weight limits are not exceeded, compare this with `weight_max`.  
  **Example value**: `5000.0`

- **weight_max (REAL)**:  
  Maximum weight the truck can carry.  
  **Example of activity**: Use this to validate if cargo can safely be loaded.  
  **Example value**: `12000.0`

- **has_refrigeration (INTEGER 0/1)**:  
  Indicates if the truck supports temperature-controlled cargo.  
  **Example of activity**: If you want to transport perishable goods, filter trucks with refrigeration.  
  **Example value**: `1`

- **current_warehouse_id (TEXT or NULL)**:  
  Warehouse where the truck is parked if not delivering.  
  **Example of activity**: If you want to locate idle trucks for assignment, query this field.  
  **Example value**: `"wh_001"`

- **origin_warehouse_id (TEXT or NULL)**:  
  Warehouse from which the truck departed for delivery.  
  **Example of activity**: If you want to trace delivery routes, use this field.  
  **Example value**: `"wh_001"`

- **destination_warehouse_id (TEXT or NULL)**:  
  Warehouse to which the truck is heading.  
  **Example of activity**: If you want to track in-transit cargo, use this field.  
  **Example value**: `"wh_002"`

- **estimated_time (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  Estimated delivery or arrival time.  
  **Example of activity**: If you want to calculate expected delivery schedules, use this value.  
  **Example value**: `"2026-03-27 15:30:00"`

- **fuel_capacity (REAL)**:  
  Maximum fuel the truck can hold (liters).  
  **Example of activity**: Use this to plan refueling for long routes.  
  **Example value**: `400.0`

- **fuel_current (REAL)**:  
  Current fuel amount in the truck.  
  **Example of activity**: If you want to check whether the truck can complete a delivery, compare with consumption.  
  **Example value**: `250.0`

- **fuel_consumption (REAL)**:  
  Average fuel consumption in liters per 100 km.  
  **Example of activity**: If you want to estimate fuel costs for a delivery, use this value.  
  **Example value**: `30.0`

- **truck_maintenance (INTEGER)**:  
  Number of maintenance events performed on the truck.  
  **Example of activity**: If you want to schedule preventive maintenance, check this field.  
  **Example value**: `3`

---

# TABLE: users

- **id (TEXT)**:  
  This field uniquely identifies each user in the system.  
  **Example of activity**: If you want to assign orders or track user activity, query using this ID.  
  **Example value**: `"user_001"`

- **name (TEXT)**:  
  This field stores the user’s full name.  
  **Example of activity**: If you want to display user information in orders or reports, use this field.  
  **Example value**: `"Alice Müller"`

- **password (TEXT)**:  
  This field stores the user’s hashed password for authentication.  
  **Example of activity**: If you want to validate login credentials, compare the hash of the entered password with this value.  
  **Example value**: `"hashed_password_123"`

- **address (TEXT)**:  
  Geographic coordinates of user location.  
  **Example of activity**: If you want to calculate delivery distances for orders, use this field.  
  **Example value**: `{"latitude":53.5511,"longitude":9.9937}` 

- **role (TEXT: 'admin','warehouse_worker','truck_driver','client')**:  
  This field defines the user’s access level in the system.  
  **Example of activity**: If you want to restrict access to certain actions, check this field.  
  **Example value**: `"client"`

---

# TABLE: online_users

- **session_id (TEXT)**:  
  This field uniquely identifies each user session in the system.  
  **Example of activity**: If you want to track or terminate a specific session, query using this ID.  
  **Example value**: `"sess_001"`

- **user_id (TEXT)**:  
  This field references the user associated with the session.  
  **Example of activity**: If you want to see which user is active in a session, use this field.  
  **Example value**: `"user_001"`

- **login_time (TEXT YYYY-MM-DD HH:MM:SS)**:  
  This field stores the timestamp when the session started.  
  **Example of activity**: If you want to monitor how long users have been logged in, use this value.  
  **Example value**: `"2026-03-26 09:15:00"`

- **last_activity (TEXT YYYY-MM-DD HH:MM:SS)**:  
  This field stores the timestamp of the user’s last interaction.  
  **Example of activity**: If you want to detect idle users or automatically log them out, compare this value with the current time.  
  **Example value**: `"2026-03-26 09:45:00"`
---

# TABLE: trucks_cargo

- **truck_id (TEXT)**:  
  This field references the truck carrying the products.  
  **Example of activity**: If you want to inspect a truck’s current cargo, query using this field.  
  **Example value**: `"truck_001"`

- **product_id (TEXT)**:  
  This field references the product loaded in the truck.  
  **Example of activity**: If you want to check which trucks are carrying a specific product, use this field.  
  **Example value**: `"prod_001"`

- **quantity (INTEGER)**:  
  This field stores the number of units of the product currently loaded in the truck.  
  **Example of activity**: If you want to ensure cargo limits are not exceeded, sum this with the product’s volume and weight.  
  **Example value**: `50`

---

# TABLE: orders

- **id (TEXT)**:  
  This field uniquely identifies each customer order.  
  **Example of activity**: If you want to track a specific order, query using this ID.  
  **Example value**: `"order_001"`

- **client_id (TEXT)**:  
  This field references the user who placed the order.  
  **Example of activity**: If you want to list all orders from a specific client, use this field.  
  **Example value**: `"user_001"`

- **final_destination (TEXT)**:  
  This field stores the delivery address for the order.  
  **Example of activity**: If you want to calculate delivery routes, use this field.  
  **Example value**: `"Hamburg, Germany"`

- **time_limit (TEXT YYYY-MM-DD HH:MM:SS)**:  
  This field stores the deadline for the order delivery.  
  **Example of activity**: If you want to prioritize urgent orders, compare this value with the current time.  
  **Example value**: `"2026-03-28 18:00:00"`

- **price (REAL)**:  
  This field stores the total price of the order.  
  **Example of activity**: If you want to calculate revenue or display the total cost to the client, use this field.  
  **Example value**: `150.75`

- **status (TEXT: 'Pending','Shipped','Delivered','Cancelled')**:  
  This field indicates the current state of the order.  
  **Example of activity**: If you want to filter orders that are ready for shipping, check this field.  
  **Example value**: `"Pending"`

- **supplier_id (TEXT or NULL)**:  
  This field references the supplier providing the goods for the order.  
  **Example of activity**: If you want to track supplier deliveries for this order, use this field.  
  **Example value**: `"sup_001"`

- **supplier_delivery (INTEGER 0/1)**:  
  Indicates whether the supplier’s goods are already in stock.  
  **Example of activity**: If you want to determine whether you need to request products from the supplier, check this field.  
  **Example value**: `1`

---
# TABLE: orders_items

- **order_id (TEXT)**:  
  This field references the order containing the product.  
  **Example of activity**: If you want to list all products in a specific order, query using this field.  
  **Example value**: `"order_001"`

- **product_id (TEXT)**:  
  This field references the product included in the order.  
  **Example of activity**: If you want to see which orders include a specific product, use this field.  
  **Example value**: `"prod_001"`

- **quantity (INTEGER)**:  
  This field stores the number of units of the product in the order.  
  **Example of activity**: If you want to calculate total items to pick or pack for an order, use this value.  
  **Example value**: `10`
---

# TABLE: orders_route

- **order_id (TEXT)**:  
  This field references the order being tracked along its delivery route.  
  **Example of activity**: If you want to monitor the journey of a specific order, query using this field.  
  **Example value**: `"order_001"`

- **step (INTEGER)**:  
  This field indicates the sequence number of the route step.  
  **Example of activity**: If you want to reconstruct the delivery process in order, sort by this field.  
  **Example value**: `1`

- **warehouse_id (TEXT or NULL)**:  
  This field references the warehouse involved at this step, if applicable.  
  **Example of activity**: If you want to track stock handling, use this field.  
  **Example value**: `"wh_001"`

- **truck_id (TEXT or NULL)**:  
  This field references the truck handling this step, if applicable.  
  **Example of activity**: If you want to track which vehicle is delivering a part of the order, use this field.  
  **Example value**: `"truck_001"`

- **destination_warehouse_id (TEXT or NULL)**:  
  This field references the next warehouse in the route, if the order is moving between warehouses.  
  **Example of activity**: If you want to calculate the next stop for a delivery, use this field.  
  **Example value**: `"wh_002"`

- **estimated_time (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  This field stores the expected arrival time at this step.  
  **Example of activity**: If you want to estimate when the order will reach the next warehouse or client, use this field.  
  **Example value**: `"2026-03-27 15:30:00"`

- **arrived_at (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  This field stores the actual arrival time at this step.  
  **Example of activity**: If you want to measure delivery performance or delays, use this field.  
  **Example value**: `"2026-03-27 15:45:00"`

---

# TABLE: supplies_route

- **order_id (TEXT)**:  
  This field references the order that the supplier is providing goods for.  
  **Example of activity**: If you want to track supplier deliveries for a specific order, query using this field.  
  **Example value**: `"order_001"`

- **supplier_id (TEXT)**:  
  This field references the supplier handling the delivery.  
  **Example of activity**: If you want to monitor which supplier is responsible for a shipment, use this field.  
  **Example value**: `"sup_001"`

- **truck_id (TEXT or NULL)**:  
  This field references the truck used for the supplier delivery, if applicable.  
  **Example of activity**: If you want to trace which vehicle is transporting goods from the supplier, use this field.  
  **Example value**: `"truck_001"`

- **estimated_departure (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  This field stores the planned departure time from the supplier.  
  **Example of activity**: If you want to schedule or optimize pickups, use this field.  
  **Example value**: `"2026-03-26 08:00:00"`

- **estimated_arrival (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  This field stores the planned arrival time at the warehouse or distribution center.  
  **Example of activity**: If you want to coordinate warehouse preparations for incoming goods, use this field.  
  **Example value**: `"2026-03-26 12:00:00"`

- **actual_arrival (TEXT YYYY-MM-DD HH:MM:SS or NULL)**:  
  This field stores the real arrival time of the delivery.  
  **Example of activity**: If you want to measure supplier performance and delays, use this field.  
  **Example value**: `"2026-03-26 12:15:00"`

---

# TABLE: freight_cost

- **order_id (TEXT)**:  
  This field references the order for which costs are calculated.  
  **Example of activity**: If you want to analyze delivery expenses for a specific order, query using this field.  
  **Example value**: `"order_001"`

- **fuel_cost (REAL)**:  
  This field stores the cost of fuel used for the delivery.  
  **Example of activity**: If you want to calculate total transportation expenses, include this value.  
  **Example value**: `45.50`

- **labor_cost (REAL)**:  
  This field stores the cost of labor for handling and transporting the order.  
  **Example of activity**: If you want to compute total operational costs, include this value.  
  **Example value**: `30.00`

- **maintenance_cost (REAL)**:  
  This field stores the cost of vehicle maintenance associated with the delivery.  
  **Example of activity**: If you want to analyze the impact of wear and tear on overall costs, use this field.  
  **Example value**: `15.25`

- **total_cost (REAL)**:  
  This field stores the aggregated total cost of the delivery (fuel + labor + maintenance).  
  **Example of activity**: If you want to determine profitability of the order, use this value.  
  **Example value**: `90.75`

- **calculated_at (TEXT YYYY-MM-DD HH:MM:SS)**:  
  This field stores the timestamp when the costs were calculated.  
  **Example of activity**: If you want to track when cost data was last updated, use this field.  
  **Example value**: `"2026-03-26 14:00:00"`

---

# RELATIONSHIPS OVERVIEW

- Products are stored in warehouses through `warehouses_stock`
- Warehouses store multiple products
- Trucks carry products via `trucks_cargo`
- Orders contain products via `orders_items`
- Orders are tracked step-by-step in `orders_route`
- Orders may involve suppliers via `supplies_route`
- Users create orders
- Trucks are either in warehouses or delivering between them

Example of activity: Trace a product from supplier to final destination using these relationships.

---

# SYSTEM RULES & CONSTRAINTS

- A truck cannot be delivering and parked simultaneously  
- A truck must always have a valid location or route  
- Volume and weight limits cannot be exceeded  
- Quantities and fuel values cannot be negative  
- Orders have restricted status values  
- Refrigerated products require compatible storage/transport  

Example of activity: Invalid operations are automatically rejected by the database.

---

# DATA INTERPRETATION (UNITS VS TOTALS)

**Per-unit fields (products):**
- volume
- weight

**Aggregated fields (trucks/warehouses):**
- volume_current
- weight_current

Example of activity: Total cargo volume = product.volume × quantity.

---

# SYSTEM FLOW (SIMPLIFIED)

1. Order is created (`orders`, `orders_items`)
2. Supplier provides goods if needed (`supplies_route`)
3. Products stored in warehouses (`warehouses_stock`)
4. Trucks transport goods (`trucks`, `trucks_cargo`)
5. Route tracked (`orders_route`)
6. Costs calculated (`freight_cost`)
7. Order delivered and status updated

Example of activity: Follow this flow to debug or track any order.

---

# INDEXES

Indexes are used to improve query performance on frequently accessed fields.

- idx_orders_client → speeds up queries filtering orders by client_id  
- idx_orders_status → speeds up filtering by order status  
- idx_online_users_user → improves lookup of sessions by user  
- idx_stock_product → speeds up product-based inventory queries  
- idx_stock_warehouse → speeds up warehouse inventory queries  
- idx_orders_route_order → improves order tracking queries  
- idx_orders_route_truck → improves truck-based route queries  
- idx_cargo_truck → speeds up cargo lookup per truck  

Example of activity: If you frequently query all orders from a user, the index avoids full table scans.
