import { notFound } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { InfoField } from "@/components/info-field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getTruckById, getDepositById, getDepositLabel } from "@/lib/mock-data"
import type { Truck } from "@/types"

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

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FleetDetailPage({ params }: PageProps) {
  const { id } = await params
  const truck = getTruckById(id)
  if (!truck) notFound()

  const cap = truck.fuel_capacity ?? 1
  const fuelPct = Math.min(100, Math.round((truck.fuel_current / cap) * 100))
  const wearPct = Math.min(100, Math.round(truck.wear_percentage))
  const volMax = truck.volume_max ?? 1
  const volPct = Math.min(100, Math.round((truck.volume_actual / volMax) * 100))
  const wMax = truck.weight_max ?? 1
  const weightPct = Math.min(100, Math.round((truck.weight_actual / wMax) * 100))
  const highWear = truck.wear_percentage > 80

  const performance: [string, string][] = [
    ["Speed", truck.speed != null ? `${truck.speed} km/h` : "—"],
    [
      "Fuel consumption",
      truck.fuel_consumption != null ? `${truck.fuel_consumption} L/km` : "—",
    ],
    ["Refrigeration", truck.has_refrigeration ? "Yes" : "No"],
    ["Service status", truck.is_valid ? "Operational" : "Maintenance required"],
    ["Delivering", truck.is_delivering ? "Yes" : "No"],
  ]

  const title = truck.model ?? truck.id

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        crumbs={[
          { label: "Fleet", href: "/fleet" },
          { label: title },
        ]}
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
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
                    <InfoField label="Size" value={truck.size ?? "—"} />
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

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground">{truckLocation(truck)}</p>
                {truck.estimated_time && (
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    ETA {new Date(truck.estimated_time).toLocaleString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Cargo</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Wear</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className={cn(
                    "font-display text-4xl tabular-nums",
                    highWear ? "text-destructive" : "text-foreground",
                  )}
                  aria-label={`Wear ${wearPct} percent`}
                >
                  {wearPct}
                  <span className="text-2xl text-muted-foreground">%</span>
                </p>
                <Progress
                  value={wearPct}
                  className={cn(
                    highWear && "[&_[data-slot=progress-indicator]]:bg-destructive",
                  )}
                />
                {highWear && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>Wear exceeds 80%. Schedule maintenance before next long haul.</p>
                  </div>
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
    </div>
  )
}
