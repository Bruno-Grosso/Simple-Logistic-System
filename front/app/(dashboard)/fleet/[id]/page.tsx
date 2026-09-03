import { notFound } from "next/navigation"
import { AlertTriangle, Wrench } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { InfoField } from "@/components/info-field"
import { EditTruckDialog } from "@/components/edit-truck-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RouteMap } from "@/components/route-map"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"
import type { Truck, Deposit } from "@/types"

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

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FleetDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireRole("admin", "truck_driver")
  const truck = await api.trucks.getById(id)
  if (!truck) notFound()
  const isAdmin = (user.rawRole || user.role) === "admin"
  if (!isAdmin) {
    const assignedRoutes = await api.orders.getAll({ driverId: user.id })
    const routes = (await Promise.all(assignedRoutes.map((order) => api.orders.getRoute(order.id)))).flat()
    if (!routes.some((route) => route.driver_id === user.id && route.truck_id === truck.id)) notFound()
  }

  const deposits = await api.warehouses.getAll()
  const depositMap = new Map<string, Deposit>()
  deposits.forEach((d) => depositMap.set(d.id, d))

  const originDeposit = truck.origin_deposit_id ? depositMap.get(truck.origin_deposit_id) : undefined
  const destinationDeposit = truck.destination_deposit_id ? depositMap.get(truck.destination_deposit_id) : undefined

  // Fetch route geometry from Valhalla if truck is traveling or has route endpoints
  let valhallaRoute: { success: boolean; summary?: any; encodedShape?: string } | null = null
  if (truck.origin_deposit_id && truck.destination_deposit_id) {
    valhallaRoute = await api.routes.calculateRouteBetweenWarehouses(
      truck.origin_deposit_id,
      truck.destination_deposit_id,
      truck.id
    )
  }

  const cap = truck.fuel_capacity ?? 1
  const fuelPct = Math.min(100, Math.round((truck.fuel_current / cap) * 100))
  const mainCount = truck.truck_maintenance ?? 0
  const volMax = truck.volume_max ?? 1
  const volPct = Math.min(100, Math.round((truck.volume_actual / volMax) * 100))
  const wMax = truck.weight_max ?? 1
  const weightPct = Math.min(100, Math.round((truck.weight_actual / wMax) * 100))
  const highMaintenance = mainCount >= 3 || !truck.is_valid

  const performance: [string, string][] = [
    ["Speed", truck.speed != null ? `${truck.speed} km/h` : "80 km/h"],
    [
      "Fuel consumption",
      truck.fuel_consumption != null ? `${truck.fuel_consumption} L/km` : "0.35 L/km",
    ],
    ["Refrigeration", truck.has_refrigeration ? "Yes" : "No"],
    ["Service status", truck.is_valid ? "Operational" : "Maintenance required"],
    ["Maintenances recorded", `${mainCount} time(s)`],
    ["Delivering", truck.is_delivering ? "Yes" : "No"],
  ]

  const title = truck.model ?? truck.id

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: "Fleet", href: "/fleet" },
          { label: title },
        ]}
        actions={isAdmin ? <EditTruckDialog truck={truck} warehouses={deposits} /> : undefined}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Specs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoField label="Model" value={truck.model ?? "—"} />
                  <InfoField label="Truck ID" value={truck.id} />
                  <div className="sm:col-span-2">
                    <InfoField 
                      label="Size" 
                      value={(() => {
                        try {
                          const parsed = typeof truck.size === "string" ? JSON.parse(truck.size) : truck.size;
                          return parsed && typeof parsed === "object" 
                            ? `${parsed.length}m x ${parsed.width}m x ${parsed.height}m` 
                            : truck.size ?? "—";
                        } catch {
                          return truck.size ?? "—";
                        }
                      })()} 
                    />
                  </div>
                  <InfoField
                    label="Volume capacity"
                    value={
                      truck.volume_max != null ? `${truck.volume_max} m³` : "—"
                    }
                  />
                  <InfoField
                    label="Weight capacity"
                    value={
                      truck.weight_max != null ? `${truck.weight_max} kg` : "—"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Valhalla Route Map for Truck */}
            <RouteMap
              encodedShape={valhallaRoute?.encodedShape}
              summary={valhallaRoute?.summary}
              originLabel={originDeposit?.location || "Origin Warehouse"}
              destinationLabel={destinationDeposit?.location || "Destination Warehouse"}
              truckModel={truck.model}
              title={`Valhalla Navigation: ${truck.model}`}
            />

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Cargo Load</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Volume</span>
                    <span className="tabular-nums">
                      {truck.volume_actual} / {truck.volume_max ?? "—"} m³ ({volPct}%)
                    </span>
                  </div>
                  <Progress value={volPct} aria-label={`Cargo volume ${volPct} percent`} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Weight</span>
                    <span className="tabular-nums">
                      {truck.weight_actual} / {truck.weight_max ?? "—"} kg ({weightPct}%)
                    </span>
                  </div>
                  <Progress value={weightPct} aria-label={`Cargo weight ${weightPct} percent`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Fuel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className="font-display text-4xl tabular-nums text-foreground"
                  aria-label={`Fuel level ${fuelPct} percent`}
                >
                  {fuelPct}
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
                <Progress value={fuelPct} />
                <p className="text-xs text-muted-foreground tabular-nums">
                  {truck.fuel_current} / {truck.fuel_capacity ?? "—"} L
                </p>
              </CardContent>
            </Card>

            {/* Maintenance Count Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  Maintenances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className={cn(
                    "font-display text-4xl tabular-nums",
                    highMaintenance ? "text-destructive" : "text-foreground",
                  )}
                >
                  {mainCount}
                  <span className="text-sm font-normal text-muted-foreground ml-2">recorded</span>
                </p>
                {highMaintenance ? (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>High maintenance frequency detected. Schedule full inspection before long haul.</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Vehicle maintenance is within normal operational limits.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {performance.map(([label, value], i) => (
                  <div key={label}>
                    {i > 0 && <Separator className="my-3" />}
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium tabular-nums text-foreground">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
