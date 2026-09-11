describe("Catalog Products & Inventory E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/products")
  })

  it("should display products catalog page and list of inventory items", () => {
    cy.contains("Products").should("be.visible")
    cy.get("table, [class*='grid']").should("exist")
  })

  it("should open add product dialog and show required product fields", () => {
    cy.get("[data-testid='add-product-button']").should("be.visible").click()
    cy.contains("Add New Product").should("be.visible")
    cy.get("#new-product-name").should("be.visible")
    cy.get("#new-product-price").should("be.visible")
    cy.get("#new-size-length").should("be.visible")
    cy.get("#new-size-width").should("be.visible")
    cy.get("#new-size-height").should("be.visible")
    cy.get("#new-product-weight").should("be.visible")
    cy.get("[data-testid='add-product-submit']").should("be.visible")
    cy.contains("button", "Cancel").click()
  })
})
