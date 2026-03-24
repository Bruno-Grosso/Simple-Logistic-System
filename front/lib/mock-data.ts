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

// ─── Users (2 admin, 2 worker, 2 client) ──────────────────────────────────────

export const USERS: User[] = [
  {
    id: "u1",
    name: "Rafael Mendes",
    role: "admin",
    work_position: "Gerente de Operações",
    address: "Rua Visconde de Pirajá, 414, Ipanema — Rio de Janeiro, RJ",
  },
  {
    id: "u2",
    name: "Patrícia Gomes",
    role: "admin",
    work_position: "Coordenadora Logística",
    address: "Av. Paulista, 1578 — São Paulo, SP",
  },
  {
    id: "u3",
    name: "Lucas Ferreira",
    role: "worker",
    work_position: "Motorista carreta",
    address: "Rua da Bahia, 1200 — Belo Horizonte, MG",
  },
  {
    id: "u4",
    name: "Camila Rocha",
    role: "worker",
    work_position: "Supervisora de armazém",
    address: "Rua XV de Novembro, 800 — Curitiba, PR",
  },
  {
    id: "u5",
    name: "Eduardo Santos",
    role: "client",
    address: "Av. Borges de Medeiros, 2100 — Porto Alegre, RS",
  },
  {
    id: "u6",
    name: "Isabela Martins",
    role: "client",
    address: "Rua Chile, 35 — Salvador, BA",
  },
];

// ─── Deposits (4 Brazilian cities, JSON location) ────────────────────────────

export const DEPOSITS: Deposit[] = [
  {
    id: "d1",
    location: '{"lat":-22.9,"lon":-43.17,"label":"Rio de Janeiro Central"}',
    size: '{"l":100,"w":50,"h":10}',
    volume_actual: 1200,
    volume_max: 5000,
    has_refrigeration: true,
  },
  {
    id: "d2",
    location: '{"lat":-23.55,"lon":-46.63,"label":"São Paulo Norte"}',
    size: '{"l":80,"w":60,"h":8}',
    volume_actual: 2800,
    volume_max: 3840,
    has_refrigeration: false,
  },
  {
    id: "d3",
    location: '{"lat":-25.43,"lon":-49.27,"label":"Curitiba Sul"}',
    size: '{"l":60,"w":40,"h":7}',
    volume_actual: 500,
    volume_max: 1680,
    has_refrigeration: true,
  },
  {
    id: "d4",
    location: '{"lat":-19.92,"lon":-43.94,"label":"Belo Horizonte Leste"}',
    size: '{"l":90,"w":45,"h":9}',
    volume_actual: 3100,
    volume_max: 3645,
    has_refrigeration: false,
  },
];

export const getDepositLabel = (deposit: Deposit): string => {
  try {
    const parsed = JSON.parse(deposit.location) as { label?: string };
    return parsed.label ?? deposit.location;
  } catch {
    return deposit.location;
  }
};

// ─── Trucks (Volvo, Mercedes, Scania, MAN — 2 traveling, 1 available, 1 maintenance)

export const TRUCKS: Truck[] = [
  {
    id: "t1",
    model: "Volvo FH 540",
    size: '{"l":13.6,"w":2.4,"h":2.7}',
    volume_actual: 18,
    volume_max: 90,
    weight_actual: 4200,
    weight_max: 25000,
    estimated_time: "2026-03-30T14:00:00",
    is_delivering: true,
    is_valid: true,
    is_traveling: true,
    origin_deposit_id: "d1",
    destination_deposit_id: "d2",
    has_refrigeration: false,
    speed: 90,
    fuel_capacity: 600,
    fuel_current: 320,
    fuel_consumption: 0.35,
    wear_percentage: 42,
    wear_rate: 0.02,
  },
  {
    id: "t2",
    model: "Mercedes-Benz Actros 2651",
    size: '{"l":13.6,"w":2.4,"h":2.7}',
    volume_actual: 0,
    volume_max: 90,
    weight_actual: 0,
    weight_max: 25000,
    is_delivering: false,
    is_valid: true,
    is_traveling: false,
    current_deposit_id: "d2",
    home_deposit_id: "d2",
    has_refrigeration: true,
    speed: 85,
    fuel_capacity: 700,
    fuel_current: 580,
    fuel_consumption: 0.38,
    wear_percentage: 15,
    wear_rate: 0.018,
  },
  {
    id: "t3",
    model: "Scania R 450",
    size: '{"l":13.6,"w":2.4,"h":2.7}',
    volume_actual: 55,
    volume_max: 85,
    weight_actual: 14000,
    weight_max: 23000,
    estimated_time: "2026-04-02T18:00:00",
    is_delivering: true,
    is_valid: true,
    is_traveling: true,
    origin_deposit_id: "d3",
    destination_deposit_id: "d4",
    has_refrigeration: false,
    speed: 95,
    fuel_capacity: 650,
    fuel_current: 140,
    fuel_consumption: 0.33,
    wear_percentage: 67,
    wear_rate: 0.025,
  },
  {
    id: "t4",
    model: "MAN TGX 28.480",
    size: '{"l":13.6,"w":2.4,"h":2.7}',
    volume_actual: 0,
    volume_max: 85,
    weight_actual: 0,
    weight_max: 22000,
    is_delivering: false,
    is_valid: false,
    is_traveling: false,
    current_deposit_id: "d1",
    home_deposit_id: "d1",
    has_refrigeration: false,
    speed: 88,
    fuel_capacity: 580,
    fuel_current: 200,
    fuel_consumption: 0.36,
    wear_percentage: 89,
    wear_rate: 0.03,
  },
];

