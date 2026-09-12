# Modelo de Dados - Projeto de Logística

Abaixo está a representação das classes e relacionamentos do sistema:

# Esquema do Banco de Dados - Projeto Logística

Este diagrama vetorial representa a estrutura de classes e relacionamentos do sistema, incluindo Usuários, Funcionários, Produtos e Logística de Entrega, renderizado com o motor ELK para máxima clareza.

![Esquema do Banco de Dados .jpeg](UML%20scheme%20Image%201.PNG)

![Esquema do Banco de Dados 2 .jpeg](UML%20scheme%20Image%202.PNG)

![Esquema do Banco de Dados .svg](dbdatabase_scheme%20V3.0.svg)

---

## Diagrama Entidade-Relacionamento (ERD) - Renderização Nativa

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "places (client_id)"
    USERS ||--o{ ONLINE_USERS : "session (user_id)"
    USERS ||--o{ ORDERS_ROUTE : "drives (driver_id)"
    WAREHOUSES ||--o{ USERS : "staff (warehouse_id)"
    
    WAREHOUSES ||--o{ WAREHOUSES_STOCK : "stores"
    PRODUCTS ||--o{ WAREHOUSES_STOCK : "stocked in"
    
    ORDERS ||--|{ ORDERS_ITEMS : "contains"
    PRODUCTS ||--o{ ORDERS_ITEMS : "item in"
    
    TRUCKS ||--o{ TRUCKS_CARGO : "carries"
    PRODUCTS ||--o{ TRUCKS_CARGO : "cargo"
    
    ORDERS ||--|{ ORDERS_ROUTE : "route steps"
    WAREHOUSES ||--o{ ORDERS_ROUTE : "waypoint"
    TRUCKS ||--o{ ORDERS_ROUTE : "assigned truck"
    
    SUPPLIERS ||--o{ ORDERS : "supplies"
    SUPPLIERS ||--o{ SUPPLIES_ROUTE : "from supplier"
    ORDERS ||--o{ SUPPLIES_ROUTE : "supply route"
    TRUCKS ||--o{ SUPPLIES_ROUTE : "transport"
    
    WAREHOUSES ||--o{ TRUCKS : "stationed"
    ORDERS ||--|| FREIGHT_COST : "freight cost"

    USERS {
        string id PK
        string name
        string email UK
        string password
        json address
        string role
        string warehouse_id FK
        float wage
        int is_active
    }

    ONLINE_USERS {
        string session_id PK
        string user_id FK
        string login_time
        string last_activity
    }

    PRODUCTS {
        string id PK
        string name
        float price
        int is_cold
        int is_fragile
        string expire_date
        json size
        float volume
        float weight
    }

    WAREHOUSES {
        string id PK
        json location
        json size
        float volume_current
        float volume_max
        int has_refrigeration
        float fuel_price
        int truck_capacity
    }

    WAREHOUSES_STOCK {
        string warehouse_id PK,FK
        string product_id PK,FK
        int quantity
    }

    TRUCKS {
        string id PK
        string model
        float speed
        int is_valid
        int is_delivering
        json size
        float volume_current
        float volume_max
        float weight_current
        float weight_max
        int has_refrigeration
        string current_warehouse_id FK
        string origin_warehouse_id FK
        string destination_warehouse_id FK
        string estimated_time
        float fuel_capacity
        float fuel_current
        float fuel_consumption
        int truck_maintenance
    }

    TRUCKS_CARGO {
        string truck_id PK,FK
        string product_id PK,FK
        int quantity
    }

    ORDERS {
        string id PK
        string client_id FK
        string final_destination
        string time_limit
        float price
        string status
        string supplier_id FK
        int supplier_delivery
        float distance_km
    }

    ORDERS_ITEMS {
        string order_id PK,FK
        string product_id PK,FK
        int quantity
    }

    ORDERS_ROUTE {
        string order_id PK,FK
        int step PK
        string warehouse_id FK
        string truck_id FK
        string driver_id FK
        string destination_warehouse_id FK
        string estimated_time
        string arrived_at
    }

    SUPPLIERS {
        string id PK
        string name
        string location
    }

    SUPPLIES_ROUTE {
        string order_id PK,FK
        string supplier_id PK,FK
        string truck_id FK
        string estimated_departure
        string estimated_arrival
        string actual_arrival
    }

    FREIGHT_COST {
        string order_id PK,FK
        float fuel_cost
        float labor_cost
        float maintenance_cost
        float total_cost
        string calculated_at
    }
```

---

<details>
<summary><b>Clique para ver o Diagrama de Classes UML (para edições no Mermaid Live Editor)</b></summary>

```mermaid
%%{init:{ "layout": "elk", "themeVariables": {"relationFontSize": "20px"}}}%%
classDiagram
    direction LR
    
    class Users {
        +String id
        +String NAME
        +String EMAIL
        +String PASSWORD
        +JSON ADDRESS
        +String ROLE
        +String WAREHOUSE_ID
        +REAL WAGE
        +INTEGER IS_ACTIVE
    }
    note for Users "CARGO: Cliente, ADM, Motorista, etc."
    note for Users "SENHA: Acesso ao sistema via ID ou Email."

    class Online_users {
        +String SESSION_id
        +String USER_id
        +String LOGIN_TIME
        +String LAST_ACTIVITY
    }

    class Products {
        +String id
        +String NAME
        +INTEGER IS_COLD
        +INTEGER IS_FRAGILE
        +String EXPIRE_DATE
        +JSON SIZE
        +REAL PRICE
        +REAL VOLUME
        +REAL WEIGHT
    }

    class Truck {
        +String id
        +String MODEL
        +REAL SPEED
        +INTEGER IS_VALID
        +INTEGER IS_DELIVERING
        +JSON SIZE
        +String ESTIMATED_TIME
        +REAL VOLUME_CURRENT
        +REAL VOLUME_MAX
        +REAL WEIGHT_CURRENT
        +REAL WEIGHT_MAX
        +INTEGER HAS_REFRIGERATION
        +String WAREHOUSE_ORIGIN_id
        +String WAREHOUSE_CURRENT_id
        +String WAREHOUSE_DESTINATION_id
        +REAL FUEL_CAPACITY
        +REAL FUEL_CURRENT
        +REAL FUEL_CONSUMPTION
        +INTEGER TRUCK_MAINTENANCE
    }
    note for Truck "ETA: Chegada estimada na rota."

    class Trucks_cargo {
        +String TRUCK_id
        +String PRODUCT_id
        +INTEGER QUANTITY
    }

    class Orders {
        +String id
        +String CLIENT_id
        +String FINAL_DESTINATION
        +String TIME_LIMIT
        +REAL PRICE
        +String STATUS
        +String SUPPLIER_id
        +INTEGER SUPPLIER_DELIVERY
        +REAL DISTANCE_KM
    }
    note for Orders "CLIENT_id: Usuário cliente vinculado."
    note for Orders "STATUS: Pending, Shipped, Delivered, Canceled."

    class Orders_items {
        +String ORDER_id
        +String PRODUCT_id
        +INTEGER QUANTITY
    }

    class Warehouses_stock {
        +String WAREHOUSE_id
        +String PRODUCT_id
        +INTEGER QUANTITY
    }

    class Orders_Route {
        +String ORDER_id
        +INTEGER STEP
        +String WAREHOUSE_id
        +String TRUCK_id
        +String DRIVER_id
        +String DESTINATION_WAREHOUSE_id
        +String ESTIMATED_TIME
        +String ARRIVED_AT
    }

    class Suppliers {
        +String id
        +String NAME
        +String LOCATION
    }

    class Suppliers_route {
        +String ORDER_id
        +String SUPPLIER_id
        +String TRUCK_id
        +String ESTIMATED_DEPARTURE
        +String ESTIMATED_ARRIVAL
        +String ACTUAL_ARRIVAL
    }

    class Warehouses {
        +String id
        +JSON LOCATION
        +JSON SIZE
        +REAL VOLUME_CURRENT
        +REAL VOLUME_MAX
        +INTEGER HAS_REFRIGERATION
        +REAL FUEL_PRICE
        +INTEGER TRUCK_CAPACITY
    }

    class Freight_cost {
        +String ORDER_id
        +REAL FUEL_COST
        +REAL LABOR_COST
        +REAL MAINTENANCE_COST
        +REAL TOTAL_COST
        +String CALCULATED_AT
    }

    %% Relacionamentos estruturados em 3 colunas (evita cruzamento diagonal)
    Users " 1 " --> " * " Orders : ORDER
    Users " 1 " --> " 1 " Online_users : ONLINE_USERS
    Products " * " --> " 1 " Truck : TRUCKS_CARGO
    Products " * " --> " 1 " Warehouses : WAREHOUSE_STOCK
    Products " * " --> " 1 " Orders_items : ORDERS_ITEMS
    Products " * " --> " 1 " Warehouses_stock : STOCK
    Products " * " --> " 1 " Trucks_cargo : STOCK
    Orders " * " --> " 1 " Orders_Route : ORDERS
    Orders " 1 " --> " * " Orders_items : ORDERS_ITEMS
    Orders " 1 " --> " * " Suppliers_route : SUPPLIERS_ROUTE
    Orders " 1 " --> " 1 " Freight_cost : FREIGHT_COST
    Suppliers " * " --> " 1 " Orders : SUPPLIERS_ROUTE
    Suppliers " 1 " --> " 1 " Suppliers_route : SUPPLIERS_ROUTE
    Truck " * " --> " 1 " Warehouses : TRUCKS
    Truck " 1 " --> " 1 " Trucks_cargo : TRUCKS
    Truck " 1 " --> " * " Orders_Route : TRUCKS_IN_ROUTE
    Truck " 1 " --> " * " Suppliers_route : SUPPLIERS_ROUTE
    Warehouses " 1 " --> " 1 " Warehouses_stock : STOCK
    Warehouses " 1 " --> " * " Orders_Route : WAREHOUSE_ROUTE
```

    
   
   
    
   


    
   
   
