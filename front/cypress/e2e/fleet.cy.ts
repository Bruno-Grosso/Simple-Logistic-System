describe("Fleet Management E2E User Journey", () => {
  beforeEach(() => {
    cy.visit("/fleet")
  })

  it("should display fleet metrics overview and list of active trucks", () => {
    cy.contains("Fleet").should("be.visible")
    cy.contains("Total trucks").should("be.visible")
    cy.contains("Traveling").should("be.visible")
    cy.contains("Available").should("be.visible")
    cy.contains("Maintenance").should("be.visible")
  })

  it("should allow navigating to detailed view of a specific truck", () => {
    cy.get('a[href^="/fleet/"]').first().click()
    cy.url().should("match", /\/fleet\/.+/)
  })
})
