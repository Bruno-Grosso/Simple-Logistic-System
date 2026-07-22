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
} from "./adapters"
import {
  DEPOSITS,
  TRUCKS,
  PRODUCTS,
  USERS,
  SUPPLIERS,
  ORDERS,
  STOCK,
} from "./mock-data"
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
} from "@/types"

const baseURL = (process.env.LOGISYS_BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8848").replace(/\/$/, "")

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
  },

  warehouses: {
    async getAll(): Promise<Deposit[]> {
      try {
        const res = await apiClient.get<any[]>("/warehouses")
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptWarehouse)
        }
      } catch (err) {
        console.warn("[API] GET /warehouses fallback to mock data:", err)
      }
      return DEPOSITS
    },

    async getById(id: string): Promise<Deposit | undefined> {
      try {
        const res = await apiClient.get<any>(`/warehouses/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptWarehouse(raw)
      } catch (err) {
        console.warn(`[API] GET /warehouses/${id} fallback:`, err)
      }
      return DEPOSITS.find((d) => d.id === id)
    },

    async getStock(id: string): Promise<Stock[]> {
      try {
        const res = await apiClient.get<any[]>(`/warehouses/${id}/stock`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptStock)
        }
      } catch (err) {
        console.warn(`[API] GET /warehouses/${id}/stock fallback:`, err)
      }
      return STOCK.filter((s) => s.deposit_id === id)
    },
  },

  trucks: {
    async getAll(model?: string): Promise<Truck[]> {
      try {
        const url = model ? `/trucks?model=${encodeURIComponent(model)}` : "/trucks"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptTruck)
        }
      } catch (err) {
        console.warn("[API] GET /trucks fallback to mock data:", err)
      }
      return TRUCKS
    },

    async getById(id: string): Promise<Truck | undefined> {
      try {
        const res = await apiClient.get<any>(`/trucks/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptTruck(raw)
      } catch (err) {
        console.warn(`[API] GET /trucks/${id} fallback:`, err)
      }
      return TRUCKS.find((t) => t.id === id)
    },
  },

  products: {
    async getAll(name?: string): Promise<Product[]> {
      try {
        const url = name ? `/products?name=${encodeURIComponent(name)}` : "/products"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptProduct)
        }
      } catch (err) {
        console.warn("[API] GET /products fallback to mock data:", err)
      }
      return PRODUCTS
    },

    async getById(id: string): Promise<Product | undefined> {
      try {
        const res = await apiClient.get<any>(`/products/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptProduct(raw)
      } catch (err) {
        console.warn(`[API] GET /products/${id} fallback:`, err)
      }
      return PRODUCTS.find((p) => p.id === id)
    },
  },

  users: {
    async getAll(role?: string): Promise<User[]> {
      try {
        const url = role ? `/users?role=${encodeURIComponent(role)}` : "/users"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptUser)
        }
      } catch (err) {
        console.warn("[API] GET /users fallback to mock data:", err)
      }
      return USERS
    },

    async getById(id: string): Promise<User | undefined> {
      try {
        const res = await apiClient.get<any>(`/users/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptUser(raw)
      } catch (err) {
        console.warn(`[API] GET /users/${id} fallback:`, err)
      }
      return USERS.find((u) => u.id === id)
    },
  },

  suppliers: {
    async getAll(): Promise<Supplier[]> {
      try {
        const res = await apiClient.get<any[]>("/suppliers")
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptSupplier)
        }
      } catch (err) {
        console.warn("[API] GET /suppliers fallback to mock data:", err)
      }
      return SUPPLIERS
    },

    async getById(id: string): Promise<Supplier | undefined> {
      try {
        const res = await apiClient.get<any>(`/suppliers/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptSupplier(raw)
      } catch (err) {
        console.warn(`[API] GET /suppliers/${id} fallback:`, err)
      }
      return SUPPLIERS.find((s) => s.id === id)
    },
  },

  orders: {
    async getAll(clientId?: string): Promise<Order[]> {
      try {
        const url = clientId ? `/orders?clientId=${encodeURIComponent(clientId)}` : "/orders"
        const res = await apiClient.get<any[]>(url)
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map(adaptOrder)
        }
      } catch (err) {
        console.warn("[API] GET /orders fallback to mock data:", err)
      }
      return ORDERS
    },

    async getById(id: string): Promise<Order | undefined> {
      try {
        const res = await apiClient.get<any>(`/orders/${id}`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptOrder(raw)
      } catch (err) {
        console.warn(`[API] GET /orders/${id} fallback:`, err)
      }
      return ORDERS.find((o) => o.id === id)
    },

    async getItems(id: string): Promise<OrderItem[]> {
      try {
        const res = await apiClient.get<any[]>(`/orders/${id}/items`)
        if (Array.isArray(res.data)) {
          return res.data.map(adaptOrderItem)
        }
      } catch (err) {
        console.warn(`[API] GET /orders/${id}/items fallback:`, err)
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
        console.warn(`[API] GET /orders/${id}/route fallback:`, err)
      }
      return []
    },

    async getCost(id: string): Promise<FreightCost | undefined> {
      try {
        const res = await apiClient.get<any>(`/orders/${id}/cost`)
        const raw = Array.isArray(res.data) ? res.data[0] : res.data
        if (raw) return adaptFreightCost(raw)
      } catch (err) {
        console.warn(`[API] GET /orders/${id}/cost fallback:`, err)
      }
      return undefined
    },
  },

  routes: {
    async calculateRoute(orderId: string, warehouseId: string): Promise<{ success: boolean; summary?: any; encodedShape?: string } | null> {
      try {
        const res = await apiClient.post<{ success: boolean; summary?: any; encodedShape?: string }>("/route", {
          orderId,
          warehouseId,
        })
        return res.data
      } catch (err) {
        console.warn("[API] POST /route error:", err)
        return null
      }
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
        console.warn("[API] GET /freight-cost fallback:", err)
      }
      return []
    },
  },
}

export { AxiosError }
