describe("Integration Tests - New Order Submission", () => {
  const products = [
    { id: "PRD-001", name: "Test product", price: 12.5, volume: 1, weight: 1 },
  ]
  const users = [
    { id: "USR-001", name: "Alice Client", role: "customer" },
    { id: "USR-002", name: "Bob Receiver", role: "warehouse_worker" },
  ]

  beforeEach(() => {
    cy.intercept("GET", "**/products", { statusCode: 200, body: products }).as("getProducts")
    cy.intercept("GET", "**/users", { statusCode: 200, body: users }).as("getUsers")
    cy.intercept("POST", "**/orders", (request) => {
      request.reply({ statusCode: 201, body: { success: true } })
    }).as("createOrder")
    cy.visit("/orders/new")
    cy.wait(["@getProducts", "@getUsers"])
  })

  it("should add a product line and update the calculated total", () => {
    cy.get('[aria-label="Product line items"] > div').should("have.length", 1)
    cy.contains("button", "Add item").click()
    cy.get('[aria-label="Product line items"] > div').should("have.length", 2)
    cy.get('[aria-label="Quantity for line 1"]').clear().type("2")
    cy.contains("R$ 37,50").should("be.visible")
  })

  it("should submit complete order payload and return to orders", () => {
    cy.get('input[name="destination"]').type("Test destination")
    cy.get('select[name="client"]').select("USR-001")
    cy.get('select[name="receiver"]').select("USR-002")
    cy.get('input[name="deadline"]').type("2027-01-15")
    cy.contains("button", "Submit order").click()

    cy.wait("@createOrder").its("request.body").should("deep.include", {
      client_id: "USR-001",
      final_destination: "Test destination",
      time_limit: "2027-01-15",
      price: 12.5,
      status: "Pending",
    })
    cy.url().should("include", "/orders")
  })
})
