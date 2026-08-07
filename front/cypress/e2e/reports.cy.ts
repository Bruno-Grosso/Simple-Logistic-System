describe("Performance Analytics & Reporting Graphs UI Tests", () => {
  beforeEach(() => {
    cy.visit("/reports")
  })

  it("should display reports page header and performance graphs", () => {
    cy.contains("Reports").should("be.visible")
    cy.contains("Logistics Financial & Operational Performance").should("be.visible")
    cy.contains("Graph 1: Monthly Profit vs. Costs").should("be.visible")
  })

  it("should render financial performance summary metrics", () => {
    cy.contains("Delivered Revenue").should("be.visible")
    cy.contains("Total Freight Cost").should("be.visible")
    cy.contains("Net Profit Margin").should("be.visible")
  })
})
