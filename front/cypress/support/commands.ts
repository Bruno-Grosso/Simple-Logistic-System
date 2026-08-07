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
    }
  }
}

Cypress.Commands.add("login", (email = "alice@logisys.com", password = "admin123") => {
  cy.visit("/login")
  cy.get('input[name="email"]').clear().type(email)
  cy.get('input[name="password"]').clear().type(password)
  cy.get('button[type="submit"]').click()
})

export {}
