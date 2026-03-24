"use client"

import { Fuel, Gauge, Refrigerator, Truck, Warehouse, Weight, Wind } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TruckScene } from "@/components/truck-scene"
import type { LucideIcon } from "lucide-react"
import type { Truck as TruckType } from "@/types"

interface TruckFleetDialogProps {
  truck: TruckType
  originLabel?: string
  destinationLabel?: string
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function GaugeRow({
  label,
  value,
  max,
  pct,
  unit,
  danger,
}: {
  label: string
  value: number
  max: number
  pct: number
  unit: string
  danger?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={danger ? "font-semibold text-destructive" : "font-medium tabular-nums"}>
          {value.toLocaleString("pt-BR")}
          {unit} / {max.toLocaleString("pt-BR")}
          {unit} — {pct}%
        </span>
      </div>
      <Progress
        value={pct}
        className={danger ? "[&>div]:bg-destructive" : undefined}
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

export function TruckFleetDialog({ truck, originLabel, destinationLabel }: TruckFleetDialogProps) {
  const fuelCap = truck.fuel_capacity ?? 1
  const fuelPct = Math.round((truck.fuel_current / fuelCap) * 100)
  const volPct  = truck.volume_max ? Math.round((truck.volume_actual / truck.volume_max) * 100) : 0
  const wearPct = truck.wear_percentage
  const fuelDanger = fuelPct < 20
  const wearDanger = wearPct > 80

  const statusLabel = !truck.is_valid
    ? "Maintenance"
    : truck.is_traveling
    ? "Traveling"
    : "Available"

  const statusVariant = !truck.is_valid
    ? "destructive"
    : truck.is_traveling
    ? "default"
    : "outline"

  return (
    <Dialog>
      {/* ── Trigger: the existing truck row ─────────────────────────── */}
      <DialogTrigger
        className="w-full rounded-lg border border-border/80 bg-card/50 p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View 3D details for ${truck.model ?? truck.id}`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{truck.model}</p>
            <p className="font-mono text-xs text-muted-foreground">{truck.id.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fuel className="size-3.5 shrink-0" aria-hidden />
            <span className="text-xs font-medium tabular-nums">{fuelPct}%</span>
          </div>
        </div>
        <Progress value={fuelPct} aria-label="Fuel level" />
      </DialogTrigger>

      {/* ── Dialog ──────────────────────────────────────────────────── */}
      <DialogContent
        className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="pb-0">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="font-display text-xl">
                {truck.model ?? truck.id}
              </DialogTitle>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {truck.id.toUpperCase()}
              </p>
            </div>
            <Badge
              variant={statusVariant}
              className={statusVariant === "outline" ? "border-chart-2 text-chart-2" : undefined}
            >
              {statusLabel}
            </Badge>
          </div>
        </DialogHeader>

        {/* 3-D scene */}
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          <TruckScene />
        </div>

        {/* ── Stats grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={Wind} label="Top speed" value={`${truck.speed ?? "—"} km/h`} />
          <Stat
            icon={Fuel}
            label="Consumption"
            value={truck.fuel_consumption ? `${truck.fuel_consumption} L/km` : "—"}
          />
          <Stat
            icon={Weight}
            label="Max weight"
            value={`${(truck.weight_max ?? 0).toLocaleString("pt-BR")} kg`}
          />
          <Stat
            icon={Gauge}
            label="Wear rate"
            value={truck.wear_rate ? `${truck.wear_rate}/km` : "—"}
          />
          <Stat
            icon={Refrigerator}
            label="Refrigeration"
            value={truck.has_refrigeration ? "Yes" : "No"}
          />
          <Stat
            icon={Truck}
            label="Delivering"
            value={truck.is_delivering ? "Yes" : "No"}
          />
        </div>

        <Separator />

        {/* ── Route ───────────────────────────────────────────────── */}
        {(originLabel || destinationLabel) && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Route
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Warehouse className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="font-medium">{originLabel ?? "—"}</span>
              <span className="mx-1 text-muted-foreground">→</span>
              <Warehouse className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="font-medium">{destinationLabel ?? "—"}</span>
            </div>
            {truck.estimated_time && (
              <p className="text-xs text-muted-foreground">
                ETA:{" "}
                {new Date(truck.estimated_time).toLocaleString("pt-BR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        )}

        {/* ── Gauges ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <GaugeRow
            label="Fuel"
            value={truck.fuel_current}
            max={fuelCap}
            pct={fuelPct}
            unit=" L"
            danger={fuelDanger}
          />
          <GaugeRow
            label="Cargo volume"
            value={truck.volume_actual}
            max={truck.volume_max ?? 1}
            pct={volPct}
            unit=" m³"
          />
          <GaugeRow
            label="Wear"
            value={wearPct}
            max={100}
            pct={wearPct}
            unit="%"
            danger={wearDanger}
          />
        </div>

        {wearDanger && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            High wear detected. Schedule maintenance before next dispatch.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
