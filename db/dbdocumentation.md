# Logistics System Database Documentation  
  
This document explains the structure and usage of the database. Each field is described using full sentences and includes practical examples of how it can be used in real scenarios.  
  
---

# TABLE: deposit  
  
- **id**: This field uniquely identifies each warehouse and is used to connect it with trucks, stock, and routes across the system. Example of activity: If you want to retrieve all inventory stored in a specific warehouse, query using this ID.  
  
- **location (json)**: This field stores the geographic coordinates of the warehouse using latitude and longitude, enabling precise positioning and distance calculations. Example of activity: If you want to find the closest warehouse to a delivery address, compare latitude and longitude values.  
  
- **size (json)**: This field defines the physical dimensions of the warehouse using length, width, and height, allowing accurate capacity and space calculations. Example of activity: If you want to check if a large shipment fits inside a warehouse, calculate the available volume using these values.  
  
- **volume_actual**: This field stores how much volume is currently occupied inside the warehouse and should reflect real inventory usage. Example of activity: If you want to prevent overloading the warehouse, compare this value with the maximum capacity.  
  
- **volume_max**: This field defines the maximum storage capacity of the warehouse and is typically derived from the size dimensions. Example of activity: If you want fast validation before adding new stock, check this value instead of recalculating volume.  
  
- **has_refrigeration**: This field indicates whether the warehouse supports temperature-controlled storage. Example of activity: If you want to store perishable goods, filter warehouses where this field is enabled.  
  
---

# TABLE: truck

Represents vehicles used to transport goods between warehouses, suppliers, and final destinations, including their capacity, state, and operational metrics.

- **id**: This field uniquely identifies each truck in the system and is used in assignments, tracking, and logistics operations. Example of activity: If you want to assign a delivery route or track a specific vehicle, query using this ID.

- **model**: This field stores the model or type of the truck, allowing classification and performance comparison. Example of activity: If you want to analyze fuel efficiency or maintenance frequency by truck model, group records using this field.

- **size (json)**: This field defines the internal cargo dimensions of the truck using length, width, and height, enabling precise loading validation. Example of activity: If you want to verify whether a set of products can physically fit inside the truck before loading, compare their dimensions with this field.

- **volume_actual**: This field stores the current volume occupied by cargo inside the truck, reflecting real-time usage. Example of activity: If you want to load additional products, check how much free space is still available.

- **volume_max**: This field defines the maximum cargo volume the truck can carry and should be consistent with its dimensions. Example of activity: If you want to prevent overloading during packing operations, validate that volume_actual does not exceed this value.

- **weight_actual**: This field stores the total weight currently loaded in the truck. Example of activity: If you want to ensure safe transportation and avoid mechanical stress, monitor this value before dispatch.

- **weight_max**: This field defines the maximum weight capacity of the truck. Example of activity: If you want to comply with safety regulations or avoid fines, ensure weight_actual remains below this threshold.

- **estimated_time**: This field stores the estimated duration for completing the current trip or delivery. Example of activity: If you want to inform customers about expected delivery times, use this value.

- **is_delivering**: This field indicates whether the truck is currently assigned to an active delivery process. Example of activity: If you want to find trucks available for new assignments, filter where this value is disabled.

- **is_valid**: This field indicates whether the truck is operational and allowed to be used in logistics operations. Example of activity: If you want to exclude trucks that are under maintenance or inactive, filter where this value is enabled.

- **is_traveling**: This field indicates whether the truck is currently moving between locations rather than parked at a warehouse. Example of activity: If you want to track trucks that are on the road in real time, filter where this value is enabled.

- **current_deposit_id**: This field links the truck to a warehouse when it is not traveling, representing its current physical location. Example of activity: If you want to list all trucks currently parked at a specific warehouse, query using this field.

- **origin_deposit_id**: This field stores the warehouse from which the truck started its current trip. Example of activity: If you want to analyze route performance or calculate travel distances, use this field as the starting point.

- **destination_deposit_id**: This field stores the warehouse where the truck is heading during its current trip. Example of activity: If you want to estimate arrival times or track delivery progress, combine this field with estimated_time.

