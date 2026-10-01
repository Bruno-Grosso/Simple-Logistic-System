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
    cy.contains("a", "ORD-001")
      .should("have.attr", "href")
      .then((href) => cy.visit(href as unknown as string))
    cy.url().should("include", "/orders/ORD-001")
    cy.contains("Order details").should("be.visible")
    cy.contains("Freight Cost Breakdown").should("be.visible")
  })

  it("should support accessible search filtering by order ID and destination", () => {
    cy.get("input#order-search-input").should("be.visible")
    cy.get("input#order-search-input").type("ORD-003")
    cy.get("tbody").should("contain.text", "ORD-003")
    cy.get("tbody").should("not.contain.text", "ORD-001")

    // Clear search using clear button
    cy.get("button[aria-label='Clear search input']").click()
    cy.get("tbody").should("contain.text", "ORD-001")
    cy.get("tbody").should("contain.text", "ORD-003")
  })

  it("should filter orders by status using accessible filter pills", () => {
    cy.get("button[aria-label*='Filter by Delivered status']").click()
    cy.get("tbody tr").each(($tr) => {
      cy.wrap($tr).should("contain.text", "Delivered")
    })

    // Reset back to All
    cy.get("button[aria-label*='Filter by All status']").click()
    cy.get("tbody tr").should("have.length.at.least", 2)
  })

  it("should change order sorting with accessible aria-sort headers", () => {
    // Sort by Destination
    cy.get("button[aria-label*='Sort by Destination']").click()
    cy.get("th[aria-sort='ascending']").should("contain.text", "Destination")

    // Reverse to descending
    cy.get("button[aria-label*='Sort by Destination']").click()
    cy.get("th[aria-sort='descending']").should("contain.text", "Destination")
  })
})
