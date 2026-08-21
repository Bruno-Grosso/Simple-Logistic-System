import type { Order, Truck, Deposit, DashboardStats, FreightCost, OrderETA } from "@/types"

export function computeDashboardStats(orders: Order[], trucks: Truck[]): DashboardStats {
  const ordersInProgress = orders.filter((o) => o.status === "Shipped").length
  const pendingOrders = orders.filter((o) => o.status === "Pending").length
  const deliveredOrders = orders.filter((o) => o.status === "Delivered")
  const deliveredThisMonth = deliveredOrders.length
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.price || 0), 0)
  const trucksOnRoad = trucks.filter((t) => t.is_traveling || t.is_delivering).length

  return {
    ordersInProgress,
    trucksOnRoad,
    pendingOrders,
    deliveredThisMonth,
    totalRevenue,
    avgDeliveryTime: 2.4, // horas médias estimadas
  }
}

export function computeDepositUsage(deposit: Deposit): { pct: number; isHighUsage: boolean } {
  const max = deposit.volume_max && deposit.volume_max > 0 ? deposit.volume_max : 1
  const actual = deposit.volume_actual || 0
  const pct = Math.min(100, Math.round((actual / max) * 100))
  return {
    pct,
    isHighUsage: pct >= 85,
  }
}

export function computeDepositParkingUsage(deposit: Deposit, parkedCount: number): {
  capacity: number
  parked: number
  available: number
  pct: number
  isFull: boolean
  isNearCapacity: boolean
  statusLabel: string
} {
  const capacity = deposit.truck_capacity && deposit.truck_capacity > 0 ? deposit.truck_capacity : 5
  const parked = Math.max(0, parkedCount)
  const available = Math.max(0, capacity - parked)
  const pct = Math.min(100, Math.round((parked / capacity) * 100))
  const isFull = parked >= capacity
  const isNearCapacity = !isFull && pct >= 75
  const statusLabel = isFull ? "Full" : isNearCapacity ? "Near Capacity" : "Available"

  return {
    capacity,
    parked,
    available,
    pct,
    isFull,
    isNearCapacity,
    statusLabel,
  }
}

export function computeTruckLoad(truck: Truck): { volumePct: number; weightPct: number } {
  const volMax = truck.volume_max && truck.volume_max > 0 ? truck.volume_max : 1
  const weightMax = truck.weight_max && truck.weight_max > 0 ? truck.weight_max : 1

  return {
    volumePct: Math.min(100, Math.round(((truck.volume_actual || 0) / volMax) * 100)),
    weightPct: Math.min(100, Math.round(((truck.weight_actual || 0) / weightMax) * 100)),
  }
}

export function computeRouteAverageGasPrice(
  deposits: Deposit[],
  routeDepositIds: string[]
): number {
  if (!routeDepositIds || routeDepositIds.length === 0) {
    if (deposits.length === 0) return 5.89
    const sum = deposits.reduce((acc, d) => acc + (d.fuel_price ?? 5.89), 0)
    return Math.round((sum / deposits.length) * 100) / 100
  }

  const matched = deposits.filter((d) => routeDepositIds.includes(d.id))
  if (matched.length === 0) return 5.89

  const sum = matched.reduce((acc, d) => acc + (d.fuel_price ?? 5.89), 0)
  return Math.round((sum / matched.length) * 100) / 100
}

export function calculateFreightEstimate(
  distanceKm: number,
  timeSeconds: number,
  truck?: Truck,
  fuelPrice: number | number[] = 5.89,
  driverWage = 45.0
): FreightCost {
  const avgFuelPrice = Array.isArray(fuelPrice)
    ? fuelPrice.length > 0
      ? fuelPrice.reduce((a, b) => a + b, 0) / fuelPrice.length
      : 5.89
    : fuelPrice

  const consumption = truck?.fuel_consumption ?? 0.35 // Litros por km
  const fuelLiters = distanceKm * consumption
  const fuelCost = Math.round(fuelLiters * avgFuelPrice * 100) / 100

  const timeHours = timeSeconds / 3600
  const laborCost = Math.round(timeHours * driverWage * 100) / 100 // Custo de motorista por hora

  const wearRate = truck?.wear_rate ?? 0.15
  const maintenanceCost = Math.round(distanceKm * wearRate * 100) / 100

  const totalCost = Math.round((fuelCost + laborCost + maintenanceCost) * 100) / 100

  return {
    order_id: "",
    distance_km: distanceKm,
    avg_fuel_price: Math.round(avgFuelPrice * 100) / 100,
    driver_wage: driverWage,
    fuel_liters: Math.round(fuelLiters * 100) / 100,
    travel_hours: Math.round(timeHours * 100) / 100,
    fuel_cost: fuelCost,
    labor_cost: laborCost,
    maintenance_cost: maintenanceCost,
    total_cost: totalCost,
    calculated_at: new Date().toISOString(),
  }
}

