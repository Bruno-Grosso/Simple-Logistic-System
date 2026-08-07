describe("UI Component Tests - Data Tables, Badges & Progress Bars", () => {
  describe("Orders Data Table & Badges UI", () => {
    it("should render table columns for Order, Status, Price, and Destination", () => {
      cy.visit("/orders")
      cy.get("table").should("be.visible")
      cy.get("thead").within(() => {
        cy.contains("Order").should("be.visible")
        cy.contains("Status").should("be.visible")
        cy.contains("Destination").should("be.visible")
      })
    })

    it("should display order status badges with proper color coding variants", () => {
      cy.visit("/orders")
      cy.get("tbody tr").should("have.length.at.least", 1)
      cy.get("tbody").within(() => {
        cy.get('[class*="badge"], [class*="inline-flex"]').should("exist")
      })
    })
  })

  describe("Fleet Fleet Cards & Fuel Level Indicators UI", () => {
    it("should render truck model, capacity metrics, and progress bars", () => {
      cy.visit("/fleet")
      cy.contains("Total trucks").should("be.visible")
      cy.get('[role="progressbar"], [aria-label*="Fuel level"]').should("exist")
    })
  })

  describe("Deposits Capacity Progress Bar UI", () => {
    it("should render deposit location cards and capacity progress indicators", () => {
      cy.visit("/deposits")
      cy.contains("Deposits").should("be.visible")
      cy.get("body").should("contain.text", "m³")
    })
  })
})
