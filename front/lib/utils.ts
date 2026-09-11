import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDimensions(
  size: string | Record<string, any> | null | undefined,
  unit = "m",
): string {
  if (!size) return "—"

  let obj: any = size
  if (typeof size === "string") {
    const trimmed = size.trim()
    if (!trimmed) return "—"
    try {
      obj = JSON.parse(trimmed)
    } catch {
      // If it's already formatted or not valid JSON, return as-is
      return trimmed
    }
  }

  if (typeof obj === "object" && obj !== null) {
    const l = obj.length ?? obj.l
    const w = obj.width ?? obj.w
    const h = obj.height ?? obj.h
    if (l != null && w != null && h != null) {
      return `${l} × ${w} × ${h} ${unit}`
    }
  }

  return typeof size === "string" ? size : "—"
}
