import type {
  User,
  Deposit,
  Truck,
  Product,
  Order,
  OrderItem,
  OrderRoute,
  Stock,
  Employee,
  Supplier,
  SupplyRoute,
  DashboardStats,
} from "@/types";

// ─── 1. Users (from db/fill_mock_data.sql) ──────────────────────────────────

export const USERS: User[] = [
  {
    id: "USR-001",
    name: "Alice Admin",
    role: "admin",
    work_position: "System Admin",
    address: "Rua do Imperador, Centro, Petrópolis - RJ",
  },
  {
    id: "USR-002",
    name: "Bob Worker",
    role: "worker",
    work_position: "Warehouse Worker",
    address: "Estrada União e Indústria, Itaipava, Petrópolis - RJ",
  },
  {
    id: "USR-003",
    name: "Charlie Driver",
    role: "worker",
    work_position: "Truck Driver",
    address: "Av. Alberto Braune, Centro, Nova Friburgo - RJ",
  },
  {
    id: "USR-004",
    name: "David Client",
    role: "client",
    address: "Av. Reta da Várzea, Várzea, Teresópolis - RJ",
  },
  {
    id: "USR-005",
    name: "Eve Client",
    role: "client",
    address: "Rua Monte Líbano, Centro, Nova Friburgo - RJ",
  },
  {
    id: "USR-006",
    name: "Frank Driver",
    role: "worker",
    work_position: "Truck Driver",
    address: "Estrada Terê-Fri, Km 12, Teresópolis - RJ",
  },
  {
    id: "USR-007",
    name: "Grace Worker",
    role: "worker",
    work_position: "Warehouse Worker",
    address: "Rua General Osório, Centro, Nova Friburgo - RJ",
  },
  {
    id: "USR-008",
    name: "Henry Client",
    role: "client",
    address: "Rua Visconde de Uruguai, Cachoeiras de Macacu - RJ",
  },
  {
    id: "USR-009",
    name: "Ivy Client",
    role: "client",
    address: "Av. Dedo de Deus, Guapimirim - RJ",
  },
  {
    id: "USR-010",
    name: "Jack Worker",
    role: "worker",
    work_position: "Warehouse Worker",
    address: "Rua Cel. Veiga, Petrópolis - RJ",
  },
];

export const getUserById = (id: string): User | undefined =>
  USERS.find((u) => u.id === id);

// ─── 2. Deposits / Warehouses (from db/fill_mock_data.sql) ─────────────────

export const DEPOSITS: Deposit[] = [
  {
    id: "WH-001",
    location: "Petrópolis Hub - Itaipava (Lat: -22.3842, Lon: -43.1311)",
    size: '{"length":100,"width":100,"height":10}',
    volume_actual: 0.36,
    volume_max: 100000.0,
    has_refrigeration: true,
  },
  {
    id: "WH-002",
    location: "Teresópolis Depot - Alto (Lat: -22.4350, Lon: -42.9800)",
    size: '{"length":50,"width":50,"height":8}',
    volume_actual: 0.0,
    volume_max: 20000.0,
    has_refrigeration: false,
  },
  {
    id: "WH-003",
    location: "Nova Friburgo Facility - Olaria (Lat: -22.3000, Lon: -42.5400)",
    size: '{"length":80,"width":60,"height":10}',
    volume_actual: 0.0,
    volume_max: 48000.0,
    has_refrigeration: true,
  },
];

export const getDepositById = (id: string): Deposit | undefined =>
  DEPOSITS.find((d) => d.id === id);

export const getDepositLabel = (deposit: Deposit): string =>
  deposit.location || `Warehouse ${deposit.id}`;

// ─── 3. Trucks (from db/fill_mock_data.sql) ─────────────────────────────────

