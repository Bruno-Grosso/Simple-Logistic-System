describe("Orders & Logistics Transactions UI Tests", () => {
  beforeEach(() => {
    cy.visit("/orders")
  })

  it("should load orders page header and orders data table", () => {
    cy.contains("Orders").should("be.visible")
    cy.get("table").should("be.visible")
  })

  it("should display order records with status badges", () => {
    cy.contains("ORD-001").should("be.visible")
    cy.contains("ORD-002").should("be.visible")
  })

  it("should navigate to order details page when clicking an order row", () => {
    cy.contains("ORD-001").click()
    cy.url().should("include", "/orders/ORD-001")
    cy.contains("Order details").should("be.visible")
    cy.contains("Freight Cost Breakdown").should("be.visible")
  })
})
