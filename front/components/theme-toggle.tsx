"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Compact Icon Toggle Button.
 * Toggles between light and dark mode with smooth icon animation.
 */
export function ThemeToggle({
  className,
  variant = "ghost",
  size = "icon-sm",
}: {
  className?: string
  variant?: "ghost" | "outline" | "default" | "secondary"
  size?: "icon" | "icon-sm" | "icon-xs" | "default" | "sm"
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("text-muted-foreground", className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-4 opacity-50" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-slate-700 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </Button>
  )
}

/**
 * Sidebar Toggle Item with label and icon.
 * Collapses gracefully when sidebar is collapsed.
 */
export function SidebarThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
        className
      )}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent/80 text-sidebar-accent-foreground">
        {isDark ? (
          <Sun className="size-3.5 text-amber-400" />
        ) : (
          <Moon className="size-3.5 text-primary" />
        )}
      </div>
      <div className="flex flex-1 items-center justify-between group-data-[collapsible=icon]:hidden">
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {isDark ? "Dark" : "Light"}
        </span>
      </div>
    </button>
  )
}

/**
 * Full Theme Selector for Settings page.
 * Provides explicit Light, Dark, and System options with preview cards.
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-border bg-muted/40 animate-pulse"
          />
        ))}
      </div>
    )
  }

  const options = [
    {
      id: "light",
      label: "Light",
      description: "Warm daylight & amber",
      icon: Sun,
      previewBg: "bg-white border-slate-200 text-slate-900",
    },
    {
      id: "dark",
      label: "Dark",
      description: "Deep industrial slate",
      icon: Moon,
      previewBg: "bg-slate-900 border-slate-700 text-slate-100",
    },
    {
      id: "system",
      label: "System",
      description: "Matches your device",
      icon: Laptop,
      previewBg: "bg-gradient-to-r from-white to-slate-900 border-slate-300 text-slate-800",
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isSelected = theme === opt.id
          const Icon = opt.icon

          return (
            <button
              key={opt.id}
              type="button"
              data-testid={`theme-${opt.id}-btn`}
              onClick={() => setTheme(opt.id)}
              className={cn(
                "relative flex flex-col items-start gap-2.5 rounded-xl border p-3.5 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border shadow-2xs",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                {isSelected && (
                  <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Active
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
