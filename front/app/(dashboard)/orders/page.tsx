import Link from "next/link"
import { ArrowUpRight, Package, Plus, Timer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { calculateOrderETA } from "@/lib/calculations"
import type { OrderStatus, User } from "@/types"

export const dynamic = "force-dynamic"

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

export default async function OrdersPage() {
  const { user } = await getCurrentUserProfile()
  const role = user.rawRole || user.role
  const orderFilters =
    role === "client" ? { clientId: user.id } :
    role === "truck_driver" ? { driverId: user.id } :
    role === "warehouse_worker" && user.warehouse_id ? { warehouseId: user.warehouse_id } : undefined
  const orders = await api.orders.getAll(orderFilters)
  const [users, trucks, routeEntries] = await Promise.all([
    role === "admin" ? api.users.getAll() : Promise.resolve([user]),
    role === "admin" || role === "truck_driver" ? api.trucks.getAll() : Promise.resolve([]),
    Promise.all(orders.map(async (order) => [order.id, await api.orders.getRoute(order.id)] as const)),
  ])

  const userMap = new Map<string, User>()
  users.forEach((u) => userMap.set(u.id, u))
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]))
  const assignmentByOrder = new Map(routeEntries.map(([orderId, routes]) => [orderId, routes[0]]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <PageShell>
      <PageHeader
        crumbs={[{ label: "Orders" }]}
        actions={role === "admin" ? (
          <Link
            href="/orders/new"
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent",
              "bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all outline-none",
              "hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            )}
            aria-label="Create new order"
          >
            <Plus className="size-4" aria-hidden />
            New Order
          </Link>
        ) : undefined}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4">Order</TableHead>
                <TableHead scope="col" className="px-4">Destination</TableHead>
                {role === "admin" && <TableHead scope="col" className="px-4">Client</TableHead>}
                {role === "admin" && <TableHead scope="col" className="px-4">Driver</TableHead>}
                {role === "admin" && <TableHead scope="col" className="px-4">Truck</TableHead>}
                <TableHead scope="col" className="px-4">Status</TableHead>
                <TableHead scope="col" className="px-4">Deadline & ETA</TableHead>
                {role === "admin" && <TableHead scope="col" className="px-4 text-right tabular-nums">Value</TableHead>}
                <TableHead scope="col" className="w-12 px-4">
                  <span className="sr-only">Open order</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const dest = parseDestination(order.final_destination)
                const client = userMap.get(order.client_id)
                const assignment = assignmentByOrder.get(order.id)
                const driver = assignment?.driver_id ? userMap.get(assignment.driver_id) : undefined
                const truck = assignment?.truck_id ? truckMap.get(assignment.truck_id) : undefined
                const deadline = order.time_limit ? new Date(order.time_limit) : null
                const isOverdue =
                  deadline !== null &&
                  order.status !== "Delivered" &&
                  order.status !== "Cancelled" &&
                  deadline < today

                const orderETA = order.eta ?? calculateOrderETA(order.distance_km || 120, {
                  truck: trucks[0],
                  timeLimit: order.time_limit,
                })

                return (
                  <TableRow key={order.id}>
                    <TableCell className="px-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                        aria-label={`Order ${order.id}`}
                      >
                        <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-mono text-sm">{order.id}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate px-4 text-muted-foreground">
                      {dest}
                    </TableCell>
                    {role === "admin" && <TableCell className="px-4">{client?.name ?? `Client ${order.client_id}`}</TableCell>}
                    {role === "admin" && <TableCell className="px-4">{driver?.name ?? "Unassigned"}</TableCell>}
                    {role === "admin" && <TableCell className="px-4">{truck ? `${truck.model ?? truck.id} (${truck.id})` : "Unassigned"}</TableCell>}
                    <TableCell className="px-4">{orderStatusBadge(order.status)}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("tabular-nums text-sm", isOverdue && "font-medium text-destructive")}>
                            {order.time_limit ?? "—"}
                          </span>
                          {isOverdue && (
                            <span className="text-xs font-semibold text-destructive" aria-label="Late">
                              LATE
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Timer className="size-3 text-primary/70" />
                          ETA: ~{orderETA.formatted_duration_avg || `${orderETA.total_transit_hours_avg}h`}
                        </span>
                      </div>
                    </TableCell>
                    {role === "admin" && <TableCell className="px-4 text-right tabular-nums">R$ {order.price.toLocaleString("pt-BR")}</TableCell>}
                    <TableCell className="px-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex text-muted-foreground transition-colors hover:text-primary"
                        aria-label={`View order ${order.id}`}
                      >
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  )
}
