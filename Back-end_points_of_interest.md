# Backend Points of Interest & API Documentation

> **System Infrastructure Summary**
> - **Backend Host / Port**: `http://localhost:8081` (`LOGISYS_BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL`)
> - **Database Engine**: PostgreSQL 15 with PostGIS extension (`back-postgresdb-1`)
> - **Valhalla Routing Engine**: `http://valhalla_server:8002/route` (or `http://localhost:8002/route`)
> - **Mock Seed Data Reference**: [`back/db/fill_mock_data.sql`](file:///home/be/projects/web/Simple-Logistic-System/back/db/fill_mock_data.sql)

---

## 🛰️ Backend Interaction Points & Endpoints Overview

| Category | HTTP Method | Route Endpoint | Query Parameters | Description |
| :--- | :---: | :--- | :--- | :--- |
| **System** | `GET` | `/status` | None | Returns list of existing database tables |
| **System** | `GET` | `/db-name` | None | Returns active PostgreSQL database name |
| **Warehouses** | `GET` | `/warehouses` | None | Retrieves all warehouse / deposit locations |
| **Warehouses** | `GET` | `/warehouses/:id` | None | Retrieves warehouse metadata by ID |
| **Warehouses** | `GET` | `/warehouses/:id/stock` | None | Retrieves inventory stock records for warehouse `:id` |
| **Warehouses** | `PUT` | `/warehouses/:id` | None | Updates location, capacity, refrigeration, and fuel price |
| **Fleet / Trucks** | `GET` | `/trucks` | `?model=<name>` | Retrieves all fleet trucks (optionally filtered by model) |
| **Fleet / Trucks** | `GET` | `/trucks/:id` | None | Retrieves single truck record |
| **Fleet / Trucks** | `PUT` | `/trucks/:id` | None | Updates truck state, maintenance flag, location, fuel |
| **Products** | `GET` | `/products` | `?name=<search>` | Retrieves catalog products (optionally searched by name) |
| **Products** | `GET` | `/products/:id` | None | Retrieves product details by ID |
| **Products** | `PUT` | `/products/:id` | None | Updates product pricing, volume, weight, cold/fragile flags |
| **Users / Access** | `GET` | `/users` | `?role=<role>` | Retrieves system users (`admin`, `warehouse_worker`, `truck_driver`, `client`) |
| **Users / Access** | `GET` | `/users/:id` | None | Retrieves user profile by ID |
| **Users / Access** | `GET` | `/online-users` | `?userId=<id>` | Retrieves active session logs |
| **Suppliers** | `GET` | `/suppliers` | None | Retrieves supplier entities |
| **Suppliers** | `GET` | `/suppliers/:id` | None | Retrieves supplier details |
| **Orders** | `GET` | `/orders` | `?clientId=<id>` | Retrieves logistics orders (optionally filtered by client) |
| **Orders** | `POST` | `/orders` | None | Creates a new order and attaches line items |
| **Orders** | `GET` | `/orders/:id` | None | Retrieves order header |
| **Orders** | `GET` | `/orders/:id/items` | None | Retrieves ordered product items and quantities |
| **Orders** | `GET` | `/orders/:id/route` | None | Retrieves transit steps and warehouse stops |
| **Orders** | `GET` | `/orders/:id/cost` | None | Retrieves calculated freight cost breakdown |
| **Supplies** | `GET` | `/supplies-route` | `?orderId=<id>` / `?supplierId=<id>` | Retrieves supplier delivery routes |
| **Costs** | `GET` | `/freight-cost` | `?orderId=<id>` | Retrieves freight cost logs across all orders |
| **Valhalla Route** | `POST` | `/route` | Payload `{ orderId, warehouseId }` | Integrates with Valhalla engine to compute truck shape |
| **Performance Reports**| `GET` | `/monthly-performance` | None | Retrieves 12-month profit vs costs, margin spread, and points of interest (POI) |

---

## 📊 Endpoints Detail & Database Schemas

### 1. Warehouses (`/warehouses`)
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

### 2. Fleet Trucks (`/trucks`)
- **Table Name**: `trucks`
- **Data Schema**:
  ```json
  {
    "id": "TRK-001",
    "model": "Volvo FH16",
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

### 3. Orders & Freight Costs (`/orders`, `/freight-cost`)
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

### 4. Monthly Performance Analytics (`/monthly-performance`)
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
- **Reports Integration**: [`front/app/(dashboard)/reports/page.tsx`](file:///home/be/projects/web/Simple-Logistic-System/front/app/%28dashboard%29/reports/page.tsx) & [`front/components/performance-graphs.tsx`](file:///home/be/projects/web/Simple-Logistic-System/front/components/performance-graphs.tsx)
