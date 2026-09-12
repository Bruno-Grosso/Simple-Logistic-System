# Backend Points of Interest & API Documentation

> **System Infrastructure Summary**
> - **Backend Host / Port**: `http://localhost:8081` (`LOGISYS_BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL`)
> - **Database Engine**: PostgreSQL 15 with PostGIS extension (`back-postgresdb-1`)
> - **Valhalla Routing Engine**: `http://valhalla_server:8002/route` (or `http://localhost:8002/route`)
> - **Mock Seed Data Reference**: [`back/db/fill_mock_data.sql`](file:///home/be/projects/web/Simple-Logistic-System/back/db/fill_mock_data.sql)

---

## 🔑 User Authentication & Mock Login Credentials Table

All user credentials are seeded from [`back/db/fill_mock_data.sql`](file:///home/be/projects/web/Simple-Logistic-System/back/db/fill_mock_data.sql) into PostgreSQL database. Users can log in using either their **ID**, **Full Name**, or **Email Address** (e.g. `alice@logisys.com` / `USR-001`).

| User ID | Full Name | Mock Email / Login ID | Password | System Role | Physical Address |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `USR-001` | **Alice Admin** | `alice@logisys.com` / `USR-001` | `admin123` | `admin` | Rua do Imperador, Centro, Petrópolis - RJ |
| `USR-002` | **Bob Worker** | `bob@logisys.com` / `USR-002` | `bobpass` | `warehouse_worker` | Estrada União e Indústria, Itaipava, Petrópolis - RJ |
| `USR-003` | **Charlie Driver** | `charlie@logisys.com` / `USR-003` | `trucker1` | `truck_driver` | Av. Alberto Braune, Centro, Nova Friburgo - RJ |
| `USR-004` | **David Client** | `david@logisys.com` / `USR-004` | `client789` | `client` | Av. Reta da Várzea, Várzea, Teresópolis - RJ |
| `USR-005` | **Eve Client** | `eve@logisys.com` / `USR-005` | `evepass` | `client` | Rua Monte Líbano, Centro, Nova Friburgo - RJ |
| `USR-006` | **Frank Driver** | `frank@logisys.com` / `USR-006` | `frank123` | `truck_driver` | Estrada Terê-Fri, Km 12, Teresópolis - RJ |
| `USR-007` | **Grace Worker** | `grace@logisys.com` / `USR-007` | `gracepass` | `warehouse_worker` | Rua General Osório, Centro, Nova Friburgo - RJ |
| `USR-008` | **Henry Client** | `henry@logisys.com` / `USR-008` | `henry789` | `client` | Rua Dr. Moacyr Freijanes, Bom Jardim - RJ |
| `USR-009` | **Ivy Client** | `ivy@logisys.com` / `USR-009` | `ivypass` | `client` | Av. Alberto Torres, Teresópolis - RJ |
| `USR-010` | **Jack Worker** | `jack@logisys.com` / `USR-010` | `jackpass` | `warehouse_worker` | Rua Cel. Veiga, Petrópolis - RJ |

---

## 🛰️ Backend Interaction Points & Endpoints Overview

| Category | HTTP Method | Route Endpoint | Query Parameters | Description |
| :--- | :---: | :--- | :--- | :--- |
| **Geocoding** | `GET` | `/geocode` | `?address=<text>` | Converts address string to coordinates and formatted address |
| **Geocoding** | `GET` | `/reverse-geocode` | `?lat=<lat>&lon=<lon>` | Converts coordinates into formatted street address |
| **System** | `GET` | `/status` | None | Returns list of existing database tables |
| **System** | `GET` | `/db-name` | None | Returns active PostgreSQL database name |
| **Auth / Login** | `POST` | `/login` | Payload `{ email, password }` | Authenticates against PostgreSQL `users` table & logs session in `online_users` |
| **Auth / Register** | `POST` | `/clients` | Payload `{ id, name, email, password, address, role }` | Registers a new client/user in PostgreSQL `users` table |
| **Users / Access** | `GET` | `/users` | `?role=<role>` | Retrieves system users (`admin`, `warehouse_worker`, `truck_driver`, `client`, etc.) |
| **Users / Access** | `GET` | `/users/drivers` | None | Retrieves all active fleet truck drivers |
| **Users / Access** | `POST` | `/employees` | Payload `{ name, email, password, role, wage, warehouse_id, is_active }` | Registers an employee with designated role and wage |
| **Users / Access** | `GET` | `/users/:id` | None | Retrieves user profile by ID |
| **Users / Access** | `PUT` | `/users/:id` | Payload `{ name, email, address, role, wage, warehouse_id, is_active }` | Updates user details, wage, or warehouse assignment |
| **Users / Access** | `DELETE` | `/users/:id` | None | Deletes user / employee record |
| **Users / Access** | `GET` | `/online-users` | `?userId=<id>` | Retrieves active session logs from `online_users` |
| **Products** | `GET` | `/products` | `?name=<search>` | Retrieves catalog products (optionally searched by name) |
| **Products** | `POST` | `/products` | Payload `{ id, name, price, is_cold, is_fragile, expire_date, size, volume, weight }` | Adds a new product to the catalog |
| **Products** | `GET` | `/products/:id` | None | Retrieves product details by ID |
| **Products** | `PUT` | `/products/:id` | Payload `{ name, price, is_cold, is_fragile, expire_date, size, volume, weight }` | Updates product pricing, volume, weight, cold/fragile flags |
| **Warehouses** | `GET` | `/warehouses` | None | Retrieves all warehouse / deposit locations |
| **Warehouses** | `GET` | `/warehouses/average-gas-price` | `?ids=WH-001,WH-002` | Calculates average fuel price across selected or all warehouses |
| **Warehouses** | `GET` | `/warehouses/:id` | None | Retrieves warehouse metadata by ID |
| **Warehouses** | `PUT` | `/warehouses/:id` | Payload `{ location, size, volume_max, has_refrigeration, fuel_price, truck_capacity }` | Updates location, capacity, refrigeration, and fuel price |
| **Warehouses** | `GET` | `/warehouses/:id/stock` | None | Retrieves inventory stock records for warehouse `:id` |
| **Warehouses** | `POST` / `PUT` | `/warehouses/:id/stock` | Payload `{ product_id, quantity }` | Upserts stock quantity for product at warehouse `:id` |
| **Warehouses** | `DELETE` | `/warehouses/:id/stock/:productId` | None | Removes product stock entry from warehouse `:id` |
| **Warehouses** | `GET` | `/warehouses/:id/parking` | None | Returns warehouse truck parking capacity, parked count, and arriving count |
| **Warehouses** | `POST` | `/warehouses/:id/check-parking` | Payload `{ truck_id }` | Validates if parking dock is available for a truck |
| **Suppliers** | `GET` | `/suppliers` | None | Retrieves supplier entities |
| **Suppliers** | `GET` | `/suppliers/:id` | None | Retrieves supplier details |
| **Fleet / Trucks** | `GET` | `/trucks` | `?model=<name>` | Retrieves all fleet trucks (optionally filtered by model) |
| **Fleet / Trucks** | `GET` | `/trucks/cargo` | None | Retrieves cargo items across all trucks |
| **Fleet / Trucks** | `GET` | `/trucks/:id` | None | Retrieves single truck record |
| **Fleet / Trucks** | `PUT` | `/trucks/:id` | Payload `{ model, speed, is_valid, is_delivering, size, volume_max, weight_max, ... }` | Updates truck state, maintenance flag, location, fuel |
| **Fleet / Trucks** | `GET` | `/trucks/:id/cargo` | None | Retrieves loaded products and quantities for truck `:id` |
| **Fleet / Trucks** | `GET` | `/trucks/:id/routes/multi-stop` | None | Previews multi-stop route for orders assigned to truck `:id` |
| **Orders** | `GET` | `/orders` | `?clientId=<id>&driverId=<id>&warehouseId=<id>` | Retrieves logistics orders (optionally filtered by client, driver, or warehouse) |
| **Orders** | `POST` | `/orders` | Payload `{ id, client_id, final_destination, time_limit, price, status, items }` | Creates a new order and attaches line items |
| **Orders** | `GET` | `/orders/export/csv` | None | Exports full orders catalog with client, warehouse, truck, and driver details as CSV |
| **Orders** | `GET` | `/orders/:id` | None | Retrieves order header |
| **Orders** | `PUT` | `/orders/:id` | Payload `{ status }` | Updates order status (`Pending`, `Shipped`, `Delivered`, `Canceled`) |
| **Orders** | `GET` | `/orders/:id/manifest.csv` | None | Exports shipping manifest and freight bill for order `:id` as CSV |
| **Orders** | `GET` | `/orders/:id/items` | None | Retrieves ordered product items and quantities |
| **Orders** | `GET` | `/orders/:id/route` | None | Retrieves transit steps and warehouse stops |
| **Orders** | `POST` | `/orders/:id/route` | Payload `{ step, warehouse_id, truck_id, driver_id, destination_warehouse_id, ... }` | Appends a route step to the order |
| **Orders** | `PUT` | `/orders/:id/route/:step` | Payload `{ warehouse_id, truck_id, driver_id, destination_warehouse_id, ... }` | Updates a specific route step |
| **Orders** | `DELETE` | `/orders/:id/route/:step` | None | Removes a route step from the order |
| **Orders** | `GET` | `/orders/:id/cost` | None | Retrieves calculated freight cost breakdown |
| **Orders** | `POST` | `/orders/:id/calculate-cost` | Payload `{ driverWage, fuelPrice, distanceKm, truckId, driverId }` | Computes and saves freight cost breakdown (fuel, labor, maintenance) |
| **Orders** | `GET` | `/orders/:id/eta` | None | Calculates & retrieves order ETA window with min/max speeds and driver rest regulation |
| **Orders** | `POST` | `/orders/:id/calculate-eta` | Payload `{ minSpeed, maxSpeed, departureTime, originWarehouseId, truckId }` | Computes transit duration with 8h/day driver limit & updates route |
| **Orders** | `POST` | `/orders/:id/calculate-distance` | Payload `{ warehouse_id }` | Computes geodesic distance between warehouse and order destination in DB |
| **Supplies** | `GET` | `/supplies-route` | `?orderId=<id>` / `?supplierId=<id>` | Retrieves supplier delivery routes |
| **Route Steps** | `GET` | `/orders-route` | `?orderId=<id>` | Retrieves order route steps |
| **Costs** | `GET` | `/freight-cost` | `?orderId=<id>` | Retrieves freight cost logs across all orders |
| **Valhalla Route** | `POST` | `/route` | Payload `{ orderId, warehouseId }` | Integrates with Valhalla engine to compute truck shape |
| **Multi-Stop Route**| `GET` / `POST` | `/routes/multi-stop` | Payload / Query `{ orderIds, warehouseId, truckId, roundTrip }` | Computes multi-order consolidated route via Valhalla |
| **Performance Reports**| `GET` | `/monthly-performance` | None | Retrieves 12-month profit vs costs, margin spread, and points of interest (POI) |
| **Delivery Cost Report**| `GET` | `/reports/delivery-costs` | `?warehouseId=<id>` | Retrieves delivery financial report, operating margins, and profit spreads |
| **Delivery Cost Export**| `GET` | `/reports/delivery-costs/csv` | `?warehouseId=<id>` | Exports delivery cost report as downloadable CSV |

---

## 📊 Endpoints Detail & Database Schemas

### 1. Login Endpoint (`POST /login`)
- **Request Body**:
  ```json
  {
    "email": "alice@logisys.com",
    "password": "admin123"
  }
  ```
- **Response**:
  ```json
  {
    "ok": true,
    "success": true,
    "token": "SESS-1785799196000",
    "sessionToken": "SESS-1785799196000",
    "user": {
      "id": "USR-001",
      "name": "Alice Admin",
      "role": "admin",
      "address": "Rua do Imperador, Centro, Petrópolis - RJ"
    }
  }
  ```

### 2. Warehouses (`/warehouses`)
- **Table Name**: `warehouses`
- **Data Schema**:
  ```json
  {
    "id": "WH-001",
    "location": { "latitude": -22.3842, "longitude": -43.1311, "label": "Petrópolis Hub (Itaipava)" },
    "size": { "length": 100, "width": 100, "height": 10 },
    "volume_current": 0.36,
    "volume_max": 100000.0,
    "has_refrigeration": 1,
    "fuel_price": 5.89
  }
  ```

### 3. Fleet Trucks (`/trucks`)
- **Table Name**: `trucks`
- **Data Schema**:
  ```json
  {
    "id": "TRK-001",
    "model": "Caminhão Serrano 01",
    "speed": 85.0,
    "is_valid": 1,
    "is_delivering": 0,
    "size": { "length": 13.6, "width": 2.5, "height": 2.7 },
    "volume_current": 0.0,
    "volume_max": 90.0,
    "weight_current": 0.0,
    "weight_max": 25000.0,
    "has_refrigeration": 1,
    "current_warehouse_id": "WH-001",
    "fuel_capacity": 500.0,
    "fuel_current": 450.0,
    "fuel_consumption": 0.3,
    "truck_maintenance": 2
  }
  ```

### 4. Orders & Freight Costs (`/orders`, `/freight-cost`)
- **Table Names**: `orders`, `orders_items`, `freight_cost`
- **Data Schema**:
  ```json
  {
    "id": "ORD-002",
    "client_id": "USR-005",
    "final_destination": "Rua Monte Líbano, Centro, Nova Friburgo - RJ",
    "time_limit": "2026-03-28",
    "price": 950.00,
    "status": "Shipped",
    "supplier_id": "SUP-001",
    "supplier_delivery": 1
  }
  ```

### 5. Monthly Performance Analytics (`/monthly-performance`)
- **Primary Feature**: Powers Reports page Profit (Green) vs Costs (Red) Area Chart & Milestone Cards
- **Data Schema**:
  ```json
  {
    "month": "Jan",
    "full_month": "January 2026",
    "revenue": 34500,
    "costs": 14200,
    "profit": 20300,
    "fuel_cost": 5800,
    "labor_cost": 6200,
    "maintenance_cost": 2200,
    "orders_count": 42,
    "is_poi": 1,
    "poi": "Fleet Modernization & Route Optimization Launched"
  }
  ```

---

## 🛠️ Frontend Integration Map

- **Adapter Utility**: [`front/lib/adapters.ts`](file:///home/be/projects/web/Simple-Logistic-System/front/lib/adapters.ts)
- **API Client**: [`front/lib/api.ts`](file:///home/be/projects/web/Simple-Logistic-System/front/lib/api.ts)
- **Authentication Handlers**: [`front/lib/auth/verify-credentials.ts`](file:///home/be/projects/web/Simple-Logistic-System/front/lib/auth/verify-credentials.ts) & [`front/app/login/actions.ts`](file:///home/be/projects/web/Simple-Logistic-System/front/app/login/actions.ts)
- **Reports Integration**: [`front/app/(dashboard)/reports/page.tsx`](file:///home/be/projects/web/Simple-Logistic-System/front/app/%28dashboard%29/reports/page.tsx) & [`front/components/performance-graphs.tsx`](file:///home/be/projects/web/Simple-Logistic-System/front/components/performance-graphs.tsx)