// ─── Products (6 — cold / fragile / normal) ──────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Notebook Dell Latitude 5540",
    is_cold: false,
    is_fragile: true,
    price: 7200,
    volume: 0.004,
    weight: 1.8,
  },
  {
    id: "p2",
    name: "Corte bovino congelado (caixa 20 kg)",
    is_cold: true,
    is_fragile: false,
    expire_date: "2026-08-01",
    price: 980,
    volume: 0.05,
    weight: 20,
  },
  {
    id: "p3",
    name: "Smart TV 55\" 4K",
    is_cold: false,
    is_fragile: true,
    price: 2890,
    volume: 0.1,
    weight: 14.5,
  },
  {
    id: "p4",
    name: "Kit medicamentos (caixa)",
    is_cold: false,
    is_fragile: false,
    expire_date: "2027-03-01",
    price: 340,
    volume: 0.002,
    weight: 0.6,
  },
  {
    id: "p5",
    name: "Sorvete industrial (balde 5 L)",
    is_cold: true,
    is_fragile: false,
    expire_date: "2026-05-15",
    price: 48,
    volume: 0.006,
    weight: 5.2,
  },
  {
    id: "p6",
    name: "Pneus radiais (conjunto 4)",
    is_cold: false,
    is_fragile: false,
    price: 3200,
    volume: 0.35,
    weight: 80,
  },
];

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const SUPPLIERS: Supplier[] = [
  {
    id: "s1",
    name: "TechParts Distribuidora Ltda.",
    address: "Rua Industrial, 500 — Guarulhos, SP",
    latitude: -23.47,
    longitude: -46.53,
  },
  {
    id: "s2",
    name: "Frigorífico São Paulo S.A.",
    address: "Estrada Municipal, 12 — Jundiaí, SP",
    latitude: -23.19,
    longitude: -46.88,
  },
];

// ─── Orders (mix of statuses) ────────────────────────────────────────────────

export const ORDERS: Order[] = [
  {
    id: "o1",
    final_destination: '{"lat":-19.92,"lon":-43.94,"label":"Belo Horizonte"}',
    sender_id: "u3",
    receiver_id: "u5",
    time_limit: "2026-04-05",
    price: 15800,
    status: "Shipped",
    client_id: "u5",
    supplier_id: "s1",
    supplier_delivery: false,
  },
  {
    id: "o2",
    final_destination: '{"lat":-25.43,"lon":-49.27,"label":"Curitiba"}',
    sender_id: "u4",
    receiver_id: "u6",
    time_limit: "2026-03-30",
    price: 2400,
    status: "Pending",
    client_id: "u6",
    supplier_delivery: false,
  },
  {
    id: "o3",
    final_destination: '{"lat":-23.55,"lon":-46.63,"label":"São Paulo"}',
    sender_id: "u4",
    receiver_id: "u5",
    time_limit: "2026-03-25",
    price: 11560,
    status: "Delivered",
    client_id: "u5",
    supplier_delivery: false,
  },
  {
    id: "o4",
    final_destination: '{"lat":-22.9,"lon":-43.17,"label":"Rio de Janeiro"}',
    sender_id: "u3",
    receiver_id: "u6",
    time_limit: "2026-04-10",
    price: 196000,
    status: "Pending",
    client_id: "u6",
    supplier_id: "s2",
    supplier_delivery: true,
  },
  {
    id: "o5",
    final_destination: '{"lat":-15.78,"lon":-47.93,"label":"Brasília"}',
    sender_id: "u4",
    receiver_id: "u5",
    time_limit: "2026-03-20",
    price: 4200,
    status: "Cancelled",
    client_id: "u5",
    supplier_delivery: false,
  },
  {
    id: "o6",
    final_destination: '{"lat":-12.97,"lon":-38.5,"label":"Salvador"}',
    sender_id: "u3",
    receiver_id: "u6",
    time_limit: "2026-04-20",
    price: 8900,
    status: "Shipped",
    client_id: "u6",
    supplier_delivery: false,
  },
];

