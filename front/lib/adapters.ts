import type {
  Deposit,
  Truck,
  Product,
  User,
  Order,
  OrderItem,
  OrderRoute,
  Supplier,
  SupplyRoute,
  FreightCost,
  Stock,
  UserRole,
  OrderStatus,
  MonthlyPerformanceData,
  OrderETA,
  DeliveryCostReport,
  DeliveryCostSummary,
  OrderDeliveryCostItem,
} from "@/types"

function asBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) return fallback
  if (typeof value === "string") return !["0", "false", "no", "off", ""].includes(value.trim().toLowerCase())
  return Boolean(value)
}

export function adaptWarehouse(raw: any): Deposit {
  if (!raw) return {} as Deposit
  let locationStr = raw.location
  let locObj = raw.location
  if (typeof raw.location === "string" && raw.location.startsWith("{")) {
    try {
      locObj = JSON.parse(raw.location)
    } catch {
      /* ignore */
    }
  }

  if (typeof locObj === "object" && locObj !== null) {
    if (locObj.label) {
      locationStr = locObj.label
    } else if (locObj.city && locObj.state) {
      locationStr = `${locObj.city}, ${locObj.state}`
    } else if (locObj.latitude && locObj.longitude) {
      locationStr = `Warehouse ${raw.id} (${locObj.latitude}, ${locObj.longitude})`
    } else {
      locationStr = JSON.stringify(locObj)
    }
  }

  const latitude = typeof locObj === "object" && locObj !== null
    ? Number(locObj.latitude ?? locObj.lat)
    : undefined
  const longitude = typeof locObj === "object" && locObj !== null
    ? Number(locObj.longitude ?? locObj.lon)
    : undefined

  return {
    id: String(raw.id),
    location: locationStr || `Warehouse ${raw.id}`,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    size: raw.size ? (typeof raw.size === "string" ? raw.size : JSON.stringify(raw.size)) : undefined,
    volume_actual: Number(raw.volume_current ?? raw.volume_actual ?? 0),
    volume_max: Number(raw.volume_max ?? 1000),
    has_refrigeration: Boolean(raw.has_refrigeration),
    fuel_price: Number(raw.fuel_price ?? 0),
    truck_capacity: Number(raw.truck_capacity ?? raw.parking_capacity ?? 5),
    parking_capacity: Number(raw.truck_capacity ?? raw.parking_capacity ?? 5),
  }
}

export function adaptTruck(raw: any): Truck {
  if (!raw) return {} as Truck
  const isDelivering = Boolean(raw.is_delivering)
  const wearPercentage = raw.wear_percentage ?? (raw.truck_maintenance ? raw.truck_maintenance * 15 : 15)
  return {
    id: String(raw.id),
    model: raw.model || `Truck ${raw.id}`,
    size: raw.size ? (typeof raw.size === "string" ? raw.size : JSON.stringify(raw.size)) : undefined,
    volume_actual: Number(raw.volume_current ?? raw.volume_actual ?? 0),
    volume_max: Number(raw.volume_max ?? 90),
    weight_actual: Number(raw.weight_current ?? raw.weight_actual ?? 0),
    weight_max: Number(raw.weight_max ?? 25000),
    estimated_time: raw.estimated_time || undefined,
    is_delivering: isDelivering,
    is_valid: raw.is_valid !== undefined ? Boolean(raw.is_valid) : true,
    is_traveling: isDelivering,
    current_deposit_id: raw.current_warehouse_id || raw.current_deposit_id || undefined,
    origin_deposit_id: raw.origin_warehouse_id || raw.origin_deposit_id || undefined,
    destination_deposit_id: raw.destination_warehouse_id || raw.destination_deposit_id || undefined,
    home_deposit_id: raw.home_deposit_id || raw.current_warehouse_id || undefined,
    has_refrigeration: Boolean(raw.has_refrigeration),
    speed: Number(raw.speed ?? 80),
    fuel_capacity: Number(raw.fuel_capacity ?? 500),
    fuel_current: Number(raw.fuel_current ?? 400),
    fuel_consumption: Number(raw.fuel_consumption ?? 0.3),
    truck_maintenance: Number(raw.truck_maintenance ?? raw.maintenance_count ?? 0),
    maintenance_count: Number(raw.truck_maintenance ?? raw.maintenance_count ?? 0),
    wear_percentage: Number(wearPercentage),
    wear_rate: Number(raw.wear_rate ?? 0.05),
  }
}