- **home_deposit_id**: This field defines the default or base warehouse of the truck. Example of activity: If you want to return trucks to their original location after completing deliveries, use this field.

- **has_refrigeration**: This field indicates whether the truck supports temperature-controlled transport. Example of activity: If you want to transport perishable or frozen goods, filter trucks where this value is enabled.

- **speed**: This field stores the average operating speed of the truck, which can be used for planning and estimation. Example of activity: If you want to dynamically calculate travel time based on distance, use this value.

- **fuel_capacity**: This field defines the maximum amount of fuel the truck can hold. Example of activity: If you want to plan long-distance routes and determine refueling needs, use this value.

- **fuel_current**: This field stores the current fuel level of the truck at any given time. Example of activity: If you want to detect trucks that need refueling before starting a trip, monitor this value.

- **fuel_consumption**: This field defines how much fuel the truck consumes per unit of distance traveled. Example of activity: If you want to estimate fuel costs for a planned route, use this field.

- **wear_percentage**: This field indicates how much the truck has degraded over time on a scale from 0 to 100. Example of activity: If you want to trigger maintenance alerts or prevent breakdowns, monitor this value.

- **wear_rate**: This field defines how quickly the truck accumulates wear based on usage. Example of activity: If you want to predict when maintenance will be required in the future, use this field.

---  

# TABLE: product

Represents all items that can be stored, transported, and sold within the logistics system, including their physical characteristics and handling requirements.

- **id**: This field uniquely identifies each product in the system and is used when linking products to stock, orders, and movements. Example of activity: If you want to add a specific product to an order or track its inventory, query using this ID.

- **name**: This field stores the name of the product for identification and display purposes. Example of activity: If you want to show product listings in a user interface or generate invoices, use this field.

- **is_cold**: This field indicates whether the product requires temperature-controlled storage or transportation. Example of activity: If you want to assign the product to a refrigerated truck or warehouse, filter products where this value is enabled.

- **is_fragile**: This field indicates whether the product requires careful handling due to its nature. Example of activity: If you want to apply special packaging rules or avoid stacking heavy items on top, filter products where this value is enabled.

- **expire_date**: This field stores the expiration date of the product, which is important for perishable goods. Example of activity: If you want to remove expired products from inventory or prioritize shipments nearing expiration, compare this value with the current date.

- **price**: This field stores the monetary value of a single unit of the product. Example of activity: If you want to calculate the total value of an order or generate billing information, use this field.

- **size (json)**: This field defines the physical dimensions of the product using length, width, and height, enabling accurate packing and space calculations. Example of activity: If you want to determine how many units can fit inside a truck or warehouse, use these dimensions.

- **volume**: This field stores the calculated volume of the product for faster access during logistics operations. Example of activity: If you want to optimize loading without recalculating dimensions every time, use this value.

- **weight**: This field stores the weight of a single unit of the product, which is essential for load balancing and safety. Example of activity: If you want to calculate the total weight of cargo inside a truck or ensure it does not exceed limits, use this field.

---

# TABLE: users

Represents all system users including administrators, workers, and clients, defining their identity, access level, and basic information.

- **id**: This field uniquely identifies each user in the system and is used across orders, sessions, and employee records. Example of activity: If you want to retrieve a specific user or link an order to a client, query using this ID.

- **name**: This field stores the full name of the user for identification and display purposes. Example of activity: If you want to show user profiles, delivery contacts, or employee lists, use this field.

- **work_position**: This field describes the role or job position of the user when applicable, especially for internal staff. Example of activity: If you want to list all warehouse workers or filter drivers, query using this field.

- **password**: This field stores the authentication credential used to verify the user's identity. Example of activity: If you want to validate login attempts, compare the provided password with this stored value.

- **address**: This field stores the physical or delivery address of the user. Example of activity: If you want to define delivery destinations or contact locations, use this field.

- **role**: This field defines the access level of the user such as admin, worker, or client, controlling permissions in the system. Example of activity: If you want to retrieve all administrators or restrict access to certain features, query by this field.

---

# TABLE: session

Represents active and historical login sessions, allowing multi-user authentication and session management.

- **session_id**: This field uniquely identifies each session created when a user logs into the system. Example of activity: If you want to track or invalidate a specific session, query using this ID.

