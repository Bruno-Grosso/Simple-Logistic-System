describe("Stock Inventory E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/stock")
  })

  it("should display stock summary metrics and inventory table", () => {
    cy.contains("Stock").should("be.visible")
    cy.contains("Total entries").should("be.visible")
    cy.contains("In deposits").should("be.visible")
    cy.contains("In transit").should("be.visible")
    cy.get("table").should("be.visible")
  })

  it("should expose inventory table columns", () => {
    cy.get("thead").within(() => {
      cy.contains("Product").should("be.visible")
      cy.contains("Quantity").should("be.visible")
      cy.contains("Location").should("be.visible")
      cy.contains("Type").should("be.visible")
      cy.contains("Arrived").should("be.visible")
    })
    cy.get("tbody tr").should("have.length.at.least", 1)
  })

  it("should open manage stock dialog and show warehouse and product controls", () => {
    cy.get("[data-testid='manage-stock-trigger']").first().click()
    cy.contains("Edit Warehouse Stock").should("be.visible")
    cy.get("#stock-warehouse-select").should("be.visible")
    cy.get("#stock-product-select").should("be.visible")
    cy.get("#stock-quantity-input").should("be.visible")
    cy.get("[data-testid='manage-stock-submit']").should("be.visible")
    cy.contains("button", "Cancel").click()
  })
})
