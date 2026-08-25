import Link from "next/link"
import { AlertTriangle, Route, Snowflake, Truck as TruckIcon, Warehouse, Wrench } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"
import { EmptyState } from "@/components/empty-state"
import type { Truck, Deposit } from "@/types"

export const dynamic = "force-dynamic"

function fleetStatus(t: Truck) {
  if (!t.is_valid) return "Maintenance" as const
  if (t.is_traveling || t.is_delivering) return "Traveling" as const
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

function truckLocation(t: Truck, depositMap: Map<string, Deposit>): string {
  if ((t.is_traveling || t.is_delivering) && t.origin_deposit_id && t.destination_deposit_id) {
    const o = depositMap.get(t.origin_deposit_id)
    const d = depositMap.get(t.destination_deposit_id)
    const a = o?.location || "—"
    const b = d?.location || "—"
    return `${a} → ${b}`
  }
  if (t.current_deposit_id) {
    const dep = depositMap.get(t.current_deposit_id)
    return dep?.location || `Warehouse ${t.current_deposit_id}`
  }
  return "—"
}

export default async function FleetPage() {
  const user = await requireRole("admin", "truck_driver")
  const role = user.rawRole || user.role
  const [allTrucks, deposits, driverOrders] = await Promise.all([
    api.trucks.getAll(),
    api.warehouses.getAll(),
    role === "truck_driver" ? api.orders.getAll({ driverId: user.id }) : Promise.resolve([]),
  ])
  const assignedTruckIds = new Set(
    (await Promise.all(driverOrders.map((order) => api.orders.getRoute(order.id))))
      .flat()
      .filter((route) => route.driver_id === user.id)
      .map((route) => route.truck_id)
      .filter((id): id is string => Boolean(id)),
  )
  const trucks = role === "truck_driver"
    ? allTrucks.filter((truck) => assignedTruckIds.has(truck.id))
    : allTrucks

  const depositMap = new Map<string, Deposit>()
  deposits.forEach((d) => depositMap.set(d.id, d))

  const traveling = trucks.filter((t) => t.is_traveling || t.is_delivering).length
  const available = trucks.filter((t) => t.is_valid && !t.is_traveling && !t.is_delivering).length
  const maintenance = trucks.filter((t) => !t.is_valid || (t.truck_maintenance ?? 0) >= 3).length

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Fleet" }]} />
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        {trucks.length === 0 ? <EmptyState icon={TruckIcon} title="No assigned trucks" description="Trucks assigned to your work will appear here." /> : <><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total trucks" value={trucks.length} icon={TruckIcon} />
          {traveling > 0 && <StatCard label="Traveling" value={traveling} icon={Route} />}
          {available > 0 && <StatCard label="Available" value={available} icon={Warehouse} />}
          {maintenance > 0 && <StatCard label="Maintenance" value={maintenance} icon={Wrench} />}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trucks.map((t) => {
            const status = fleetStatus(t)
            const cap = t.fuel_capacity ?? 1
            const fuelPct = Math.min(100, Math.round((t.fuel_current / cap) * 100))
            const mainCount = t.truck_maintenance ?? 0
            const highMaintenance = mainCount >= 3 || !t.is_valid

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
                  <p className="text-sm text-muted-foreground">{truckLocation(t, depositMap)}</p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fuel Level</span>
                      <span className="tabular-nums">{fuelPct}%</span>
                    </div>
                    <Progress value={fuelPct} aria-label={`Fuel level ${fuelPct} percent`} />
                  </div>

                  <div className="flex items-center justify-between rounded-md bg-muted/40 p-2 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="size-3.5 text-primary" />
                      Maintenances Performed
                    </span>
                    <span className={cn("font-semibold tabular-nums", highMaintenance ? "text-destructive" : "text-foreground")}>
                      {mainCount} {mainCount === 1 ? "time" : "times"}
                    </span>
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
                      {highMaintenance && (
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
        </div></>}
      </div>
    </PageShell>
  )
}
