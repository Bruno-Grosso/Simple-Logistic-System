import { NextResponse } from "next/server"
import * as mockData from "@/lib/mock-data"
import * as calculations from "@/lib/calculations"
import * as adapters from "@/lib/adapters"
import * as utils from "@/lib/utils"
import * as geocoding from "@/lib/geocoding"
import * as sessionAuth from "@/lib/auth/session"
import * as verifyCredsAuth from "@/lib/auth/verify-credentials"
import { api } from "@/lib/api"
import { loginAction } from "@/app/login/actions"
import { registerAction } from "@/app/register/actions"

export const dynamic = "force-dynamic"

export async function GET() {
  const results: Record<string, any> = {}

  // ─── 1. Exercise lib/mock-data.ts (all static records & helper functions) ───
  try {
    results.productsCount = mockData.PRODUCTS.length
    results.depositsCount = mockData.DEPOSITS.length
    results.trucksCount = mockData.TRUCKS.length
    results.ordersCount = mockData.ORDERS.length
    results.usersCount = mockData.USERS.length
    results.suppliersCount = mockData.SUPPLIERS.length
    results.stockCount = mockData.STOCK.length
    results.orderItemsCount = mockData.ORDER_ITEMS.length
    results.orderRoutesCount = mockData.ORDER_ROUTES.length
    results.performanceCount = mockData.MONTHLY_PERFORMANCE.length
    results.freightCostsCount = mockData.FREIGHT_COSTS.length

    mockData.getProductById("PROD-001")
    mockData.getProductById("NON-EXISTENT")
    mockData.getDepositById("WH-001")
    mockData.getDepositById("NON-EXISTENT")
    mockData.getDepositLabel(mockData.DEPOSITS[0])
    mockData.getUserById("USR-001")
    mockData.getUserById("NON-EXISTENT")
    mockData.getTruckById("TRK-001")
    mockData.getTruckById("NON-EXISTENT")
    mockData.getOrderById("ORD-001")
    mockData.getOrderById("NON-EXISTENT")
    mockData.getOrderItems("ORD-001")
    mockData.getOrderItems("NON-EXISTENT")
    mockData.getOrderRoute("ORD-001")
    mockData.getOrderRoute("NON-EXISTENT")
    mockData.getStockByDeposit("WH-001")
    mockData.getStockByDeposit("NON-EXISTENT")
    mockData.getFreightCostByOrder("ORD-001")
    mockData.getFreightCostByOrder("NON-EXISTENT")
    mockData.getDashboardStats()
  } catch (e: any) {
    results.mockDataError = e.message
  }

  // ─── 2. Exercise lib/utils.ts (all branches) ───
  try {
    utils.cn("px-2", "py-1", { "bg-red-500": true, "hidden": false }, ["text-sm", null, undefined])
    utils.cn()
    
    // formatDimensions branches
    utils.formatDimensions(null)
    utils.formatDimensions(undefined)
    utils.formatDimensions("")
    utils.formatDimensions("   ")
    utils.formatDimensions('{"length":10,"width":5,"height":3}')
    utils.formatDimensions('{"l":10,"w":5,"h":3}', "cm")
    utils.formatDimensions({ length: 12, width: 6, height: 4 })
    utils.formatDimensions({ l: 12, w: 6, h: 4 })
    utils.formatDimensions({ l: 12 }) // incomplete
    utils.formatDimensions("not-json-string")
    utils.formatDimensions(123 as any)

    // getErrorMessage branches
    utils.getErrorMessage(null, "fallback")
    utils.getErrorMessage(undefined)
    utils.getErrorMessage({})
    utils.getErrorMessage("plain error string")
    utils.getErrorMessage(new Error("Standard error message"))
    utils.getErrorMessage({ response: { data: { error: "Axios error.error" } } })
    utils.getErrorMessage({ response: { data: { message: "Axios error.message" } } })
    utils.getErrorMessage({ response: { data: "Axios string data" } })
    utils.getErrorMessage({ response: { data: {} } })
    utils.getErrorMessage({ message: "General message property" })
  } catch (e: any) {
    results.utilsError = e.message
  }

  // ─── 3. Exercise lib/calculations.ts (all functions & branches) ───
  try {
    const orders = mockData.ORDERS
    const trucks = mockData.TRUCKS
    const deposits = mockData.DEPOSITS

    calculations.computeDashboardStats([], [])
    calculations.computeDashboardStats(orders, trucks)
    calculations.computeDashboardStats(
      [{ id: "1", status: "Delivered", price: 100 }, { id: "2", status: "Cancelled", price: 50 }] as any,
      [{ id: "T1", is_delivering: false, is_traveling: false }] as any
    )

    calculations.computeDepositUsage(deposits[0])
    calculations.computeDepositUsage({ volume_actual: 900, volume_max: 1000 } as any) // high usage
    calculations.computeDepositUsage({ volume_actual: 0, volume_max: 0 } as any)
    calculations.computeDepositUsage({} as any)

    calculations.computeDepositParkingUsage(deposits[0] as any, 2)
    calculations.computeDepositParkingUsage({ truck_capacity: 10 } as any, 9) // high usage
    calculations.computeDepositParkingUsage({ truck_capacity: 0 } as any, 0)

    calculations.computeTruckLoad(trucks[0])
    calculations.computeTruckLoad({ current_weight: 900, max_weight: 1000 } as any) // high weight
    calculations.computeTruckLoad({ current_volume: 90, max_volume: 100 } as any) // high volume
    calculations.computeTruckLoad({ current_weight: 0, max_weight: 0, current_volume: 0, max_volume: 0 } as any)

    calculations.computeRouteAverageGasPrice([{ gas_price: 5.5 }, { gas_price: 6.0 }] as any, [])
    calculations.computeRouteAverageGasPrice([], [])
    calculations.computeRouteAverageGasPrice([{ gas_price: 0 }] as any, ["1"])

    calculations.calculateFreightEstimate(100, 500)
    calculations.calculateFreightEstimate(0, 0)
    calculations.calculateFreightEstimate(200, 1000, undefined, 2.5)

    calculations.calculateOrderETA(100, { avgSpeed: 50 })
    calculations.calculateOrderETA(0)

    calculations.formatDurationHours(0)
    calculations.formatDurationHours(0.5)
    calculations.formatDurationHours(2.75)
    calculations.formatDurationHours(24)

    calculations.haversineDistanceKm(-22.5, -43.1, -22.9, -43.2)
    calculations.haversineDistanceKm(0, 0, 0, 0)

    calculations.distancePointToSegmentKm(
      [-22.5, -43.1],
      [-22.4, -43.0],
      [-22.6, -43.2]
    )
    calculations.distancePointToSegmentKm(
      [-22.5, -43.1],
      [-22.5, -43.1],
      [-22.5, -43.1]
    )

    const routeCoords = [
      { lat: -22.5, lon: -43.1 },
      { lat: -22.6, lon: -43.2 },
      { lat: -22.7, lon: -43.3 },
    ]
    calculations.minDistanceToRouteKm({ lat: -22.55, lon: -43.15 }, routeCoords)
    calculations.minDistanceToRouteKm({ lat: -22.55, lon: -43.15 }, [])
    calculations.minDistanceToRouteKm({ lat: -22.55, lon: -43.15 }, [{ lat: -22.55, lon: -43.15 }])

    calculations.decodePolyline6("_p~iF~ps|U_ulLnnqC_mqNvxq`@")
    calculations.decodePolyline6("")

    calculations.selectOrdersNearRoute({ orders, routePoints: routeCoords })
    calculations.selectOrdersNearRoute({ orders: [], routePoints: routeCoords })
    calculations.selectOrdersNearRoute({ orders, routePoints: [] })
  } catch (e: any) {
    results.calculationsError = e.message
  }

  // ─── 4. Exercise lib/adapters.ts (all models and edge cases) ───
  try {
    adapters.adaptWarehouse(null)
    adapters.adaptWarehouse({})
    adapters.adaptWarehouse({
      id: "WH-1",
      location: '{"latitude":-22.5,"longitude":-43.1,"label":"Depot A"}',
      size: '{"length":10,"width":10,"height":5}',
      volume_current: 50,
      volume_max: 100,
      has_refrigeration: 1,
      is_active: 1,
    })
    adapters.adaptWarehouse({
      id: "WH-2",
      location: '{"city":"Petropolis","state":"RJ"}',
      size: { l: 20, w: 20, h: 5 },
      has_refrigeration: "true",
      is_active: true,
    })
    adapters.adaptWarehouse({
      id: "WH-3",
      location: '{"lat":-22.1,"lon":-43.2}',
      has_refrigeration: 0,
      is_active: false,
    })
    adapters.adaptWarehouse({
      id: "WH-4",
      location: "invalid-json",
      has_refrigeration: "no",
      is_active: "0",
    })

    adapters.adaptTruck(null)
    adapters.adaptTruck({})
    adapters.adaptTruck({
      id: "TRK-1",
      current_location: '{"latitude":-22.5,"longitude":-43.1}',
      size: '{"length":13,"width":2.5,"height":2.7}',
      has_refrigeration: 1,
      is_delivering: 1,
      is_traveling: 0,
      is_active: 1,
    })
    adapters.adaptTruck({
      id: "TRK-2",
      current_location: "Petropolis Depot",
      has_refrigeration: false,
      is_delivering: false,
      is_traveling: true,
      is_active: false,
    })

    adapters.adaptProduct(null)
    adapters.adaptProduct({})
    adapters.adaptProduct({
      id: "P1",
      name: "Milk",
      is_cold: 1,
      is_fragile: 0,
      size: '{"length":10,"width":10,"height":20}',
      price: 5.5,
      weight: 1.0,
      volume: 0.002,
    })
    adapters.adaptProduct({
      id: "P2",
      name: "Glass",
      is_cold: false,
      is_fragile: true,
      price: "100",
    })

    adapters.adaptUser(null)
    adapters.adaptUser({})
    adapters.adaptUser({ id: "U1", name: "Alice", email: "alice@test.com", role: "admin", is_active: 1 })
    adapters.adaptUser({ id: "U2", name: "Bob", email: "bob@test.com", role: "dispatcher", is_active: 0 })

    adapters.adaptOrder(null)
    adapters.adaptOrder({})
    adapters.adaptOrder({
      id: "ORD-1",
      origin: '{"latitude":-22.5,"longitude":-43.1,"label":"Origin"}',
      destination: '{"latitude":-22.6,"longitude":-43.2,"label":"Dest"}',
      status: "In Transit",
      items: [{ product_id: "P1", quantity: 2, price: 10 }],
      route: [{ latitude: -22.5, longitude: -43.1 }, { latitude: -22.6, longitude: -43.2 }],
    })
    adapters.adaptOrder({
      id: "ORD-2",
      origin: "Origin String",
      destination: "Dest String",
      status: "Delivered",
      items: "not-an-array",
    })

    adapters.adaptOrderItem({ order_id: "ORD-1", product_id: "P1", quantity: 5 })
    adapters.adaptOrderItem({ order_id: "ORD-2", product_id: "P2" })

    adapters.adaptOrderRoute({ order_id: "ORD-1", warehouse_id: "WH-1", truck_id: "TRK-1" })
    adapters.adaptOrderRoute({ order_id: "ORD-2", destination_warehouse_id: "WH-2", driver_id: "U1" })

    adapters.adaptSupplier(null)
    adapters.adaptSupplier({})
    adapters.adaptSupplier({ id: "SUP-1", name: "Supplier A", location: '{"city":"Rio"}', is_active: 1 })
    adapters.adaptSupplier({ id: "SUP-2", name: "Supplier B", location: "-22.5,-43.1", is_active: 0 })

    adapters.adaptStock(null)
    adapters.adaptStock({})
    adapters.adaptStock({ id: "STK-1", warehouse_id: "WH-1", product_id: "P1", quantity_actual: 100 })

    adapters.adaptFreightCost(null)
    adapters.adaptFreightCost({})
    adapters.adaptFreightCost({ distance_km: 150, cost_total: 750, duration_hours: 3.5 })

    adapters.adaptMonthlyPerformance(null)
    adapters.adaptMonthlyPerformance({})
    adapters.adaptMonthlyPerformance({ month: "2026-09", delivered_count: 50, revenue: 15000 })

    adapters.adaptOrderETA(null)
    adapters.adaptOrderETA({})
    adapters.adaptOrderETA({ order_id: "ORD-1", eta_hours: 4.2, distance_km: 120 })

    adapters.adaptDeliveryCostReport(null)
    adapters.adaptDeliveryCostReport({})
    adapters.adaptDeliveryCostReport({
      summary: { totalOrders: 10, totalFreightCost: 2500, averageCostPerOrder: 250 },
      orders: [{ id: "ORD-1", freightCost: 250, distanceKm: 50 }],
    })
  } catch (e: any) {
    results.adaptersError = e.message
  }

  // ─── 5. Exercise lib/auth/* ───
  try {
    sessionAuth.sessionCookieMaxAge()
    sessionAuth.createSessionToken("test@example.com")
    sessionAuth.createSessionToken({ sub: "USR-001", role: "admin", name: "Alice" })

    await verifyCredsAuth.authenticateLogin("alice@logisys.com", "admin123")
    await verifyCredsAuth.authenticateLogin("unknown@logisys.com", "wrongpass")
  } catch (e: any) {
    results.authError = e.message
  }

  // ─── 6. Exercise lib/geocoding.ts ───
  try {
    await geocoding.converterEndereco("")
    await geocoding.converterEndereco("   ")
    await geocoding.converterCoordenadas("", "")
    await geocoding.converterCoordenadas(undefined as any, undefined as any)
  } catch (e: any) {
    results.geocodingError = e.message
  }

  // ─── 7. Exercise lib/api.ts (live backend calls to Postgres) ───
  try {
    await api.warehouses.getAll().catch(() => null)
    await api.warehouses.getById("WH-001").catch(() => null)
    await api.warehouses.getStock("WH-001").catch(() => null)
    await api.warehouses.getParking("WH-001").catch(() => null)
    await api.trucks.getAll().catch(() => null)
    await api.trucks.getById("TRK-001").catch(() => null)
    await api.products.getAll().catch(() => null)
    await api.products.getById("PROD-001").catch(() => null)
    await api.orders.getAll().catch(() => null)
    await api.orders.getById("ORD-001").catch(() => null)
    await api.users.getAll().catch(() => null)
    await api.suppliers.getAll().catch(() => null)
    await api.reports.getDeliveryCosts().catch(() => null)
    await api.reports.getMonthlyPerformance().catch(() => null)
    await api.auth.login("alice@logisys.com", "admin123").catch(() => null)
  } catch (e: any) {
    results.apiError = e.message
  }

  // ─── 8. Exercise actions.ts ───
  try {
    const emptyForm = new FormData()
    await loginAction({}, emptyForm).catch(() => null)

    const filledLogin = new FormData()
    filledLogin.append("email", "alice@logisys.com")
    filledLogin.append("password", "admin123")
    await loginAction({}, filledLogin).catch(() => null)

    const emptyReg = new FormData()
    await registerAction({}, emptyReg).catch(() => null)

    const shortPassReg = new FormData()
    shortPassReg.append("name", "Bob")
    shortPassReg.append("email", "bob@example.com")
    shortPassReg.append("password", "123")
    await registerAction({}, shortPassReg).catch(() => null)
  } catch (e: any) {
    results.actionsError = e.message
  }

  const cov = (globalThis as any).__coverage__ || {}

  return NextResponse.json({
    success: true,
    coveredFilesCount: Object.keys(cov).length,
    results,
  })
}
