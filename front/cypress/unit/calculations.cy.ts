import {
  computeDashboardStats,
  computeDepositUsage,
  computeTruckLoad,
  calculateFreightEstimate,
} from "../../lib/calculations"
import type { Order, Truck, Deposit } from "../../types"

describe("Unit Tests - Domain Calculations (lib/calculations.ts)", () => {
  describe("computeDashboardStats", () => {
    it("should calculate correct aggregate statistics from orders and trucks array", () => {
      const orders: Partial<Order>[] = [
        { id: "1", status: "Shipped", price: 100 },
        { id: "2", status: "Shipped", price: 200 },
        { id: "3", status: "Pending", price: 150 },
        { id: "4", status: "Delivered", price: 500 },
        { id: "5", status: "Delivered", price: 300 },
        { id: "6", status: "Cancelled", price: 50 },
      ]

      const trucks: Partial<Truck>[] = [
        { id: "T1", is_delivering: true, is_traveling: true },
        { id: "T2", is_delivering: false, is_traveling: true },
        { id: "T3", is_delivering: false, is_traveling: false },
      ]

      const stats = computeDashboardStats(orders as Order[], trucks as Truck[])

      expect(stats.ordersInProgress).to.equal(2)
      expect(stats.pendingOrders).to.equal(1)
      expect(stats.deliveredThisMonth).to.equal(2)
      expect(stats.totalRevenue).to.equal(800) // 500 + 300
      expect(stats.trucksOnRoad).to.equal(2) // T1 and T2
      expect(stats.avgDeliveryTime).to.equal(2.4)
    })

    it("should handle empty arrays without throwing NaN or crashing", () => {
      const stats = computeDashboardStats([], [])
      expect(stats.ordersInProgress).to.equal(0)
      expect(stats.trucksOnRoad).to.equal(0)
      expect(stats.totalRevenue).to.equal(0)
    })
  })

  describe("computeDepositUsage", () => {
    it("should calculate correct volume percentage and flag high usage above 85%", () => {
      const depositHigh: Partial<Deposit> = { volume_actual: 900, volume_max: 1000 }
      const resHigh = computeDepositUsage(depositHigh as Deposit)
      expect(resHigh.pct).to.equal(90)
      expect(resHigh.isHighUsage).to.equal(true)

      const depositNormal: Partial<Deposit> = { volume_actual: 500, volume_max: 1000 }
      const resNormal = computeDepositUsage(depositNormal as Deposit)
      expect(resNormal.pct).to.equal(50)
      expect(resNormal.isHighUsage).to.equal(false)
    })

    it("should cap percentage at 100% and handle zero volume max safely", () => {
      const depositOverflow: Partial<Deposit> = { volume_actual: 1500, volume_max: 1000 }
      expect(computeDepositUsage(depositOverflow as Deposit).pct).to.equal(100)

      const depositZero: Partial<Deposit> = { volume_actual: 100, volume_max: 0 }
      expect(computeDepositUsage(depositZero as Deposit).pct).to.equal(100)
    })
  })

  describe("computeTruckLoad", () => {
    it("should compute volume and weight load percentages", () => {
      const truck: Partial<Truck> = {
        volume_actual: 45,
        volume_max: 90,
        weight_actual: 12500,
        weight_max: 25000,
      }
      const load = computeTruckLoad(truck as Truck)
      expect(load.volumePct).to.equal(50)
      expect(load.weightPct).to.equal(50)
    })

    it("should handle zero max capacity defaults gracefully", () => {
      const emptyTruck: Partial<Truck> = { volume_actual: 0, weight_actual: 0 }
      const load = computeTruckLoad(emptyTruck as Truck)
      expect(load.volumePct).to.equal(0)
      expect(load.weightPct).to.equal(0)
    })
  })

  describe("calculateFreightEstimate", () => {
    it("should calculate breakdown of fuel, labor, maintenance, and total cost", () => {
      const truck: Partial<Truck> = { fuel_consumption: 0.4, wear_rate: 0.2 }
      const distanceKm = 100
      const timeSeconds = 7200 // 2 hours
      const customFuelPrice = 6.0

      const estimate = calculateFreightEstimate(distanceKm, timeSeconds, truck as Truck, customFuelPrice)

      // Fuel: 100 km * 0.4 L/km = 40 L -> 40 * 6.0 = 240.00
      expect(estimate.fuel_cost).to.equal(240)
      // Labor: 2 hours * R$ 45/hr = 90.00
      expect(estimate.labor_cost).to.equal(90)
      // Maintenance: 100 km * 0.2 wear_rate = 20.00
      expect(estimate.maintenance_cost).to.equal(20)
      // Total: 240 + 90 + 20 = 350.00
      expect(estimate.total_cost).to.equal(350)
      expect(estimate.calculated_at).to.be.a("string")
    })
  })
})