export function adaptProduct(raw: any): Product {
  if (!raw) return {} as Product
  return {
    id: String(raw.id),
    name: raw.name || "Product",
    is_cold: Boolean(raw.is_cold),
    is_fragile: Boolean(raw.is_fragile),
    expire_date: raw.expire_date || undefined,
    price: Number(raw.price ?? 0),
    size: raw.size ? (typeof raw.size === "string" ? raw.size : JSON.stringify(raw.size)) : undefined,
    volume: Number(raw.volume ?? 1),
    weight: Number(raw.weight ?? 1),
  }
}

export function adaptUser(raw: any): User {
  if (!raw) return {} as User
  let role: UserRole = "client"
  if (raw.role === "admin") role = "admin"
  else if (raw.role === "warehouse_worker" || raw.role === "truck_driver" || raw.role === "worker") role = "worker"
  else role = "client"

  let addressStr = raw.address
  if (typeof raw.address === "object" && raw.address !== null) {
    addressStr = raw.address.address || JSON.stringify(raw.address)
  } else if (typeof raw.address === "string" && raw.address.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw.address)
      addressStr = parsed.address || raw.address
    } catch {
      /* ignore */
    }
  }

  const nameStr = raw.name || "User"
  const firstName = nameStr.split(" ")[0].toLowerCase()
  const derivedEmail = `${firstName}@logisys.com`

  return {
    id: String(raw.id),
    name: nameStr,
    email: raw.email || derivedEmail,
    work_position: raw.work_position || (raw.role ? raw.role.replace("_", " ") : undefined),
    address: addressStr || undefined,
    role,
    rawRole: raw.role || "client",
    wage: Number(raw.wage ?? (role === "client" ? 0 : 45.0)),
    warehouse_id: raw.warehouse_id || undefined,
    is_active: asBoolean(raw.is_active, true),
  }
}

export function adaptOrder(raw: any): Order {
  if (!raw) return {} as Order
  let status: OrderStatus = "Pending"
  if (raw.status === "Shipped") status = "Shipped"
  else if (raw.status === "Delivered") status = "Delivered"
  else if (raw.status === "Canceled" || raw.status === "Cancelled") status = "Cancelled"

  let destStr = raw.final_destination
  if (typeof raw.final_destination === "object" && raw.final_destination !== null) {
    destStr = raw.final_destination.label || raw.final_destination.address || JSON.stringify(raw.final_destination)
  } else if (typeof raw.final_destination === "string" && raw.final_destination.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw.final_destination)
      destStr = parsed.label || parsed.address || raw.final_destination
    } catch {
      /* preserve the original value when it is not valid JSON */
    }
  }

  return {
    id: String(raw.id),
    final_destination: destStr || undefined,
    sender_id: raw.sender_id || undefined,
    receiver_id: raw.receiver_id || undefined,
    time_limit: raw.time_limit || undefined,
    price: Number(raw.price ?? 0),
    status,
    client_id: String(raw.client_id || raw.client || ""),
    supplier_id: raw.supplier_id || undefined,
    supplier_delivery: Boolean(raw.supplier_delivery),
    distance_km: raw.distance_km !== undefined ? Number(raw.distance_km) : undefined,
    eta: raw.eta ? adaptOrderETA(raw.eta) : undefined,
  }
}

