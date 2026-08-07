import {
  adaptWarehouse,
  adaptTruck,
  adaptProduct,
  adaptUser,
  adaptOrder,
  adaptOrderItem,
  adaptOrderRoute,
  adaptSupplier,
  adaptStock,
  adaptFreightCost,
  adaptMonthlyPerformance,
} from "../../lib/adapters"

describe("Unit Tests - Data Adapters (lib/adapters.ts)", () => {
  describe("adaptWarehouse", () => {
    it("should return empty object fallback if input is null or undefined", () => {
      expect(adaptWarehouse(null)).to.deep.equal({})
      expect(adaptWarehouse(undefined)).to.deep.equal({})
    })

    it("should parse stringified JSON location field correctly", () => {
      const raw = {
        id: 101,
        location: JSON.stringify({ city: "Petrópolis", state: "RJ" }),
        volume_current: 450,
        volume_max: 1000,
        has_refrigeration: true,
      }
      const adapted = adaptWarehouse(raw)
      expect(adapted.id).to.equal("101")
      expect(adapted.location).to.equal("Petrópolis, RJ")
      expect(adapted.volume_actual).to.equal(450)
      expect(adapted.volume_max).to.equal(1000)
      expect(adapted.has_refrigeration).to.equal(true)
    })

    it("should handle location object with label", () => {
      const raw = {
        id: "W-2",
        location: { label: "Central Distribution Hub" },
        volume_actual: 800,
        volume_max: 2000,
      }
      const adapted = adaptWarehouse(raw)
      expect(adapted.location).to.equal("Central Distribution Hub")
      expect(adapted.volume_actual).to.equal(800)
    })

    it("should fallback to Warehouse ID string if location field is missing", () => {
      const raw = { id: 303 }
      const adapted = adaptWarehouse(raw)
      expect(adapted.location).to.equal("Warehouse 303")
      expect(adapted.volume_max).to.equal(1000)
      expect(adapted.volume_actual).to.equal(0)
    })
  })

  describe("adaptTruck", () => {
    it("should map truck status, wear percentage and fuel capacities correctly", () => {
      const raw = {
        id: 5,
        model: "Volvo FH 540",
        is_delivering: 1,
        volume_current: 65,
        volume_max: 90,
        weight_current: 18000,
        weight_max: 25000,
        fuel_current: 350,
        fuel_capacity: 500,
        truck_maintenance: 2,
      }
      const adapted = adaptTruck(raw)
      expect(adapted.id).to.equal("5")
      expect(adapted.model).to.equal("Volvo FH 540")
      expect(adapted.is_delivering).to.equal(true)
      expect(adapted.is_traveling).to.equal(true)
      expect(adapted.wear_percentage).to.equal(30)
      expect(adapted.volume_actual).to.equal(65)
      expect(adapted.weight_actual).to.equal(18000)
      expect(adapted.fuel_current).to.equal(350)
    })

    it("should default model name and capacities when omitted", () => {
      const raw = { id: 12 }
      const adapted = adaptTruck(raw)
      expect(adapted.model).to.equal("Truck 12")
      expect(adapted.volume_max).to.equal(90)
      expect(adapted.weight_max).to.equal(25000)
      expect(adapted.is_valid).to.equal(true)
      expect(adapted.is_delivering).to.equal(false)
    })
  })

  describe("adaptProduct", () => {
    it("should transform product raw attributes into frontend product contract", () => {
      const raw = {
        id: "P-99",
        name: "Refrigerated Vaccines",
        is_cold: 1,
        is_fragile: 0,
        price: "150.50",
        volume: 2.5,
        weight: 1.2,
      }
      const adapted = adaptProduct(raw)
      expect(adapted.id).to.equal("P-99")
      expect(adapted.name).to.equal("Refrigerated Vaccines")
      expect(adapted.is_cold).to.equal(true)
      expect(adapted.is_fragile).to.equal(false)
      expect(adapted.price).to.equal(150.5)
      expect(adapted.volume).to.equal(2.5)
    })
  })

  describe("adaptUser", () => {
    it("should map roles correctly to client, worker, or admin", () => {
      expect(adaptUser({ id: 1, role: "admin" }).role).to.equal("admin")
      expect(adaptUser({ id: 2, role: "warehouse_worker" }).role).to.equal("worker")
      expect(adaptUser({ id: 3, role: "truck_driver" }).role).to.equal("worker")
      expect(adaptUser({ id: 4, role: "customer" }).role).to.equal("client")
    })

    it("should extract derived email and address string", () => {
      const raw = {
        id: 10,
        name: "Bob Smith",
        address: { address: "Rua do Imperador 100, Petrópolis" },
      }
      const adapted = adaptUser(raw)
      expect(adapted.name).to.equal("Bob Smith")
      expect(adapted.email).to.equal("bob@logisys.com")
      expect(adapted.address).to.equal("Rua do Imperador 100, Petrópolis")
    })
  })

  describe("adaptOrder", () => {
    it("should normalize status and pricing details", () => {
      const raw = {
        id: "ORD-500",
        status: "Shipped",
        price: 1250.75,
        final_destination: { label: "Rio de Janeiro Port" },
        client_id: "USR-002",
      }
      const adapted = adaptOrder(raw)
      expect(adapted.id).to.equal("ORD-500")
      expect(adapted.status).to.equal("Shipped")
      expect(adapted.price).to.equal(1250.75)
      expect(adapted.final_destination).to.equal("Rio de Janeiro Port")
    })

    it("should handle status spelling variants like Cancelled", () => {
      const raw = { id: "ORD-501", status: "Cancelled" }
      expect(adaptOrder(raw).status).to.equal("Cancelled")
    })
  })

  describe("adaptOrderItem & adaptOrderRoute", () => {
    it("should map order items correctly", () => {
      const raw = { order_id: 10, product_id: 5, quantity: 20 }
      const adapted = adaptOrderItem(raw)
      expect(adapted.order_id).to.equal("10")
      expect(adapted.product_id).to.equal("5")
      expect(adapted.quantity).to.equal(20)
    })

    it("should map route steps correctly", () => {
      const raw = { order_id: 10, step: 2, warehouse_id: "W-1", truck_id: "T-3" }
      const adapted = adaptOrderRoute(raw)
      expect(adapted.step).to.equal(2)
      expect(adapted.deposit_id).to.equal("W-1")
      expect(adapted.truck_id).to.equal("T-3")
    })
  })

  describe("adaptSupplier", () => {
    it("should parse lat/lng coordinates from comma-separated location strings", () => {
      const raw = { id: 1, name: "Alpha Supply", location: "-22.505, -43.178" }
      const adapted = adaptSupplier(raw)
      expect(adapted.name).to.equal("Alpha Supply")
      expect(adapted.latitude).to.equal(-22.505)
      expect(adapted.longitude).to.equal(-43.178)
    })
  })

  describe("adaptStock", () => {
    it("should format compound stock ID and deposit connection", () => {
      const raw = { warehouse_id: "W-10", product_id: "P-4", quantity: 150 }
      const adapted = adaptStock(raw)
      expect(adapted.id).to.equal("W-10-P-4")
      expect(adapted.deposit_id).to.equal("W-10")
      expect(adapted.quantity).to.equal(150)
    })
  })

  describe("adaptFreightCost & adaptMonthlyPerformance", () => {
    it("should correctly adapt freight cost breakdown", () => {
      const raw = { order_id: "ORD-1", fuel_cost: 120, labor_cost: 90, maintenance_cost: 30, total_cost: 240 }
      const adapted = adaptFreightCost(raw)
      expect(adapted.total_cost).to.equal(240)
      expect(adapted.fuel_cost).to.equal(120)
    })

    it("should map monthly performance snake_case properties", () => {
      const raw = {
        month: "Jan",
        full_month: "January 2026",
        revenue: 50000,
        costs: 30000,
        profit: 20000,
        fuel_cost: 10000,
        orders_count: 42,
        is_poi: 1,
      }
      const adapted = adaptMonthlyPerformance(raw)
      expect(adapted.fullMonth).to.equal("January 2026")
      expect(adapted.revenue).to.equal(50000)
      expect(adapted.profit).to.equal(20000)
      expect(adapted.isPoi).to.equal(true)
    })
  })
})
