# Modelo de Dados - Projeto de Logística

Abaixo está a representação das classes e relacionamentos do sistema:

# Esquema do Banco de Dados - Projeto Logística

Este diagrama vetorial representa a estrutura de classes e relacionamentos do sistema, incluindo Usuários, Funcionários, Produtos e Logística de Entrega, renderizado com o motor ELK para máxima clareza.

> **Dica:** Como este é um arquivo SVG, você pode dar zoom na imagem no seu navegador para ler os detalhes sem perder qualidade.

![Esquema do Banco de Dados](https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/db/UML/dbdatabase_scheme%20V3.0.svg)

---

<details>
<summary><b>Clique para ver o Código Mermaid (para edições futuras)</b></summary>

'''mermaid
%%{init:{ "layout": "elk", "themeVariables": {"relationFontSize": "25px"}}}%%
%%{init:{ "layout": "elk", "themeVariables": {"relationFontSize": "25px"}}}%%
classDiagram
    direction LR
    
    class Users {
        +UUID id
        +String NAME
        +String PASSWORD
        +String ADDRESS
        +String ROLE
    }
    note for Users "CARGO: Cliente ou ADM."
    note for Users "SENHA: Acesso ao sistema."

    class Online_users{
        +UUID SESSION_id
        +Users[] USER_id
        +DOUBLE[] LOGIN_TIME
        +DOUBLE[] LAST_ACTIVITY
    }

    class Products {
        +UUID id
        +String NAME
        +BOOL IS_COLD
        +BOOL IS_FRAGILE
        +DATE_TIME EXPIRE_DATE
        +String LOCATION
        +DOUBLE[] SIZE
        +DOUBLE[] PRICE
        +DOUBLE[] VOLUME
        +DOUBLE[] WEIGHT
    }

    class Truck {
        +UUID id
        +String MODEL
        +DOUBLE[] SPEED
        +BOOL IS_VALID
        +BOOL IS_DELIVERING
        +DOUBLE[] SIZE
        +DATE_TIME ETA
        +DOUBLE[] VOULME_CURRENT
        +DOUBLE[] VOLUME_MAX
        +DOUBLE[] WEIGHT_CURRENT
        +DOUBLE[] WEIGHT_MAX
        +BOOL HAS_REFRIGERATION
        +Warehouses[] WAREHOUSE_ORIGIN_id
        +Warehouses[] WAREHOUSE_CURRENT_id
        +Warehouses[] WAREHOUSE_DESTINATION_id
        +DOUBLE[] FUEL_CAPACITY
        +DOUBLE[] FUEL_CURRENT
        +DOUBLE[] FUEL_CONSUMPTION
        +DOUBLE[] TRUCK_MAINTENANCE
    }
    note for Truck "ETA: Chegada estimada."

    class Trucks_cargo{
        +Truck[] TRUCK_id
        +Products[] PRODUCTS_id
        +INTEGER QUANTITY
    }

    class Orders {
        +UUID id
        +String FINAL_DESTINATION
        +DATE_TIME TIME_LIMIT
        +String STATUS
        +DOUBLE[] PRICE
        +BOOL SUPPLIER_DELIVERY
        +Suppliers[] SUPPLIER_id
        +Users[] CLIENT_id
        
    }
    note for Orders "USER: Lista de clientes vinculados."
    note for Orders "ROUTE: Depósitos da rota."
    note for Orders "STATUS: Avanço da viagem." 

    class Orders_items{
        +Orders[] ORDER_id
        +Products[] PRODUCTS_id
        +INTEGER QUANTITY
    }

    class Warehouses_stock{
        +Warehouses[] WAREHOUSE_id
        +Product[] PRODUCT  
        +INTEGER QUANTITY          
    }

    class Orders_Route{
        +Orders[] id
        +INTEGER STEP
        +Warehouses[] WAREHOUSE_id
        +Truck[] TRUCK_id
        +Warehouses[] WAREHOUSE_DESTINATION_id
        +String ESTIMATED_TIME
        +String ARRIVED_AT
    }

    class Suppliers{
        +UUID id
        +String NAME
        +String LOCATION
    }

    class Suppliers_route{
        +Orders[] ORDER_id
        +Suppliers[] SUPPLIER_id
        +Truck[] TRUCK_id
        +DOUBLE[] ESTIMATED_DEPARTURE
        +DOUBLE[] ESTIMATED_ARRIVAL
        +DOUBLE[] ACTUAL_ARRIVAL   
    }

    class Warehouses{
        +UUID id
        +String LOCATION
        +DOUBLE[] SIZE 
        +DOUBLE[] VOULME_CURRENT
        +DOUBLE[] VOLUME_MAX
        +BOOL HAS_REFRIGERATION
        +DOUBLE[] FUEL_PRICE
    }

    class Freight_cost{
        +Orders[] ORDER_id
        +DOUBLE[] FUEL_COST
        +DOUBLE[] LABOR_COST
        +DOUBLE[] MAINTENANCE_COST
        +DOUBLE[] TOTAL_COST
        +DOUBLE[] CALCULATED_AT 
    }


    
    %% Relacionamentos com 1 e *
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

    
   
   
