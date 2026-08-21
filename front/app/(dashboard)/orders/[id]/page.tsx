import { notFound } from "next/navigation"
import { CheckCircle2, RouteOff, Truck, Warehouse, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { InfoField } from "@/components/info-field"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { RouteMap } from "@/components/route-map"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { calculateFreightEstimate } from "@/lib/calculations"
import type { OrderStatus, User, Product, Deposit, Truck as TruckType } from "@/types"

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
    products,
    warehouses,
    trucks,
  ] = await Promise.all([
    api.users.getAll(),
    api.orders.getItems(order.id),
    api.orders.getRoute(order.id),
    api.orders.getCost(order.id),
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

  // Pick origin warehouse from first route step or first warehouse
  const originWarehouseId = routeSteps[0]?.deposit_id || warehouses[0]?.id || "WH-001"
  const originWarehouse = depositMap.get(originWarehouseId)

  // Calculate Valhalla route map
  const valhallaRoute = await api.routes.calculateRoute(order.id, originWarehouseId)

  // Freight Cost calculation if not already recorded in DB
  const freightCost = costData ?? calculateFreightEstimate(
    valhallaRoute?.summary?.length || 120,
    valhallaRoute?.summary?.time || 5400,
    trucks[0],
    5.89
  )

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
                <Badge variant="outline" className="text-xs">
                  {costData ? "Recorded in DB" : "Estimated"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoField
                    label="Fuel Cost"
                    value={`R$ ${(freightCost.fuel_cost ?? 0).toLocaleString("pt-BR")}`}
                  />
                  <InfoField
                    label="Labor Cost"
                    value={`R$ ${(freightCost.labor_cost ?? 0).toLocaleString("pt-BR")}`}
                  />
                  <InfoField
                    label="Maintenance"
                    value={`R$ ${(freightCost.maintenance_cost ?? 0).toLocaleString("pt-BR")}`}
                  />
                  <InfoField
                    label="Total Freight Cost"
                    value={`R$ ${(freightCost.total_cost ?? 0).toLocaleString("pt-BR")}`}
                  />
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
