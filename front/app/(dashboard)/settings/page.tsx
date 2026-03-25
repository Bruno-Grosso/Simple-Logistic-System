"use client"

import { useEffect, useState } from "react"
import { LogOut, Moon, Shield, Sun, Truck } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const USER = { name: "Rafael Mendes", role: "admin", email: "rafael.mendes@logisys.io" }

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]![0]! + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        checked ? "bg-primary" : "bg-input",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
        {children}
      </div>
    </section>
  )
}

export default function SettingsPage() {
  const [isLight, setIsLight] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderAlerts, setOrderAlerts] = useState(true)
  const [fleetAlerts, setFleetAlerts] = useState(false)
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true)

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"))
  }, [])

  function toggleTheme() {
    const next = !isLight
    setIsLight(next)
    document.documentElement.classList.toggle("light", next)
    try { localStorage.setItem("theme", next ? "light" : "dark") } catch {}
  }

  return (
    <div className="flex min-h-0 flex-1 items-start justify-center p-6">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <PageHeader crumbs={[{ label: "Settings" }]} />

        {/* Account */}
        <Section title="Account">
          <div className="flex items-center gap-4 py-4">
            <Avatar className="size-12">
              <AvatarFallback className="bg-primary/10 font-mono text-sm font-semibold text-primary">
                {initials(USER.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{USER.name}</p>
                <Badge variant="secondary" className="capitalize text-[10px]">
                  <Shield className="mr-1 size-2.5" />
                  {USER.role}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{USER.email}</p>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow
            label="Theme"
            description={isLight ? "Light — warm white" : "Dark — deep blue-slate"}
          >
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLight ? (
                <><Moon className="size-3.5" /> Switch to Dark</>
              ) : (
                <><Sun className="size-3.5" /> Switch to Light</>
              )}
            </button>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            label="Email notifications"
            description="Receive a daily digest to your inbox"
          >
            <Toggle id="email-notif" checked={emailNotifications} onChange={setEmailNotifications} />
          </SettingRow>
          <SettingRow
            label="Order alerts"
            description="Get notified on status changes and overdue orders"
          >
            <Toggle id="order-alerts" checked={orderAlerts} onChange={setOrderAlerts} />
          </SettingRow>
          <SettingRow
            label="Fleet alerts"
            description="Updates when trucks change state or route"
          >
            <Toggle id="fleet-alerts" checked={fleetAlerts} onChange={setFleetAlerts} />
          </SettingRow>
          <SettingRow
            label="Maintenance alerts"
            description="Warnings for trucks above 80% wear"
          >
            <Toggle id="maint-alerts" checked={maintenanceAlerts} onChange={setMaintenanceAlerts} />
          </SettingRow>
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow label="Application">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Truck className="size-3.5" />
              LogiSys
            </div>
          </SettingRow>
          <SettingRow label="Version">
            <span className="font-mono text-xs text-muted-foreground">1.0.0-beta</span>
          </SettingRow>
          <SettingRow label="Environment">
            <Badge variant="outline" className="font-mono text-[10px]">
              development
            </Badge>
          </SettingRow>
        </Section>

        {/* Session */}
        <section>
          <h2 className="mb-1 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Session
          </h2>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4">
            <div className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sign out</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You will be returned to the login screen
                </p>
              </div>
              <Link
                href="/login"
                className={buttonVariants({ variant: "destructive", size: "sm" })}
              >
                <LogOut className="size-3.5" />
                Sign out
              </Link>
            </div>
          </div>
        </section>

        <Separator />
        <p className="pb-2 text-center text-xs text-muted-foreground">
          LogiSys — UERJ Software Engineering Project
        </p>
      </div>
    </div>
  )
}
