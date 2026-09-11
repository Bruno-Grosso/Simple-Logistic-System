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

  it("should allow opening and interacting with the profile edit dialog", () => {
    cy.get('[data-slot="dialog-trigger"]').click()
    cy.contains("Edit User Profile").should("be.visible")
    cy.get('input[id="name"]').should("have.value", "Alice Admin")
    cy.contains("button", "Cancel").click()
  })
})
