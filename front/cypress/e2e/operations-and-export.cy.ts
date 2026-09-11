describe("Usability (CSV/PDF Export) & Operations (Multi-Stop Routing)", () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.clearCookies()
    cy.login("alice@logisys.com", "admin123")
    cy.url().should("include", "/dashboard")
  })

  it("renders Export CSV and Multi-Stop Route buttons on /orders page", () => {
    cy.visit("/orders")
    cy.url().should("include", "/orders")

    cy.contains("button", "Export CSV").should("be.visible")
    cy.contains("button", "Multi-Stop Route").should("be.visible")
  })

  it("opens Multi-Stop Route Planner modal and allows order selection", () => {
    cy.visit("/orders")
    cy.contains("button", "Multi-Stop Route").click()

    cy.contains("Multi-Stop Route Planner").should("exist")
    cy.contains("Dispatch Warehouse").should("exist")
    cy.contains("Assigned Truck").should("exist")
    cy.contains("Round-trip").should("exist")

    // Check quick pick orders
    cy.contains("button", "Quick Pick").click()
    cy.contains("button", "Calculate Multi-Stop Route").should("be.enabled")
  })

  it("renders Export Manifest button on Order Detail page and opens printable Bill of Lading", () => {
    cy.visit("/orders/ORD-001")
    cy.url().should("include", "/orders/ORD-001")

    const exportBtn = cy.contains("button", "Export Manifest")
    exportBtn.should("be.visible")
    exportBtn.click()

    cy.contains("Shipping Manifest & Bill of Lading").should("exist")
    cy.contains("LOGISYS").should("exist")
    cy.contains("Itemized Cargo Manifest").should("exist")
    cy.contains("Total Cargo Weight").should("exist")
    cy.contains("Dispatcher Signature").should("exist")
    cy.contains("Print / Save as PDF").should("exist")
    cy.contains("Download CSV").should("exist")

    cy.contains("button", "Close").click()
  })

  it("renders Export CSV button on Reports page", () => {
    cy.visit("/reports")
    cy.url().should("include", "/reports")

    cy.contains("button", "Export CSV").should("be.visible")
  })
})
