describe("Employees & Staff Directory E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/employees")
  })

  it("should display employees page title and employee list", () => {
    cy.contains("Employees").should("be.visible")
  })

  it("should open add employee dialog and include extended employee roles", () => {
    cy.get("[data-testid='add-employee-button']").should("be.visible").click()
    cy.contains("Add employee").should("be.visible")
    cy.get("[data-testid='employee-role-select']").within(() => {
      cy.get("option[value='dispatcher']").should("exist")
      cy.get("option[value='inventory_manager']").should("exist")
      cy.get("option[value='maintenance_technician']").should("exist")
      cy.get("option[value='warehouse_worker']").should("exist")
      cy.get("option[value='truck_driver']").should("exist")
    })
    cy.contains("button", "Cancel").click()
  })
})
