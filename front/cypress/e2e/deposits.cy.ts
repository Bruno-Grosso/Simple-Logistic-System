describe("Deposits & Warehouses E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/deposits")
  })

  it("should display deposits page title, metrics, and list of warehouses", () => {
    cy.contains("Deposits").should("be.visible")
    cy.get("body").should("contain.text", "Warehouse")
  })

  it("should render capacity progress and location badges for warehouses", () => {
    cy.get("body").should("contain.text", "m³")
  })
})
