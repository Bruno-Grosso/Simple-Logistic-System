import Link from "next/link"
import { AlertTriangle, Route, Snowflake, Truck as TruckIcon, Warehouse, Wrench } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { TRUCKS, getDepositById, getDepositLabel } from "@/lib/mock-data"
import type { Truck } from "@/types"

function fleetStatus(t: Truck) {
  if (!t.is_valid) return "Maintenance" as const
  if (t.is_traveling) return "Traveling" as const
  return "Available" as const
}

function statusBadge(status: ReturnType<typeof fleetStatus>) {
  switch (status) {
    case "Maintenance":
      return <Badge variant="destructive">{status}</Badge>
    case "Traveling":
      return <Badge variant="default">{status}</Badge>
    case "Available":
      return (
        <Badge variant="outline" className="border-chart-2 text-chart-2">
          {status}
        </Badge>
      )
  }
}

function truckLocation(t: Truck): string {
  if (t.is_traveling && t.origin_deposit_id && t.destination_deposit_id) {
    const o = getDepositById(t.origin_deposit_id)
    const d = getDepositById(t.destination_deposit_id)
    const a = o ? getDepositLabel(o) : "—"
    const b = d ? getDepositLabel(d) : "—"
    return `${a} → ${b}`
  }
  if (t.current_deposit_id) {
    const dep = getDepositById(t.current_deposit_id)
    return dep ? getDepositLabel(dep) : "—"
  }
  return "—"
}

export default function FleetPage() {
  const traveling = TRUCKS.filter((t) => t.is_traveling).length
  const available = TRUCKS.filter((t) => t.is_valid && !t.is_traveling).length
  const maintenance = TRUCKS.filter((t) => !t.is_valid).length

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Fleet" }]} />
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total trucks" value={TRUCKS.length} icon={TruckIcon} />
          <StatCard label="Traveling" value={traveling} icon={Route} />
          <StatCard label="Available" value={available} icon={Warehouse} />
          <StatCard label="Maintenance" value={maintenance} icon={Wrench} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TRUCKS.map((t) => {
            const status = fleetStatus(t)
            const cap = t.fuel_capacity ?? 1
            const fuelPct = Math.min(100, Math.round((t.fuel_current / cap) * 100))
            const wearPct = Math.min(100, Math.round(t.wear_percentage))
            const highWear = t.wear_percentage > 80

            return (
              <Card
                key={t.id}
                className="overflow-hidden border border-border ring-0"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="font-display text-base leading-tight">
                      <Link
                        href={`/fleet/${t.id}`}
                        className="text-foreground hover:text-primary hover:underline"
                      >
                        {t.model}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{t.id}</p>
                  </div>
                  {statusBadge(status)}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{truckLocation(t)}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fuel</span>
                      <span className="tabular-nums">{fuelPct}%</span>
                    </div>
                    <Progress value={fuelPct} aria-label={`Fuel level ${fuelPct} percent`} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Wear</span>
                      <span className="tabular-nums">{wearPct}%</span>
                    </div>
                    <Progress
                      value={wearPct}
                      className={cn(highWear && "[&_[data-slot=progress-indicator]]:bg-destructive")}
                      aria-label={`Wear ${wearPct} percent`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                    <p className="text-sm tabular-nums text-foreground">
                      Cargo{" "}
                      <span className="font-medium">
                        {t.volume_actual} / {t.volume_max ?? "—"} m³
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          t.has_refrigeration ? "bg-chart-2" : "bg-muted-foreground/40",
                        )}
                        aria-label={t.has_refrigeration ? "Refrigeration equipped" : "No refrigeration"}
                      />
                      {t.has_refrigeration && (
                        <Snowflake className="size-3.5 text-chart-2" aria-hidden />
                      )}
                      {highWear && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertTriangle className="size-3.5" aria-hidden />
                          Service
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