export function formatDurationHours(hours: number): string {
  if (!hours || isNaN(hours) || hours <= 0) return "0h"
  const totalMinutes = Math.round(hours * 60)
  const days = Math.floor(totalMinutes / (24 * 60))
  const remainingMinutes = totalMinutes % (24 * 60)
  const h = Math.floor(remainingMinutes / 60)
  const m = remainingMinutes % 60

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (h > 0 || (days === 0 && m === 0)) parts.push(`${h}h`)
  if (m > 0 && days === 0) parts.push(`${m}m`)
  return parts.join(" ") || "0h"
}

export function calculateOrderETA(
  distanceKm: number,
  options?: {
    minSpeed?: number
    maxSpeed?: number
    avgSpeed?: number
    departureTime?: Date | string
    timeLimit?: Date | string
    truck?: Truck
  }
): OrderETA {
  const minSpeed = options?.minSpeed !== undefined ? options.minSpeed : 40.0
  const maxSpeed = options?.maxSpeed !== undefined ? options.maxSpeed : (options?.truck?.speed ?? 85.0)
  const avgSpeed =
    options?.avgSpeed !== undefined
      ? options.avgSpeed
      : Math.round(((minSpeed + maxSpeed) / 2) * 10) / 10

  const computeCase = (speedKmH: number) => {
    const effSpeed = Math.max(1, speedKmH)
    const drivingHours = distanceKm / effSpeed
    const restPeriodsCount = Math.max(0, Math.floor((drivingHours - 0.001) / 8))
    const restHours = restPeriodsCount * 16
    const totalTransitHours = drivingHours + restHours
    return {
      drivingHours: Math.round(drivingHours * 100) / 100,
      restPeriodsCount,
      restHours: Math.round(restHours * 100) / 100,
      totalTransitHours: Math.round(totalTransitHours * 100) / 100,
    }
  }

  const fast = computeCase(maxSpeed)
  const slow = computeCase(minSpeed)
  const avg = computeCase(avgSpeed)

  const dep = options?.departureTime ? new Date(options.departureTime) : new Date()
  const depMs = !isNaN(dep.getTime()) ? dep.getTime() : Date.now()

  const etaMinDate = new Date(depMs + fast.totalTransitHours * 3600 * 1000)
  const etaMaxDate = new Date(depMs + slow.totalTransitHours * 3600 * 1000)
  const etaAvgDate = new Date(depMs + avg.totalTransitHours * 3600 * 1000)

  let isOnTime = true
  let complianceStatus: "on_time" | "at_risk" | "overdue" = "on_time"
  if (options?.timeLimit) {
    const limit = new Date(options.timeLimit)
    if (!isNaN(limit.getTime())) {
      if (etaMaxDate.getTime() <= limit.getTime()) {
        complianceStatus = "on_time"
        isOnTime = true
      } else if (etaAvgDate.getTime() <= limit.getTime()) {
        complianceStatus = "at_risk"
        isOnTime = true
      } else {
        complianceStatus = "overdue"
        isOnTime = false
      }
    }
  }

  return {
    order_id: "",
    distance_km: Math.round(distanceKm * 10) / 10,
    min_speed_kmh: minSpeed,
    max_speed_kmh: maxSpeed,
    avg_speed_kmh: avgSpeed,
    driving_hours_min: fast.drivingHours,
    driving_hours_max: slow.drivingHours,
    driving_hours_avg: avg.drivingHours,
    rest_hours_min: fast.restHours,
    rest_hours_max: slow.restHours,
    rest_hours_avg: avg.restHours,
    rest_periods_count: avg.restPeriodsCount,
    total_transit_hours_min: fast.totalTransitHours,
    total_transit_hours_max: slow.totalTransitHours,
    total_transit_hours_avg: avg.totalTransitHours,
    departure_time: dep.toISOString(),
    eta_min: etaMinDate.toISOString().replace("T", " ").slice(0, 19),
    eta_max: etaMaxDate.toISOString().replace("T", " ").slice(0, 19),
    eta_expected: etaAvgDate.toISOString().replace("T", " ").slice(0, 19),
    formatted_duration_min: formatDurationHours(fast.totalTransitHours),
    formatted_duration_max: formatDurationHours(slow.totalTransitHours),
    formatted_duration_avg: formatDurationHours(avg.totalTransitHours),
    is_on_time: isOnTime,
    compliance_status: complianceStatus,
    time_limit: options?.timeLimit ? String(options.timeLimit) : undefined,
  }
}


