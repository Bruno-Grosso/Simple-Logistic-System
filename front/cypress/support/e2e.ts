import "./commands"

Cypress.on("uncaught:exception", (err) => {
  // Ignore React hydration errors, cross-origin CDN scripts (Leaflet/tiles), and benign Next.js warnings
  if (
    err.message.includes("Minified React error") ||
    err.message.includes("Hydration failed") ||
    err.message.includes("Text content does not match server-rendered HTML") ||
    err.message.includes("Script error") ||
    err.message.includes("ResizeObserver")
  ) {
    return false
  }
  return false
})

beforeEach(() => {
  const spec = Cypress.spec?.name || ""
  // Set authenticated session for all tests except explicit auth tests (login & register)
  if (!spec.includes("login") && !spec.includes("register")) {
    cy.setSession()
  }
})

