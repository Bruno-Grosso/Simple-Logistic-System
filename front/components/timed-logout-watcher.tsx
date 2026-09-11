"use client"

import * as React from "react"
import { toast } from "sonner"
import { timedLogoutAction } from "@/app/login/actions"
import { INACTIVITY_TIMEOUT_KEY, DEFAULT_TIMEOUT_MINUTES } from "@/components/timeout-setting"

export function TimedLogoutWatcher() {
  const lastActiveRef = React.useRef<number>(Date.now())
  const warnedRef = React.useRef<boolean>(false)
  const timeoutMinutesRef = React.useRef<number>(DEFAULT_TIMEOUT_MINUTES)

  React.useEffect(() => {
    // Read saved preference
    const stored = localStorage.getItem(INACTIVITY_TIMEOUT_KEY)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed)) {
        timeoutMinutesRef.current = parsed
      }
    }

    function handleTimeoutChange(e: Event) {
      const customEvent = e as CustomEvent<{ minutes: number }>
      if (typeof customEvent.detail?.minutes === "number") {
        timeoutMinutesRef.current = customEvent.detail.minutes
        warnedRef.current = false
      }
    }
    window.addEventListener("logisys-timeout-change", handleTimeoutChange)

    let throttleTimer: any = null
    function onActivity() {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        lastActiveRef.current = Date.now()
        warnedRef.current = false
        throttleTimer = null
      }, 2000)
    }

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"]
    activityEvents.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }))

    const checkInterval = setInterval(() => {
      const timeoutMin = timeoutMinutesRef.current
      if (timeoutMin <= 0) return // Disabled

      const timeoutMs = timeoutMin * 60 * 1000
      const idleMs = Date.now() - lastActiveRef.current

      // 60 seconds before expiration warning
      if (idleMs >= timeoutMs - 60000 && !warnedRef.current && idleMs < timeoutMs) {
        warnedRef.current = true
        toast.warning("Session Timeout Warning", {
          description: "You have been inactive. For your security, you will be logged out in 60 seconds.",
          action: {
            label: "Stay signed in",
            onClick: () => {
              lastActiveRef.current = Date.now()
              warnedRef.current = false
            },
          },
          duration: 15000,
        })
      }

      // Reached timeout
      if (idleMs >= timeoutMs) {
        clearInterval(checkInterval)
        toast.error("Session expired due to inactivity. Signing out...")
        timedLogoutAction()
      }
    }, 5000)

    return () => {
      clearInterval(checkInterval)
      window.removeEventListener("logisys-timeout-change", handleTimeoutChange)
      activityEvents.forEach((evt) => window.removeEventListener(evt, onActivity))
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [])

  return null
}
