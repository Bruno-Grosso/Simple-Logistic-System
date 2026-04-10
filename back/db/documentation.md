# Logistics System Detailed Database Documentation (Neo4j)

---

## 1. IDENTITY & ACCESS LAYER (Users & Sessions)
This layer manages system security and identifies the actors interacting with the logistics chain.

### NODE: User
* **id (String - Unique):** The primary key used for all application-side lookups.
* **name (String):** Display name for the UI.
* **password (String):** Encrypted hash of the user's credentials.
* **role (String):** Categorization for permission logic. 
    * *Values:* `admin`, `warehouse_worker`, `truck_driver`, `client`.
* **address (String):** The primary location for the user (used as default delivery destination for clients).

### NODE: Session
* **id (String - Unique):** Generated per login event.
* **login (Datetime):** Timestamp of initial authentication.
* **last_activity (Datetime):** Timestamp used to calculate session timeouts.

**Relationship:** `(u:User)-[:HAS_SESSION]->(s:Session)`
* *Logic:* One user can have multiple active sessions (e.g., mobile and desktop).

---

## 2. PRODUCT & INVENTORY LAYER
Defines the physical items and where they are currently located in the supply chain.

### NODE: Product
* **Dimensions:** `length`, `width`, `height`, `weight`, `volume` (Float).
* **Requirements:** * `refrigeration` (Boolean): If true, requires cold-chain handling.
    * `fragile` (Boolean): If true, requires special handling instructions.
* **Metadata:** `price` (Float), `expire_date` (Date).

### RELATIONSHIP: STOCKS
* **Path:** `(w:Warehouse)-[r:STOCKS]->(p:Product)`
* **Properties:**
    * `quantity` (Integer): Total units available.
    * `volume_occupied` (Float): Calculated as `Product.volume * quantity`.
    * `arrived` (Datetime): Timestamp of when this specific batch entered the warehouse.

---

## 3. INFRASTRUCTURE & FLEET LAYER
The physical network and the vehicles that move goods through it.

### NODE: Warehouse
* **location (Point):** Geo-coordinates used for routing.
* **refrigeration (Boolean):** Flag for temperature-controlled capacity.
* **Capacity:** `volume_current` vs `volume_max`.
* **Economics:** `fuel_price` (Float) used to calculate freight costs based on where a truck refuels.

### NODE: Truck & TruckModel
* **TruckModel:** A "blueprint" node containing static specs (`fuel_capacity`, `speed`, `max_weight`, `max_volume`).
* **Truck:** An active unit node containing dynamic data:
    * `current_location` (Point).
    * `fuel_current` (Float).
    * `maintenance_level` (Integer).
    * `is_delivering` (Boolean): Global lock to prevent double-assignment.

**Relationship:** `(t:Truck)-[:IS_MODEL]->(tm:TruckModel)`

---

## 4. TRANSACTION & ROUTING LAYER
How customer requests turn into physical movement.

### NODE: Order
* **status (String):** Current phase (`Pending`, `Shipped`, `Delivered`).
* **time_limit (Datetime):** The "SLA" or hard deadline for the customer.
* **supplier_delivered (Boolean):** Trigger used to check if the order is ready for warehouse dispatch.

### RELATIONSHIP: HAS_ITEM
* **Path:** `(o:Order)-[i:HAS_ITEM]->(p:Product)`
* **Properties:** `quantity`, `price_at_sale`.
* *Note:* `price_at_sale` captures the price at the moment of the order, protecting the record from future product price changes.

### RELATIONSHIP: STOPS_AT (The Route)
* **Path:** `(o:Order)-[r:STOPS_AT]->(w:Warehouse)`
* **Property:** `stop_order` (Integer).
* *Logic:* Defines the "Hop" sequence. Stop 1 might be the origin warehouse, Stop 2 a regional hub.

---

## 5. PERFORMANCE & OPTIMIZATION (Indexes)
To ensure the system remains responsive under high load, the following indexes are applied:

| Index Name | Target | Purpose |
| :--- | :--- | :--- |
| `truck_loc` | `Truck(current_location)` | Find the closest truck to a warehouse. |
| `order_status` | `Order(status)` | Filter orders for the shipping dashboard. |
| `warehouse_refrig`| `Warehouse(refrigeration)`| Quickly find compatible storage for cold goods. |
| `session_activity`| `Session(last_activity)` | Batch-delete expired sessions. |

---

## 6. BUSINESS LOGIC RULES (Constraints)
* **Cold Chain Rule:** A `Product` where `refrigeration = true` can **only** have a `STOCKS` relationship with a `Warehouse` where `refrigeration = true` and a `CARRIES` relationship with a `Truck` (via Model) where `refrigeration = true`.
* **Weight Lock:** The sum of `weight_occupied` in all `CARRIES` relationships for a `Truck` must not exceed its `TruckModel.weight_max`.
* **Uniqueness:** Every entity `id` is globally unique to prevent duplicate data during CSV imports.

---
# SEE THE Data(SCV) folder for more details
