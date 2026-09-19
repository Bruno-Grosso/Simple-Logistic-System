"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface ReportsAutoRefresherProps {
  intervalMs?: number
}

/**
 * ReportsAutoRefresher enables automatic live synchronization of the reports page.
 * It periodically refreshes the server component data and also triggers a refresh
 * whenever the tab/window regains focus or visibility, keeping graphics, KPIs, and
 * active periods up to date automatically without manual page reloading.
 */
export function ReportsAutoRefresher({ intervalMs = 6000 }: ReportsAutoRefresherProps) {
  const router = useRouter()

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        router.refresh()
      }
    }, intervalMs)

    const handleFocus = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        router.refresh()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
    }
  }, [router, intervalMs])

  return null
}
