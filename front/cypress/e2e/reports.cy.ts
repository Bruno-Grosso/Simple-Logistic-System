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

  it("should display monthly order completion target and operational pace metrics", () => {
    cy.contains("Monthly Order Completion Target & Operational Pace").should("be.visible")
    cy.contains("Orders Needed to Complete").should("be.visible")
    cy.contains("Required Daily Run Rate").should("be.visible")
    cy.contains("Current Daily Velocity").should("be.visible")
    cy.contains("Projected Month-End").should("be.visible")
  })

  it("should support period timeframe filtering connected to database metrics", () => {
    cy.get("#period-filter").should("be.visible")
    cy.get("#period-filter").select("March 2026 (Active Orders)")
    cy.url({ timeout: 10000 }).should("include", "period=2026-03")
    cy.contains("Active Database Query:").should("be.visible")
    cy.contains("March 2026").should("be.visible")
    cy.get("table").should("be.visible")
  })

  it("should synchronize graph range selectors with report period", () => {
    cy.contains("button", "H1 (Jan-Jun)").click()
    cy.url({ timeout: 10000 }).should("include", "period=6M_H1")
    cy.contains("Active Database Query:").should("be.visible")
  })

  it("should include warehouse and period parameters in Export CSV link", () => {
    cy.get("#period-filter").select("Q1 (Jan - Mar 2026)")
    cy.url({ timeout: 10000 }).should("include", "period=Q1")
    cy.get("[data-testid='export-csv-button']")
      .should("be.visible")
      .and("have.attr", "data-url")
      .and("include", "period=Q1")
  })

  it("should automatically populate dynamic active periods from the database", () => {
    cy.get("#period-filter").find("option").should("have.length.at.least", 10)
    cy.get("#period-filter").find("option").contains("March 2026 (Active Orders)").should("exist")
    cy.get("#period-filter").find("option").contains("April 2026 (Active Orders)").should("exist")

    // Filter to April
    cy.get("#period-filter").select("April 2026 (Active Orders)")
    cy.url({ timeout: 10000 }).should("include", "period=2026-04")
    cy.contains("Active Database Query:").should("be.visible")
    cy.contains("April 2026").should("be.visible")
  })
})
