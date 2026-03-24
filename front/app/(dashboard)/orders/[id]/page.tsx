import { notFound } from "next/navigation"
import { CheckCircle2, RouteOff, Truck, Warehouse } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { InfoField } from "@/components/info-field"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import {
  getOrderById,
  getUserById,
  getOrderItems,
  getOrderRoute,
  getDepositById,
  getTruckById,
  getDepositLabel,
  getProductById,
} from "@/lib/mock-data"
import type { OrderStatus } from "@/types"

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
  const order = getOrderById(id)
  if (!order) notFound()

  const client = getUserById(order.client_id)
  const receiver = order.receiver_id ? getUserById(order.receiver_id) : undefined
  const items = getOrderItems(order.id)
  const routeSteps = getOrderRoute(order.id)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        crumbs={[
          { label: "Orders", href: "/orders" },
          { label: `#${order.id}` },
        ]}
      />
      <div className="flex-1 space-y-5 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Order details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoField label="Client" value={client?.name ?? "—"} />
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

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No line items.</p>
                ) : (
                  <ul className="space-y-3" aria-label="Order line items">
                    {items.map((line) => {
                      const product = getProductById(line.product_id)
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
                                <Badge variant="outline" className="text-xs">
                                  Cold
                                </Badge>
                              )}
                              {product?.is_fragile && (
                                <Badge variant="outline" className="text-xs">
                                  Fragile
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-baseline gap-6 tabular-nums">
                            <span className="text-sm text-muted-foreground">
                              Qty{" "}
                              <span className="font-medium text-foreground">{line.quantity}</span>
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
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="font-display text-lg">Route tracking</CardTitle>
              </CardHeader>
              <CardContent>
                {routeSteps.length === 0 ? (
                  <EmptyState
                    icon={RouteOff}
                    title="No route data"
                    description="This order does not have route steps yet."
                  />
                ) : (
                  <ol className="relative ms-2 space-y-0 border-l border-border pl-6" aria-label="Route timeline">
                    {routeSteps.map((step, idx) => {
                      const completed = Boolean(step.arrived_at)
                      const deposit = step.deposit_id ? getDepositById(step.deposit_id) : undefined
                      const truck = step.truck_id ? getTruckById(step.truck_id) : undefined
                      const label = deposit
                        ? getDepositLabel(deposit)
                        : truck?.model ?? "—"
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
                            <p className="font-medium leading-snug">{label}</p>
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
    </div>
  )
}
