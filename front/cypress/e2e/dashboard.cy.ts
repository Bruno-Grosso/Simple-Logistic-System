describe("Dashboard Overview & Navigation UI Tests", () => {
  beforeEach(() => {
    cy.visit("/dashboard")
  })

  it("should load dashboard page header and branding", () => {
    cy.contains("Dashboard").should("be.visible")
    cy.contains("LogiSys").should("be.visible")
  })

  it("should render key performance indicator (KPI) metric cards", () => {
    cy.contains("In Transit").should("be.visible")
    cy.contains("Pending").should("be.visible")
    cy.contains("Delivered").should("be.visible")
    cy.contains("Revenue").should("be.visible")
  })

  it("should display sidebar navigation items for all logistics domains", () => {
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

  it("should navigate to Profile page when clicking Profile in sidebar", () => {
    cy.get('[data-slot="sidebar"]').contains("Profile").click()
    cy.url().should("include", "/profile")
    cy.contains("User Profile").should("be.visible")
  })
})
