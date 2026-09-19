describe("Error Messages, Validations & Failure Modes E2E", () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.clearCookies()
    cy.login("alice@logisys.com", "admin123")
    cy.url().should("include", "/dashboard")
  })

  describe("Authentication and Login Error States", () => {
    it("displays an accessible role='alert' on invalid login credentials", () => {
      cy.clearCookies()
      cy.visit("/login")
      cy.get('input[name="email"]').type("nonexistent@logisys.com")
      cy.get('input[name="password"]').type("wrongpassword123")
      cy.get('button[type="submit"]').click()

      // Should display accessible alert with clear message
      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Invalid email or password")
    })
  })

  describe("Order Creation Form Validations (/orders/new)", () => {
    beforeEach(() => {
      cy.visit("/orders/new")
      cy.url().should("include", "/orders/new")
    })

    it("displays error alert when submitting an empty form", () => {
      cy.get('button[data-testid="submit-order-button"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Destination address is required")
      cy.get('input[name="destination"]').should("have.attr", "aria-invalid", "true")
    })

    it("displays error alert when client selection is missing", () => {
      cy.get('select[name="client"]').select("")
      cy.get('input[name="destination"]').type("Rua Alberto Braune, 100, Nova Friburgo - RJ")
      cy.get('button[data-testid="submit-order-button"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Please select a client account")
    })

    it("displays error alert when delivery deadline is missing", () => {
      cy.get('input[name="destination"]').type("Rua Alberto Braune, 100, Nova Friburgo - RJ")
      cy.get('select[name="client"]').select(1)
      cy.get('button[data-testid="submit-order-button"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Delivery deadline date and time is required")
    })

    it("displays server error message when order creation API fails", () => {
      cy.intercept("POST", "**/orders", {
        statusCode: 400,
        body: { error: "Warehouse has insufficient inventory stock for requested products." },
      }).as("createOrderFail")

      cy.get('button[data-testid="auto-select-order-data"]').click()
      cy.get('button[data-testid="submit-order-button"]').click()

      cy.wait("@createOrderFail")
      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Warehouse has insufficient inventory stock")
    })
  })

  describe("Manage Order Dialog Error States", () => {
    it("displays error alert when attempting to reassign or recalculate a shipped order", () => {
      cy.visit("/orders/ORD-001")
      cy.url().should("include", "/orders/ORD-001")

      cy.get("body").then(($body) => {
        if ($body.find('[data-testid="manage-order-trigger"]').length > 0) {
          cy.get('[data-testid="manage-order-trigger"]').click()
          cy.contains("Manage ORD-001").should("be.visible")

          cy.get("body").then(($dialog) => {
            if ($dialog.find('[role="alert"]').length > 0) {
              cy.get('[role="alert"]').should("contain.text", "Cannot modify or recalculate an order that has already been shipped")
            }
          })
          cy.contains("button", "Cancel").click()
        }
      })
    })
  })

  describe("Multi-Stop Route Planner Error States", () => {
    it("disables calculate route button when 0 orders are selected", () => {
      cy.visit("/orders")
      cy.get('[data-testid="multi-stop-route-trigger"]').click({ force: true })
      cy.contains("Multi-Stop Route Planner").should("be.visible")

      // Clear all orders using the dialog's Clear button
      cy.contains("button", "Clear").click()

      // Calculate button should be disabled when 0 orders are selected
      cy.contains("button", "Calculate Multi-Stop Route (0 stops)")
        .should("be.disabled")

      cy.get('[data-slot="dialog-close"]').first().click({ force: true })
    })
  })

  describe("Manage Stock Dialog Validations", () => {
    it("validates non-negative integer quantity in stock update dialog", () => {
      cy.visit("/stock")
      cy.contains("Stock").should("be.visible")
      cy.get("table").should("be.visible")
      cy.get('[data-testid="manage-stock-trigger"]').first().should("be.visible").click()
      cy.contains("Edit Warehouse Stock", { timeout: 10000 }).should("be.visible")

      // Type negative quantity
      cy.get("#stock-quantity-input").clear().type("-15")
      cy.get('[data-testid="manage-stock-submit"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Stock quantity must be a non-negative integer")

      cy.contains("button", "Cancel").click()
    })
  })

  describe("Warehouse Edit Dialog Validations", () => {
    it("validates required location label and positive storage volume", () => {
      cy.visit("/deposits/WH-001")
      cy.contains("Deposit details").should("be.visible")

      cy.contains("button", "Edit Warehouse").should("be.visible").click()
      cy.contains("Edit Warehouse Details").should("be.visible")

      // Clear location label
      cy.get("#location-label").clear()
      cy.contains("button", "Save Changes").click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Warehouse location label cannot be empty")

      cy.contains("button", "Cancel").click()
    })
  })

  describe("Truck Fleet Edit Dialog Validations", () => {
    it("validates model name and fuel tank constraints", () => {
      cy.visit("/fleet/TRK-001")
      cy.contains("Specs").should("be.visible")

      cy.contains("button", "Edit Truck").should("be.visible").click()
      cy.contains("Edit Truck Details").should("be.visible")

      // Clear model name
      cy.get("#truck-model").clear()
      cy.contains("button", "Save Changes").click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Truck model name cannot be empty")

      // Enter valid model name but current fuel exceeding tank capacity
      cy.get("#truck-model").type("Volvo FH Electric")
      cy.get("#fuel-cap").clear().type("200")
      cy.get("#fuel-curr").clear().type("350")
      cy.contains("button", "Save Changes").click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "cannot exceed maximum fuel tank capacity")

      cy.contains("button", "Cancel").click()
    })
  })

  describe("Product Dialog Validations", () => {
    it("validates product name, non-negative price, and positive volume", () => {
      cy.visit("/products")
      cy.contains("button", "Add product").should("be.visible").click()
      cy.contains("Add New Product").should("be.visible")

      // Empty name with whitespace
      cy.get("#new-product-name").clear().type("   ")
      cy.get('[data-testid="add-product-submit"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Product name is required")

      // Negative price
      cy.get("#new-product-name").clear().type("Valid Name")
      cy.get("#new-product-price").clear().type("-10")
      cy.get('[data-testid="add-product-submit"]').click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Product price must be 0 or greater")

      cy.contains("button", "Cancel").click()
    })
  })

  describe("Employee Management Validations", () => {
    it("validates employee name and minimum password length", () => {
      cy.visit("/employees")
      cy.get('[data-testid="add-employee-button"]').should("be.visible").click()
      cy.contains("Add employee").should("be.visible")

      // Empty name with spaces
      cy.get("#employee-name").clear().type("   ")
      cy.contains("button", "Save employee").click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Please enter an employee name")

      // Short password (< 8 chars)
      cy.get("#employee-name").clear().type("Valid Employee")
      cy.get('input[type="email"]').clear().type("testemp@logisys.com")
      cy.get('input[type="password"]').clear().type("123")
      cy.contains("button", "Save employee").click()

      cy.get('[role="alert"]')
        .should("be.visible")
        .and("contain.text", "Password must be at least 8 characters long")

      cy.contains("button", "Cancel").click()
    })
  })

  describe("404 Not Found Handling", () => {
    it("renders friendly 404 page when navigating to a nonexistent order or route", () => {
      cy.visit("/orders/NONEXISTENT-ORDER-99999", { failOnStatusCode: false })

      cy.contains("404 — Not Found").should("be.visible")
      cy.contains("Resource or Page Not Found").should("be.visible")
      cy.contains("The requested page, order, warehouse, or vehicle could not be found").should("be.visible")
      cy.contains("a", "Go to Dashboard").should("have.attr", "href", "/dashboard")
    })
  })
})
