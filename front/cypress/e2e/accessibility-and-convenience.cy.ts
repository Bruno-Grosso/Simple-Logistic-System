describe("Accessibility & Convenience Features", () => {
  it("should have a functional 'Skip to main content' accessibility link", () => {
    cy.visit("/dashboard")
    cy.get("a[href='#main-content']")
      .should("exist")
      .and("contain.text", "Skip to main content")
    cy.get("#main-content").should("exist")
  })

  it("should display timeout notification banner on login page when reason=timeout", () => {
    cy.clearCookies()
    cy.visit("/login?reason=timeout")
    cy.contains("Your session expired due to inactivity").should("be.visible")
  })

  it("should provide an 'Auto-select valid order data' button on new order page", () => {
    cy.visit("/orders/new")
    cy.get("[data-testid='auto-select-order-data']").should("be.visible")
    cy.get("[data-testid='auto-select-order-data']").click()
    cy.get("input[name='destination']").should("not.have.value", "")
  })
})