export function adaptOrderETA(raw: any): OrderETA {
  if (!raw) return {} as OrderETA
  return {
    order_id: String(raw.order_id || ""),
    distance_km: Number(raw.distance_km ?? 0),
    min_speed_kmh: Number(raw.min_speed_kmh ?? 40.0),
    max_speed_kmh: Number(raw.max_speed_kmh ?? 85.0),
    avg_speed_kmh: Number(raw.avg_speed_kmh ?? 62.5),
    driving_hours_min: Number(raw.driving_hours_min ?? 0),
    driving_hours_max: Number(raw.driving_hours_max ?? 0),
    driving_hours_avg: Number(raw.driving_hours_avg ?? 0),
    rest_hours_min: Number(raw.rest_hours_min ?? 0),
    rest_hours_max: Number(raw.rest_hours_max ?? 0),
    rest_hours_avg: Number(raw.rest_hours_avg ?? 0),
    rest_periods_count: Number(raw.rest_periods_count ?? 0),
    total_transit_hours_min: Number(raw.total_transit_hours_min ?? 0),
    total_transit_hours_max: Number(raw.total_transit_hours_max ?? 0),
    total_transit_hours_avg: Number(raw.total_transit_hours_avg ?? 0),
    departure_time: raw.departure_time || undefined,
    eta_min: raw.eta_min || undefined,
    eta_max: raw.eta_max || undefined,
    eta_expected: raw.eta_expected || undefined,
    formatted_duration_min: raw.formatted_duration_min || undefined,
    formatted_duration_max: raw.formatted_duration_max || undefined,
    formatted_duration_avg: raw.formatted_duration_avg || undefined,
    is_on_time: raw.is_on_time !== undefined ? Boolean(raw.is_on_time) : true,
    compliance_status: raw.compliance_status || "on_time",
    time_limit: raw.time_limit || undefined,
  }
}

export function adaptOrderItem(raw: any): OrderItem {
  return {
    order_id: String(raw.order_id),
    product_id: String(raw.product_id),
    quantity: Number(raw.quantity ?? 1),
  }
}

export function adaptOrderRoute(raw: any): OrderRoute {
  return {
    order_id: String(raw.order_id),
    step: Number(raw.step ?? 1),
    deposit_id: raw.warehouse_id || raw.deposit_id || undefined,
    destination_deposit_id: raw.destination_warehouse_id || raw.destination_deposit_id || undefined,
    driver_id: raw.driver_id || undefined,
    truck_id: raw.truck_id || undefined,
    estimated_time: raw.estimated_time || undefined,
    arrived_at: raw.arrived_at || undefined,
  }
}

export function adaptSupplier(raw: any): Supplier {
  if (!raw) return {} as Supplier
  let loc = raw.location
  let lat: number | undefined = undefined
  let lon: number | undefined = undefined
  if (typeof loc === "string" && loc.includes(",")) {
    const parts = loc.split(",")
    if (parts.length === 2 && !isNaN(Number(parts[0]))) {
      lat = Number(parts[0].trim())
      lon = Number(parts[1].trim())
    }
  }

  return {
    id: String(raw.id),
    name: raw.name || "Supplier",
    address: typeof loc === "string" ? loc : JSON.stringify(loc),
    latitude: lat,
    longitude: lon,
  }
}

export function adaptStock(raw: any): Stock {
  return {
    id: `${raw.warehouse_id || raw.deposit_id || "wh"}-${raw.product_id}`,
    product_id: String(raw.product_id),
    quantity: Number(raw.quantity ?? 0),
    deposit_id: raw.warehouse_id || raw.deposit_id || undefined,
    truck_id: raw.truck_id || undefined,
    order_id: raw.order_id || undefined,
    arrived_at: raw.arrived_at || new Date().toISOString().split("T")[0],
  }
}

export function adaptFreightCost(raw: any): FreightCost {
  return {
    order_id: String(raw.order_id),
    fuel_cost: Number(raw.fuel_cost ?? 0),
    labor_cost: Number(raw.labor_cost ?? 0),
    maintenance_cost: Number(raw.maintenance_cost ?? 0),
    total_cost: Number(raw.total_cost ?? 0),
    distance_km: raw.distance_km !== undefined ? Number(raw.distance_km) : undefined,
    avg_fuel_price: raw.avg_fuel_price !== undefined ? Number(raw.avg_fuel_price) : undefined,
    driver_wage: raw.driver_wage !== undefined ? Number(raw.driver_wage) : undefined,
    warehouses_passed: Array.isArray(raw.warehouses_passed) ? raw.warehouses_passed : undefined,
    fuel_liters: raw.fuel_liters !== undefined ? Number(raw.fuel_liters) : undefined,
    travel_hours: raw.travel_hours !== undefined ? Number(raw.travel_hours) : undefined,
    calculated_at: raw.calculated_at || undefined,
  }
}

