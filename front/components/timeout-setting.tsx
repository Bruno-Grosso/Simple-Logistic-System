"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { toast } from "sonner"

export const INACTIVITY_TIMEOUT_KEY = "logisys_inactivity_timeout_min"
export const DEFAULT_TIMEOUT_MINUTES = 15

export function TimeoutSettingSelector() {
  const [minutes, setMinutes] = React.useState<number>(DEFAULT_TIMEOUT_MINUTES)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(INACTIVITY_TIMEOUT_KEY)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed)) {
        setMinutes(parsed)
      }
    }
  }, [])

  function handleChange(val: number) {
    setMinutes(val)
    localStorage.setItem(INACTIVITY_TIMEOUT_KEY, val.toString())
    window.dispatchEvent(new CustomEvent("logisys-timeout-change", { detail: { minutes: val } }))
    if (val === 0) {
      toast.info("Session inactivity logout disabled")
    } else {
      toast.success(`Session timeout set to ${val} minutes`)
    }
  }

  if (!mounted) {
    return <div className="h-8 w-36 rounded-md bg-muted/50 animate-pulse" />
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
      <select
        id="session-timeout-select"
        data-testid="timeout-setting-select"
        aria-label="Session Inactivity Timeout"
        value={minutes}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value={5}>5 minutes</option>
        <option value={15}>15 minutes (Default)</option>
        <option value={30}>30 minutes</option>
        <option value={60}>1 hour</option>
        <option value={0}>Never (Disabled)</option>
      </select>
    </div>
  )
}
