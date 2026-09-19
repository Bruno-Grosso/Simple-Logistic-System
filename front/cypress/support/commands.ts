// Custom Cypress commands for LogiSys Frontend UI Testing

declare global {
  // Cypress augments its global Chainable interface through a namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in as a specific user or default seed user.
       */
      login(email?: string, password?: string): Chainable<void>
      /**
       * Injects a session cookie directly for authenticated tests.
       */
      setSession(custom?: Record<string, any>): Chainable<void>
      /**
       * Logs in as default admin user via cookie injection.
       */
      loginAsAdmin(): Chainable<void>
    }
  }
}

function makeSessionToken(payloadOrEmail: string | Record<string, any>): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const payload =
    typeof payloadOrEmail === "string"
      ? { email: payloadOrEmail, exp }
      : { ...payloadOrEmail, exp }
  const json = JSON.stringify(payload)
  const b64 = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return "next." + b64
}

Cypress.Commands.add("setSession", (custom: Record<string, any> = {}) => {
  cy.clearCookies()
  const token = makeSessionToken({
    sub: "USR-001",
    email: "alice@logisys.com",
    name: "Alice Admin",
    role: "admin",
    ...custom,
  })
  cy.setCookie("logisys_session", token)
})

Cypress.Commands.add("loginAsAdmin", () => {
  cy.setSession()
})

Cypress.Commands.add("login", (email = "alice@logisys.com", password = "admin123") => {
  cy.clearCookies()
  cy.visit("/login")
  cy.get('input[name="email"]').clear().type(email)
  cy.get('input[name="password"]').clear().type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should("not.include", "/login")
})

export {}

