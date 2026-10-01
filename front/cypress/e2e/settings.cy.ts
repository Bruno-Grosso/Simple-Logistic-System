describe("Settings E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/settings")
  })

  it("should render account and session settings sections", () => {
    cy.contains("Settings").should("be.visible")
    cy.contains("Account Profile").should("be.visible")
    cy.contains("Appearance & Theme").should("be.visible")
    cy.contains("Active Session").should("be.visible")
    cy.contains("Session Management").should("be.visible")
  })

  it("should provide a link back to profile management", () => {
    cy.contains("a", "Manage Profile").should("have.attr", "href", "/profile")
  })

  it("should allow changing theme preferences", () => {
    cy.get("[data-testid='theme-light-btn']").should("be.visible").click()
    cy.get("html").should("have.class", "light")
    cy.get("[data-testid='theme-dark-btn']").should("be.visible").click()
    cy.get("html").should("have.class", "dark")
  })

  it("should allow configuring inactivity auto-logout timeout", () => {
    cy.get("[data-testid='timeout-setting-select']").should("be.visible")
    cy.get("[data-testid='timeout-setting-select']").select("30")
    cy.window().then((win) => {
      expect(win.localStorage.getItem("logisys_inactivity_timeout_min")).to.equal("30")
    })
  })

  it("should render copy buttons for user credentials", () => {
    cy.get("[data-testid='copy-button']").should("have.length.at.least", 1)
  })
})
