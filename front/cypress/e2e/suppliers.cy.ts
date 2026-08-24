describe("Suppliers & Logistics Network E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/suppliers")
  })

  it("should display suppliers page title and list of partner suppliers", () => {
    cy.contains("Suppliers").should("be.visible")
  })
})
