import "server-only"

import { cookies } from "next/headers"

import { SESSION_COOKIE_NAME } from "./session"

export type Session = {
  /** User ID (backend JWT "sub" claim). */
  sub?: string
  /** Email (dev token only). */
  email?: string
  role?: string
  sid?: string
  exp: number
}

/**
 * Reads and decodes the session cookie.
 * - Backend JWT (header.payload.signature): decodes the payload segment.
 * - Dev/Next-signed token (next.<base64>): decodes the JSON payload.
 * Returns null if absent, malformed, or expired.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const parts = token.split(".")

    // Backend HS256 JWT: three dot-separated segments
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      ) as Session
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
      return payload
    }

    // Dev token minted by createSessionToken: "next.<base64json>"
    if (token.startsWith("next.")) {
      const payload = JSON.parse(
        Buffer.from(token.slice(5), "base64url").toString("utf8"),
      ) as Session
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
      return payload
    }
  } catch {
    return null
  }

  return null
}
