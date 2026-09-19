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
import { decodePolyline6, selectOrdersNearRoute } from "@/lib/calculations"
import { getErrorMessage } from "@/lib/utils"
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

  // Candidate orders for delivery: Pending orders only (Shipped orders cannot be recalculated)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status === "Pending")
  }, [orders])

  const selectedTruck = trucks.find((t) => t.id === selectedTruckId) || trucks[0]
  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0]

  // Payload estimates (approx 35kg per selected order if items are dynamic)
  const estimatedWeight = selectedOrderIds.length * 35.0
  const maxWeight = selectedTruck?.weight_max ?? 25000.0
  const isOverloaded = selectedTruck ? estimatedWeight > maxWeight : false
  const capacityPct = maxWeight > 0 ? Math.min(100, Math.round((estimatedWeight / maxWeight) * 100)) : 0

  const [quickPicking, setQuickPicking] = useState(false)
  const [corridorDistances, setCorridorDistances] = useState<Record<string, number>>({})
  const [fleetRoutes, setFleetRoutes] = useState<any[]>([])
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0)
  const [plannerError, setPlannerError] = useState<string | null>(null)

  function toggleOrder(orderId: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  function selectFleetRoute(index: number) {
    if (!fleetRoutes[index]) return
    setActiveRouteIndex(index)
    const r = fleetRoutes[index]
    setSelectedOrderIds(r.order_ids || [])
    if (r.truck_id) setSelectedTruckId(r.truck_id)
    setRouteResult(r.circuit)

    const distMap: Record<string, number> = {}
    if (r.anchor_order_id) distMap[r.anchor_order_id] = 0
    if (Array.isArray(r.corridor_scored_candidates)) {
      for (const cand of r.corridor_scored_candidates) {
        distMap[cand.order_id] = cand.distance_to_route_km
      }
    }
    setCorridorDistances(distMap)
  }

  async function handleQuickPick() {
    setPlannerError(null)
    if (activeOrders.length === 0) {
      const msg = "No pending orders available to auto-select corridor route for this warehouse."
      setPlannerError(msg)
      toast.info(msg)
      return
    }

    setQuickPicking(true)
    try {
      // 1. Call backend Valhalla route corridor fleet multi-routes API
      const result = await api.routes.calculateQuickPick({
        warehouseId: selectedWarehouseId,
        truckId: selectedTruckId || undefined,
        roundTrip,
        maxOrders: 4,
      })

      if (result && result.success && result.selected_order_ids?.length > 0) {
        if (Array.isArray(result.routes) && result.routes.length > 0) {
          setFleetRoutes(result.routes)
          setActiveRouteIndex(0)
          const primary = result.routes[0]
          setSelectedOrderIds(primary.order_ids || [])
          if (primary.truck_id) setSelectedTruckId(primary.truck_id)
          setRouteResult(primary.circuit)

          const distMap: Record<string, number> = {}
          if (primary.anchor_order_id) distMap[primary.anchor_order_id] = 0
          if (Array.isArray(primary.corridor_scored_candidates)) {
            for (const cand of primary.corridor_scored_candidates) {
              distMap[cand.order_id] = cand.distance_to_route_km
            }
          }
          setCorridorDistances(distMap)

          toast.success(
            `Quick Pick: Generated ${result.routes.length} multi-routes (${result.total_orders || result.selected_order_ids.length} orders partitioned across fleet)!`
          )
        } else {
          setSelectedOrderIds(result.selected_order_ids)
          setRouteResult(result)

          const distMap: Record<string, number> = {}
          if (result.anchor_order_id) {
            distMap[result.anchor_order_id] = 0
          }
          if (Array.isArray(result.corridor_scored_candidates)) {
            for (const cand of result.corridor_scored_candidates) {
              distMap[cand.order_id] = cand.distance_to_route_km
            }
          }
          setCorridorDistances(distMap)

          toast.success(
            `Quick Pick: Selected ${result.selected_order_ids.length} corridor orders (${result.total_distance_km} km)!`
          )
        }
      } else {
        // Fallback: client-side corridor proximity ranking
        const pending = activeOrders.filter((o) => o.status === "Pending")
        const anchor = pending[0] || activeOrders[0]

        const anchorRes = await api.routes.calculateMultiStopRoute({
          warehouseId: selectedWarehouseId,
          orderIds: [anchor.id],
          truckId: selectedTruckId || undefined,
          roundTrip: false,
        })

        let routePoints: [number, number][] = []
        if (anchorRes?.legs?.[0]?.shape) {
          routePoints = decodePolyline6(anchorRes.legs[0].shape)
        } else if (anchorRes?.encodedShape) {
          routePoints = decodePolyline6(anchorRes.encodedShape)
        }

        const picked = selectOrdersNearRoute({
          orders: activeOrders,
          routePoints,
          maxOrders: 4,
          maxWeightKg: maxWeight,
        })

        const pickedIds = [anchor.id, ...picked.filter((p) => p.order.id !== anchor.id).map((p) => p.order.id)]
        setSelectedOrderIds(pickedIds)

        const distMap: Record<string, number> = { [anchor.id]: 0 }
        picked.forEach((p) => {
          distMap[p.order.id] = p.distanceToRouteKm
        })
        setCorridorDistances(distMap)

        const fullRoute = await api.routes.calculateMultiStopRoute({
          warehouseId: selectedWarehouseId,
          orderIds: pickedIds,
          truckId: selectedTruckId || undefined,
          roundTrip,
        })

        if (fullRoute && fullRoute.success) {
          setRouteResult(fullRoute)
          toast.success(
            `Quick Pick: Selected ${pickedIds.length} corridor orders (${fullRoute.total_distance_km} km)!`
          )
        } else {
          toast.info(`Selected ${pickedIds.length} orders along the route corridor.`)
        }
      }
    } catch (err: any) {
      console.warn("Quick pick error:", err)
      toast.error(err.message || "Could not complete Quick Pick.")
    } finally {
      setQuickPicking(false)
    }
  }

  function clearAll() {
    setSelectedOrderIds([])
    setRouteResult(null)
    setCorridorDistances({})
    setFleetRoutes([])
    setActiveRouteIndex(0)
  }

  async function handleCalculateRoute() {
    setPlannerError(null)
    if (selectedOrderIds.length === 0) {
      const msg = "Please select at least one order to route."
      setPlannerError(msg)
      toast.error(msg)
      return
    }

    if (isOverloaded) {
      const msg = `Selected orders weight (${estimatedWeight.toFixed(0)} kg) exceeds assigned truck capacity (${maxWeight} kg). Please deselect some orders or select a truck with higher capacity.`
      setPlannerError(msg)
      toast.error(msg)
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
        throw new Error(result?.error || "Could not calculate multi-stop route with Valhalla.")
      }

      setRouteResult(result)
      toast.success(
        `Multi-stop route calculated: ${result.total_distance_km} km across ${result.stops?.length ?? selectedOrderIds.length} stops!`
      )
    } catch (err: any) {
      const msg = getErrorMessage(err, "Failed to solve delivery route with Valhalla routing engine.")
      setPlannerError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDispatchRoute(dispatchAll = false) {
    setPlannerError(null)
    if (!routeResult && !dispatchAll) {
      const msg = "Please calculate a route first before attempting dispatch."
      setPlannerError(msg)
      toast.error(msg)
      return
    }
    setDispatching(true)
    try {
      const routesToDispatch = dispatchAll && fleetRoutes.length > 0
        ? fleetRoutes
        : [{
            truck_id: selectedTruckId,
            order_ids: selectedOrderIds,
            circuit: routeResult,
          }]

      let totalDispatched = 0
      for (const r of routesToDispatch) {
        const truckId = r.truck_id || selectedTruckId
        const stops = r.circuit?.stops || []
        const stopOrderMap = new Map<string, number>()
        stops.forEach((s: any, idx: number) => {
          if (s.order_id) stopOrderMap.set(s.order_id, s.stop_number || idx + 1)
        })

        for (const orderId of r.order_ids) {
          const stepNum = stopOrderMap.get(orderId) || 1
          if (truckId) {
            // Update or insert route step with assigned truck and sequential stop number
            const routeRes = await api.orders.addRouteStep(orderId, {
              step: stepNum,
              warehouse_id: selectedWarehouseId,
              truck_id: truckId,
            })
            if (!routeRes.success && routeRes.status !== 409) {
              await api.orders.updateRouteStep(orderId, stepNum, {
                warehouse_id: selectedWarehouseId,
                truck_id: truckId,
              })
            }
          }
          await api.orders.updateStatus(orderId, "Shipped")
          totalDispatched++
        }
      }

      toast.success(
        `Dispatched ${totalDispatched} orders across ${routesToDispatch.length} multi-stop route(s)! Fleet cargo and warehouse inventory updated.`
      )
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      const msg = getErrorMessage(err, "Failed to dispatch route to fleet and update stock.")
      setPlannerError(msg)
      toast.error(msg)
    } finally {
      setDispatching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setPlannerError(null); }}>
      <DialogTrigger
        data-testid="multi-stop-route-trigger"
        onClick={() => setOpen(true)}
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
      >
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
            Build optimal multi-destination circuits using Valhalla TSP routing or corridor-based Quick Pick for your fleet.
          </DialogDescription>
        </DialogHeader>

        {plannerError && (
          <div
            role="alert"
            aria-live="assertive"
            className="my-3 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              <span>{plannerError}</span>
            </div>
            <button
              type="button"
              onClick={() => setPlannerError(null)}
              className="text-destructive/70 hover:text-destructive text-xs font-semibold px-1"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Multi-Route Fleet Partition Bar (when multi-routes are recommended) */}
          {fleetRoutes.length > 0 && (
            <div className="lg:col-span-12 flex flex-wrap items-center justify-between gap-2.5 p-3 bg-primary/5 border border-primary/20 rounded-xl shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Fleet Multi-Routes:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {fleetRoutes.map((r, idx) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectFleetRoute(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        activeRouteIndex === idx
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "bg-background text-muted-foreground hover:text-foreground border border-border hover:bg-muted/40 font-medium"
                      }`}
                    >
                      {r.name} ({r.order_ids?.length ?? 0} stops • {r.circuit?.total_distance_km ?? 0} km • {r.truck?.model || r.truck_id})
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDispatchRoute(true)}
                disabled={dispatching}
                className="text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-medium"
              >
                {dispatching ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                Dispatch All {fleetRoutes.length} Routes
              </Button>
            </div>
          )}

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
                    data-testid="quick-pick-route-button"
                    onClick={handleQuickPick}
                    disabled={quickPicking || loading || activeOrders.length === 0}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {quickPicking ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3 text-primary" />
                    )}
                    Quick Pick (Route Corridor)
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
                    const corridorDist = corridorDistances[o.id]
                    const isAnchor = (routeResult?.anchor_order_id === o.id) || (corridorDist === 0 && isChecked)

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
                            <div className="flex items-center gap-1.5">
                              {isAnchor && (
                                <Badge variant="default" className="text-[9px] py-0 h-4 bg-emerald-600 hover:bg-emerald-600 text-white font-normal">
                                  Anchor
                                </Badge>
                              )}
                              {corridorDist !== undefined && !isAnchor && (
                                <Badge variant="outline" className="text-[9px] py-0 h-4 text-primary border-primary/40 font-mono">
                                  ~{corridorDist} km detour
                                </Badge>
                              )}
                              <Badge
                                variant={o.status === "Shipped" ? "default" : "secondary"}
                                className="text-[10px] py-0 h-4"
                              >
                                {o.status}
                              </Badge>
                            </div>
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
                <div role="alert" aria-live="assertive" className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
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
                      onClick={() => handleDispatchRoute(false)}
                      disabled={dispatching}
                      className="gap-1.5 bg-primary text-primary-foreground text-xs font-semibold h-8 cursor-pointer shadow-xs hover:bg-primary/90"
                    >
                      {dispatching ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      <span>Dispatch {fleetRoutes[activeRouteIndex]?.name || "Route"} ({selectedOrderIds.length} Orders)</span>
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

