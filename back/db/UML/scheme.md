# Modelo de Dados - Projeto de Logística

Abaixo está a representação das classes e relacionamentos do sistema:

# Esquema do Banco de Dados - Projeto Logística

Este diagrama vetorial representa a estrutura de classes e relacionamentos do sistema, incluindo Usuários, Funcionários, Produtos e Logística de Entrega, renderizado com o motor ELK para máxima clareza.

![Esquema do Banco de Dados .jpeg](UML%20scheme%20Image%201.PNG)

![Esquema do Banco de Dados 2 .jpeg](UML%20scheme%20Image%202.PNG)

![Esquema do Banco de Dados .svg](https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/db/UML/dbdatabase_scheme%20V3.0.svg)

---

<details>
<summary><b>Clique para ver o Código Mermaid (para edições futuras)</b></summary>

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

    
   


    
   
   
