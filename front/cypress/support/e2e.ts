import "./commands"

Cypress.on("uncaught:exception", (err) => {
  // Ignore React hydration errors and benign Next.js hydration warnings
  if (
    err.message.includes("Minified React error #418") ||
    err.message.includes("Minified React error #423") ||
    err.message.includes("Minified React error #425") ||
    err.message.includes("Hydration failed") ||
    err.message.includes("Text content does not match server-rendered HTML")
  ) {
    return false
  }
  return true
})