export const TRUCKS: Truck[] = [
  {
    id: "TRK-001",
    model: "Volvo FH16",
    size: '{"length":13.6,"width":2.5,"height":2.7}',
    volume_actual: 0.0,
    volume_max: 90.0,
    weight_actual: 0.0,
    weight_max: 25000.0,
    is_delivering: false,
    is_valid: true,
    is_traveling: false,
    current_deposit_id: "WH-001",
    has_refrigeration: true,
    speed: 85.0,
    fuel_capacity: 500.0,
    fuel_current: 450.0,
    fuel_consumption: 0.3,
    wear_percentage: 20,
    truck_maintenance: 0,
  },
  {
    id: "TRK-002",
    model: "Scania R500",
    size: '{"length":13.6,"width":2.5,"height":2.7}',
    volume_actual: 0.036,
    volume_max: 90.0,
    weight_actual: 2.5,
    weight_max: 25000.0,
    is_delivering: true,
    is_valid: true,
    is_traveling: true,
    origin_deposit_id: "WH-001",
    destination_deposit_id: "WH-002",
    estimated_time: "2026-03-26T14:00:00",
    has_refrigeration: false,
    speed: 80.0,
    fuel_capacity: 600.0,
    fuel_current: 300.0,
    fuel_consumption: 0.35,
    wear_percentage: 30,
    truck_maintenance: 0,
  },
  {
    id: "TRK-003",
    model: "MAN TGX",
    size: '{"length":13.6,"width":2.5,"height":2.7}',
    volume_actual: 0.0,
    volume_max: 90.0,
    weight_actual: 0.0,
    weight_max: 25000.0,
    is_delivering: false,
    is_valid: true,
    is_traveling: false,
    current_deposit_id: "WH-003",
    has_refrigeration: true,
    speed: 82.0,
    fuel_capacity: 550.0,
    fuel_current: 500.0,
    fuel_consumption: 0.32,
    wear_percentage: 15,
    truck_maintenance: 0,
  },
  {
    id: "TRK-004",
    model: "Iveco S-Way",
    size: '{"length":12,"width":2.4,"height":2.5}',
    volume_actual: 0.0,
    volume_max: 72.0,
    weight_actual: 0.0,
    weight_max: 18000.0,
    is_delivering: false,
    is_valid: true,
    is_traveling: false,
    current_deposit_id: "WH-002",
    has_refrigeration: false,
    speed: 75.0,
    fuel_capacity: 400.0,
    fuel_current: 380.0,
    fuel_consumption: 0.28,
    wear_percentage: 15,
    truck_maintenance: 1,
  },
];

export const getTruckById = (id: string): Truck | undefined =>
  TRUCKS.find((t) => t.id === id);

// ─── 4. Products (from db/fill_mock_data.sql) ───────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "PROD-001",
    name: "Fresh Milk",
    is_cold: true,
    is_fragile: false,
    expire_date: "2026-04-10",
    price: 3.5,
    size: '{"length":10,"width":10,"height":20}',
    volume: 0.002,
    weight: 1.0,
  },
  {
    id: "PROD-002",
    name: "Crystal Vase",
    is_cold: false,
    is_fragile: true,
    price: 45.0,
    size: '{"length":30,"width":30,"height":40}',
    volume: 0.036,
    weight: 2.5,
  },
  {
    id: "PROD-003",
    name: "Smartphone X",
    is_cold: false,
    is_fragile: false,
    price: 899.99,
    size: '{"length":15,"width":8,"height":2}',
    volume: 0.00024,
    weight: 0.2,
  },
  {
    id: "PROD-004",
    name: "Frozen Pizza",
    is_cold: true,
    is_fragile: false,
    expire_date: "2026-09-20",
    price: 5.99,
    size: '{"length":30,"width":30,"height":3}',
    volume: 0.0027,
    weight: 0.5,
  },
  {
    id: "PROD-005",
    name: "Office Chair",
    is_cold: false,
    is_fragile: false,
    price: 120.0,
    size: '{"length":60,"width":60,"height":100}',
    volume: 0.36,
    weight: 12.0,
  },
  {
    id: "PROD-006",
    name: "Gaming Laptop",
    is_cold: false,
    is_fragile: true,
    price: 1500.0,
    size: '{"length":40,"width":30,"height":5}',
    volume: 0.006,
    weight: 3.0,
  },
  {
    id: "PROD-007",
    name: "Red Wine Box",
    is_cold: false,
    is_fragile: true,
    expire_date: "2028-12-31",
    price: 80.0,
    size: '{"length":30,"width":20,"height":30}',
    volume: 0.018,
    weight: 9.0,
  },
  {
    id: "PROD-008",
    name: "Industrial Drill",
    is_cold: false,
    is_fragile: false,
    price: 250.0,
    size: '{"length":40,"width":15,"height":25}',
    volume: 0.015,
    weight: 5.5,
  },
];

