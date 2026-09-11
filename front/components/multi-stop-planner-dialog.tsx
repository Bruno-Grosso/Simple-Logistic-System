"use client"

import { useState, useMemo } from "react"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  Navigation,
  Package,
  RotateCcw,
  Route,
  Send,
  Sparkles,
  Truck as TruckIcon,
  Warehouse as WarehouseIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RouteMap } from "@/components/route-map"
import { api } from "@/lib/api"
import type { Deposit, Order, Truck } from "@/types"

type Props = {
  orders: Order[]
  trucks: Truck[]
  warehouses: Deposit[]
}

function getWarehouseLabel(w?: Deposit): string {
  if (!w) return "Origin Warehouse"
  if (typeof w.location === "object" && w.location !== null) {
    return (w.location as any).label || (w.location as any).address || w.id
  }
  if (typeof w.location === "string") {
    try {
      const parsed = JSON.parse(w.location)
      if (parsed?.label) return parsed.label
      if (parsed?.address) return parsed.address
    } catch {}
    return w.location
  }
  return w.id
}

function getDestinationLabel(raw?: string): string {
  if (!raw) return "—"
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.label) return parsed.label
    if (parsed?.address) return parsed.address
  } catch {}
  return raw
}

export function MultiStopPlannerDialog({ orders, trucks, warehouses }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [selectedTruckId, setSelectedTruckId] = useState<string>(trucks[0]?.id || "")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || "WH-001")
  const [roundTrip, setRoundTrip] = useState<boolean>(true)

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [routeResult, setRouteResult] = useState<any | null>(null)

  // Candidate orders for delivery (Pending or Shipped)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled")
  }, [orders])

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) || trucks[0]
  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0]

  // Payload estimates (approx 35kg per selected order if items are dynamic)
  const estimatedWeight = selectedOrderIds.length * 35.0
  const maxWeight = selectedTruck?.weight_max ?? 25000.0
  const isOverloaded = selectedTruck ? estimatedWeight > maxWeight : false
  const capacityPct = maxWeight > 0 ? Math.min(100, Math.round((estimatedWeight / maxWeight) * 100)) : 0

  function toggleOrder(orderId: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  function selectAll() {
    setSelectedOrderIds(activeOrders.slice(0, 5).map((o) => o.id))
  }

  function clearAll() {
    setSelectedOrderIds([])
    setRouteResult(null)
  }

  async function handleCalculateRoute() {
    if (selectedOrderIds.length === 0) {
      toast.error("Select at least one order to route.")
      return
    }

    setLoading(true)
    try {
      const result = await api.routes.calculateMultiStopRoute({
        warehouseId: selectedWarehouseId,
        orderIds: selectedOrderIds,
        truckId: selectedTruckId || undefined,
        roundTrip,
      })

      if (!result || !result.success) {
        throw new Error(result?.error || "Could not calculate multi-stop route.")
      }

      setRouteResult(result)
      toast.success(
        `Multi-stop route calculated: ${result.total_distance_km} km across ${result.stops?.length ?? selectedOrderIds.length} stops!`
      )
    } catch (err: any) {
      toast.error(err.message || "Failed to solve delivery route.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDispatchRoute() {
    if (!routeResult || selectedOrderIds.length === 0) return
    setDispatching(true)
    try {
      for (const orderId of selectedOrderIds) {
        if (selectedTruckId) {
          // Try creating route step; if it conflicts (step already exists), update it
          const routeRes = await api.orders.addRouteStep(orderId, {
            step: 1,
            warehouse_id: selectedWarehouseId,
            truck_id: selectedTruckId,
          })
          if (!routeRes.success && routeRes.status !== 409) {
            // Fall back to updating the existing step
            await api.orders.updateRouteStep(orderId, 1, {
              warehouse_id: selectedWarehouseId,
              truck_id: selectedTruckId,
            })
          }
        }
        await api.orders.updateStatus(orderId, "Shipped")
      }
      toast.success(
        `Dispatched ${selectedOrderIds.length} orders on ${selectedTruck?.model || selectedTruckId}! Warehouse inventory & truck cargo updated.`
      )
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch route")
    } finally {
      setDispatching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Route className="size-3.5 text-primary" />
        Multi-Stop Route
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 font-display text-lg text-foreground">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Route className="size-4.5" />
              </div>
              Multi-Stop Route Planner
            </DialogTitle>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-mono">
              Valhalla TSP Solver
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Consolidate multiple customer delivery orders into an optimized multi-waypoint logistics route with vehicle capacity checks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Controls & Order Selection (Left Column) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Origin & Vehicle Selection */}
            <div className="space-y-3.5 rounded-xl border border-border p-4 bg-muted/20">
              {/* Dispatch Warehouse */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <WarehouseIcon className="size-3.5 text-primary" />
                  Dispatch Warehouse
                </label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {getWarehouseLabel(w)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned Truck */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <TruckIcon className="size-3.5 text-primary" />
                  Assigned Truck
                </label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.model || t.id} — Max: {(t.weight_max ?? 25000).toLocaleString()} kg
                    </option>
                  ))}
                </select>

                {/* Truck Capacity Live Meter */}
                {selectedTruck && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                      <span>Vehicle Capacity Usage</span>
                      <span className={isOverloaded ? "text-destructive font-bold" : "text-foreground font-mono"}>
                        {estimatedWeight.toFixed(0)} kg / {(selectedTruck.weight_max ?? 25000).toLocaleString()} kg ({capacityPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverloaded
                            ? "bg-destructive"
                            : capacityPct > 80
                            ? "bg-amber-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, capacityPct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Round-trip checkbox */}
              <div className="flex items-center gap-2.5 pt-1 border-t border-border/60">
                <input
                  type="checkbox"
                  id="round-trip-check"
                  checked={roundTrip}
                  onChange={(e) => setRoundTrip(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer"
                />
                <label htmlFor="round-trip-check" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Round-trip circuit (return truck to warehouse)
                </label>
              </div>
            </div>

            {/* Orders Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="size-3.5 text-primary" />
                  Select Orders
                  <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5 font-mono">
                    {selectedOrderIds.length} chosen
                  </Badge>
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Quick Pick
                  </button>
                  <span className="text-muted-foreground/40">•</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border/60 bg-card shadow-xs">
                {activeOrders.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">No pending or active orders available.</p>
                ) : (
                  activeOrders.map((o) => {
                    const isChecked = selectedOrderIds.includes(o.id)
                    const dest = getDestinationLabel(o.final_destination)

                    return (
                      <label
                        key={o.id}
                        className={`flex items-start gap-3 p-2.5 cursor-pointer text-xs transition-colors select-none ${
                          isChecked ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOrder(o.id)}
                          className="mt-0.5 rounded border-input size-4 text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono font-semibold text-foreground">{o.id}</span>
                            <Badge
                              variant={o.status === "Shipped" ? "default" : "secondary"}
                              className="text-[10px] py-0 h-4"
                            >
                              {o.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{dest}</span>
                          </p>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* Calculate Button */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleCalculateRoute}
                disabled={loading || selectedOrderIds.length === 0 || isOverloaded}
                className="w-full gap-2 font-medium"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Navigation className="size-4" />
                )}
                Calculate Multi-Stop Route ({selectedOrderIds.length} stops)
              </Button>

              {isOverloaded && (
                <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Selected cargo exceeds truck payload limit! Reduce stops or select a heavier vehicle.</span>
                </div>
              )}
            </div>
          </div>

          {/* Map & Itinerary Results (Right Column) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-start">
            {/* Interactive Leaflet Map */}
            <div className="rounded-xl overflow-hidden border border-border shadow-xs bg-muted/10">
              <RouteMap
                encodedShape={routeResult?.encodedShape}
                legs={routeResult?.legs}
                summary={
                  routeResult
                    ? { length: routeResult.total_distance_km, time: routeResult.total_time_seconds }
                    : undefined
                }
                originLabel={getWarehouseLabel(selectedWarehouse)}
                destinationLabel={
                  routeResult?.stops?.length
                    ? `Final Stop (${routeResult.stops[routeResult.stops.length - 1].destination})`
                    : "Waypoints"
                }
                truckModel={selectedTruck?.model}
                title={
                  routeResult
                    ? `Circuit: ${routeResult.total_orders} Deliveries`
                    : "Multi-Stop Circuit Map"
                }
                waypoints={routeResult?.waypoints}
                className="relative h-[340px] sm:h-[380px] w-full overflow-hidden"
              />
            </div>

            {/* Itinerary Results Breakdown */}
            {routeResult ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    Route Solved: <span className="font-mono text-sm text-primary">{routeResult.total_distance_km} km</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md font-mono">
                      <Clock className="size-3.5 text-primary" />
                      {Math.floor(routeResult.total_time_seconds / 3600) > 0
                        ? `${Math.floor(routeResult.total_time_seconds / 3600)}h `
                        : ""}
                      {Math.round((routeResult.total_time_seconds % 3600) / 60)} min
                    </span>
                    <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md font-mono">
                      <TruckIcon className="size-3.5 text-primary" />
                      {routeResult.collective_weight_kg ?? 0} kg payload
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Dispatch Sequence ({routeResult.stops?.length ?? 0} Stops)</span>
                    {roundTrip && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-1">
                        <RotateCcw className="size-3" /> Returns to Warehouse
                      </span>
                    )}
                  </p>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {/* Warehouse Start Stop */}
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 truncate">
                        <span className="size-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                          WH
                        </span>
                        <span className="font-semibold text-emerald-900 dark:text-emerald-300 truncate">
                          {getWarehouseLabel(selectedWarehouse)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-600">
                        Dispatch Origin
                      </Badge>
                    </div>

                    {/* Order Delivery Stops */}
                    {routeResult.stops?.map((stop: any, idx: number) => (
                      <div
                        key={stop.order_id || idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="size-5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                            {stop.stop_number || idx + 1}
                          </span>
                          <span className="truncate font-medium text-foreground">{stop.destination}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">#{stop.order_id}</span>
                        </div>
                        <span className="text-muted-foreground font-mono text-[11px] shrink-0 ml-2 font-medium">
                          {stop.leg_distance_km ? `${stop.leg_distance_km} km` : "—"}
                        </span>
                      </div>
                    ))}

                    {/* Return Stop if Round-Trip */}
                    {roundTrip && (
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="flex items-center gap-2 truncate">
                          <span className="size-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                            END
                          </span>
                          <span className="font-semibold text-rose-900 dark:text-rose-300 truncate">
                            Return: {getWarehouseLabel(selectedWarehouse)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] py-0 border-rose-500/30 text-rose-600">
                          Return to Depot
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      className="text-xs h-8"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDispatchRoute}
                      disabled={dispatching}
                      className="gap-1.5 bg-primary text-primary-foreground text-xs font-semibold h-8 cursor-pointer shadow-xs hover:bg-primary/90"
                    >
                      {dispatching ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      <span>Dispatch Route ({selectedOrderIds.length} Orders)</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-muted/10 space-y-2">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                  <Navigation className="size-5" />
                </div>
                <p className="font-semibold text-foreground text-sm">No Route Calculated Yet</p>
                <p className="max-w-md mx-auto text-muted-foreground text-[11px] leading-relaxed">
                  Select your dispatch warehouse, assign a delivery vehicle, choose candidate orders on the left, and click 
                  <strong className="text-foreground font-medium"> Calculate Multi-Stop Route</strong> to solve the multi-destination logistics circuit.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

