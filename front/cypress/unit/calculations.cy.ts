import {
  computeDashboardStats,
  computeDepositUsage,
  computeDepositParkingUsage,
  computeTruckLoad,
  computeRouteAverageGasPrice,
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

  describe("computeDepositParkingUsage", () => {
    it("should calculate parked percentage and availability correctly", () => {
      const deposit: Partial<Deposit> = { truck_capacity: 5 }
      const res = computeDepositParkingUsage(deposit as Deposit, 2)
      expect(res.capacity).to.equal(5)
      expect(res.parked).to.equal(2)
      expect(res.available).to.equal(3)
      expect(res.pct).to.equal(40)
      expect(res.isFull).to.equal(false)
      expect(res.statusLabel).to.equal("Available")
    })

    it("should identify full parking status", () => {
      const deposit: Partial<Deposit> = { truck_capacity: 4 }
      const res = computeDepositParkingUsage(deposit as Deposit, 4)
      expect(res.isFull).to.equal(true)
      expect(res.available).to.equal(0)
      expect(res.statusLabel).to.equal("Full")
    })
  })

  describe("computeRouteAverageGasPrice", () => {
    it("should compute average fuel price across warehouses along route", () => {
      const warehouses: Partial<Deposit>[] = [
        { id: "WH-001", fuel_price: 5.89 },
        { id: "WH-002", fuel_price: 6.15 },
        { id: "WH-003", fuel_price: 5.95 },
      ]
      const avg = computeRouteAverageGasPrice(warehouses as Deposit[], ["WH-001", "WH-002"])
      // (5.89 + 6.15) / 2 = 6.02
      expect(avg).to.equal(6.02)
    })

    it("should fallback to default if no matching warehouses", () => {
      const avg = computeRouteAverageGasPrice([], [])
      expect(avg).to.equal(5.89)
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
      const customDriverWage = 45.0

      const estimate = calculateFreightEstimate(distanceKm, timeSeconds, truck as Truck, customFuelPrice, customDriverWage)

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

    it("should calculate delivery cost considering array of warehouse gas prices and driver wage", () => {
      const truck: Partial<Truck> = { fuel_consumption: 0.3, wear_rate: 0.1 }
      const distanceKm = 200
      const timeSeconds = 9000 // 2.5 hours
      const warehouseGasPrices = [5.89, 6.15] // avg = 6.02
      const driverWage = 55.0 // R$ 55/hour for Charlie Driver

      const estimate = calculateFreightEstimate(distanceKm, timeSeconds, truck as Truck, warehouseGasPrices, driverWage)

      // Fuel: 200 * 0.3 = 60 L * 6.02 = 361.20
      expect(estimate.fuel_cost).to.equal(361.2)
      // Labor: 2.5 hours * 55.0 = 137.50
      expect(estimate.labor_cost).to.equal(137.5)
      // Maintenance: 200 * 0.1 = 20.00
      expect(estimate.maintenance_cost).to.equal(20)
      // Total: 361.20 + 137.50 + 20.00 = 518.70
      expect(estimate.total_cost).to.equal(518.7)
    })
  })
})

