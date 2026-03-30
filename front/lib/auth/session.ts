import "server-only"

export const SESSION_COOKIE_NAME = "logisys_session"

/** Cookie maxAge in seconds (7 days). */
export function sessionCookieMaxAge(): number {
  return 60 * 60 * 24 * 7
}

/**
 * Mints a simple dev/env-fallback session token (not used when LOGISYS_BACKEND_URL is set,
 * since the backend JWT is stored directly).
 */
export function createSessionToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + sessionCookieMaxAge()
  return "next." + Buffer.from(JSON.stringify({ email, exp })).toString("base64url")
}
