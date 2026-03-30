import "server-only"

import axios, { AxiosError, type AxiosResponse } from "axios"

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const baseURL = (process.env.LOGISYS_BACKEND_URL ?? "http://localhost:8848").replace(/\/$/, "")

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
})

// ---------------------------------------------------------------------------
// Response shape types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API namespaces
// ---------------------------------------------------------------------------

export const api = {
  auth: {
    login(
      email: string,
      password: string,
    ): Promise<AxiosResponse<LoginResponseData>> {
      return apiClient.post<LoginResponseData>("/login", { email, password })
    },

    register(payload: RegisterPayload): Promise<AxiosResponse<RegisterResponseData>> {
      return apiClient.post<RegisterResponseData>("/clients", payload)
    },
  },
}

// Re-export so callers can do instanceof checks without importing axios directly
export { AxiosError }