- **user_id**: This field links the session to the user who owns it, establishing authentication context. Example of activity: If you want to retrieve all sessions for a specific user or detect multiple active logins, query using this field.

- **login_time**: This field stores the exact timestamp when the session was created. Example of activity: If you want to analyze login activity or detect unusual access times, use this field.

- **expires_at**: This field defines when the session should become invalid and no longer be accepted. Example of activity: If you want to enforce automatic logout after a certain period, compare this value with the current time.

- **is_active**: This field indicates whether the session is currently valid and usable. Example of activity: If you want to list only active sessions or block inactive ones from making requests, filter by this field. 
  
- # TABLE: orders

Represents customer orders including delivery details, status, and associated clients and suppliers, serving as the central entity in logistics operations.

- **id**: This field uniquely identifies each order in the system and is used to link items, routes, and stock movements. Example of activity: If you want to track the progress of a delivery or generate an invoice, query using this ID.

- **final_destination (json)**: This field stores the coordinates of the delivery location, allowing distance calculation and route optimization. Example of activity: If you want to determine the best delivery route from a warehouse to the customer, use this field.

- **sender_id**: This field identifies the user who is sending the order. Example of activity: If you want to retrieve sender information for notifications or invoices, join with the users table.

- **receiver_id**: This field identifies the user who will receive the order. Example of activity: If you want to confirm delivery or provide tracking updates to the recipient, use this field.

- **time_limit**: This field defines the deadline for completing the delivery. Example of activity: If you want to prioritize urgent orders, filter by this field.

- **price**: This field stores the total cost or value of the order. Example of activity: If you want to calculate revenue or generate billing reports, use this field.

- **status**: This field tracks the current state of the order, such as Pending, Shipped, Delivered, or Cancelled. Example of activity: If you want to list only orders currently in transit, filter by status.

- **client_id**: This field identifies the client who created the order. Example of activity: If you want to retrieve all orders placed by a specific client, query using this field.

- **supplier_id**: This field identifies the supplier responsible for providing the goods. Example of activity: If you want to track which supplier delivered each product, use this field.

- **supplier_delivery**: This field indicates whether the supplier is responsible for the initial delivery to the system. Example of activity: If you want to plan the first leg of the supply route, check this field.

---

# TABLE: order_items

Connects products to specific orders, specifying quantities and enabling accurate inventory tracking and fulfillment.

- **order_id**: This field links the item to a specific order. Example of activity: If you want to list all products included in an order, filter using this field.

- **product_id**: This field links the item to a specific product. Example of activity: If you want to check which orders contain a particular product, query using this field.

- **quantity**: This field defines the number of units of the product included in the order. Example of activity: If you want to validate whether stock is sufficient to fulfill an order, sum the quantity across related order_items.

---
  
# TABLE: stock

Represents the current inventory of products, tracking their exact location, quantity, and association with orders or trucks for efficient logistics management.

- **id**: This field uniquely identifies each stock record in the system. Example of activity: If you want to update or move a specific inventory entry, query using this ID.

- **product_id**: This field links the stock to a specific product, allowing tracking of individual items. Example of activity: If you want to calculate total availability of a product across all locations, group by this field.

- **quantity**: This field stores how many units of the product are present in this stock entry. Example of activity: If you want to check whether an order can be fulfilled, compare this value against the requested amount.

- **deposit_id**: This field indicates that the stock is stored at a warehouse. Example of activity: If you want to list all inventory currently stored in a specific warehouse, filter using this field.

- **truck_id**: This field indicates that the stock is inside a truck during transportation. Example of activity: If you want to monitor goods currently in transit, query using this field.

- **order_id**: This field links the stock to a specific order if it has been reserved or allocated. Example of activity: If you want to track items designated for delivery, filter by this field.

- **arrived_at**: This field stores the timestamp when the stock reached its current location. Example of activity: If you want to apply FIFO inventory logic or analyze arrival times, use this field.

---

# TABLE: stock_history

Keeps a detailed record of all stock movements for auditing, tracking, and historical analysis, including who moved the stock and when.

