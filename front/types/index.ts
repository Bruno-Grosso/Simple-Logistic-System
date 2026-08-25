// ─── Enums / unions (match SQL CHECK constraints) ───────────────────────────

/** Roles stored by the API. `worker` remains for older records. */
export type UserRole = "admin" | "warehouse_worker" | "truck_driver" | "worker" | "client";

export type OrderStatus = "Pending" | "Shipped" | "Delivered" | "Cancelled";

// ─── 1. deposit ───────────────────────────────────────────────────────────────

export interface Deposit {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  size?: string;
  volume_actual: number;
  volume_max?: number;
  has_refrigeration: boolean;
  fuel_price?: number;
  truck_capacity?: number;
  parking_capacity?: number;
  trucks_parked?: number;
  parking_available?: number;
}

// ─── 2. truck ─────────────────────────────────────────────────────────────────

export interface Truck {
  id: string;
  model?: string;
  size?: string;
  volume_actual: number;
  volume_max?: number;
  weight_actual: number;
  weight_max?: number;
  estimated_time?: string;
  is_delivering: boolean;
  is_valid: boolean;
  is_traveling: boolean;
  current_deposit_id?: string;
  origin_deposit_id?: string;
  destination_deposit_id?: string;
  home_deposit_id?: string;
  has_refrigeration: boolean;
  speed?: number;
  fuel_capacity?: number;
  fuel_current: number;
  fuel_consumption?: number;
  truck_maintenance: number;
  maintenance_count?: number;
  wear_percentage?: number;
  wear_rate?: number;
}

// ─── 3. product ───────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  is_cold: boolean;
  is_fragile: boolean;
  expire_date?: string;
  price?: number;
  size?: string;
  volume?: number;
  weight?: number;
}

// ─── 4. users (password omitted for frontend) ─────────────────────────────────

export interface User {
  id: string;
  name: string;
  email?: string;
  work_position?: string;
  address?: string;
  role: UserRole;
  rawRole?: string;
  wage?: number;
  warehouse_id?: string;
  is_active?: boolean;
}

// ─── 5. session ───────────────────────────────────────────────────────────────

export interface Session {
  session_id: string;
  user_id: string;
  login_time?: string;
  expires_at: string;
  is_active: boolean;
}

export interface OrderETA {
  order_id: string;
  distance_km: number;
  min_speed_kmh: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  driving_hours_min: number;
  driving_hours_max: number;
  driving_hours_avg: number;
  rest_hours_min: number;
  rest_hours_max: number;
  rest_hours_avg: number;
  rest_periods_count: number;
  total_transit_hours_min: number;
  total_transit_hours_max: number;
  total_transit_hours_avg: number;
  departure_time?: string;
  eta_min?: string;
  eta_max?: string;
  eta_expected?: string;
  formatted_duration_min?: string;
  formatted_duration_max?: string;
  formatted_duration_avg?: string;
  is_on_time?: boolean;
  compliance_status?: "on_time" | "at_risk" | "overdue";
  time_limit?: string;
}

export interface Order {
  id: string;
  final_destination?: string;
  sender_id?: string;
  receiver_id?: string;
  time_limit?: string;
  price: number;
  status: OrderStatus;
  client_id: string;
  supplier_id?: string;
  supplier_delivery: boolean;
  distance_km?: number;
  eta?: OrderETA;
}

// ─── 7. order_items ───────────────────────────────────────────────────────────

export interface OrderItem {
  order_id: string;
  product_id: string;
  quantity: number;
}

// ─── 8. stock ─────────────────────────────────────────────────────────────────

export interface Stock {
  id: string;
  product_id: string;
  quantity: number;
  deposit_id?: string;
  truck_id?: string;
  order_id?: string;
  arrived_at: string;
}

// ─── 9. stock_history ─────────────────────────────────────────────────────────

export interface StockHistory {
  id: string;
  stock_id: string;
  quantity: number;
  deposit_id?: string;
  truck_id?: string;
  order_id?: string;
  moved_by?: string;
  moved_at?: string;
}

// ─── 10. order_route ──────────────────────────────────────────────────────────

export interface OrderRoute {
  order_id: string;
  step: number;
  deposit_id?: string;
  destination_deposit_id?: string;
  truck_id?: string;
  driver_id?: string;
  estimated_time?: string;
  arrived_at?: string;
}

