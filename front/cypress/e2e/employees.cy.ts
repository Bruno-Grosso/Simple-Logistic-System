describe("Employees & Staff Directory E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/employees")
  })

  it("should display employees page title and employee list", () => {
    cy.contains("Employees").should("be.visible")
  })
})