export function adaptMonthlyPerformance(raw: any): MonthlyPerformanceData {
  return {
    month: String(raw.month),
    fullMonth: String(raw.full_month || raw.fullMonth || raw.month),
    revenue: Number(raw.revenue ?? 0),
    costs: Number(raw.costs ?? 0),
    profit: Number(raw.profit ?? 0),
    fuelCost: Number(raw.fuel_cost ?? raw.fuelCost ?? 0),
    laborCost: Number(raw.labor_cost ?? raw.laborCost ?? 0),
    maintenanceCost: Number(raw.maintenance_cost ?? raw.maintenanceCost ?? 0),
    ordersCount: Number(raw.orders_count ?? raw.ordersCount ?? 0),
    isPoi: Boolean(raw.is_poi ?? raw.isPoi),
    poi: raw.poi || undefined,
  }
}

export function adaptDeliveryCostReport(raw: any): DeliveryCostReport {
  if (!raw) {
    return {
      warehouse_id: null,
      summary: {
        total_orders_analyzed: 0,
        total_delivered_revenue: 0,
        total_all_revenue: 0,
        total_delivery_cost: 0,
        total_fuel_cost: 0,
        total_labor_cost: 0,
        total_maintenance_cost: 0,
        net_operating_profit: 0,
        cost_to_revenue_ratio: 0,
        avg_delivery_cost_per_order: 0,
        avg_cost_per_km: 0,
        total_distance_km: 0,
      },
      orders: [],
    }
  }

  const rawSummary = raw.summary || {}
  const rawOrders = Array.isArray(raw.orders) ? raw.orders : []

  return {
    warehouse_id: raw.warehouse_id || null,
    summary: {
      total_orders_analyzed: Number(rawSummary.total_orders_analyzed ?? 0),
      total_delivered_revenue: Number(rawSummary.total_delivered_revenue ?? 0),
      total_all_revenue: Number(rawSummary.total_all_revenue ?? 0),
      total_delivery_cost: Number(rawSummary.total_delivery_cost ?? 0),
      total_fuel_cost: Number(rawSummary.total_fuel_cost ?? 0),
      total_labor_cost: Number(rawSummary.total_labor_cost ?? 0),
      total_maintenance_cost: Number(rawSummary.total_maintenance_cost ?? 0),
      net_operating_profit: Number(rawSummary.net_operating_profit ?? 0),
      cost_to_revenue_ratio: Number(rawSummary.cost_to_revenue_ratio ?? 0),
      avg_delivery_cost_per_order: Number(rawSummary.avg_delivery_cost_per_order ?? 0),
      avg_cost_per_km: Number(rawSummary.avg_cost_per_km ?? 0),
      total_distance_km: Number(rawSummary.total_distance_km ?? 0),
    },
    orders: rawOrders.map((o: any) => ({
      order_id: String(o.order_id),
      client_id: String(o.client_id),
      client_name: String(o.client_name || `Client ${o.client_id}`),
      destination: o.destination || undefined,
      origin_warehouse_id: o.origin_warehouse_id || undefined,
      origin_warehouse_label: o.origin_warehouse_label || undefined,
      distance_km: Number(o.distance_km ?? 0),
      status: o.status || "Pending",
      revenue: Number(o.revenue ?? 0),
      fuel_cost: Number(o.fuel_cost ?? 0),
      labor_cost: Number(o.labor_cost ?? 0),
      maintenance_cost: Number(o.maintenance_cost ?? 0),
      total_delivery_cost: Number(o.total_delivery_cost ?? 0),
      net_margin: Number(o.net_margin ?? 0),
      margin_percent: Number(o.margin_percent ?? 0),
      calculated_at: o.calculated_at || undefined,
    })),
  }
}
