describe("User Profile & Backend Identity Integration UI Tests", () => {
  beforeEach(() => {
    cy.visit("/profile")
  })

  it("should display profile header, user avatar, system ID, and role badge", () => {
    cy.contains("User Profile").should("be.visible")
    cy.contains("System ID").should("be.visible")
    cy.contains("USR-001").should("be.visible")
    cy.contains("Alice Admin").should("be.visible")
  })

  it("should render account details card and active online sessions card", () => {
    cy.contains("Account Details & Backend Attributes").should("be.visible")
    cy.contains("Active Backend Sessions").should("be.visible")
  })

  it("should allow switching mock profile view using the select dropdown", () => {
    cy.get("select").select("USR-002 - Bob Worker (warehouse_worker)", { force: true })
    cy.contains("Bob Worker").should("be.visible")
    cy.contains("USR-002").should("be.visible")
  })
})
