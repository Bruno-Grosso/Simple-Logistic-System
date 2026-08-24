describe("Settings E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/settings")
  })

  it("should render account and session settings sections", () => {
    cy.contains("Settings").should("be.visible")
    cy.contains("Account Profile").should("be.visible")
    cy.contains("Active Session").should("be.visible")
    cy.contains("Session Management").should("be.visible")
  })

  it("should provide a link back to profile management", () => {
    cy.contains("a", "Manage Profile").should("have.attr", "href", "/profile")
  })
})
