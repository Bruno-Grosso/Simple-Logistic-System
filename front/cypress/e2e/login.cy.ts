describe("Authentication & Login UI Tests", () => {
  beforeEach(() => {
    cy.visit("/login")
  })

  it("should display the login form", () => {
    cy.get('button[type="submit"]').should("be.visible").and("contain", "Sign in")
    cy.get("form").within(() => {
      cy.get('input[name="email"]').should("be.visible")
      cy.get('input[name="password"]').should("be.visible")
      cy.get('button[type="submit"]').should("be.visible").and("contain", "Sign in")
    })
  })

  it("should require an email and an eight-character password", () => {
    cy.get('input[name="email"]')
      .should("have.attr", "required")
    cy.get('input[name="email"]').should("have.attr", "type", "email")
    cy.get('input[name="password"]').should("have.attr", "required")
    cy.get('input[name="password"]').should("have.attr", "minlength", "8")
  })

  it("should allow toggling password visibility", () => {
    cy.get('input[name="password"]').should("have.attr", "type", "password")
    cy.get('button[aria-label="Show password"]').click()
    cy.get('input[name="password"]').should("have.attr", "type", "text")
    cy.get('button[aria-label="Hide password"]').click()
    cy.get('input[name="password"]').should("have.attr", "type", "password")
  })

  it("should link users to registration", () => {
    cy.contains("a", "Register").should("have.attr", "href", "/register")
  })
})