// ─── 11. supplier ─────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// ─── 12. supply_route ─────────────────────────────────────────────────────────

export interface SupplyRoute {
  order_id: string;
  supplier_id: string;
  truck_id?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_arrival?: string;
}

// ─── 13. fuel_station ─────────────────────────────────────────────────────────

export interface FuelStation {
  id: string;
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_partner: boolean;
}

// ─── 14. fuel_price ───────────────────────────────────────────────────────────

export interface FuelPrice {
  station_id: string;
  price_per_liter: number;
  recorded_at: string;
}

// ─── 15. refuel_log ───────────────────────────────────────────────────────────

export interface RefuelLog {
  id: string;
  truck_id: string;
  station_id: string;
  liters: number;
  price_per_liter: number;
  refueled_at?: string;
}

// ─── 16. employee ─────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  user_id: string;
  is_able: boolean;
  deposit_id?: string;
  max_work_hours_per_day?: number;
  hourly_cost?: number;
}

// ─── 17. truck_driver ─────────────────────────────────────────────────────────

export interface TruckDriver {
  truck_id: string;
  employee_id: string;
  assigned_at?: string;
}

// ─── 18. work_log ─────────────────────────────────────────────────────────────

export interface WorkLog {
  id: string;
  employee_id: string;
  truck_id?: string;
  start_time: string;
  end_time?: string;
}

// ─── 19. freight_cost ─────────────────────────────────────────────────────────

export interface FreightCost {
  order_id: string;
  fuel_cost?: number;
  labor_cost?: number;
  maintenance_cost?: number;
  total_cost?: number;
  distance_km?: number;
  avg_fuel_price?: number;
  driver_wage?: number;
  warehouses_passed?: string[];
  fuel_liters?: number;
  travel_hours?: number;
  calculated_at?: string;
}

// ─── 20. truck_performance_history (TruckPerformance) ───────────────────────

export interface TruckPerformance {
  id: string;
  truck_id: string;
  total_distance?: number;
  fuel_consumed?: number;
  orders_completed?: number;
  maintenance_count?: number;
  wear_percentage?: number;
  recorded_at?: string;
}

// ─── 21. truck_maintenance ────────────────────────────────────────────────────

export interface TruckMaintenance {
  id: string;
  truck_id: string;
  type?: string;
  description?: string;
  cost?: number;
  wear_before?: number;
  wear_after?: number;
  performed_at?: string;
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface DashboardStats {
  ordersInProgress: number;
  trucksOnRoad: number;
  pendingOrders: number;
  deliveredThisMonth: number;
  totalRevenue: number;
  avgDeliveryTime: number;
}

// ─── Monthly Performance Data ──────────────────────────────────────────────────

export interface MonthlyPerformanceData {
  month: string;
  fullMonth: string;
  revenue: number;
  costs: number;
  profit: number;
  fuelCost: number;
  laborCost: number;
  maintenanceCost: number;
  ordersCount: number;
  poi?: string;
  isPoi?: boolean;
}

// ─── Delivery Cost Analytics Report ────────────────────────────────────────────

export interface OrderDeliveryCostItem {
  order_id: string;
  client_id: string;
  client_name: string;
  destination?: string;
  origin_warehouse_id?: string;
  origin_warehouse_label?: string;
  distance_km: number;
  status: OrderStatus;
  revenue: number;
  fuel_cost: number;
  labor_cost: number;
  maintenance_cost: number;
  total_delivery_cost: number;
  net_margin: number;
  margin_percent: number;
  calculated_at?: string;
}

export interface DeliveryCostSummary {
  total_orders_analyzed: number;
  total_delivered_revenue: number;
  total_all_revenue: number;
  total_delivery_cost: number;
  total_fuel_cost: number;
  total_labor_cost: number;
  total_maintenance_cost: number;
  net_operating_profit: number;
  cost_to_revenue_ratio: number;
  avg_delivery_cost_per_order: number;
  avg_cost_per_km: number;
  total_distance_km: number;
}

export interface DeliveryCostReport {
  warehouse_id?: string | null;
  summary: DeliveryCostSummary;
  orders: OrderDeliveryCostItem[];
}
