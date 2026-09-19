"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  Package,
  RotateCcw,
  Search,
  Timer,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getErrorMessage } from "@/lib/utils"
import { api } from "@/lib/api"
import { calculateOrderETA } from "@/lib/calculations"
import type { Order, OrderStatus, Truck, User, Warehouse } from "@/types"

export interface OrdersTableInteractiveProps {
  initialOrders: Order[]
  users: User[]
  trucks: Truck[]
  warehouses: Warehouse[]
  allRoutes: any[]
  activeFleetRoutes: any[]
  isOrderManager: boolean
}

type SortKey = "id" | "destination" | "status" | "deadline" | "price"
type SortDirection = "asc" | "desc"

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
        <Badge variant="outline" className="border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
          {status}
        </Badge>
      )
    case "Cancelled":
      return <Badge variant="destructive">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function OrdersTableInteractive({
  initialOrders,
  users,
  trucks,
  allRoutes,
  activeFleetRoutes,
  isOrderManager,
}: OrdersTableInteractiveProps) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | OrderStatus>("all")
  const [sortKey, setSortKey] = React.useState<SortKey>("id")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")
  const [announcement, setAnnouncement] = React.useState("")
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(null)

  // Sync state if initialOrders prop changes
  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const userMap = React.useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

  const truckMap = React.useMemo(() => {
    return new Map(trucks.map((t) => [t.id, t]))
  }, [trucks])

  const assignmentByOrder = React.useMemo(() => {
    const map = new Map<string, any>()
    allRoutes.forEach((route) => {
      if (!map.has(route.order_id)) {
        map.set(route.order_id, route)
      }
    })
    return map
  }, [allRoutes])

  const multiRouteStepByOrder = React.useMemo(() => {
    const map = new Map<string, { step: number; truckId: string; totalStops: number }>()
    activeFleetRoutes.forEach((mr) => {
      mr.steps?.forEach((st: any) => {
        map.set(st.order_id, {
          step: st.step,
          truckId: mr.truck_id,
          totalStops: mr.total_orders,
        })
      })
    })
    return map
  }, [activeFleetRoutes])

  const today = React.useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Status counts for filter pills
  const statusCounts = React.useMemo(() => {
    const counts = {
      all: orders.length,
      Pending: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    }
    orders.forEach((o) => {
      if (o.status === "Pending") counts.Pending++
      else if (o.status === "Shipped") counts.Shipped++
      else if (o.status === "Delivered") counts.Delivered++
      else if (o.status === "Cancelled" || o.status === ("Canceled" as any)) counts.Cancelled++
    })
    return counts
  }, [orders])

  // Handle Sort Change (Order changes)
  const handleSort = (key: SortKey) => {
    let nextDirection: SortDirection = "asc"
    if (sortKey === key) {
      nextDirection = sortDirection === "asc" ? "desc" : "asc"
    }
    setSortKey(key)
    setSortDirection(nextDirection)

    const labelMap: Record<SortKey, string> = {
      id: "Order ID",
      destination: "Destination",
      status: "Status",
      deadline: "Deadline",
      price: "Price",
    }
    setAnnouncement(`Table sorted by ${labelMap[key]} in ${nextDirection === "asc" ? "ascending" : "descending"} order.`)
  }

  // Handle Status Filter Change
  const handleStatusFilter = (status: "all" | OrderStatus) => {
    setStatusFilter(status)
    setAnnouncement(`Filtered to ${status === "all" ? "all" : status} orders.`)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortKey("id")
    setSortDirection("asc")
    setAnnouncement("All search and filter criteria have been reset.")
  }

  // Inline Order Status Change
  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const res = await api.orders.updateStatus(orderId, nextStatus)
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        )
        toast.success(`Order ${orderId} updated to ${nextStatus}`)
        setAnnouncement(`Order ${orderId} status changed to ${nextStatus}.`)
      } else {
        toast.error(res.error || `Failed to update status for order ${orderId}`)
        setAnnouncement(`Failed to update order ${orderId}: ${res.error || "unknown error"}`)
      }
    } catch (err: any) {
      const msg = getErrorMessage(err, "Error updating order status")
      toast.error(msg)
      setAnnouncement(`Error updating order ${orderId}: ${msg}`)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Filter and search logic
  const filteredOrders = React.useMemo(() => {
    let result = [...orders]

    // 1. Status Filter
    if (statusFilter !== "all") {
      result = result.filter((o) => {
        if (statusFilter === "Cancelled") {
          return o.status === "Cancelled" || o.status === ("Canceled" as any)
        }
        return o.status === statusFilter
      })
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((o) => {
        const dest = parseDestination(o.final_destination).toLowerCase()
        const client = userMap.get(o.client_id)?.name?.toLowerCase() || ""
        const assignment = assignmentByOrder.get(o.id)
        const driver = assignment?.driver_id ? userMap.get(assignment.driver_id)?.name?.toLowerCase() || "" : ""
        const truck = assignment?.truck_id ? truckMap.get(assignment.truck_id) : undefined
        const truckInfo = (truck ? `${truck.model} ${truck.id}` : "").toLowerCase()
        const orderId = o.id.toLowerCase()
        const status = o.status.toLowerCase()

        return (
          orderId.includes(q) ||
          dest.includes(q) ||
          client.includes(q) ||
          driver.includes(q) ||
          truckInfo.includes(q) ||
          status.includes(q) ||
          (o.time_limit && o.time_limit.includes(q))
        )
      })
    }

    // 3. Sort logic (Order Changes)
    result.sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case "id":
          comparison = a.id.localeCompare(b.id, undefined, { numeric: true })
          break
        case "destination": {
          const destA = parseDestination(a.final_destination)
          const destB = parseDestination(b.final_destination)
          comparison = destA.localeCompare(destB)
          break
        }
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "deadline": {
          const timeA = a.time_limit ? new Date(a.time_limit).getTime() : 0
          const timeB = b.time_limit ? new Date(b.time_limit).getTime() : 0
          comparison = timeA - timeB
          break
        }
        case "price":
          comparison = (a.price || 0) - (b.price || 0)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [orders, statusFilter, searchQuery, sortKey, sortDirection, userMap, assignmentByOrder, truckMap])

  const isFiltered = searchQuery.trim() !== "" || statusFilter !== "all"

  return (
    <div className="space-y-4">
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Interactive Controls Bar: Search & Status Filter & Order Changes */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Accessible Search Input */}
        <div className="relative flex-1" role="search">
          <label htmlFor="order-search-input" className="sr-only">
            Search orders by ID, client, driver, truck, or destination
          </label>
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="order-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setAnnouncement(`Search updated. ${filteredOrders.length} orders match.`)
            }}
            placeholder="Search orders (ID, client, destination, driver, truck)..."
            aria-label="Search orders by ID, client, driver, truck, or destination"
            className="pl-9 pr-9 text-sm"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchQuery("")
                setAnnouncement("Search query cleared.")
              }}
              className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search input"
            >
              <X className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Status Filter Pills (Tablist / Radiogroup) */}
        <div
          role="radiogroup"
          aria-label="Filter orders by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="sr-only">Status Filter:</span>
          {(["all", "Pending", "Shipped", "Delivered", "Cancelled"] as const).map((st) => {
            const isSelected = statusFilter === st
            const count = statusCounts[st]
            const label = st === "all" ? "All" : st
            return (
              <button
                key={st}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleStatusFilter(st)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label={`Filter by ${label} status, ${count} orders`}
              >
                <span>{label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-semibold",
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground/80"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {isFiltered && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Reset all active filters and search"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Live Result Count Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <p aria-hidden="true">
          Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> of{" "}
          <span className="font-semibold text-foreground">{orders.length}</span> orders
          {isFiltered && " (filtered)"}
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Tip: Click table headers to change order sorting
        </p>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table className="w-full" aria-label="Orders Data Table">
          <TableHeader>
            <TableRow>
              {/* Order ID Column */}
              <TableHead
                scope="col"
                className="px-2.5 sm:px-3"
                aria-sort={sortKey === "id" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs tracking-wider transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -mx-1"
                  aria-label={`Sort by Order ID. Currently ${sortKey === "id" ? `${sortDirection}ending` : "unsorted"}. Activate to reverse.`}
                >
                  <span>Order</span>
                  {sortKey === "id" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </button>
              </TableHead>

              {/* Destination Column */}
              <TableHead
                scope="col"
                className="px-2.5 sm:px-3"
                aria-sort={sortKey === "destination" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => handleSort("destination")}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs tracking-wider transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -mx-1"
                  aria-label={`Sort by Destination. Currently ${sortKey === "destination" ? `${sortDirection}ending` : "unsorted"}. Activate to reverse.`}
                >
                  <span>Destination</span>
                  {sortKey === "destination" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </button>
              </TableHead>

              {isOrderManager && <TableHead scope="col" className="px-2.5 sm:px-3">Client</TableHead>}
              {isOrderManager && <TableHead scope="col" className="px-2.5 sm:px-3">Driver</TableHead>}
              {isOrderManager && <TableHead scope="col" className="px-2.5 sm:px-3">Truck</TableHead>}

              {/* Status Column */}
              <TableHead
                scope="col"
                className="px-2.5 sm:px-3"
                aria-sort={sortKey === "status" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs tracking-wider transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -mx-1"
                  aria-label={`Sort by Status. Currently ${sortKey === "status" ? `${sortDirection}ending` : "unsorted"}. Activate to reverse.`}
                >
                  <span>Status</span>
                  {sortKey === "status" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </button>
              </TableHead>

              {/* Deadline & ETA Column */}
              <TableHead
                scope="col"
                className="px-2.5 sm:px-3"
                aria-sort={sortKey === "deadline" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => handleSort("deadline")}
                  className="inline-flex items-center gap-1.5 font-semibold text-xs tracking-wider transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -mx-1"
                  aria-label={`Sort by Deadline and ETA. Currently ${sortKey === "deadline" ? `${sortDirection}ending` : "unsorted"}. Activate to reverse.`}
                >
                  <span>Deadline & ETA</span>
                  {sortKey === "deadline" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
                  )}
                </button>
              </TableHead>

              {/* Value Column */}
              {isOrderManager && (
                <TableHead
                  scope="col"
                  className="px-2.5 sm:px-3 text-right tabular-nums"
                  aria-sort={sortKey === "price" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => handleSort("price")}
                    className="inline-flex items-center justify-end gap-1.5 font-semibold text-xs tracking-wider transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -mx-1"
                    aria-label={`Sort by Value. Currently ${sortKey === "price" ? `${sortDirection}ending` : "unsorted"}. Activate to reverse.`}
                  >
                    <span>Value</span>
                    {sortKey === "price" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden="true" />
                    )}
                  </button>
                </TableHead>
              )}

              <TableHead scope="col" className="w-10 px-2">
                <span className="sr-only">Open order details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isOrderManager ? 9 : 5}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2" role="status">
                    <Filter className="size-8 text-muted-foreground/40" aria-hidden="true" />
                    <p className="font-medium text-foreground">No orders match your criteria</p>
                    <p className="text-xs text-muted-foreground">
                      Try changing your search term or status filter.
                    </p>
                    {isFiltered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
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
                    {/* Order ID & Multi-route badge */}
                    <TableCell className="px-2.5 sm:px-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded font-medium"
                          aria-label={`Order ${order.id}`}
                        >
                          <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="font-mono text-sm">{order.id}</span>
                        </Link>
                        {multiRouteStepByOrder.has(order.id) && (
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-primary/40 bg-primary/5 text-primary gap-1"
                              title={`Multi-route stop ${multiRouteStepByOrder.get(order.id)?.step} of ${multiRouteStepByOrder.get(order.id)?.totalStops}`}
                            >
                              <span className="font-semibold">Stop #{multiRouteStepByOrder.get(order.id)?.step}</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Destination */}
                    <TableCell className="max-w-[180px] truncate px-2.5 sm:px-3 text-muted-foreground" title={dest}>
                      {dest}
                    </TableCell>

                    {/* Manager Columns: Client, Driver, Truck */}
                    {isOrderManager && (
                      <TableCell className="px-2.5 sm:px-3">
                        {client?.name ?? `Client ${order.client_id}`}
                      </TableCell>
                    )}
                    {isOrderManager && (
                      <TableCell className="px-2.5 sm:px-3 text-muted-foreground">
                        {driver?.name ?? "Unassigned"}
                      </TableCell>
                    )}
                    {isOrderManager && (
                      <TableCell className="px-2.5 sm:px-3 text-muted-foreground">
                        {truck ? `${truck.model ?? truck.id} (${truck.id})` : "Unassigned"}
                      </TableCell>
                    )}

                    {/* Status Column with Inline Order Changes / Status Selector */}
                    <TableCell className="px-2.5 sm:px-3">
                      <div className="flex items-center gap-2">
                        {orderStatusBadge(order.status)}
                        {isOrderManager && (
                          <div className="relative inline-block">
                            <label htmlFor={`status-select-${order.id}`} className="sr-only">
                              Change status for order {order.id}
                            </label>
                            <select
                              id={`status-select-${order.id}`}
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onChange={(e) =>
                                handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                              }
                              aria-label={`Change order ${order.id} status`}
                              className={cn(
                                "h-6 rounded border border-border bg-background px-1.5 text-[11px] font-medium text-foreground transition-all cursor-pointer",
                                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                                updatingOrderId === order.id && "opacity-50 pointer-events-none"
                              )}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Deadline & ETA */}
                    <TableCell className="px-2.5 sm:px-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("tabular-nums text-sm", isOverdue && "font-medium text-destructive")}>
                            {order.time_limit ?? "—"}
                          </span>
                          {isOverdue && (
                            <span className="text-xs font-semibold text-destructive" aria-label="Late delivery">
                              LATE
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Timer className="size-3 text-primary/70" aria-hidden="true" />
                          ETA: ~{orderETA.formatted_duration_avg || `${orderETA.total_transit_hours_avg}h`}
                        </span>
                      </div>
                    </TableCell>

                    {/* Value */}
                    {isOrderManager && (
                      <TableCell className="px-2.5 sm:px-3 text-right tabular-nums font-medium">
                        R$ {order.price.toLocaleString("pt-BR")}
                      </TableCell>
                    )}

                    {/* View Action Link */}
                    <TableCell className="w-10 px-2">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded p-1"
                        aria-label={`View details for order ${order.id}`}
                      >
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