export const getProductById = (id: string): Product | undefined =>
  PRODUCTS.find((p) => p.id === id);

// ─── 5. Orders & Line Items (from db/fill_mock_data.sql) ────────────────────

export const ORDERS: Order[] = [
  {
    id: "ORD-001",
    client_id: "USR-004",
    final_destination: "Av. Reta da Várzea, Várzea, Teresópolis - RJ",
    time_limit: "2026-03-30",
    price: 50.0,
    status: "Pending",
    supplier_id: "SUP-002",
    supplier_delivery: false,
  },
  {
    id: "ORD-002",
    client_id: "USR-005",
    final_destination: "Rua Monte Líbano, Centro, Nova Friburgo - RJ",
    time_limit: "2026-03-28",
    price: 950.0,
    status: "Shipped",
    supplier_id: "SUP-001",
    supplier_delivery: true,
  },
  {
    id: "ORD-003",
    client_id: "USR-004",
    final_destination: "Av. Reta da Várzea, Várzea, Teresópolis - RJ",
    time_limit: "2026-03-20",
    price: 15.0,
    status: "Delivered",
    supplier_delivery: true,
  },
  {
    id: "ORD-004",
    client_id: "USR-008",
    final_destination: "Rua Visconde de Uruguai, Cachoeiras de Macacu - RJ",
    time_limit: "2026-04-05",
    price: 2400.0,
    status: "Pending",
    supplier_id: "SUP-003",
    supplier_delivery: false,
  },
  {
    id: "ORD-005",
    client_id: "USR-009",
    final_destination: "Av. Dedo de Deus, Guapimirim - RJ",
    time_limit: "2026-04-02",
    price: 120.0,
    status: "Cancelled",
    supplier_delivery: true,
  },
];

export const getOrderById = (id: string): Order | undefined =>
  ORDERS.find((o) => o.id === id);

export const ORDER_ITEMS: OrderItem[] = [
  { order_id: "ORD-001", product_id: "PROD-001", quantity: 5 },
  { order_id: "ORD-001", product_id: "PROD-004", quantity: 3 },
  { order_id: "ORD-002", product_id: "PROD-003", quantity: 1 },
  { order_id: "ORD-002", product_id: "PROD-002", quantity: 1 },
  { order_id: "ORD-003", product_id: "PROD-004", quantity: 2 },
  { order_id: "ORD-004", product_id: "PROD-006", quantity: 2 },
  { order_id: "ORD-004", product_id: "PROD-007", quantity: 10 },
  { order_id: "ORD-005", product_id: "PROD-005", quantity: 1 },
];

export const getOrderItems = (orderId: string): OrderItem[] =>
  ORDER_ITEMS.filter((item) => item.order_id === orderId);

export const ORDER_ROUTES: OrderRoute[] = [
  {
    order_id: "ORD-002",
    step: 1,
    deposit_id: "WH-001",
    truck_id: "TRK-002",
    estimated_time: "2026-03-26 14:00:00",
  },
  {
    order_id: "ORD-003",
    step: 1,
    deposit_id: "WH-001",
    arrived_at: "2026-03-19 10:00:00",
  },
  {
    order_id: "ORD-004",
    step: 1,
    deposit_id: "WH-003",
    truck_id: "TRK-003",
    estimated_time: "2026-04-01 10:00:00",
  },
];

export const getOrderRoute = (orderId: string): OrderRoute[] =>
  ORDER_ROUTES.filter((r) => r.order_id === orderId).sort(
    (a, b) => a.step - b.step,
  );

// ─── 6. Stock (from db/fill_mock_data.sql) ──────────────────────────────────

