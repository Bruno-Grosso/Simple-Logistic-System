# Modelo de Dados - Projeto de Logística

Abaixo está a representação das classes e relacionamentos do sistema:

# Esquema do Banco de Dados - Projeto Logística

Este diagrama vetorial representa a estrutura de classes e relacionamentos do sistema, incluindo Usuários, Funcionários, Produtos e Logística de Entrega, renderizado com o motor ELK para máxima clareza.

> **Dica:** Como este é um arquivo SVG, você pode dar zoom na imagem no seu navegador para ler os detalhes sem perder qualidade.

![Esquema do Banco de Dados](https://raw.githubusercontent.com/Bruno-Grosso/Simple-Logistic-System/refs/heads/main/db/scheme_db.svg)

---

<details>
<summary><b>Clique para ver o Código Mermaid (para edições futuras)</b></summary>

'''mermaid
%%{init:{ "layout": "elk", "themeVariables": {"relationFontSize": "25px"}}}%%
classDiagram
    direction LR
    
    class User {
        +UUID id
        +String NAME
        +String POSITION
        +String PASSWORD
        +String LOCATION
    }
    note for User "CARGO: Cliente ou ADM."
    note for User "SENHA: Acesso ao sistema."

    class Product {
        +UUID id
        +String NOME
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
        +BOOL IS_VALID
        +BOOL IS_TRAVELING
        +DOUBLE CAPACITY
        +DATE_TIME ETA
        +DOUBLE[] VOLUME_ACTUAL
        +DOUBLE[] VOLUME_MAX
        +DOUBLE[] WEIGHT_ACTUAL
        +DOUBLE[] WEIGHT_MAX
        +Deposit[] ORIGIN
        +Deposit[] DESTINATION
        +Product[] CARGO
        +String[] LOCATIONS
    }
    note for Truck "ETA: Chegada estimada."

    class Deposit {
        +UUID id
        +String LOCATION
        +String SIZE,
        +Real VOLUME_ACTUAL,
        +Real VOLUME_MAX,
        +DOUBLE[] CAPACITY
        +Product[] PRODUCTS
        +Truck[] TRUCKS
    }

    class Order {
        +UUID id
        +String DESTINATION
        +String SENDER
        +String RECEIVER
        +DATE_TIME TIME_LIMIT
        +String STATUS
        +DOUBLE[] PRICE
        +Product[] PRODUCT
        +Deposit[] ROUTE
        +Client[] USER
        
    }
    note for Order "USER: Lista de clientes vinculados."
    note for Order "ROUTE: Depósitos da rota."
    note for Order "STATUS: Avanço da viagem." 

    class Stock{
        +UUID id
        +INTEGER QUANTITY
        +String ARRIVED_AT
        +Product[] PRODUCT
        +Deposit[] DEPOSIT
        +Truck[] TRUCKS         
    }

    class Order_Route{
        +UUID id
        +INTEGER STEP
        +String ESTIMATED_TIME
        +String ARRIVED_AT
        +Deposit[] DEPOSIT
    }

    class Employees{
        +UUID id
        +String NAME
        +String POSITION
        +BOOL IS_ABLE
        +Truck[] TRUCK
        +Deposit[] DEPOSIT
    }
    %% Relacionamentos com 1 e *
    User " * " --> " 1 " Order : ORDER
    Product " * " --> " 1 " Truck : CARGO
    Product " * " --> " 1 " Deposit : PRODUCTS
    Product " * " --> " 1 " Order : PRODUCT
    Product " * " --> " 1 " Stock : PRODUCT
    Deposit " * " --> " 1 " Order : ROUTE
    Deposit " * " --> " 1 " Truck : DEPOSITS
    Deposit " * " --> " 1 " Stock : DEPOSITS
    Deposit " * " --> " 1 " Order_Route : DEPOSITS
    Deposit " * " --> " 1 " Employees : EMPLOYEES 
    Truck " * " --> " 1 " Stock : TRUCKS
    Truck " * " --> " 1 " Employees : EMPLOYEES 

