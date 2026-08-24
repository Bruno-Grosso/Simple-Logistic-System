import { notFound } from "next/navigation"
import {
  CheckCircle2,
  RouteOff,
  Truck,
  Warehouse,
  DollarSign,
  Clock,
  Timer,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { InfoField } from "@/components/info-field"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { RouteMap } from "@/components/route-map"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { calculateFreightEstimate, calculateOrderETA } from "@/lib/calculations"
import type { OrderStatus, User, Product, Deposit, Truck as TruckType, OrderETA, OrderRoute } from "@/types"

function parseDestination(raw: string | undefined): string {
  if (!raw) return "—"
  try {
    const o = JSON.parse(raw) as { label?: string }
    return o.label ?? raw
  } catch {
    return raw
  }
}

function orderStatusBadge(status: OrderStatus) {
  switch (status) {
    case "Pending":
      return <Badge variant="secondary">{status}</Badge>
    case "Shipped":
      return <Badge variant="default">{status}</Badge>
    case "Delivered":
      return (
        <Badge variant="outline" className="border-chart-2 text-chart-2">
          {status}
        </Badge>
      )
    case "Cancelled":
      return <Badge variant="destructive">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDt(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await api.orders.getById(id)
  if (!order) notFound()

  const [
    users,
    items,
    routeSteps,
    costData,
    etaData,
    products,
    warehouses,
    trucks,
  ] = await Promise.all([
    api.users.getAll(),
    api.orders.getItems(order.id),
    api.orders.getRoute(order.id),
    api.orders.getCost(order.id),
    api.orders.getETA(order.id),
    api.products.getAll(),
    api.warehouses.getAll(),
    api.trucks.getAll(),
  ])

  const userMap = new Map<string, User>()
  users.forEach((u) => userMap.set(u.id, u))

  const productMap = new Map<string, Product>()
  products.forEach((p) => productMap.set(p.id, p))

  const depositMap = new Map<string, Deposit>()
  warehouses.forEach((w) => depositMap.set(w.id, w))

  const truckMap = new Map<string, TruckType>()
  trucks.forEach((t) => truckMap.set(t.id, t))

  const client = userMap.get(order.client_id)
  const receiver = order.receiver_id ? userMap.get(order.receiver_id) : undefined

  // Pick origin warehouse from first valid route step or closest logical regional warehouse
  let originWarehouseId = routeSteps.find((s) => s.deposit_id && depositMap.has(s.deposit_id))?.deposit_id
  if (!originWarehouseId && warehouses.length > 0) {
    const dest = order.final_destination || ""
    const matchedWarehouse = warehouses.find((w) => {
      const loc = w.location || ""
      if (dest.includes("Teresópolis") && loc.includes("Teresópolis")) return true
      if (dest.includes("Friburgo") && loc.includes("Friburgo")) return true
      if (dest.includes("São José") && loc.includes("São José")) return true
      if (dest.includes("Bom Jardim") && loc.includes("Bom Jardim")) return true
      if (dest.includes("Petrópolis") && loc.includes("Petrópolis")) return true
      return false
    })
    originWarehouseId = matchedWarehouse?.id || warehouses[0]?.id || "WH-001"
  } else if (!originWarehouseId) {
    originWarehouseId = "WH-001"
  }
  const originWarehouse = depositMap.get(originWarehouseId) || warehouses[0]

  // Calculate route warehouses and average gas price
  const routeWarehouseIdSet = new Set<string>([originWarehouseId])
  routeSteps.forEach((s) => {
    if (s.deposit_id && depositMap.has(s.deposit_id)) routeWarehouseIdSet.add(s.deposit_id)
  })
  const routeWarehouseIds = Array.from(routeWarehouseIdSet)
  const routeWarehouses = routeWarehouseIds.map((id) => depositMap.get(id)).filter(Boolean) as Deposit[]
  const avgGasPrice =
    routeWarehouses.length > 0
      ? Math.round((routeWarehouses.reduce((acc, w) => acc + (w.fuel_price ?? 5.89), 0) / routeWarehouses.length) * 100) / 100
      : (originWarehouse?.fuel_price ?? 5.89)

  // Assigned truck and driver wage
  const assignedTruckId = routeSteps.find((s) => s.truck_id && truckMap.has(s.truck_id))?.truck_id || trucks[0]?.id
  const assignedTruck = assignedTruckId ? truckMap.get(assignedTruckId) : trucks[0]
  const drivers = users.filter((u) => u.rawRole === "truck_driver" || u.work_position?.includes("Driver"))
  const driverWage = drivers[0]?.wage ?? 50.0

  // Effective route tracking steps to display in timeline
  const displayRouteSteps: OrderRoute[] =
    routeSteps.length > 0
      ? routeSteps
      : [
          {
            order_id: order.id,
            step: 1,
            deposit_id: originWarehouseId,
            truck_id: assignedTruck?.id,
            estimated_time: order.time_limit,
            arrived_at: order.status === "Delivered" ? order.time_limit : undefined,
          },
        ]

  // Calculate Valhalla route map
  const valhallaRoute = await api.routes.calculateRoute(order.id, originWarehouseId, assignedTruck?.id)
  const distanceKm = valhallaRoute?.summary?.length || 120
  const timeSeconds = valhallaRoute?.summary?.time || 5400

  // Freight Cost calculation if not already recorded in DB
  const freightCost = costData ?? calculateFreightEstimate(
    distanceKm,
    timeSeconds,
    assignedTruck,
    avgGasPrice,
    driverWage
  )

  // Order ETA calculation considering min/max speeds and driver 8h/day max driving rule
  const orderETA = etaData ?? calculateOrderETA(distanceKm, {
    truck: assignedTruck,
    timeLimit: order.time_limit,
  })

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: "Orders", href: "/orders" },
          { label: `#${order.id}` },
        ]}
      />
      <div className="min-h-0 flex-1 space-y-5 overflow-auto">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Order details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoField label="Client" value={client?.name ?? `Client ${order.client_id}`} />
                  <InfoField label="Receiver" value={receiver?.name ?? "—"} />
                  <div className="sm:col-span-2">
                    <InfoField
                      label="Destination"
                      value={parseDestination(order.final_destination)}
                    />
                  </div>
                  <InfoField label="Deadline" value={order.time_limit ?? "—"} />
                  <InfoField
                    label="Value"
                    value={`R$ ${order.price.toLocaleString("pt-BR")}`}
                  />
                  <InfoField
                    label="Supplier delivery"
                    value={order.supplier_delivery ? "Yes" : "No"}
                  />
                  <div>
                    <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </p>
                    {orderStatusBadge(order.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order ETA & Transit Time Estimation Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Timer className="size-4 text-primary" />
                  Estimated Time of Arrival (ETA)
                </CardTitle>
                <div className="flex items-center gap-2">
                  {orderETA.compliance_status === "on_time" && (
                    <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5">
                      <ShieldCheck className="size-3.5" />
                      On Schedule
                    </Badge>
                  )}
                  {orderETA.compliance_status === "at_risk" && (
                    <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      Tight Schedule
                    </Badge>
                  )}
                  {orderETA.compliance_status === "overdue" && (
                    <Badge variant="destructive" className="gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      Delay Risk
                    </Badge>
                  )}
                  <Badge variant={etaData ? "default" : "secondary"} className="text-xs">
                    {etaData ? "Database ETA" : "Calculated ETA"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/80 bg-muted/40 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Expected Arrival
                      </p>
                      <p className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        {formatDt(orderETA.eta_expected)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Clock className="size-3" />
                        ~{orderETA.formatted_duration_avg || `${orderETA.total_transit_hours_avg}h`} total transit
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/60 pt-2.5">
                    <span>
                      <strong className="text-foreground">Earliest (Max Speed):</strong> {formatDt(orderETA.eta_min)}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-foreground">Latest (Min Speed):</strong> {formatDt(orderETA.eta_max)}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-foreground">Deadline:</strong> {order.time_limit ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoField
                    label="Min Speed"
                    value={`${orderETA.min_speed_kmh} km/h`}
                  />
                  <InfoField
                    label="Truck Max Speed"
                    value={`${orderETA.max_speed_kmh} km/h`}
                  />
                  <InfoField
                    label="Pure Driving Time"
                    value={`${orderETA.driving_hours_min}h – ${orderETA.driving_hours_max}h`}
                  />
                  <InfoField
                    label="Mandatory Rest"
                    value={`${orderETA.rest_hours_avg}h (${orderETA.rest_periods_count} stop${orderETA.rest_periods_count === 1 ? '' : 's'})`}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                  <Gauge className="size-3.5 shrink-0 text-primary mt-0.5" />
                  <div>
                    <strong>Driver Rest Regulation:</strong> Complies with max 8 hours driving per 24h work day. Journeys exceeding 8h automatically schedule 16-hour mandatory rest intervals between driving shifts.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valhalla Route Map for Specific Order */}
            <RouteMap
              encodedShape={valhallaRoute?.encodedShape}
              summary={valhallaRoute?.summary}
              originLabel={originWarehouse?.location || "Warehouse"}
              destinationLabel={parseDestination(order.final_destination)}
              title={`Valhalla Map Route: Order #${order.id}`}
            />

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No line items recorded for this order.</p>
                ) : (
                  <ul className="space-y-3" aria-label="Order line items">
                    {items.map((line) => {
                      const product = productMap.get(line.product_id)
                      const unit = product?.price ?? 0
                      const subtotal = unit * line.quantity
                      return (
                        <li
                          key={`${line.order_id}-${line.product_id}`}
                          className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium leading-tight">{product?.name ?? line.product_id}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {product?.is_cold && (
                                <Badge variant="outline" className="text-xs">Cold</Badge>
                              )}
                              {product?.is_fragile && (
                                <Badge variant="outline" className="text-xs">Fragile</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-baseline gap-6 tabular-nums">
                            <span className="text-sm text-muted-foreground">
                              Qty <span className="font-medium text-foreground">{line.quantity}</span>
                            </span>
                            <span className="text-sm">
                              Subtotal{" "}
                              <span className="font-semibold">
                                R$ {subtotal.toLocaleString("pt-BR")}
                              </span>
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Freight Cost Calculations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <DollarSign className="size-4 text-primary" />
                  Freight Cost Breakdown
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Avg Gas: R$ {avgGasPrice.toFixed(2)}/L
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Driver: R$ {driverWage.toFixed(2)}/h
                  </Badge>
                  <Badge variant={costData ? "default" : "secondary"} className="text-xs">
                    {costData ? "Recorded in DB" : "Estimated"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoField
                    label="Fuel Cost"
                    value={`R$ ${(freightCost.fuel_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  />
                  <InfoField
                    label="Labor Cost"
                    value={`R$ ${(freightCost.labor_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  />
                  <InfoField
                    label="Maintenance"
                    value={`R$ ${(freightCost.maintenance_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  />
                  <InfoField
                    label="Total Freight Cost"
                    value={`R$ ${(freightCost.total_cost ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  />
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>Route Distance:</strong> {distanceKm.toFixed(1)} km
                    </span>
                    <span>
                      <strong>Warehouses in Route:</strong>{" "}
                      {routeWarehouses.map((w) => `${w.location.split("(")[0].trim()} (R$ ${(w.fuel_price ?? 5.89).toFixed(2)}/L)`).join(" ➔ ") || originWarehouse?.location || "Warehouse"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-display text-lg">Route tracking timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {routeSteps.length === 0 ? (
                  <EmptyState
                    icon={RouteOff}
                    title="No route steps"
                    description="This order does not have route steps recorded yet."
                  />
                ) : (
                  <ol className="relative ms-2 space-y-0 border-l border-border pl-6" aria-label="Route timeline">
                    {routeSteps.map((step, idx) => {
                      const completed = Boolean(step.arrived_at)
                      const deposit = step.deposit_id ? depositMap.get(step.deposit_id) : undefined
                      const truck = step.truck_id ? truckMap.get(step.truck_id) : undefined
                      const label = deposit
                        ? deposit.location
                        : truck?.model ?? "On Route"
                      const isLast = idx === routeSteps.length - 1

                      return (
                        <li key={step.step} className={cn("relative", !isLast && "pb-8")}>
                          <span
                            className="absolute -left-[25px] top-0 flex size-4 items-center justify-center rounded-full border-2 border-border bg-card ring-2 ring-background"
                            aria-hidden
                          >
                            {completed ? (
                              <CheckCircle2 className="size-3 text-chart-2" aria-hidden />
                            ) : step.truck_id ? (
                              <Truck className="size-2.5 text-muted-foreground" aria-hidden />
                            ) : (
                              <Warehouse className="size-2.5 text-muted-foreground" aria-hidden />
                            )}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium leading-snug">{label}</p>
                              {deposit && (
                                <Badge variant="outline" className="text-[10px]">
                                  {trucks.filter((t) => t.current_deposit_id === deposit.id).length}/{deposit.truck_capacity ?? 5} parking
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ETA: {formatDt(step.estimated_time)}
                            </p>
                            {step.arrived_at && (
                              <p className="text-xs tabular-nums text-foreground">
                                Arrived: {formatDt(step.arrived_at)}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
