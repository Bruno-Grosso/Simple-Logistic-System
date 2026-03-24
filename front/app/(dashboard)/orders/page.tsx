import Link from "next/link"
import { ArrowUpRight, Package, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
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
import { ORDERS, getUserById } from "@/lib/mock-data"
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

export default function OrdersPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        crumbs={[{ label: "Orders" }]}
        actions={
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
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4">
                  Order
                </TableHead>
                <TableHead scope="col" className="px-4">
                  Destination
                </TableHead>
                <TableHead scope="col" className="px-4">
                  Client
                </TableHead>
                <TableHead scope="col" className="px-4">
                  Status
                </TableHead>
                <TableHead scope="col" className="px-4">
                  Deadline
                </TableHead>
                <TableHead scope="col" className="px-4 text-right tabular-nums">
                  Value
                </TableHead>
                <TableHead scope="col" className="w-12 px-4">
                  <span className="sr-only">Open order</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((order) => {
                const dest = parseDestination(order.final_destination)
                const client = getUserById(order.client_id)
                const deadline = order.time_limit ? new Date(order.time_limit) : null
                const isOverdue =
                  deadline !== null &&
                  order.status !== "Delivered" &&
                  order.status !== "Cancelled" &&
                  deadline < today

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
                    <TableCell className="px-4">{client?.name ?? "—"}</TableCell>
                    <TableCell className="px-4">{orderStatusBadge(order.status)}</TableCell>
                    <TableCell className="px-4">
                      <span
                        className={cn(
                          "tabular-nums",
                          isOverdue && "font-medium text-destructive",
                        )}
                      >
                        {order.time_limit ?? "—"}
                      </span>
                      {isOverdue && (
                        <span className="ml-1.5 text-xs font-semibold text-destructive" aria-label="Late">
                          LATE
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right tabular-nums">
                      R$ {order.price.toLocaleString("pt-BR")}
                    </TableCell>
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
    </div>
  )
}
