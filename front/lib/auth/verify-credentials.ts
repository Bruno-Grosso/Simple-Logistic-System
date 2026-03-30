import "server-only"

import { api, AxiosError } from "@/lib/api"
import { createSessionToken } from "@/lib/auth/session"

type DevUser = { email: string; password: string }

export type AuthenticateResult =
  | { ok: false; reason?: "backend_no_token" }
  | { ok: true; sessionCookieValue: string; source: "backend" | "next" }

function parseDevUsers(): Record<string, string> {
  const raw = process.env.LOGISYS_DEV_USERS_JSON
  if (!raw?.trim()) return {}
  try {
    const arr = JSON.parse(raw) as DevUser[]
    if (!Array.isArray(arr)) return {}
    return Object.fromEntries(
      arr
        .filter((u) => u?.email && u?.password)
        .map((u) => [String(u.email).trim().toLowerCase(), String(u.password)]),
    )
  } catch {
    return {}
  }
}

function extractBackendSessionToken(data: Record<string, unknown>): string | null {
  const customKey = process.env.LOGISYS_BACKEND_TOKEN_FIELD?.trim()
  if (customKey) {
    const v = data[customKey]
    if (typeof v === "string" && v.length > 0) return v
  }
  for (const k of ["sessionToken", "token", "access_token", "session_id", "sessionId"]) {
    const v = data[k]
    if (typeof v === "string" && v.length > 0) return v
  }
  return null
}

/**
 * Verifies credentials and returns the value to store in the `logisys_session` cookie.
 *
 * - **Backend (`LOGISYS_BACKEND_URL`)**: POSTs to `/login`, expects JSON with `{ ok: true }` or
 *   `{ success: true }` and a session string in `sessionToken`, `token`, `access_token`, or
 *   `LOGISYS_BACKEND_TOKEN_FIELD`. If login succeeds but no token field is present,
 *   authentication fails (configure your API or the env key).
 * - **Env / dev**: mints a Next-signed cookie (`source: "next"`).
 */
export async function authenticateLogin(
  email: string,
  password: string,
): Promise<AuthenticateResult> {
  const backendUrl = process.env.LOGISYS_BACKEND_URL?.trim()

  if (backendUrl) {
    try {
      const { data } = await api.auth.login(email, password)
      const success = data.ok === true || data.success === true
      if (!success) return { ok: false }
      const sessionToken = extractBackendSessionToken(data as Record<string, unknown>)
      if (!sessionToken) return { ok: false, reason: "backend_no_token" }
      return { ok: true, sessionCookieValue: sessionToken, source: "backend" }
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        return { ok: false }
      }
      return { ok: false }
    }
  }

  const expectedEmail = process.env.LOGISYS_AUTH_EMAIL?.trim().toLowerCase()
  const expectedPassword = process.env.LOGISYS_AUTH_PASSWORD
  if (expectedEmail && expectedPassword != null && expectedPassword !== "") {
    if (email !== expectedEmail || password !== expectedPassword) return { ok: false }
    return { ok: true, sessionCookieValue: createSessionToken(email), source: "next" }
  }

  if (process.env.NODE_ENV !== "production" && process.env.LOGISYS_ALLOW_DEV_LOGIN === "true") {
    const map = parseDevUsers()
    const p = map[email]
    if (p == null || p !== password) return { ok: false }
    return { ok: true, sessionCookieValue: createSessionToken(email), source: "next" }
  }

  return { ok: false }
}
