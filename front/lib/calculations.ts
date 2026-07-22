import type { Order, Truck, Deposit, DashboardStats, FreightCost } from "@/types"

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

export function computeTruckLoad(truck: Truck): { volumePct: number; weightPct: number } {
  const volMax = truck.volume_max && truck.volume_max > 0 ? truck.volume_max : 1
  const weightMax = truck.weight_max && truck.weight_max > 0 ? truck.weight_max : 1

  return {
    volumePct: Math.min(100, Math.round(((truck.volume_actual || 0) / volMax) * 100)),
    weightPct: Math.min(100, Math.round(((truck.weight_actual || 0) / weightMax) * 100)),
  }
}

export function calculateFreightEstimate(
  distanceKm: number,
  timeSeconds: number,
  truck?: Truck,
  fuelPrice = 5.89
): FreightCost {
  const consumption = truck?.fuel_consumption ?? 0.35 // Litros por km
  const fuelLiters = distanceKm * consumption
  const fuelCost = Math.round(fuelLiters * fuelPrice * 100) / 100

  const timeHours = timeSeconds / 3600
  const laborCost = Math.round(timeHours * 45 * 100) / 100 // R$ 45/hora de motorista

  const wearRate = truck?.wear_rate ?? 0.15
  const maintenanceCost = Math.round(distanceKm * wearRate * 100) / 100

  const totalCost = Math.round((fuelCost + laborCost + maintenanceCost) * 100) / 100

  return {
    order_id: "",
    fuel_cost: fuelCost,
    labor_cost: laborCost,
    maintenance_cost: maintenanceCost,
    total_cost: totalCost,
    calculated_at: new Date().toISOString(),
  }
}
