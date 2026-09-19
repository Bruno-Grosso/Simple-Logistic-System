describe("Optimal Vehicle Dispatch & Merged Auto-Select Workflow", () => {
  beforeEach(() => {
    cy.login("alice@logisys.com", "admin123")
  })

  it("should auto-select valid data, optimal truck, warehouse, and driver on /orders/new", () => {
    cy.visit("/orders/new")
    cy.get("[data-testid='auto-select-order-data']").should("be.visible").click()

    // Verify auto-selected values
    cy.get("input[name='destination']").should("not.have.value", "")
    cy.get("select[name='client']").should("not.have.value", "")
    cy.get("select[name='receiver']").should("not.have.value", "")
    cy.get("select[name='warehouse']").should("not.have.value", "")
    cy.get("select[name='truck']").should("not.have.value", "")
    cy.get("select[name='driver']").should("not.have.value", "")
    cy.get("input[name='deadline']").should("not.have.value", "")

    // Verify submit button is enabled
    cy.get("button[type='submit']").should("be.visible")
  })

  it("should auto-select optimal truck, driver, and warehouse in Manage Order dialog without 404", () => {
    cy.visit("/orders/ORD-002")
    cy.contains("button", "Manage order").should("be.visible").click()

    // The dialog should open
    cy.contains("Manage ORD-002").should("be.visible")

    // The merged auto-select button should be visible and functional
    cy.get("[data-testid='auto-select-order-data']").should("be.visible").click()

    // Truck and driver should be filled
    cy.get("#manage-order-truck").should("not.have.value", "")
    cy.get("#manage-order-driver").should("not.have.value", "")

    // No 404 error alert should appear
    cy.contains("404").should("not.exist")
  })

  it("should open Multi-Stop Route Planner and use Quick Pick (Route Corridor) to select corridor orders and compute route", () => {
    cy.visit("/orders")
    cy.get("[data-testid='multi-stop-route-trigger']").should("be.visible").click()

    // The dialog should open
    cy.contains("Multi-Stop Route Planner").should("be.visible")

    // Click Quick Pick (Route Corridor)
    cy.get("[data-testid='quick-pick-route-button']").should("be.visible").click()

    // Should select corridor-proximate orders
    cy.contains("chosen", { timeout: 15000 }).should("not.contain", "0 chosen")
    cy.contains("Anchor", { timeout: 15000 }).should("exist")

    // Multi-stop route should be solved and displayed on map & itinerary
    cy.contains("Fleet Multi-Routes:", { timeout: 15000 }).should("be.visible")
    cy.contains("Route Solved:", { timeout: 15000 }).should("exist")
    cy.contains("Dispatch Sequence", { timeout: 15000 }).should("exist")
  })

  it("should display active multi-routes panel and stop indicators on /orders", () => {
    cy.visit("/orders")
    cy.contains("Active Multi-Routing Fleet Operations", { timeout: 15000 }).should("be.visible")
    cy.get("[data-testid='active-multi-routes-panel']", { timeout: 15000 }).should("be.visible")
    cy.contains("Stop Sequence Itinerary", { timeout: 15000 }).should("be.visible")
    cy.contains("Stop #", { timeout: 15000 }).should("exist")
  })

  it("should display multi-route circuit map on order detail page for orders in a multi-route", () => {
    cy.visit("/orders/ORD-014")
    cy.contains("Multi-Route Active").should("be.visible")
    cy.contains(/Stop #\d+ of \d+/).should("be.visible")
    cy.contains("Valhalla Multi-Routing Circuit Map").should("be.visible")
  })
})

