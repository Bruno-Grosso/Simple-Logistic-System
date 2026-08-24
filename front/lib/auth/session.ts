import "server-only"

export const SESSION_COOKIE_NAME = "logisys_session"

/** Cookie maxAge in seconds (7 days). */
export function sessionCookieMaxAge(): number {
  return 60 * 60 * 24 * 7
}

/**
 * Mints a session token payload for client/server session tracking.
 */
export function createSessionToken(payloadOrEmail: string | Record<string, any>): string {
  const exp = Math.floor(Date.now() / 1000) + sessionCookieMaxAge()
  const payload =
    typeof payloadOrEmail === "string"
      ? { email: payloadOrEmail, exp }
      : { ...payloadOrEmail, exp }
  return "next." + Buffer.from(JSON.stringify(payload)).toString("base64url")
}