- **id**: This field uniquely identifies each stock movement record. Example of activity: If you want to trace a particular movement for auditing purposes, query using this ID.

- **stock_id**: This field links the movement record to a specific stock entry. Example of activity: If you want to retrieve the full movement history of a specific inventory item, filter by this field.

- **quantity**: This field stores the number of units moved in this transaction. Example of activity: If you want to analyze product flow and logistics efficiency, use this value.

- **deposit_id**: This field identifies the warehouse involved in the movement, if any. Example of activity: If you want to see all transfers that arrived at a specific warehouse, filter using this field.

- **truck_id**: This field identifies the truck used for the movement, if any. Example of activity: If you want to track all items transported by a specific vehicle, use this field.

- **order_id**: This field links the movement to a specific order, if applicable. Example of activity: If you want to audit all stock movements related to a particular order, query using this field.

- **moved_by**: This field identifies the user responsible for moving the stock. Example of activity: If you want to check accountability or user activity in inventory operations, use this field.

- **moved_at**: This field stores the timestamp when the stock movement occurred. Example of activity: If you want to generate a timeline of inventory movements or detect delays, use this field.

---

# TABLE: order_route

Tracks the journey of an order step by step, recording which warehouse or truck it passes through, estimated times, and actual arrivals.

- **order_id**: This field links each step to a specific order. Example of activity: If you want to retrieve the full route history for a delivery, filter using this field.

- **step**: This field represents the sequential step number in the order’s journey, starting from 1. Example of activity: If you want to reconstruct the path of an order, sort by this field.

- **deposit_id**: This field identifies the warehouse involved in this step, if applicable. Example of activity: If you want to see all stops at a specific warehouse for multiple orders, filter by this field.

- **truck_id**: This field identifies the truck involved in this step, if applicable. Example of activity: If you want to track which vehicle handled a particular delivery segment, use this field.

- **estimated_time**: This field stores the planned time for this step to be completed. Example of activity: If you want to estimate delivery arrival times for customers, use this field.

- **arrived_at**: This field records the actual timestamp when this step was completed. Example of activity: If you want to measure delays or track punctuality, compare with estimated_time.

---

# TABLE: supplier

Represents external suppliers providing products to the system, including location and contact information.

- **id**: This field uniquely identifies each supplier in the system. Example of activity: If you want to track orders supplied by a specific vendor, query using this field.

- **name**: This field stores the official name of the supplier. Example of activity: If you want to display supplier information for an order, use this field.

- **address**: This field stores the supplier’s physical address for shipping and contact purposes. Example of activity: If you want to plan pickups or deliveries from a supplier, use this field.

- **latitude**: This field stores the geographic latitude coordinate of the supplier. Example of activity: If you want to calculate distance from a warehouse for planning supply routes, use this field.

- **longitude**: This field stores the geographic longitude coordinate of the supplier. Example of activity: If you want to optimize transportation routes to reduce travel time, use this field.

---

# TABLE: supply_route

Tracks the initial delivery of products from suppliers to the system, including estimated and actual arrival times.

- **order_id**: This field links the supply route to a specific order provided by a supplier. Example of activity: If you want to monitor inbound logistics for a particular order, filter using this field.

- **supplier_id**: This field identifies the supplier responsible for delivering the order. Example of activity: If you want to analyze supplier performance or delays, use this field.

- **truck_id**: This field identifies the truck used to transport goods from the supplier to the system. Example of activity: If you want to track vehicles used in inbound logistics, use this field.

- **estimated_departure**: This field stores when the shipment is expected to leave the supplier. Example of activity: If you want to plan warehouse intake schedules, use this value.

- **estimated_arrival**: This field stores when the shipment is expected to arrive at the system. Example of activity: If you want to coordinate staff for unloading, use this field.

- **actual_arrival**: This field records the timestamp when the shipment actually arrived. Example of activity: If you want to calculate delays or supplier reliability, compare this value with estimated_arrival.
  
---

# TABLE: fuel_station

Represents locations where trucks can refuel, including coordinates and partnership status for discounts or agreements.

- **id**: This field uniquely identifies each fuel station in the system. Example of activity: If you want to track fuel purchases at a specific station, query using this ID.

