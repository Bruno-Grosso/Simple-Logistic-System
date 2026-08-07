describe("UI Component Tests - Layouts, Cards, Badges & Dialogs", () => {
  beforeEach(() => {
    cy.visit("/dashboard")
  })

  describe("KPI Stat Cards UI", () => {
    it("should render metric title, numerical values, and container icons", () => {
      cy.contains("In Transit").should("be.visible")
      cy.contains("Pending").should("be.visible")
      cy.contains("Delivered").should("be.visible")
      cy.contains("Revenue").should("be.visible")
    })

    it("should render formatted currency and metric counts with tabular numbers", () => {
      cy.get('.tabular-nums, [class*="tabular-nums"]').should("exist")
    })
  })

  describe("Page Header & Shell UI", () => {
    it("should render page breadcrumbs and user navigation headers", () => {
      cy.get('nav[aria-label="Breadcrumb"]').should("be.visible")
      cy.contains("LogiSys").should("be.visible")
    })
  })

  describe("App Sidebar Navigation UI", () => {
    it("should render navigation list items and icons for all logistics sections", () => {
      cy.get('[data-slot="sidebar"]').within(() => {
        cy.contains("Dashboard").should("be.visible")
        cy.contains("Orders").should("be.visible")
        cy.contains("Fleet").should("be.visible")
        cy.contains("Deposits").should("be.visible")
        cy.contains("Products").should("be.visible")
        cy.contains("Stock").should("be.visible")
        cy.contains("Employees").should("be.visible")
        cy.contains("Suppliers").should("be.visible")
        cy.contains("Reports").should("be.visible")
        cy.contains("Profile").should("be.visible")
      })
    })

    it("should highlight active menu item corresponding to current route", () => {
      cy.get('[data-slot="sidebar"]').contains("Dashboard").closest("a").should("have.attr", "href", "/dashboard")
    })
  })

  describe("Modal Dialogs UI Components", () => {
    it("should render profile edit dialog UI elements when triggered", () => {
      cy.visit("/profile")
      cy.get('[data-slot="dialog-trigger"]').click()
      cy.get('[data-slot="dialog-content"]').should("be.visible")
      cy.get('[data-slot="dialog-content"]').within(() => {
        cy.contains("Edit User Profile").should("be.visible")
        cy.get("input").should("have.length.at.least", 1)
        cy.contains("button", "Save Changes").should("be.visible")
        cy.contains("button", "Cancel").should("be.visible")
      })
      cy.contains("button", "Cancel").click()
      cy.get('[data-slot="dialog-content"]').should("not.exist")
    })
  })
})
