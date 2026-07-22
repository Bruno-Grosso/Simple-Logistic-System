# Plano de Integração: Frontend <-> Backend & Banco de Dados (Sem alterar o Backend)

Este documento detalha o plano de ação arquitetural e técnico para substituir os dados estáticos do frontend (`mock-data.ts`) por chamadas reais aos endpoints existentes no backend ([back/app/src/server.ts](file:///home/lhff/Simple-Logistic-System/back/app/src/server.ts)), executando todas as transformações de schema e cálculos de negócio diretamente no frontend.

---

## 1. Visão Geral da Arquitetura

O sistema backend ([back/app/src/server.ts](file:///home/lhff/Simple-Logistic-System/back/app/src/server.ts)) expõe endpoints REST baseados no banco de dados PostgreSQL ([back/db/db.sql](file:///home/lhff/Simple-Logistic-System/back/db/db.sql)) e um serviço de roteamento Valhalla ([back/app/src/routes.ts](file:///home/lhff/Simple-Logistic-System/back/app/src/routes.ts)).

### Princípio Fundamental
**O backend permanecerá 100% inalterado.**
Todas as discrepâncias entre a estrutura das tabelas SQL/respostas JSON do backend e os tipos esperados pelo frontend serão resolvidas através de:
1. **Camada de Adaptação (`lib/adapters.ts`)**: Mapeamento de colunas do banco para propriedades de UI.
2. **Motor de Calculo no Frontend (`lib/calculations.ts`)**: Agregação de KPIs, cálculo de volumetria, ocupação e simulação de custos de frete com base nos dados do backend.
3. **Gerenciador de Estado do Cliente**: Armazenamento local temporário para ações de criação (ex: formulário de novo pedido) quando o backend não possuir endpoint `POST`/`PUT`.

---

## 2. Mapeamento de Endpoints, Tabelas e Telas

| Tela Frontend | Endpoint Backend | Tabela SQL Fonte | Transformações & Adaptadores Necessários |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `GET /orders`, `GET /trucks`, `GET /warehouses` | `orders`, `trucks`, `warehouses` | Agregar estatísticas no frontend (pedidos por status, frota em trânsito, faturamento total). |
| **Pedidos (`/orders`)** | `GET /orders`, `GET /users` | `orders`, `users` | Mapear `final_destination` (JSON/string), resolver nome do cliente pelo `client_id`. |
| **Detalhes do Pedido (`/orders/[id]`)** | `GET /orders/:id`, `GET /orders/:id/items`, `GET /orders/:id/route`, `GET /orders/:id/cost`, `POST /route` | `orders`, `orders_items`, `orders_route`, `freight_cost`, Valhalla | Consolidar itens do pedido, calcular rota geográfica via `POST /route`, exibir detalhamento de custos. |
| **Depósitos (`/deposits`)** | `GET /warehouses`, `GET /warehouses/:id/stock` | `warehouses`, `warehouses_stock` | Mapear `volume_current` -> `volume_actual`, parse do JSON de `location` e `size`, converter `has_refrigeration` (0/1 -> boolean). |
| **Frota (`/fleet`)** | `GET /trucks`, `GET /trucks/:id` | `trucks` | Mapear `current_warehouse_id` -> `current_deposit_id`, converter inteiros `0/1` para booleanos (`is_delivering`, `is_valid`, `truck_maintenance`). |
| **Estoque (`/stock`)** | `GET /warehouses`, `GET /warehouses/:id/stock`, `GET /products` | `warehouses_stock`, `products` | Fazer cruzamento (join) no frontend dos dados de estoque com a tabela de produtos. |
| **Funcionários (`/employees`)** | `GET /users` | `users` | Filtrar por `role IN ('warehouse_worker', 'truck_driver')`. Mapear `role` SQL para papéis de UI. |
| **Fornecedores (`/suppliers`)** | `GET /suppliers` | `suppliers` | Mapear `location` para formato legível de endereço/coordenadas. |
| **Produtos (`/products`)** | `GET /products` | `products` | Mapear booleanos `is_cold` e `is_fragile` (0/1 -> boolean). |
| **Relatórios (`/reports`)** | `GET /orders`, `GET /freight-cost`, `GET /trucks` | `orders`, `freight_cost`, `trucks` | Processar séries temporais e estatísticas financeiras diretamente no cliente. |

---

## 3. Camada de Adaptação de Dados (`lib/adapters.ts`)

Como as colunas do banco de dados diferem ligeiramente das interfaces de UI do frontend ([front/types/index.ts](file:///home/lhff/Simple-Logistic-System/front/types/index.ts)), criaremos adaptadores puros no frontend:

```typescript
// Exemplo de conversão de Warehouse (Backend) para Deposit (Frontend UI)
export function adaptWarehouseToDeposit(raw: any): Deposit {
  const loc = typeof raw.location === 'string' ? JSON.parse(raw.location) : raw.location;
  return {
    id: raw.id,
    location: loc?.city ? `${loc.city}, ${loc.state}` : JSON.stringify(raw.location),
    size: raw.size ? JSON.stringify(raw.size) : undefined,
    volume_actual: raw.volume_current ?? 0,
    volume_max: raw.volume_max ?? 0,
    has_refrigeration: Boolean(raw.has_refrigeration),
  };
}

// Exemplo de conversão de Truck (Backend) para Truck (Frontend UI)
export function adaptTruck(raw: any): Truck {
  return {
    id: raw.id,
    model: raw.model,
    size: raw.size ? JSON.stringify(raw.size) : undefined,
    volume_actual: raw.volume_current ?? 0,
    volume_max: raw.volume_max ?? 0,
    weight_actual: raw.weight_current ?? 0,
    weight_max: raw.weight_max ?? 0,
    is_delivering: Boolean(raw.is_delivering),
    is_valid: Boolean(raw.is_valid),
    is_traveling: Boolean(raw.is_delivering), // no DB é is_delivering
    current_deposit_id: raw.current_warehouse_id,
    origin_deposit_id: raw.origin_warehouse_id,
    destination_deposit_id: raw.destination_warehouse_id,
    has_refrigeration: Boolean(raw.has_refrigeration),
    speed: raw.speed,
    fuel_capacity: raw.fuel_capacity,
    fuel_current: raw.fuel_current,
    fuel_consumption: raw.fuel_consumption,
    wear_percentage: raw.truck_maintenance ? 85 : 15, // Mapeamento do alerta de manutenção
  };
}
```

---

## 4. Motor de Cálculos no Frontend (`lib/calculations.ts`)

Sem alterar o backend, as métricas e resumos exibidos serão calculados no frontend a partir dos conjuntos de dados recebidos:

### 4.1 KPIs do Dashboard
- **`ordersInProgress`**: `orders.filter(o => o.status === 'Shipped').length`
- **`pendingOrders`**: `orders.filter(o => o.status === 'Pending').length`
- **`deliveredThisMonth`**: `orders.filter(o => o.status === 'Delivered').length`
- **`totalRevenue`**: `orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.price, 0)`

### 4.2 Ocupação de Depósitos e Frota
- **% Ocupação Depósito**: `(warehouse.volume_current / warehouse.volume_max) * 100`
- **% Ocupação Carga Caminhão**: `(truck.volume_current / truck.volume_max) * 100`
- **% Ocupação Peso Caminhão**: `(truck.weight_current / truck.weight_max) * 100`

### 4.3 Roteamento e Custo de Frete (Valhalla + Client Calculation)
1. O frontend chama `POST /route` passando `{ orderId, warehouseId }`.
2. O backend retorna a polyline codificada (`encodedShape`) e o resumo da viagem (`summary`: distância em km e tempo em segundos).
3. Caso a tabela `freight_cost` ainda não tenha valores salvos para o pedido, o frontend calcula:
   - `Custo Combustível` = `(distancia_km / consumo_caminhao) * preco_combustivel_deposito`
   - `Custo Mão de Obra` = `(tempo_horas * custo_hora_motorista)`
   - `Custo Total` = `Custo Combustível + Custo Mão de Obra + Manutenção`

---

## 5. Estratégia de Mutação de Dados no Frontend

Como o backend expõe principalmente rotas `GET` e `POST /route`, para criar novos pedidos ou atualizar dados na interface sem alterar a API backend:
- **Estado Reativo do React / Context**: Os formulários de criação (ex: `/orders/new`) adicionarão o pedido ao estado local da sessão (com persistência via `localStorage` ou Zustand/React State).
- Ao listar pedidos, o frontend unifica os pedidos vindos da API (`GET /orders`) com os novos pedidos criados localmente na sessão do usuário.

---

## 6. Plano de Execução em Passos

1. **Fase 1: Expandir o `lib/api.ts`**
   - Implementar todos os métodos de busca para `/warehouses`, `/trucks`, `/products`, `/users`, `/orders`, `/suppliers`, `/freight-cost` e `POST /route`.
2. **Fase 2: Criar `lib/adapters.ts` e `lib/calculations.ts`**
   - Escrever os adaptadores de tipo e os utilitários de cálculos de KPIs e frete.
3. **Fase 3: Substituir `mock-data.ts` nas Páginas**
   - Atualizar sequencialmente cada página do dashboard (`(dashboard)/...`) para buscar dados do `api` em vez das constantes estáticas.
4. **Fase 4: Integrar Mapa e Roteador em `/orders/[id]`**
   - Consumir `POST /route` e renderizar o trajeto no mapa com as estatísticas do Valhalla.
5. **Fase 5: Validação Final e Tratamento de Erros**
   - Adicionar estados de *loading* (Skeleton) e tratamento para quando o backend não estiver rodando ou retornar erros.