- **name**: This field stores the name of the fuel station for display and reporting. Example of activity: If you want to show available fuel stations to drivers in an interface, use this field.

- **location (json)**: This field contains the geographic coordinates of the station using latitude and longitude. Example of activity: If you want to plan the closest refueling point along a route, use this field.

- **latitude**: This field stores the geographic latitude of the station. Example of activity: If you want to calculate distances to stations for routing optimization, use this field.

- **longitude**: This field stores the geographic longitude of the station. Example of activity: If you want to calculate distances to stations for routing optimization, use this field.

- **is_partner**: This field indicates whether the station has a partnership agreement with the company. Example of activity: If you want to apply discounted fuel rates or prioritize preferred stations, filter by this field.

---

# TABLE: fuel_price

Tracks the historical fuel prices at each station for cost analysis and planning.

- **station_id**: This field links the price record to a specific fuel station. Example of activity: If you want to see the price history for a station or choose the cheapest fuel, query using this field.

- **price_per_liter**: This field stores the cost of fuel per liter at the recorded time. Example of activity: If you want to calculate refueling expenses for a planned trip, use this value.

- **recorded_at**: This field stores the timestamp when the price was recorded. Example of activity: If you want to analyze fuel price trends over time, sort or filter using this field.

---

# TABLE: refuel_log

Records all refueling events for trucks, tracking quantity, price, and timestamp for operational and cost management.

- **id**: This field uniquely identifies each refueling event. Example of activity: If you want to audit fuel usage for a truck, query using this ID.

- **truck_id**: This field links the refueling event to the specific truck. Example of activity: If you want to calculate fuel consumption per vehicle, filter by this field.

- **station_id**: This field identifies the fuel station where the refueling took place. Example of activity: If you want to analyze refueling patterns by station, use this field.

- **liters**: This field stores the amount of fuel added during the event. Example of activity: If you want to calculate total fuel consumption for a trip or truck, sum this value.

- **price_per_liter**: This field records the cost per liter at the time of refueling. Example of activity: If you want to calculate total refueling expenses, multiply by liters.

- **refueled_at**: This field stores the timestamp when the refueling occurred. Example of activity: If you want to analyze refueling frequency or time-based patterns, use this field.

---

# TABLE: employee

Represents internal staff members, including their work eligibility, assigned warehouse, and labor costs for operational and payroll management.

- **id**: This field uniquely identifies each employee in the system. Example of activity: If you want to track work history or assign tasks, query using this ID.

- **user_id**: This field links the employee to the corresponding user account. Example of activity: If you want to retrieve personal details or authentication info, join with the users table.

- **is_able**: This field indicates whether the employee is currently available for assignments. Example of activity: If you want to select staff for a shift or delivery, filter by this field.

- **deposit_id**: This field identifies the warehouse the employee is primarily assigned to. Example of activity: If you want to list all staff working at a specific warehouse, filter using this field.

- **max_work_hours_per_day**: This field stores the maximum hours an employee is allowed to work per day. Example of activity: If you want to schedule shifts without exceeding legal limits, use this field.

- **hourly_cost**: This field defines the employee's cost per hour for payroll or operational cost calculation. Example of activity: If you want to calculate labor costs for a specific task or delivery, multiply hours worked by this value.

---

# TABLE: truck_driver

Represents the assignment of employees as drivers to trucks, allowing multiple drivers per vehicle.

- **truck_id**: This field links the assignment to a specific truck. Example of activity: If you want to find all drivers currently assigned to a truck, query using this field.

- **employee_id**: This field links the assignment to a specific employee. Example of activity: If you want to see which trucks an employee is qualified to drive, filter using this field.

- **assigned_at**: This field stores the timestamp when the assignment was made. Example of activity: If you want to track driver rotations or assignment durations, use this field.

---

# TABLE: work_log

Records the working periods of employees, including their assignments to trucks, start times, and end times for accurate labor tracking.

- **id**: This field uniquely identifies each work session. Example of activity: If you want to audit employee activity or calculate hours worked, query using this ID.

- **employee_id**: This field links the work session to a specific employee. Example of activity: If you want to retrieve all work periods for an individual, filter by this field.

