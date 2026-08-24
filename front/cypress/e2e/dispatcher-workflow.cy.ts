describe("Dispatcher workflow", () => {
  const products = [
    { id: "PROD-001", name: "Insulated Produce", price: 25, volume: 1, weight: 1, is_cold: true },
  ]
  const users = [
    { id: "USR-CLIENT", name: "Cypress Client", role: "client" },
    { id: "USR-RECEIVER", name: "Cypress Receiver", role: "warehouse_worker" },
  ]
  const warehouses = [
    { id: "WH-001", location: "Cypress Dispatch Hub", volume_actual: 120, volume_max: 1000, truck_capacity: 5, fuel_price: 5.89 },
  ]
  const trucks = [
    { id: "TRK-001", model: "Cypress Truck", current_warehouse_id: "WH-001", speed: 80, is_delivering: false, is_valid: true, fuel_consumption: 0.3 },
  ]

  beforeEach(() => {
    cy.intercept("GET", "**/products", { statusCode: 200, body: products }).as("getProducts")
    cy.intercept("GET", "**/users", { statusCode: 200, body: users }).as("getUsers")
    cy.intercept("GET", "**/warehouses", { statusCode: 200, body: warehouses }).as("getWarehouses")
    cy.intercept("GET", "**/trucks", { statusCode: 200, body: trucks }).as("getTrucks")
    cy.intercept("POST", "**/orders", (request) => {
      request.reply({ statusCode: 201, body: { success: true, order: { id: request.body.id } } })
    }).as("createOrder")
    cy.intercept("POST", "**/orders/*/route", { statusCode: 201, body: { success: true } }).as("createRoute")
  })

  it("creates a routed order, then reviews operational reports", () => {
    cy.visit("/dashboard")
    cy.get('[data-slot="sidebar"]').contains("Orders").click()
    cy.contains("a", "New Order").click()

    cy.wait(["@getProducts", "@getUsers", "@getWarehouses", "@getTrucks"])
    cy.get('input[name="destination"]').type("Petrópolis customer site")
    cy.get('select[name="client"]').select("USR-CLIENT")
    cy.get('select[name="receiver"]').select("USR-RECEIVER")
    cy.get('select[name="warehouse"]').select("WH-001")
    cy.get('input[name="deadline"]').type("2027-01-15")
    cy.contains("Estimated Transit & Arrival (ETA)").should("be.visible")
    cy.get('[aria-label="Quantity for line 1"]').clear().type("3")
    cy.contains("button", "Submit order").click()

    cy.wait("@createOrder").its("request.body").should((body) => {
      expect(body).to.include({
        client_id: "USR-CLIENT",
        final_destination: "Petrópolis customer site",
        status: "Pending",
      })
      expect(body.price).to.be.greaterThan(0)
    })
    cy.wait("@createRoute").its("request.body").should("include", { warehouse_id: "WH-001", truck_id: "TRK-001" })
    cy.url().should("include", "/orders")

    cy.get('[data-slot="sidebar"]').contains("Reports").click()
    cy.url().should("include", "/reports")
    cy.contains("Freight Costs Financial Breakdown").should("be.visible")
    cy.contains("Highest-Cost Delivery Routes").should("be.visible")
    cy.contains("Route Profitability Detail").should("be.visible")
  })
})
