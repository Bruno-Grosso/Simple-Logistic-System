import { cn, formatDimensions } from "../../lib/utils"

describe("Unit Tests - UI Utility Functions (lib/utils.ts)", () => {
  it("should merge CSS class names and resolve Tailwind conflicts", () => {
    const result = cn("px-2 py-1", "bg-red-500", "px-4")
    expect(result).to.include("px-4")
    expect(result).to.include("py-1")
    expect(result).to.include("bg-red-500")
    expect(result).not.to.include("px-2")
  })

  it("should handle conditional and falsy class inputs gracefully", () => {
    const isTrue = true
    const isFalse = false
    const result = cn("base-class", isTrue && "active", isFalse && "hidden", null, undefined)
    expect(result).to.equal("base-class active")
  })

  describe("formatDimensions", () => {
    it("should format stringified JSON dimensions correctly for trucks and warehouses", () => {
      const truckSize = '{"length":13.6,"width":2.5,"height":2.7}'
      expect(formatDimensions(truckSize)).to.equal("13.6 × 2.5 × 2.7 m")
    })

    it("should handle abbreviated object keys (l, w, h)", () => {
      expect(formatDimensions({ l: 10, w: 20, h: 5 })).to.equal("10 × 20 × 5 m")
    })

    it("should support custom units", () => {
      const productSize = '{"length":10,"width":10,"height":20}'
      expect(formatDimensions(productSize, "cm")).to.equal("10 × 10 × 20 cm")
    })

    it("should return fallback for missing or empty inputs", () => {
      expect(formatDimensions(null)).to.equal("—")
      expect(formatDimensions(undefined)).to.equal("—")
      expect(formatDimensions("")).to.equal("—")
    })
  })
})

