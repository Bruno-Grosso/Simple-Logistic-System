describe("Role-specific page permissions and navigation granularity", () => {
  describe("Dispatcher role", () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.login("diana@logisys.com", "dianapass")
      cy.url().should("include", "/dashboard")
    })

    it("displays tailored sidebar navigation items for dispatcher", () => {
      const sidebar = cy.get('[data-slot="sidebar"]')
      sidebar.should("contain.text", "Dashboard")
      sidebar.should("contain.text", "Orders")
      sidebar.should("contain.text", "Fleet")
      sidebar.should("contain.text", "Reports")
      sidebar.should("contain.text", "Profile")

      sidebar.should("not.contain.text", "Deposits")
      sidebar.should("not.contain.text", "Products")
      sidebar.should("not.contain.text", "Stock")
      sidebar.should("not.contain.text", "Employees")
      sidebar.should("not.contain.text", "Suppliers")
    })

    it("grants access to /orders, /orders/new, /fleet, and /reports", () => {
      cy.visit("/orders")
      cy.url().should("include", "/orders")
      cy.contains("a", "New Order").should("be.visible")
      cy.contains("th", "Client").should("be.visible")
      cy.contains("th", "Driver").should("be.visible")
      cy.contains("th", "Truck").should("be.visible")
      cy.contains("th", "Value").should("be.visible")

      cy.visit("/orders/new")
      cy.url().should("include", "/orders/new")
      cy.contains("button", "Submit order").should("be.visible")

      cy.visit("/fleet")
      cy.url().should("include", "/fleet")
      cy.contains("Total trucks").should("be.visible")

      cy.visit("/reports")
      cy.url().should("include", "/reports")
      cy.contains("Reports").should("be.visible")
    })

    it("redirects dispatcher away from forbidden routes", () => {
      cy.visit("/stock")
      cy.url().should("include", "/dashboard")

      cy.visit("/deposits")
      cy.url().should("include", "/dashboard")

      cy.visit("/products")
      cy.url().should("include", "/dashboard")

      cy.visit("/suppliers")
      cy.url().should("include", "/dashboard")

      cy.visit("/employees")
      cy.url().should("include", "/dashboard")
    })
  })

  describe("Inventory Manager role", () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.login("isabela@logisys.com", "isabelapass")
      cy.url().should("include", "/dashboard")
    })

    it("displays tailored sidebar navigation items for inventory manager", () => {
      const sidebar = cy.get('[data-slot="sidebar"]')
      sidebar.should("contain.text", "Dashboard")
      sidebar.should("contain.text", "Deposits")
      sidebar.should("contain.text", "Products")
      sidebar.should("contain.text", "Stock")
      sidebar.should("contain.text", "Suppliers")
      sidebar.should("contain.text", "Profile")

      sidebar.should("not.contain.text", "Orders")
      sidebar.should("not.contain.text", "Fleet")
      sidebar.should("not.contain.text", "Reports")
      sidebar.should("not.contain.text", "Employees")
    })

    it("grants access to /stock, /deposits, /products, and /suppliers", () => {
      cy.visit("/stock")
      cy.url().should("include", "/stock")
      cy.contains("Stock").should("be.visible")

      cy.visit("/deposits")
      cy.url().should("include", "/deposits")
      cy.contains("Deposits").should("be.visible")

      cy.visit("/products")
      cy.url().should("include", "/products")
      cy.contains("Products").should("be.visible")

      cy.visit("/suppliers")
      cy.url().should("include", "/suppliers")
      cy.contains("Suppliers").should("be.visible")
    })

    it("redirects inventory manager away from forbidden routes", () => {
      cy.visit("/fleet")
      cy.url().should("include", "/dashboard")

      cy.visit("/reports")
      cy.url().should("include", "/dashboard")

      cy.visit("/employees")
      cy.url().should("include", "/dashboard")

      cy.visit("/orders/new")
      cy.url().should("include", "/dashboard")
    })
  })

  describe("Maintenance Technician role", () => {
    beforeEach(() => {
      cy.clearCookies()
      cy.login("paulo@logisys.com", "paulopass")
      cy.url().should("include", "/dashboard")
    })

    it("displays tailored sidebar navigation items for maintenance technician", () => {
      const sidebar = cy.get('[data-slot="sidebar"]')
      sidebar.should("contain.text", "Dashboard")
      sidebar.should("contain.text", "Fleet")
      sidebar.should("contain.text", "Profile")

      sidebar.should("not.contain.text", "Orders")
      sidebar.should("not.contain.text", "Deposits")
      sidebar.should("not.contain.text", "Products")
      sidebar.should("not.contain.text", "Stock")
      sidebar.should("not.contain.text", "Suppliers")
      sidebar.should("not.contain.text", "Reports")
      sidebar.should("not.contain.text", "Employees")
    })

    it("grants access to /fleet and individual truck fleet details", () => {
      cy.visit("/fleet")
      cy.url().should("include", "/fleet")
      cy.contains("Total trucks").should("be.visible")

      cy.visit("/fleet/TRK-001")
      cy.url().should("include", "/fleet/TRK-001")
      cy.contains("Specs").should("be.visible")
    })

    it("redirects maintenance technician away from forbidden routes", () => {
      cy.visit("/stock")
      cy.url().should("include", "/dashboard")

      cy.visit("/deposits")
      cy.url().should("include", "/dashboard")

      cy.visit("/products")
      cy.url().should("include", "/dashboard")

      cy.visit("/suppliers")
      cy.url().should("include", "/dashboard")

      cy.visit("/reports")
      cy.url().should("include", "/dashboard")

      cy.visit("/employees")
      cy.url().should("include", "/dashboard")

      cy.visit("/orders/new")
      cy.url().should("include", "/dashboard")
    })
  })
})
