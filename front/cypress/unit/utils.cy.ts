import { cn } from "../../lib/utils"

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
})
