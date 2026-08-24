describe("Integration Tests - User State & View Filtering", () => {
  it("should update profile details card dynamically when changing selected user profile option", () => {
    cy.visit("/profile")

    // Default view: Alice Admin
    cy.contains("Alice Admin").should("be.visible")
    cy.contains("USR-001").should("be.visible")

    // Switch to Bob Worker (USR-002)
    cy.get("select").select("USR-002", { force: true })
    cy.contains("Bob Worker").should("be.visible")
    cy.contains("USR-002").should("be.visible")
  })

  it("should filter reports by warehouse and preserve the selected query parameter", () => {
    cy.visit("/reports")
    cy.contains("Reports").should("be.visible")
    cy.get("#warehouse-filter option")
      .eq(1)
      .then(($option) => {
        cy.get("#warehouse-filter").select($option.val() as string)
        cy.url({ timeout: 10_000 }).should("include", `warehouseId=${$option.val()}`)
      })
    cy.contains("Freight Costs Financial Breakdown").should("be.visible")
  })
})
