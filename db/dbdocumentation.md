# Logistics System Database Documentation

---

## TABLE: products
**id:** This field uniquely identifies each product in the catalog and is used to connect it with stock, orders, and truck cargo.  
Example of activity: If you want to track where a specific product is stored or delivered, query using this ID.

**name:** This field stores the product’s name for identification and display purposes.  
Example of activity: If you want to show product listings to users, retrieve this field.

**price:** This field defines the monetary value of the product.  
Example of activity: If you want to calculate the total cost of an order, multiply this value by the quantity ordered.

**is_cold:** This field indicates whether the product requires refrigerated storage (1 = yes, 0 = no).  
Example of activity: If you want to assign storage, filter warehouses or trucks that support refrigeration.

**is_fragile:** This field indicates whether the product requires careful handling (1 = yes, 0 = no).  
Example of activity: If you want to optimize transport safety, prioritize special handling for fragile items.

**expire_date:** This field stores the expiration date of the product, or NULL if the product does not expire.  
Example of activity: If you want to prevent shipping expired goods, compare this value with the current date.

**size:** This field defines the physical dimensions of the product (e.g., JSON or structured text).  
Example of activity: If you want to calculate how much space a product occupies, use this field.

**volume:** This field represents the volume of a single unit of the product.  
Example of activity: Multiply by quantity to calculate total occupied space.

**weight:** This field represents the weight of a single unit of the product.  
Example of activity: Use this to ensure transport weight limits are not exceeded.

---

## TABLE: suppliers
**id:** Unique identifier for each supplier.  
Example of activity: Used to trace product origin.

**name:** Supplier name.  
Example of activity: Display supplier information.

**location:** Geographic location of the supplier.  
Example of activity: Estimate delivery time to warehouses.

---

## TABLE: warehouses
**id:** Unique identifier for each warehouse.  
Example of activity: Retrieve all inventory stored in a warehouse.

**location:** Geographic location of the warehouse.  
Example of activity: Used for route calculations.

**size:** Physical dimensions of the warehouse.  
Example of activity: Used to evaluate storage capacity.

**volume_current:** Current occupied volume.  
Example of activity: Prevent overloading.

**volume_max:** Maximum capacity.  
Example of activity: Validate incoming shipments.

**has_refrigeration:** Indicates cold storage availability.  
Example of activity: Store perishable goods.

**fuel_price:** Fuel cost at this location.  
Example of activity: Estimate transportation costs.

---

## TABLE: warehouses_stock
**warehouse_id:** Reference to warehouse.  

**product_id:** Reference to product.  

**quantity:** Quantity stored.  

Example of activity: Check product availability in warehouses.

---

## TABLE: trucks
**id:** Unique identifier for each truck.  

**model:** Truck model.  

**speed:** Average speed.  

**is_valid:** Indicates if operational.  

**is_delivering:** Indicates if in transit.  

**size:** Cargo dimensions.  

**volume_current / volume_max:** Volume usage and limit.  

**weight_current / weight_max:** Weight usage and limit.  

**has_refrigeration:** Supports cold transport.  

**current_warehouse_id:** Current location if idle.  

**origin_warehouse_id / destination_warehouse_id:** Delivery route.  

**estimated_time:** Delivery estimate.  

**fuel_capacity / fuel_current / fuel_consumption:** Fuel system.  

**truck_maintenance:** Maintenance count.  

Example of activity: Assign trucks and track deliveries.

---

## TABLE: users
**id:** Unique identifier.  

**name:** User name.  

**password:** Authentication field.  

**address:** User location.  

**role:** Defines access level (admin, warehouse_worker, truck_driver, client).  

Example of activity: Manage users and permissions.

---

## TABLE: online_users
**session_id:** Unique session identifier.  

**user_id:** Linked user.  

**login_time:** Session start.  

**last_activity:** Last interaction.  

Example of activity: Track active users.

---

## TABLE: trucks_cargo
**truck_id:** Reference to truck.  

**product_id:** Reference to product.  

**quantity:** Quantity carried.  

Example of activity: Inspect truck cargo.

---

## TABLE: orders
**id:** Unique identifier.  

**client_id:** User who placed the order.  

**final_destination:** Delivery address.  

**time_limit:** Deadline.  

**price:** Total price.  

**status:** Order state (Pending, Shipped, Delivered, Cancelled).  

**supplier_id:** Linked supplier.  

**supplier_delivery:** Indicates if already in stock.  

Example of activity: Track and manage orders.

---

## TABLE: orders_items
**order_id:** Reference to order.  

**product_id:** Reference to product.  

**quantity:** Quantity ordered.  

Example of activity: List products in an order.

---

## TABLE: orders_route
**order_id:** Reference to order.  

**step:** Route sequence.  

**warehouse_id:** Related warehouse.  

**truck_id:** Related truck.  

**destination_warehouse_id:** Next destination.  

**estimated_time:** Expected time.  

**arrived_at:** Actual arrival.  

Example of activity: Track delivery steps.

---

## TABLE: supplies_route
**order_id:** Reference to order.  

**supplier_id:** Supplier involved.  

**truck_id:** Truck used.  

**estimated_departure / estimated_arrival / actual_arrival:** Timing fields.  

Example of activity: Track supplier deliveries.

---

## TABLE: freight_cost
**order_id:** Reference to order.  

**fuel_cost / labor_cost / maintenance_cost:** Cost components.  

**total_cost:** Total cost.  

**calculated_at:** Timestamp.  

Example of activity: Analyze delivery costs.

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
