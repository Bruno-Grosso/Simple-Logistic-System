import axios, { AxiosError, type AxiosResponse } from "axios"
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
  adaptOrderETA,
  adaptDeliveryCostReport,
} from "./adapters"
import type {
  Deposit,
  Truck,
  Product,
  User,
  Order,
  OrderItem,
  OrderRoute,
  Supplier,
  Stock,
  FreightCost,
  MonthlyPerformanceData,
  OrderETA,
  DeliveryCostReport,
} from "@/types"

const baseURL = (process.env.LOGISYS_BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8081").replace(/\/$/, "")

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 5_000,
})

export type LoginResponseData = {
  ok?: boolean
  success?: boolean
  token?: string
  access_token?: string
  sessionToken?: string
  session_id?: string
  sessionId?: string
  [key: string]: unknown
}

export type RegisterResponseData = {
  ok?: boolean
  error?: string
  [key: string]: unknown
}

export type RegisterPayload = {
  id: string
  name: string
  email: string
  password: string
  address: string
  role: string
}

export const api = {
  auth: {
    login(email: string, password: string): Promise<AxiosResponse<LoginResponseData>> {
      return apiClient.post<LoginResponseData>("/login", { email, password })
    },
    register(payload: RegisterPayload): Promise<AxiosResponse<RegisterResponseData>> {
      return apiClient.post<RegisterResponseData>("/clients", payload)
    },
    async getEcPublicKey(): Promise<{ success: boolean; algorithm?: string; publicKey?: string } | null> {
      try {
        const res = await apiClient.get<any>("/auth/ec-public-key")
        return res.data
      } catch (err) {
        console.error("[API] GET /auth/ec-public-key error:", err)
      }
      return null
    },
    async verifyEcToken(token: string): Promise<{ success: boolean; valid?: boolean; payload?: any; error?: string }> {
      try {
        const res = await apiClient.post<any>("/auth/ec-verify", { token })
        return res.data
      } catch (err: any) {
        return { success: false, valid: false, error: err.response?.data?.error || err.message }
      }
    },
  },

  warehouses: {
    async getAll(): Promise<Deposit[]> {
      try {
        const res = await apiClient.get<any[]>("/warehouses")
        if (Array.isArray(res.data)) {
          return res.data.map(adaptWarehouse)
        }
      } catch (err) {
        console.error("[API] GET /warehouses error:", err)
      }
      return []
    },

    async getById(id: string): Promise<Deposit | undefined> {
      try {
        const res = await apiClient.get<any>(`/warehouses/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptWarehouse(raw)
      } catch (err) {
        console.error(`[API] GET /warehouses/${id} error:`, err)
      }
      return undefined
    },

    async getStock(id: string): Promise<Stock[]> {
      try {
        const res = await apiClient.get<any[]>(`/warehouses/${id}/stock`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptStock)
        }
      } catch (err) {
        console.error(`[API] GET /warehouses/${id}/stock error:`, err)
      }
      return []
    },

    async getParking(id: string): Promise<{
      warehouse_id: string
      truck_capacity: number
      parked_count: number
      inbound_count: number
      occupied_spots: number
      available_spots: number
      is_full: boolean
      parked_trucks: any[]
      inbound_trucks: any[]
    } | null> {
      try {
        const res = await apiClient.get<any>(`/warehouses/${id}/parking`)
        if (res.data) return res.data
      } catch (err) {
        console.error(`[API] GET /warehouses/${id}/parking error:`, err)
      }
      return null
    },

    async checkParking(id: string, truckId?: string): Promise<{ allowed: boolean; reason?: string; status?: any }> {
      try {
        const res = await apiClient.post<any>(`/warehouses/${id}/check-parking`, { truck_id: truckId })
        return res.data
      } catch (err: any) {
        return { allowed: false, reason: err.response?.data?.reason || "Warehouse parking full or unavailable" }
      }
    },

    async getAverageGasPrice(ids?: string[]): Promise<number> {
      try {
        const query = ids && ids.length > 0 ? `?ids=${encodeURIComponent(ids.join(","))}` : ""
        const res = await apiClient.get<{ avg_gas_price: number }>(`/warehouses/average-gas-price${query}`)
        if (res.data && res.data.avg_gas_price !== undefined) {
          return res.data.avg_gas_price
        }
      } catch (err) {
        console.error("[API] GET /warehouses/average-gas-price error:", err)
      }
      return 5.89
    },

    async update(id: string, payload: {
      location: any
      size: any
      volume_max: number
      has_refrigeration: number
      fuel_price: number
      truck_capacity?: number
    }): Promise<{ success: boolean; warehouse?: any; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; warehouse?: any; error?: string }>(`/warehouses/${id}`, payload)
        return res.data
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.error || err.response?.data?.message || err.message,
        }
      }
    },

    async updateStock(id: string, payload: { product_id: string; quantity: number }): Promise<{ success: boolean; stock?: any; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; stock?: any }>(`/warehouses/${id}/stock`, payload)
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data || err.message }
      }
    },

    async deleteStock(id: string, productId: string): Promise<{ success: boolean; error?: string }> {
      try {
        const res = await apiClient.delete<{ success: boolean }>(`/warehouses/${id}/stock/${productId}`)
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data || err.message }
      }
    },
  },

  trucks: {
    async getAll(model?: string): Promise<Truck[]> {
      try {
        const url = model ? `/trucks?model=${encodeURIComponent(model)}` : "/trucks"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptTruck)
        }
      } catch (err) {
        console.error("[API] GET /trucks error:", err)
      }
      return []
    },

    async getById(id: string): Promise<Truck | undefined> {
      try {
        const res = await apiClient.get<any>(`/trucks/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptTruck(raw)
      } catch (err) {
        console.error(`[API] GET /trucks/${id} error:`, err)
      }
      return undefined
    },

    async update(id: string, payload: {
      model: string
      speed: number
      is_valid: number
      size: any
      volume_max: number
      weight_max: number
      has_refrigeration: number
      fuel_capacity: number
      fuel_current: number
      fuel_consumption: number
      current_warehouse_id: string | null
    }): Promise<{ success: boolean; truck?: any; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; truck?: any; error?: string }>(`/trucks/${id}`, payload)
        return res.data
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.error || err.response?.data?.message || err.message,
        }
      }
    },

    async getCargo(truckId?: string): Promise<Stock[]> {
      try {
        const url = truckId ? `/trucks/${truckId}/cargo` : "/trucks/cargo"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptStock)
        }
      } catch (err) {
        console.error("[API] GET /trucks/cargo error:", err)
      }
      return []
    },
  },

  products: {
    async getAll(name?: string): Promise<Product[]> {
      try {
        const url = name ? `/products?name=${encodeURIComponent(name)}` : "/products"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptProduct)
        }
      } catch (err) {
        console.error("[API] GET /products error:", err)
      }
      return []
    },

    async getById(id: string): Promise<Product | undefined> {
      try {
        const res = await apiClient.get<any>(`/products/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptProduct(raw)
      } catch (err) {
        console.error(`[API] GET /products/${id} error:`, err)
      }
      return undefined
    },

    async update(id: string, payload: {
      name: string
      price: number
      is_cold: number
      is_fragile: number
      expire_date: string | null
      size: any
      volume: number
      weight: number
    }): Promise<{ success: boolean; product?: any; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; product?: any; error?: string }>(`/products/${id}`, payload)
        return res.data
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.error || err.response?.data?.message || err.message,
        }
      }
    },

    async create(payload: {
      id?: string
      name: string
      price: number
      is_cold?: number | boolean
      is_fragile?: number | boolean
      expire_date?: string | null
      size?: any
      volume: number
      weight: number
    }): Promise<{ success: boolean; product?: Product; error?: string }> {
      try {
        const res = await apiClient.post<{ success: boolean; product?: any }>("/products", {
          ...payload,
          is_cold: payload.is_cold ? 1 : 0,
          is_fragile: payload.is_fragile ? 1 : 0,
        })
        return {
          success: true,
          product: res.data.product ? adaptProduct(res.data.product) : undefined,
        }
      } catch (err: any) {
        return { success: false, error: err.response?.data || err.message }
      }
    },
  },

  users: {
    async getAll(role?: string): Promise<User[]> {
      try {
        const url = role ? `/users?role=${encodeURIComponent(role)}` : "/users"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptUser)
        }
      } catch (err) {
        console.error("[API] GET /users error:", err)
      }
      return []
    },

    async getById(id: string): Promise<User | undefined> {
      try {
        const res = await apiClient.get<any>(`/users/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptUser(raw)
      } catch (err) {
        console.error(`[API] GET /users/${id} error:`, err)
      }
      return undefined
    },

    async getDrivers(): Promise<User[]> {
      try {
        const res = await apiClient.get<any[]>("/users/drivers")
        if (Array.isArray(res.data)) {
          return res.data.map(adaptUser)
        }
      } catch (err) {
        console.error("[API] GET /users/drivers error:", err)
      }
      return []
    },

    async update(id: string, payload: {
      name?: string
      address?: string
      password?: string
      role?: string
      wage?: number
      warehouse_id?: string | null
      is_active?: number
    }): Promise<{ success: boolean; user?: User; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; user?: any }>(`/users/${id}`, payload)
        if (res.data && res.data.success && res.data.user) {
          return { success: true, user: adaptUser(res.data.user) }
        }
      } catch (err: any) {
        console.error(`[API] PUT /users/${id} error:`, err)
        return { success: false, error: err.response?.data?.error || err.response?.data || err.message }
      }
      return { success: false, error: "The employee update was not accepted" }
    },

    async createEmployee(payload: { name: string; email?: string; password: string; address?: string; role: string; wage?: number; warehouse_id?: string | null; is_active?: number }): Promise<{ success: boolean; employee?: User; error?: string }> {
      try {
        const res = await apiClient.post<{ success: boolean; employee?: any }>("/employees", payload)
        return { ...res.data, employee: res.data.employee ? adaptUser(res.data.employee) : undefined }
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || err.message }
      }
    },

    async remove(id: string): Promise<{ success: boolean; error?: string }> {
      try {
        const res = await apiClient.delete<{ success: boolean }>(`/users/${id}`)
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || err.message }
      }
    },

    async getOnlineSessions(userId?: string): Promise<any[]> {
      try {
        const url = userId ? `/online-users?userId=${encodeURIComponent(userId)}` : "/online-users"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) return res.data
      } catch (err) {
        console.error("[API] GET /online-users error:", err)
      }
      return []
    },
  },

  suppliers: {
    async getAll(): Promise<Supplier[]> {
      try {
        const res = await apiClient.get<any[]>("/suppliers")
        if (Array.isArray(res.data)) {
          return res.data.map(adaptSupplier)
        }
      } catch (err) {
        console.error("[API] GET /suppliers error:", err)
      }
      return []
    },

    async getById(id: string): Promise<Supplier | undefined> {
      try {
        const res = await apiClient.get<any>(`/suppliers/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptSupplier(raw)
      } catch (err) {
        console.error(`[API] GET /suppliers/${id} error:`, err)
      }
      return undefined
    },
  },

  orders: {
    async getAll(filters?: { clientId?: string; driverId?: string; warehouseId?: string }): Promise<Order[]> {
      try {
        const params = new URLSearchParams()
        if (filters?.clientId) params.set("clientId", filters.clientId)
        if (filters?.driverId) params.set("driverId", filters.driverId)
        if (filters?.warehouseId) params.set("warehouseId", filters.warehouseId)
        const url = params.size ? `/orders?${params}` : "/orders"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptOrder)
        }
      } catch (err) {
        console.error("[API] GET /orders error:", err)
      }
      return []
    },

    async getById(id: string): Promise<Order | undefined> {
      try {
        const res = await apiClient.get<any>(`/orders/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptOrder(raw)
      } catch (err) {
        console.error(`[API] GET /orders/${id} error:`, err)
      }
      return undefined
    },

    async getItems(id: string): Promise<OrderItem[]> {
      try {
        const res = await apiClient.get<any[]>(`/orders/${id}/items`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptOrderItem)
        }
      } catch (err) {
        console.error(`[API] GET /orders/${id}/items error:`, err)
      }
      return []
    },

    async getRoute(id: string): Promise<OrderRoute[]> {
      try {
        const res = await apiClient.get<any[]>(`/orders/${id}/route`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptOrderRoute)
        }
      } catch (err) {
        console.error(`[API] GET /orders/${id}/route error:`, err)
      }
      return []
    },

    async getAllRoutes(): Promise<OrderRoute[]> {
      try {
        const res = await apiClient.get<any[]>("/orders-route")
        if (Array.isArray(res.data)) {
          return res.data.map(adaptOrderRoute)
        }
      } catch (err) {
        console.error("[API] GET /orders-route error:", err)
      }
      return []
    },

    async getCost(id: string): Promise<FreightCost | undefined> {
      try {
        const res = await apiClient.get<any>(`/orders/${id}/cost`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptFreightCost(raw)
      } catch (err) {
        console.error(`[API] GET /orders/${id}/cost error:`, err)
      }
      return undefined
    },

    async getETA(id: string): Promise<OrderETA | undefined> {
      try {
        const res = await apiClient.get<any>(`/orders/${id}/eta`)
        if (res.data && res.data.success) {
          return adaptOrderETA(res.data)
        }
      } catch (err) {
        console.error(`[API] GET /orders/${id}/eta error:`, err)
      }
      return undefined
    },

    async create(payload: {
      id: string
      client_id: string
      final_destination: string
      time_limit: string
      price: number
      status?: string
      items: Array<{ product_id: string; quantity: number }>
    }): Promise<{ success: boolean; order?: any; error?: string }> {
      try {
        const res = await apiClient.post<{ success: boolean; order?: any; error?: string }>("/orders", payload)
        return res.data
      } catch (err: any) {
        return {
          success: false,
          error: err.response?.data?.error || err.response?.data?.message || err.message,
        }
      }
    },

    async updateStatus(id: string, status: Order["status"]): Promise<{ success: boolean; order?: any; error?: string }> {
      try {
        const res = await apiClient.put<{ success: boolean; order?: any }>(`/orders/${id}`, { status })
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || err.message }
      }
    },

    async calculateETA(orderId: string, options?: {
      minSpeed?: number
      maxSpeed?: number
      avgSpeed?: number
      departureTime?: string
      originWarehouseId?: string
      truckId?: string
    }): Promise<OrderETA | null> {
      try {
        const res = await apiClient.post<any>(`/orders/${orderId}/calculate-eta`, options || {})
        if (res.data && res.data.success) {
          return adaptOrderETA(res.data)
        }
      } catch (err) {
        console.error(`[API] POST /orders/${orderId}/calculate-eta error:`, err)
      }
      return null
    },

    async calculateCost(orderId: string, options?: {
      driverWage?: number
      fuelPrice?: number
      distanceKm?: number
      truckId?: string
      driverId?: string
    }): Promise<FreightCost | null> {
      try {
        const res = await apiClient.post<any>(`/orders/${orderId}/calculate-cost`, options || {})
        if (res.data && res.data.success) {
          return adaptFreightCost(res.data)
        }
      } catch (err) {
        console.error(`[API] POST /orders/${orderId}/calculate-cost error:`, err)
      }
      return null
    },

    async calculateDistance(orderId: string, warehouseId?: string): Promise<{ distance_km: number } | null> {
      try {
        const res = await apiClient.post<any>(`/orders/${orderId}/calculate-distance`, { warehouse_id: warehouseId })
        if (res.data && res.data.success) {
          return { distance_km: res.data.distance_km }
        }
      } catch (err) {
        console.error(`[API] POST /orders/${orderId}/calculate-distance error:`, err)
      }
      return null
    },

    async suggestTruck(orderId: string, warehouseId?: string): Promise<{
      success: boolean
      best_truck?: {
        truck_id: string
        model: string
        current_warehouse_id?: string
        has_refrigeration: boolean
        remaining_weight: number
        remaining_volume: number
        score: number
      }
      suggested_driver?: { id: string; name: string }
      candidate_trucks?: any[]
      requirements?: { requires_cold: boolean; has_fragile: boolean }
      error?: string
    }> {
      try {
        const res = await apiClient.post<any>(`/orders/${encodeURIComponent(orderId)}/suggest-truck`, { warehouse_id: warehouseId })
        if (res.data?.success && res.data?.best_truck) return res.data
      } catch {
        // Try GET if POST is not handled or failed
        try {
          const query = warehouseId ? `?warehouse_id=${encodeURIComponent(warehouseId)}` : ""
          const getRes = await apiClient.get<any>(`/orders/${encodeURIComponent(orderId)}/suggest-truck${query}`)
          if (getRes.data?.success && getRes.data?.best_truck) return getRes.data
        } catch {
          // Fall through to offline/mock client-side calculation
        }
      }

      // Offline / graceful fallback to prevent 404s
      try {
        const [trucks, users] = await Promise.all([
          api.trucks.getAll().catch(() => []),
          api.users.getAll().catch(() => []),
        ])
        const candidateTrucks = (trucks || []).filter((t: any) => t.is_valid !== false)
        const candidates = candidateTrucks.map((t: any) => {
          let score = 100
          const tWh = t.current_deposit_id || t.current_warehouse_id
          if (warehouseId && tWh === warehouseId) score += 50
          if (!t.is_delivering) score += 35
          score -= Number(t.truck_maintenance || 0) * 15
          return {
            truck_id: t.id,
            model: t.model || t.id,
            current_warehouse_id: tWh,
            has_refrigeration: Boolean(t.has_refrigeration),
            remaining_weight: Math.max(0, Number(t.weight_max || 25000) - Number(t.weight_actual || 0)),
            remaining_volume: Math.max(0, Number(t.volume_max || 90) - Number(t.volume_actual || 0)),
            score: Math.max(0, score),
          }
        }).sort((a: any, b: any) => b.score - a.score)

        const bestTruck = candidates[0]
        const suggestedDriver = (users || []).find((u: any) => u.rawRole === "truck_driver" || u.role === "truck_driver")

        if (bestTruck) {
          return {
            success: true,
            best_truck: bestTruck,
            suggested_driver: suggestedDriver ? { id: suggestedDriver.id, name: suggestedDriver.name } : undefined,
            candidate_trucks: candidates.slice(0, 5),
            requirements: { requires_cold: false, has_fragile: false },
          }
        }
      } catch (fallbackErr) {
        console.warn("[API] suggestTruck fallback error:", fallbackErr)
      }

      return { success: false, error: "No suitable trucks available." }
    },

    exportCsvUrl(): string {
      return `${baseURL}/orders/export/csv`
    },

    exportManifestCsvUrl(orderId: string): string {
      return `${baseURL}/orders/${encodeURIComponent(orderId)}/manifest.csv`
    },

    async addRouteStep(orderId: string, payload: {
      step: number
      warehouse_id?: string | null
      truck_id?: string | null
      driver_id?: string | null
      destination_warehouse_id?: string | null
      estimated_time?: string | null
      arrived_at?: string | null
    }): Promise<{ success: boolean; route?: any; error?: string; status?: number }> {
      try {
        const res = await apiClient.post<{ success: boolean; route?: any }>(`/orders/${orderId}/route`, payload)
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || err.message, status: err.response?.status }
      }
    },

    async updateRouteStep(orderId: string, step: number, payload: {
      warehouse_id?: string | null
      truck_id?: string | null
      driver_id?: string | null
      destination_warehouse_id?: string | null
      estimated_time?: string | null
      arrived_at?: string | null
    }): Promise<{ success: boolean; route?: any; error?: string; status?: number }> {
      try {
        const res = await apiClient.put<{ success: boolean; route?: any }>(`/orders/${orderId}/route/${step}`, payload)
        return res.data
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || err.message, status: err.response?.status }
      }
    },
  },

  routes: {
    async calculateRoute(orderId: string, warehouseId: string, truckId?: string): Promise<{ success: boolean; summary?: any; encodedShape?: string } | null> {
      try {
        const res = await apiClient.post<{ success: boolean; summary?: any; encodedShape?: string }>("/route", {
          orderId,
          warehouseId,
          ...(truckId ? { truckId } : {}),
        })
        return res.data
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          console.warn(`[API] POST /route returned 404 for order ${orderId} (fallback route estimate will be used)`)
        } else {
          console.warn(`[API] POST /route error:`, err?.message || err)
        }
        return null
      }
    },

    async calculateRouteBetweenWarehouses(
      originWarehouseId: string,
      destinationWarehouseId: string,
      truckId?: string
    ): Promise<{ success: boolean; summary?: any; encodedShape?: string } | null> {
      try {
        const res = await apiClient.post<{ success: boolean; summary?: any; encodedShape?: string }>("/route", {
          originWarehouseId,
          destinationWarehouseId,
          ...(truckId ? { truckId } : {}),
        })
        return res.data
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          console.warn(`[API] POST /route returned 404 for warehouses ${originWarehouseId} -> ${destinationWarehouseId}`)
        } else {
          console.warn(`[API] POST /route warehouse error:`, err?.message || err)
        }
        return null
      }
    },

    async calculateMultiStopRoute(options: {
      warehouseId?: string
      orderIds: string[]
      truckId?: string
      roundTrip?: boolean
    }): Promise<{
      success: boolean
      error?: string
      warehouse?: { id: string; label: string; coords: { lat: number; lon: number } }
      truck?: { id: string; model: string; weight_max: number; volume_max: number }
      total_orders?: number
      collective_weight_kg?: number
      collective_volume_m3?: number
      total_distance_km?: number
      total_time_seconds?: number
      stops?: Array<{
        stop_number: number
        order_id: string
        destination: string
        coords: { lat: number; lon: number }
        weight_kg: number
        volume_m3: number
        leg_distance_km: number
        leg_time_seconds: number
      }>
      legs?: any[]
      encodedShape?: string
      waypoints?: Array<{ index: number; label: string; lat: number; lon: number; type: string }>
    } | null> {
      try {
        const res = await apiClient.post<any>("/routes/multi-stop", options)
        return res.data
      } catch (err: any) {
        console.warn("[API] POST /routes/multi-stop error:", err?.response?.data?.error || err.message)
        return {
          success: false,
          error: err?.response?.data?.error || err.message || "Failed to calculate multi-stop route",
        }
      }
    },

    async calculateQuickPick(options?: {
      warehouseId?: string
      truckId?: string
      maxOrders?: number
      roundTrip?: boolean
      anchorOrderId?: string
    }): Promise<any | null> {
      try {
        const res = await apiClient.post<any>("/routes/quick-pick", options || {})
        return res.data
      } catch (err: any) {
        console.warn("[API] POST /routes/quick-pick error:", err?.response?.data?.error || err.message)
        return {
          success: false,
          error: err?.response?.data?.error || err.message || "Failed to calculate quick pick route",
        }
      }
    },

    async getTruckMultiStopRoute(truckId: string): Promise<any | null> {
      try {
        const res = await apiClient.get<any>(`/trucks/${encodeURIComponent(truckId)}/routes/multi-stop`)
        return res.data
      } catch (err: any) {
        console.warn(`[API] GET /trucks/${truckId}/routes/multi-stop error:`, err?.message || err)
        return null
      }
    },

    async getActiveMultiRoutes(): Promise<{
      success: boolean
      total_active_multi_routes: number
      multi_routes: Array<{
        truck_id: string
        truck_model: string
        warehouse_id: string
        total_orders: number
        order_ids: string[]
        steps: Array<{
          order_id: string
          step: number
          destination?: string
          status: string
          time_limit?: string
          warehouse_id?: string
          estimated_time?: string
          arrived_at?: string
        }>
        circuit?: any
      }>
    } | null> {
      try {
        const res = await apiClient.get<any>("/orders/multi-route/active")
        if (res.data && res.data.success) return res.data
      } catch (err: any) {
        console.warn("[API] GET /orders/multi-route/active error:", err?.message || err)
      }
      return null
    },

    async getOrderMultiRoute(orderId: string): Promise<{
      success: boolean
      order_id: string
      truck_id: string
      step: number
      total_stops: number
      multi_route: any
      siblings: Array<{
        order_id: string
        step: number
        status: string
        destination?: string
      }>
    } | null> {
      try {
        const res = await apiClient.get<any>(`/orders/${encodeURIComponent(orderId)}/multi-route`)
        if (res.data && res.data.success) return res.data
      } catch (err: any) {
        // Not part of a multi-route or error
        console.warn(`[API] GET /orders/${orderId}/multi-route:`, err?.message || err)
      }
      return null
    },
  },

  freightCost: {
    async getAll(orderId?: string): Promise<FreightCost[]> {
      try {
        const url = orderId ? `/freight-cost?orderId=${encodeURIComponent(orderId)}` : "/freight-cost"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptFreightCost)
        }
      } catch (err) {
        console.error("[API] GET /freight-cost error:", err)
      }
      return []
    },

    async calculate(orderId: string, options?: {
      driverWage?: number
      fuelPrice?: number
      distanceKm?: number
      truckId?: string
      driverId?: string
    }): Promise<FreightCost | null> {
      try {
        const res = await apiClient.post<any>(`/orders/${orderId}/calculate-cost`, options || {})
        if (res.data && res.data.success) {
          return adaptFreightCost(res.data)
        }
      } catch (err) {
        console.error(`[API] POST /orders/${orderId}/calculate-cost error:`, err)
      }
      return null
    },
  },

  reports: {
    async getMonthlyPerformance(warehouseId?: string, period?: string): Promise<MonthlyPerformanceData[]> {
      try {
        const params = new URLSearchParams()
        if (warehouseId) params.set("warehouseId", warehouseId)
        if (period) params.set("period", period)
        const qs = params.toString() ? `?${params.toString()}` : ""
        const res = await apiClient.get<any[]>(`/monthly-performance${qs}`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptMonthlyPerformance)
        }
      } catch (err) {
        console.error("[API] GET /monthly-performance error:", err)
      }
      return []
    },

    async getDeliveryCosts(warehouseId?: string, period?: string): Promise<DeliveryCostReport> {
      try {
        const params = new URLSearchParams()
        if (warehouseId) params.set("warehouseId", warehouseId)
        if (period) params.set("period", period)
        const qs = params.toString() ? `?${params.toString()}` : ""
        const res = await apiClient.get<any>(`/reports/delivery-costs${qs}`)
        if (res.data) {
          return adaptDeliveryCostReport(res.data)
        }
      } catch (err) {
        console.error("[API] GET /reports/delivery-costs error:", err)
      }
      return adaptDeliveryCostReport(null)
    },

    exportDeliveryCostsCsvUrl(warehouseId?: string, period?: string): string {
      const params = new URLSearchParams()
      if (warehouseId) params.set("warehouseId", warehouseId)
      if (period) params.set("period", period)
      const qs = params.toString() ? `?${params.toString()}` : ""
      return `${baseURL}/reports/delivery-costs/csv${qs}`
    },
  },

  geo: {
    async addressToCoordinates(address: string): Promise<{ endereco_completo: string; latitude: string; longitude: string } | null> {
      try {
        const res = await apiClient.get<any>(`/geocode?address=${encodeURIComponent(address)}`)
        if (res.data && res.data.success) {
          return {
            endereco_completo: res.data.endereco_completo,
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          }
        }
      } catch (err) {
        console.error("[API] GET /geocode error:", err)
      }
      return null
    },

    async coordinatesToAddress(lat: string | number, lon: string | number): Promise<{ endereco_completo: string; latitude: string; longitude: string } | null> {
      try {
        const res = await apiClient.get<any>(`/reverse-geocode?lat=${lat}&lon=${lon}`)
        if (res.data && res.data.success) {
          return {
            endereco_completo: res.data.endereco_completo,
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          }
        }
      } catch (err) {
        console.error("[API] GET /reverse-geocode error:", err)
      }
      return null
    },
  },
}

export { AxiosError }
