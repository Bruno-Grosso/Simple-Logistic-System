describe("Performance Analytics & Reporting Graphs UI Tests", () => {
  beforeEach(() => {
    cy.visit("/reports")
  })

  it("should display reports page header and performance graphs", () => {
    cy.contains("Reports").should("be.visible")
    cy.contains("Profit vs Costs").should("be.visible")
  })

  it("should render financial performance summary metrics", () => {
    cy.contains("Total Revenue").should("be.visible")
    cy.contains("Operating Costs").should("be.visible")
    cy.contains("Net Profit").should("be.visible")
  })
})