export const ORDER_ITEMS: OrderItem[] = [
  { order_id: "o1", product_id: "p1", quantity: 2 },
  { order_id: "o1", product_id: "p4", quantity: 12 },
  { order_id: "o2", product_id: "p5", quantity: 40 },
  { order_id: "o3", product_id: "p3", quantity: 3 },
  { order_id: "o3", product_id: "p1", quantity: 1 },
  { order_id: "o4", product_id: "p2", quantity: 200 },
  { order_id: "o6", product_id: "p6", quantity: 2 },
];

/** Rotas para pedidos Shipped / Delivered */
export const ORDER_ROUTES: OrderRoute[] = [
  {
    order_id: "o1",
    step: 1,
    deposit_id: "d1",
    estimated_time: "2026-03-28T08:00:00",
    arrived_at: "2026-03-28T09:15:00",
  },
  {
    order_id: "o1",
    step: 2,
    truck_id: "t1",
    estimated_time: "2026-03-29T12:00:00",
    arrived_at: "2026-03-29T13:30:00",
  },
  {
    order_id: "o1",
    step: 3,
    deposit_id: "d4",
    estimated_time: "2026-04-04T08:00:00",
  },
  {
    order_id: "o3",
    step: 1,
    deposit_id: "d1",
    estimated_time: "2026-03-20T08:00:00",
    arrived_at: "2026-03-20T08:45:00",
  },
  {
    order_id: "o3",
    step: 2,
    truck_id: "t2",
    estimated_time: "2026-03-22T10:00:00",
    arrived_at: "2026-03-22T10:55:00",
  },
  {
    order_id: "o3",
    step: 3,
    deposit_id: "d2",
    estimated_time: "2026-03-24T08:00:00",
    arrived_at: "2026-03-24T07:50:00",
  },
  {
    order_id: "o6",
    step: 1,
    deposit_id: "d2",
    estimated_time: "2026-03-21T06:00:00",
    arrived_at: "2026-03-21T07:10:00",
  },
  {
    order_id: "o6",
    step: 2,
    truck_id: "t3",
    estimated_time: "2026-03-23T14:00:00",
    arrived_at: "2026-03-23T15:20:00",
  },
  {
    order_id: "o6",
    step: 3,
    deposit_id: "d4",
    estimated_time: "2026-03-28T10:00:00",
  },
];

export const SUPPLY_ROUTES: SupplyRoute[] = [
  {
    order_id: "o1",
    supplier_id: "s1",
    truck_id: "t2",
    estimated_departure: "2026-03-26T06:00:00",
    estimated_arrival: "2026-03-27T18:00:00",
    actual_arrival: "2026-03-27T17:40:00",
  },
  {
    order_id: "o4",
    supplier_id: "s2",
    truck_id: "t4",
    estimated_departure: "2026-04-08T05:00:00",
    estimated_arrival: "2026-04-09T20:00:00",
  },
];

// ─── Stock (7: 6 em depósitos, 1 em caminhão) ─────────────────────────────────

export const STOCK: Stock[] = [
  {
    id: "st1",
    product_id: "p1",
    quantity: 15,
    deposit_id: "d1",
    arrived_at: "2026-03-10T10:00:00",
  },
  {
    id: "st2",
    product_id: "p2",
    quantity: 300,
    deposit_id: "d1",
    arrived_at: "2026-03-15T14:00:00",
  },
  {
    id: "st3",
    product_id: "p3",
    quantity: 8,
    deposit_id: "d2",
    arrived_at: "2026-03-18T09:00:00",
  },
  {
    id: "st4",
    product_id: "p4",
    quantity: 200,
    deposit_id: "d2",
    arrived_at: "2026-03-20T11:00:00",
  },
  {
    id: "st5",
    product_id: "p5",
    quantity: 500,
    deposit_id: "d3",
    arrived_at: "2026-03-22T08:00:00",
  },
  {
    id: "st6",
    product_id: "p6",
    quantity: 30,
    deposit_id: "d4",
    arrived_at: "2026-03-19T16:00:00",
  },
  {
    id: "st7",
    product_id: "p1",
    quantity: 3,
    truck_id: "t1",
    order_id: "o1",
    arrived_at: "2026-03-28T09:15:00",
  },
];

