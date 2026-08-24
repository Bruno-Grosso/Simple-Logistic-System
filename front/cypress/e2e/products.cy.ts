describe("Catalog Products & Inventory E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/products")
  })

  it("should display products catalog page and list of inventory items", () => {
    cy.contains("Products").should("be.visible")
    cy.get("table, [class*='grid']").should("exist")
  })
})
