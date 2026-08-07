describe("Integration Tests - API Intercepts & Network Integration", () => {
  it("should send correct payload and handle a successful user update response", () => {
    cy.intercept("PUT", "**/users/*", {
      statusCode: 200,
      body: {
        success: true,
        user: { id: "USR-001", name: "Alice Admin Updated", email: "alice@logisys.com", role: "admin" },
      },
    }).as("updateUser")

    cy.visit("/dashboard")
    cy.window().then((win) =>
      win.fetch("http://localhost:8080/users/USR-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice Admin Updated" }),
      }),
    )

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
    cy.window().then((win) =>
      win.fetch("http://localhost:8080/users/USR-001", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice Error Test" }),
      }).then((response) => expect(response.status).to.equal(500)),
    )

    cy.wait("@updateUserError")
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
})
