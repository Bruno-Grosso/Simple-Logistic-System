describe("3D Models Visualization and Lighthouse Quality Audits", () => {
  describe("3D Digital Twin Visualizations", () => {
    beforeEach(() => {
      cy.loginAsAdmin()
    })

    it("renders the 3D Vehicle Twin on truck detail page with controls and metadata", () => {
      cy.visit("/fleet/TRK-001")
      cy.url().should("include", "/fleet/TRK-001")

      // Verify the 3D Vehicle Twin card
      cy.contains("3D Vehicle Twin").should("be.visible")
      cy.get('[aria-label="Interactive 3D truck"]').should("exist")
      cy.get('canvas').should("exist")

      // Verify interactive controls
      cy.get('button[aria-label="Pause auto rotation"]').should("be.visible").click()
      cy.get('button[aria-label="Enable auto rotation"]').should("be.visible").click()
      cy.get('button[aria-label="Reset 3D camera view"]').should("be.visible").click()

      // Verify specs & details remain visible and accessible
      cy.contains("Specs").should("be.visible")
      cy.contains("TRK-001").should("be.visible")
    })

    it("renders the 3D Facility & Yard Twin on deposit detail page with controls and metadata", () => {
      cy.visit("/deposits/WH-001")
      cy.url().should("include", "/deposits/WH-001")

      // Verify the 3D Facility Twin card
      cy.contains("3D Facility Twin").should("be.visible")
      cy.get('[aria-label="Interactive 3D model of logistics warehouse facility"]').should("exist")
      cy.get('canvas').should("exist")

      // Verify interactive controls
      cy.get('button[aria-label="Pause auto rotation"]').should("be.visible").click()
      cy.get('button[aria-label="Enable auto rotation"]').should("be.visible").click()
      cy.get('button[aria-label="Reset 3D camera view"]').should("be.visible").click()

      // Verify overlay indicators
      cy.contains("3 Loading Bays Active").should("be.visible")
      cy.contains("Deposit details").should("be.visible")
    })
  })

  describe("Lighthouse SEO, Metadata & Accessibility Checks", () => {
    it("provides complete SEO metadata, viewport, and OpenGraph tags", () => {
      cy.visit("/login")

      // Meta viewport
      cy.get('meta[name="viewport"]')
        .should("have.attr", "content")
        .and("include", "width=device-width")

      // Meta description
      cy.get('meta[name="description"]')
        .should("have.attr", "content")
        .and("not.be.empty")

      // OpenGraph tags
      cy.get('meta[property="og:title"]').should("exist")
      cy.get('meta[property="og:description"]').should("exist")
      cy.get('meta[property="og:site_name"]').should("exist")

      // Favicon & Icon links
      cy.get('link[rel="icon"]').should("exist")

      // Heading hierarchy check
      cy.get("h1").should("exist")
    })

    it("includes skip-to-content accessibility mechanism in dashboard layout", () => {
      cy.loginAsAdmin()
      cy.visit("/dashboard")

      cy.get('a[href="#main-content"]')
        .should("exist")
        .and("contain.text", "Skip to main content")

      cy.get('#main-content').should("exist")
    })

    it("serves security and performance headers on HTTP responses", () => {
      cy.request("/login").then((response) => {
        expect(response.headers).to.have.property("x-content-type-options", "nosniff")
        expect(response.headers).to.have.property("x-frame-options", "SAMEORIGIN")
        expect(response.headers).to.have.property("referrer-policy", "strict-origin-when-cross-origin")
        expect(response.headers).to.not.have.property("x-powered-by")
      })
    })

    it("serves robots.txt and manifest.json correctly", () => {
      cy.request("/robots.txt").then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.include("User-agent: *")
      })

      cy.request("/manifest.json").then((response) => {
        expect(response.status).to.eq(200)
        expect(response.headers["content-type"]).to.include("application/json")
        expect(response.body).to.have.property("short_name", "LogiSys")
      })
    })
  })
})
