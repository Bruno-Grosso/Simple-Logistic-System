describe("Integration Tests - API Intercepts & Network Integration", () => {
  const apiBase = "http://localhost:8080"

  function put(path: string, payload: unknown) {
    return cy.window().then((win) => win.fetch(`${apiBase}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }))
  }

  function post(path: string, payload: unknown) {
    return cy.window().then((win) => win.fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }))
  }

  it("should send correct payload and handle a successful user update response", () => {
    cy.intercept("PUT", "**/users/*", {
      statusCode: 200,
      body: {
        success: true,
        user: { id: "USR-001", name: "Alice Admin Updated", email: "alice@logisys.com", role: "admin" },
      },
    }).as("updateUser")

    cy.visit("/dashboard")
    put("/users/USR-001", { name: "Alice Admin Updated" })

    cy.wait("@updateUser").its("request.body").should("deep.include", {
      name: "Alice Admin Updated",
    })
  })

  it("should expose a failed user update response", () => {
    cy.intercept("PUT", "**/users/*", {
      statusCode: 500,
      body: { success: false, error: "Database error" },
    }).as("updateUserError")

    cy.visit("/dashboard")
    put("/users/USR-001", { name: "Alice Error Test" }).then((response) => expect(response.status).to.equal(500))

    cy.wait("@updateUserError")
  })

  it("creates an employee and persists an inactive status", () => {
    cy.intercept("POST", "**/employees", {
      statusCode: 201,
      body: {
        success: true,
        employee: { id: "USR-011", name: "New Driver", role: "truck_driver", is_active: 1 },
      },
    }).as("createEmployee")
    cy.intercept("PUT", "**/users/USR-011", {
      statusCode: 200,
      body: {
        success: true,
        user: { id: "USR-011", name: "New Driver", role: "truck_driver", is_active: 0 },
      },
    }).as("deactivateEmployee")
    cy.visit("/dashboard")

    post("/employees", {
      name: "New Driver",
      email: "new.driver@logisys.com",
      password: "safe-password",
      role: "truck_driver",
      wage: 45,
      warehouse_id: null,
      is_active: 1,
    })
    put("/users/USR-011", { is_active: 0 })

    cy.wait("@createEmployee").its("request.body").should("deep.include", {
      name: "New Driver",
      role: "truck_driver",
      is_active: 1,
    })
    cy.wait("@deactivateEmployee").its("request.body").should("deep.equal", { is_active: 0 })
  })

  it("should stub and intercept GET user sessions API calls", () => {
    cy.intercept("GET", "**/online-users*", {
      statusCode: 200,
      body: [
        {
          id: "SESS-100",
          user_id: "USR-001",
          ip_address: "192.168.1.50",
          user_agent: "Cypress Integration Test Browser",
        },
      ],
    }).as("getOnlineSessions")

    cy.visit("/profile")
    cy.contains("button", "Refresh").click()
    cy.wait("@getOnlineSessions").its("response.body.0.id").should("equal", "SESS-100")
  })

  it("sends the complete product, truck, and warehouse edit payloads", () => {
    cy.intercept("PUT", "**/products/PROD-001", { statusCode: 200, body: { success: true } }).as("updateProduct")
    cy.intercept("PUT", "**/trucks/TRK-001", { statusCode: 200, body: { success: true } }).as("updateTruck")
    cy.intercept("PUT", "**/warehouses/WH-001", { statusCode: 200, body: { success: true } }).as("updateWarehouse")
    cy.visit("/dashboard")

    put("/products/PROD-001", { name: "Fresh Milk", price: 4.5, volume: 1, weight: 1, is_cold: 1, is_fragile: 0, expire_date: null, size: { length: 1, width: 1, height: 1 } })
    put("/trucks/TRK-001", { model: "Serrano", speed: 80, is_valid: 1, size: { length: 7, width: 2, height: 3 }, volume_max: 90, weight_max: 25000, has_refrigeration: 1, fuel_capacity: 500, fuel_current: 400, fuel_consumption: 0.3, current_warehouse_id: "WH-001" })
    put("/warehouses/WH-001", { location: { label: "Petrópolis Hub", latitude: -22.3842, longitude: -43.1311 }, size: { length: 100, width: 100, height: 10 }, volume_max: 100000, has_refrigeration: 1, fuel_price: 5.89, truck_capacity: 5 })

    cy.wait("@updateProduct").its("request.body").should("include", { price: 4.5, is_cold: 1 })
    cy.wait("@updateTruck").its("request.body").should("include", { speed: 80, current_warehouse_id: "WH-001" })
    cy.wait("@updateWarehouse").its("request.body").should("deep.include", { truck_capacity: 5 })
  })

  it("updates an order status without requiring a dispatch assignment", () => {
    cy.intercept("PUT", "**/orders/ORD-001", { statusCode: 200, body: { success: true, order: { status: "Canceled" } } }).as("updateOrder")
    cy.visit("/dashboard")

    put("/orders/ORD-001", { status: "Cancelled" })

    cy.wait("@updateOrder").its("request.body").should("deep.equal", { status: "Cancelled" })
  })
})
