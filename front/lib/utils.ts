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

/**
 * Extracts a human-readable error message from any error value (Error, AxiosError,
 * backend JSON { error: "..." }, string, etc.) avoiding raw [object Object] displays.
 */
export function getErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please check the inputs and try again.",
): string {
  if (!err) return fallback
  if (typeof err === "string" && err.trim()) return err.trim()

  if (typeof err === "object") {
    const anyErr = err as any

    // Handle Axios response data
    if (anyErr.response?.data) {
      const data = anyErr.response.data
      if (typeof data === "string" && data.trim()) return data.trim()
      if (typeof data === "object") {
        if (typeof data.error === "string" && data.error.trim()) return data.error.trim()
        if (typeof data.message === "string" && data.message.trim()) return data.message.trim()
        if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim()
      }
    }

    // Handle direct error object properties
    if (typeof anyErr.error === "string" && anyErr.error.trim()) return anyErr.error.trim()
    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message.trim()
    if (typeof anyErr.statusText === "string" && anyErr.statusText.trim()) return anyErr.statusText.trim()
  }

  return fallback
}