- **truck_id**: This field identifies the truck the employee was operating during this session, if applicable. Example of activity: If you want to track which vehicles were driven by a particular employee, use this field.

- **start_time**: This field stores the timestamp when the work session began. Example of activity: If you want to calculate total hours worked or analyze shift patterns, use this field.

- **end_time**: This field stores the timestamp when the work session ended. Example of activity: If you want to determine overtime or verify attendance, use this field.

---

# TABLE: freight_cost

Tracks the costs associated with each order, including fuel, labor, maintenance, and the total cost, for accurate financial reporting and operational analysis.

- **order_id**: This field links the cost record to a specific order. Example of activity: If you want to calculate the total expense for fulfilling a particular order, query using this field.

- **fuel_cost**: This field stores the fuel expenses incurred during the delivery of the order. Example of activity: If you want to analyze fuel efficiency or optimize route planning to reduce costs, use this value.

- **labor_cost**: This field stores the cost of employee labor involved in the order. Example of activity: If you want to calculate the total manpower expense for an order, sum the hours worked multiplied by hourly rates.

- **maintenance_cost**: This field records costs of truck maintenance associated with delivering the order. Example of activity: If you want to track wear-and-tear expenses linked to deliveries, use this field.

- **total_cost**: This field stores the total calculated cost of the order, summing fuel, labor, and maintenance. Example of activity: If you want to generate profit reports or evaluate order profitability, use this field.

- **calculated_at**: This field stores the timestamp when the costs were computed. Example of activity: If you want to review historical cost analysis or verify updates, use this field.

---

# TABLE: truck_performance_history

Keeps periodic snapshots of a truck’s operational performance, including distance traveled, fuel consumption, maintenance, and wear.

- **id**: This field uniquely identifies each performance record. Example of activity: If you want to retrieve a specific snapshot for auditing or analysis, query using this field.

- **truck_id**: This field links the record to a specific truck. Example of activity: If you want to analyze trends or compare performance across trucks, filter by this field.

- **total_distance**: This field stores the cumulative distance traveled since the last snapshot or maintenance. Example of activity: If you want to monitor vehicle usage or schedule maintenance based on mileage, use this value.

- **fuel_consumed**: This field stores the total fuel consumed during the recorded period. Example of activity: If you want to calculate fuel efficiency or detect abnormal consumption, use this value.

- **orders_completed**: This field records the number of deliveries completed during the period. Example of activity: If you want to evaluate productivity per vehicle, use this field.

- **maintenance_count**: This field records the number of maintenance events performed during the period. Example of activity: If you want to schedule preventive maintenance or analyze vehicle reliability, use this field.

- **wear_percentage**: This field stores the wear level of the truck at the time of recording. Example of activity: If you want to forecast maintenance needs or prevent failures, use this value.

- **recorded_at**: This field stores the timestamp of the snapshot. Example of activity: If you want to analyze performance trends over time, use this field.

---

# TABLE: truck_maintenance

Records all maintenance events for trucks, including type, cost, wear before and after, and descriptions, for operational tracking and budgeting.

- **id**: This field uniquely identifies each maintenance event. Example of activity: If you want to audit repairs or track maintenance history for a truck, query using this field.

- **truck_id**: This field links the maintenance record to a specific truck. Example of activity: If you want to retrieve all maintenance performed on a truck, filter by this field.

- **type**: This field describes the type of maintenance performed, such as routine, emergency, or repair. Example of activity: If you want to categorize maintenance events for cost analysis, use this field.

- **description**: This field provides additional details about the maintenance performed. Example of activity: If you want to know what specific tasks were done during a service, read this field.

- **cost**: This field stores the expense associated with the maintenance. Example of activity: If you want to calculate total vehicle maintenance costs over time, sum this field.

- **wear_before**: This field stores the truck’s wear level before the maintenance. Example of activity: If you want to evaluate maintenance effectiveness, compare with wear_after.

- **wear_after**: This field stores the truck’s wear level after maintenance. Example of activity: If you want to assess improvement or durability after service, use this field.

- **performed_at**: This field stores the timestamp when maintenance was carried out. Example of activity: If you want to analyze service frequency or schedule preventive maintenance, use this field.
