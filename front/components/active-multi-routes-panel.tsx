"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Package,
  Route,
  Truck as TruckIcon,
  Warehouse,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RouteMap, type Waypoint } from "@/components/route-map"
import { cn } from "@/lib/utils"

export type ActiveMultiRouteItem = {
  truck_id: string
  truck_model: string
  warehouse_id: string
  total_orders: number
  order_ids: string[]
  steps: Array<{
    order_id: string
    step: number
    destination?: string
    status: string
    time_limit?: string
    warehouse_id?: string
    estimated_time?: string
    arrived_at?: string
  }>
  circuit?: any
}

type Props = {
  routes: ActiveMultiRouteItem[]
  defaultSelectedTruckId?: string
  className?: string
}

function parseDestination(raw?: string): string {
  if (!raw) return "—"
  try {
    const o = JSON.parse(raw)
    return o.label || o.address || raw
  } catch {
    return raw
  }
}

export function ActiveMultiRoutesPanel({ routes, defaultSelectedTruckId, className }: Props) {
  const [selectedTruckId, setSelectedTruckId] = useState<string>(
    defaultSelectedTruckId || routes[0]?.truck_id || ""
  )
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!routes || routes.length === 0) {
    return (
      <Card className={cn("border-border shadow-sm overflow-hidden", className)} data-testid="active-multi-routes-panel">
        <CardHeader className="bg-muted/30 py-3.5 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Route className="size-4" />
              </div>
              <div>
                <CardTitle className="font-display text-base text-foreground">
                  Active Multi-Routing Fleet Operations
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No active multi-stop circuits currently in progress. Dispatched routes will appear here.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              0 Active Circuits
            </Badge>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const selectedRoute = routes.find((r) => r.truck_id === selectedTruckId) || routes[0]

  // Extract waypoints for RouteMap from the selected route's circuit
  const waypoints: Waypoint[] = selectedRoute.circuit?.waypoints?.map((w: any) => ({
    label: w.label || `Stop ${w.index}`,
    lat: w.lat,
    lon: w.lon,
    type: w.type,
    orderId: w.orderId,
  })) || []

  return (
    <Card className={cn("border-border shadow-sm overflow-hidden", className)} data-testid="active-multi-routes-panel">
      <CardHeader className="bg-muted/30 border-b border-border py-3 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Route className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="font-display text-base text-foreground">
                  Active Multi-Routing Fleet Operations
                </CardTitle>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs font-semibold">
                  {routes.length} Active Circuit{routes.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Live multi-stop routes, stop sequencing, and road corridor itineraries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? "Expand active routes panel" : "Collapse active routes panel"}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="size-3.5" />
                  Show Circuits
                </>
              ) : (
                <>
                  <ChevronUp className="size-3.5" />
                  Minimize
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Multi-Route Tabs / Truck Selector */}
        {!isCollapsed && routes.length >= 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1" role="tablist" aria-label="Active multi-routes">
            <span className="text-xs font-medium text-muted-foreground shrink-0 flex items-center gap-1">
              <TruckIcon className="size-3.5" /> Truck Routes:
            </span>
            {routes.map((r, idx) => {
              const isSelected = r.truck_id === selectedRoute.truck_id
              const letter = String.fromCharCode(65 + idx)
              return (
                <button
                  key={r.truck_id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedTruckId(r.truck_id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="font-bold">Circuit {letter}:</span>
                  <span>{r.truck_model}</span>
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] px-1 py-0 h-4 font-mono",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : ""
                    )}
                  >
                    {r.total_orders} stops
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Circuit Summary Banner */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <TruckIcon className="size-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">
                  {selectedRoute.truck_model} ({selectedRoute.truck_id})
                </span>
              </div>
              <span className="text-muted-foreground text-xs">•</span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Warehouse className="size-3.5" />
                <span>Base: {selectedRoute.warehouse_id}</span>
              </div>
              <span className="text-muted-foreground text-xs">•</span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5" />
                <span>{selectedRoute.total_orders} Orders Dispatched</span>
              </div>
            </div>

            {selectedRoute.circuit && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  {selectedRoute.circuit.total_distance_km} km
                </span>
                <span className="text-muted-foreground">
                  (~{Math.round((selectedRoute.circuit.total_time_seconds || 3600) / 60)} mins driving)
                </span>
              </div>
            )}
          </div>

          {/* Grid: Map + Stop Sequencing List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Interactive Map */}
            <div className="lg:col-span-7">
              <RouteMap
                encodedShape={selectedRoute.circuit?.encodedShape}
                legs={selectedRoute.circuit?.legs}
                summary={{
                  length: selectedRoute.circuit?.total_distance_km,
                  time: selectedRoute.circuit?.total_time_seconds,
                }}
                waypoints={waypoints}
                title={`Multi-Route Circuit: ${selectedRoute.truck_model}`}
                originLabel={`Base Warehouse ${selectedRoute.warehouse_id}`}
                className="h-[340px] sm:h-[380px] w-full"
              />
            </div>

            {/* Stop Sequence Itinerary */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Stop Sequence Itinerary
                </h4>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedRoute.steps.length} Waypoints
                </span>
              </div>

              <div className="max-h-[330px] overflow-y-auto space-y-2 pr-1">
                {selectedRoute.steps.map((st, idx) => {
                  const dest = parseDestination(st.destination)
                  const isDelivered = st.status === "Delivered"

                  return (
                    <div
                      key={`${st.order_id}-${st.step}`}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-colors"
                    >
                      <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                        {st.step || idx + 1}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <Link
                            href={`/orders/${st.order_id}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            #{st.order_id}
                            <ArrowRight className="size-2.5 opacity-60" />
                          </Link>
                          <Badge
                            variant={isDelivered ? "outline" : "default"}
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-4 font-normal",
                              isDelivered ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : ""
                            )}
                          >
                            {st.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-foreground truncate" title={dest}>
                          {dest}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>Deadline: {st.time_limit || "—"}</span>
                          {st.estimated_time && (
                            <span className="tabular-nums">ETA: {st.estimated_time.split(" ")[1] || st.estimated_time}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