// ─── Employees (3 registros: 2 motoristas/armazém + 1 vínculo operacional admin)

export const EMPLOYEES: Employee[] = [
  {
    id: "e1",
    user_id: "u3",
    is_able: true,
    deposit_id: "d1",
    max_work_hours_per_day: 8,
    hourly_cost: 38.5,
  },
  {
    id: "e2",
    user_id: "u4",
    is_able: true,
    deposit_id: "d2",
    max_work_hours_per_day: 8,
    hourly_cost: 42,
  },
  {
    id: "e3",
    user_id: "u1",
    is_able: true,
    deposit_id: "d1",
    max_work_hours_per_day: 6,
    hourly_cost: 85,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getById<T extends { id: string }>(
  collection: T[],
  id: string,
): T | undefined {
  return collection.find((item) => item.id === id);
}

export const getUserById = (id: string): User | undefined => getById(USERS, id);
export const getDepositById = (id: string): Deposit | undefined =>
  getById(DEPOSITS, id);
export const getTruckById = (id: string): Truck | undefined => getById(TRUCKS, id);
export const getProductById = (id: string): Product | undefined =>
  getById(PRODUCTS, id);
export const getOrderById = (id: string): Order | undefined => getById(ORDERS, id);

export const getOrderItems = (orderId: string): OrderItem[] =>
  ORDER_ITEMS.filter((i) => i.order_id === orderId);

export const getOrderRoute = (orderId: string): OrderRoute[] =>
  ORDER_ROUTES.filter((r) => r.order_id === orderId).sort((a, b) => a.step - b.step);

export const getStockByDeposit = (depositId: string): Stock[] =>
  STOCK.filter((s) => s.deposit_id === depositId);

export const getStockByTruck = (truckId: string): Stock[] =>
  STOCK.filter((s) => s.truck_id === truckId);

/** Referência de “mês atual” para KPIs do mock (alinhado ao cenário mar/2026). */
const KPI_REFERENCE_MONTH = "2026-03";

function parseMonthKey(iso: string): string {
  return iso.slice(0, 7);
}

function getRouteDeliveryDurationHours(orderId: string): number | null {
  const steps = getOrderRoute(orderId).filter((s) => s.arrived_at);
  if (steps.length < 2) return null;
  const first = new Date(steps[0].arrived_at!).getTime();
  const last = new Date(steps[steps.length - 1].arrived_at!).getTime();
  if (Number.isNaN(first) || Number.isNaN(last)) return null;
  return (last - first) / (1000 * 60 * 60);
}

function getLastRouteArrival(orderId: string): string | undefined {
  const withArrival = getOrderRoute(orderId).filter((s) => s.arrived_at);
  if (withArrival.length === 0) return undefined;
  return withArrival[withArrival.length - 1].arrived_at;
}

export function getDashboardStats(): DashboardStats {
  const ordersInProgress = ORDERS.filter((o) => o.status === "Shipped").length;
  const trucksOnRoad = TRUCKS.filter((t) => t.is_traveling).length;
  const pendingOrders = ORDERS.filter((o) => o.status === "Pending").length;

  const delivered = ORDERS.filter((o) => o.status === "Delivered");
  const deliveredThisMonth = delivered.filter((o) => {
    const last = getLastRouteArrival(o.id);
    if (last) return parseMonthKey(last) === KPI_REFERENCE_MONTH;
    return o.time_limit ? parseMonthKey(o.time_limit) === KPI_REFERENCE_MONTH : false;
  }).length;

  const totalRevenue = delivered.reduce((sum, o) => sum + o.price, 0);

  const durations = delivered
    .map((o) => getRouteDeliveryDurationHours(o.id))
    .filter((h): h is number => h !== null && h >= 0);
  const avgDeliveryTime =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    ordersInProgress,
    trucksOnRoad,
    pendingOrders,
    deliveredThisMonth,
    totalRevenue,
    avgDeliveryTime,
  };
}