export const STOCK: Stock[] = [
  {
    id: "WH-001-PROD-005",
    deposit_id: "WH-001",
    product_id: "PROD-005",
    quantity: 10,
    arrived_at: "2026-03-01",
  },
  {
    id: "WH-003-PROD-008",
    deposit_id: "WH-003",
    product_id: "PROD-008",
    quantity: 50,
    arrived_at: "2026-03-05",
  },
  {
    id: "WH-001-PROD-001",
    deposit_id: "WH-001",
    product_id: "PROD-001",
    quantity: 100,
    arrived_at: "2026-03-10",
  },
  {
    id: "WH-002-PROD-004",
    deposit_id: "WH-002",
    product_id: "PROD-004",
    quantity: 20,
    arrived_at: "2026-03-12",
  },
  {
    id: "WH-003-PROD-002",
    deposit_id: "WH-003",
    product_id: "PROD-002",
    quantity: 5,
    arrived_at: "2026-03-15",
  },
];

export const getStockByDeposit = (depositId: string): Stock[] =>
  STOCK.filter((s) => s.deposit_id === depositId);

// ─── 7. Employees (from db/fill_mock_data.sql) ──────────────────────────────

export const EMPLOYEES: Employee[] = [
  {
    id: "emp1",
    user_id: "USR-002",
    is_able: true,
    deposit_id: "WH-001",
    max_work_hours_per_day: 8,
    hourly_cost: 35.0,
  },
  {
    id: "emp2",
    user_id: "USR-003",
    is_able: true,
    deposit_id: "WH-001",
    max_work_hours_per_day: 10,
    hourly_cost: 45.0,
  },
  {
    id: "emp3",
    user_id: "USR-006",
    is_able: true,
    deposit_id: "WH-002",
    max_work_hours_per_day: 10,
    hourly_cost: 42.0,
  },
  {
    id: "emp4",
    user_id: "USR-007",
    is_able: true,
    deposit_id: "WH-003",
    max_work_hours_per_day: 8,
    hourly_cost: 38.0,
  },
  {
    id: "emp5",
    user_id: "USR-010",
    is_able: false,
    deposit_id: "WH-002",
    max_work_hours_per_day: 8,
    hourly_cost: 36.0,
  },
];

// ─── 8. Suppliers & Supply Routes (from db/fill_mock_data.sql) ───────────────

export const SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001",
    name: "Horta Serrana Hortifruti",
    address: "Av. Feliciano Sodré, Teresópolis, RJ",
    latitude: -22.4123,
    longitude: -42.9656,
  },
  {
    id: "SUP-002",
    name: "Queijaria Suíça Friburgo",
    address: "Circuito Terê-Fri, Nova Friburgo, RJ",
    latitude: -22.2819,
    longitude: -42.5311,
  },
  {
    id: "SUP-003",
    name: "Distribuidora Imperial",
    address: "Rua do Imperador, Petrópolis, RJ",
    latitude: -22.5050,
    longitude: -43.1789,
  },
];

export const SUPPLY_ROUTES: SupplyRoute[] = [
  {
    order_id: "ORD-001",
    supplier_id: "SUP-002",
    truck_id: "TRK-001",
    estimated_departure: "2026-03-26 08:00:00",
    estimated_arrival: "2026-03-26 12:00:00",
  },
  {
    order_id: "ORD-004",
    supplier_id: "SUP-003",
    truck_id: "TRK-003",
    estimated_departure: "2026-03-28 09:00:00",
    estimated_arrival: "2026-03-30 15:00:00",
  },
];

// ─── 9. Dashboard Stats Helper ──────────────────────────────────────────────

export const getDashboardStats = (): DashboardStats => {
  const ordersInProgress = ORDERS.filter((o) => o.status === "Shipped").length;
  const pendingOrders = ORDERS.filter((o) => o.status === "Pending").length;
  const deliveredOrders = ORDERS.filter((o) => o.status === "Delivered");
  const deliveredThisMonth = deliveredOrders.length;
  const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.price, 0);
  const trucksOnRoad = TRUCKS.filter((t) => t.is_traveling).length;

  return {
    ordersInProgress,
    trucksOnRoad,
    pendingOrders,
    deliveredThisMonth,
    totalRevenue,
    avgDeliveryTime: 2.4,
  };
};
