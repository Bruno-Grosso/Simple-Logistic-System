import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  User,
  Warehouse,
  Landmark,
  Fuel,
  Users,
  Wrench,
  ArrowUpRight,
  Route,
  Receipt,
  Percent,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportFilters } from "@/components/report-filters"
import { PerformanceGraphs } from "@/components/performance-graphs"
import { api } from "@/lib/api"
import { computeDashboardStats } from "@/lib/calculations"

export const dynamic = "force-dynamic"

interface ReportsPageProps {
  searchParams: Promise<{ warehouseId?: string }> | { warehouseId?: string }
}

function parseDestination(raw: string | undefined): string {
  if (!raw) return "—"
  try {
    const o = JSON.parse(raw) as { label?: string }
    return o.label ?? raw
  } catch {
    return raw
  }
}

export default async function ReportsPage(props: ReportsPageProps) {
  const searchParams = await props.searchParams
  const warehouseId = searchParams?.warehouseId

  const [rawOrders, rawTrucks, rawFreightCosts, users, products, warehouses, monthlyPerformance, deliveryReport] = await Promise.all([
    api.orders.getAll(),
    api.trucks.getAll(),
    api.freightCost.getAll(),
    api.users.getAll(),
    api.products.getAll(),
    api.warehouses.getAll(),
    api.reports.getMonthlyPerformance(),
    api.reports.getDeliveryCosts(warehouseId),
  ])

  // Fetch routes for all orders to determine which warehouse they pass through
  const orderRoutesList = await Promise.all(
    rawOrders.map(async (o) => {
      try {
        const route = await api.orders.getRoute(o.id)
        return { orderId: o.id, steps: route }
      } catch {
        return { orderId: o.id, steps: [] }
      }
    })
  )

  // Filter orders based on the selected warehouse
  const orders = warehouseId
    ? rawOrders.filter((o) => {
        const routeInfo = orderRoutesList.find((r) => r.orderId === o.id)
        return routeInfo?.steps.some((step) => step.deposit_id === warehouseId)
      })
    : rawOrders

  // Filter trucks based on the selected warehouse
  const trucks = warehouseId
    ? rawTrucks.filter((t) => t.current_deposit_id === warehouseId)
    : rawTrucks

  // Filter freight costs to only include those belonging to the filtered orders
  const filteredOrderIds = new Set(orders.map((o) => o.id))
  const freightCosts = rawFreightCosts.filter((fc) => filteredOrderIds.has(fc.order_id))

  // Fetch items for the filtered orders to compute product performance
  const orderItemsLists = await Promise.all(
    orders.map(async (o) => {
      try {
        const items = await api.orders.getItems(o.id)
        return items.map((item) => ({ ...item, orderPrice: o.price }))
      } catch {
        return []
      }
    })
  )
  const allOrderItems = orderItemsLists.flat()

  const stats = computeDashboardStats(orders, trucks)
  
  // Freight Cost Summary from Report or Local Aggregation
  const reportSummary = deliveryReport?.summary
  const totalFreightSpent = reportSummary?.total_delivery_cost ?? freightCosts.reduce((acc, fc) => acc + (fc.total_cost || 0), 0)
  const totalFuelCost = reportSummary?.total_fuel_cost ?? freightCosts.reduce((acc, fc) => acc + (fc.fuel_cost || 0), 0)
  const totalLaborCost = reportSummary?.total_labor_cost ?? freightCosts.reduce((acc, fc) => acc + (fc.labor_cost || 0), 0)
  const totalMaintenanceCost = reportSummary?.total_maintenance_cost ?? freightCosts.reduce((acc, fc) => acc + (fc.maintenance_cost || 0), 0)
  const avgCostPerKm = reportSummary?.avg_cost_per_km ?? (totalFreightSpent > 0 ? 1.85 : 0)
  const avgCostPerOrder = reportSummary?.avg_delivery_cost_per_order ?? (orders.length > 0 ? totalFreightSpent / orders.length : 0)

  const deliveredOrders = orders.filter((o) => o.status === "Delivered")
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.price || 0), 0)
  const netMargin = totalRevenue - totalFreightSpent
  const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0
  const costToRevenueRatio = totalRevenue > 0 ? (totalFreightSpent / totalRevenue) * 100 : 0

  const deliveryCostOrders = (deliveryReport?.orders ?? orders.map((order) => {
    const cost = freightCosts.find((item) => item.order_id === order.id)
    const totalDeliveryCost = cost?.total_cost ?? 0
    const revenue = order.price ?? 0
    const netMargin = revenue - totalDeliveryCost
    return {
      order_id: order.id,
      destination: parseDestination(order.final_destination),
      status: order.status,
      revenue,
      total_delivery_cost: totalDeliveryCost,
      net_margin: netMargin,
      margin_percent: revenue > 0 ? (netMargin / revenue) * 100 : 0,
      distance_km: order.distance_km ?? 0,
    }
  }))
    .sort((a, b) => b.total_delivery_cost - a.total_delivery_cost)
    .slice(0, 6)
  const largestRouteCost = deliveryCostOrders[0]?.total_delivery_cost ?? 0

  // 1. Client revenue contribution
  const clientRevenueMap = new Map<string, { name: string; totalSpent: number; orderCount: number }>()
  orders.forEach((o) => {
    const clientUser = users.find((u) => u.id === o.client_id)
    const clientName = clientUser?.name ?? `Client ${o.client_id}`
    const current = clientRevenueMap.get(o.client_id) ?? { name: clientName, totalSpent: 0, orderCount: 0 }
    
    if (o.status === "Delivered") {
      current.totalSpent += o.price
    }
    current.orderCount += 1
    clientRevenueMap.set(o.client_id, current)
  })
  const clientReport = Array.from(clientRevenueMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)

  // 2. Product performance
  const productSalesMap = new Map<string, { name: string; quantity: number; totalRevenue: number }>()
  allOrderItems.forEach((item) => {
    const prod = products.find((p) => p.id === item.product_id)
    const productName = prod?.name ?? `Product ${item.product_id}`
    const price = prod?.price ?? 0
    const current = productSalesMap.get(item.product_id) ?? { name: productName, quantity: 0, totalRevenue: 0 }
    
    current.quantity += item.quantity
    current.totalRevenue += price * item.quantity
    productSalesMap.set(item.product_id, current)
  })
  const productReport = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  // Average freight cost
  const avgFreight = freightCosts.length > 0 ? totalFreightSpent / freightCosts.length : 0

  // Filter warehouse occupancy view if filtered
  const filteredWarehouses = warehouseId
    ? warehouses.filter((w) => w.id === warehouseId)
    : warehouses

  return (
    <PageShell>
      <PageHeader 
        crumbs={[{ label: "Reports" }]} 
        actions={<ReportFilters warehouses={warehouses} />}
      />
      
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Delivered Revenue"
            value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            description="From delivered orders"
            accent
          />
          <StatCard
            label="Total Freight Cost"
            value={`R$ ${totalFreightSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            description={`Avg R$ ${avgFreight.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} per route`}
          />
          <StatCard
            label="Net Profit Margin"
            value={`R$ ${netMargin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={BarChart3}
            description={`${marginPercent.toFixed(1)}% margin efficiency`}
          />
          <StatCard
            label="Completed Orders"
            value={deliveredOrders.length}
            icon={Package}
            description={`${orders.length} orders total`}
          />
        </div>

        {/* Performance Graphs (Profit vs Costs Area Chart & Operational Breakdown) */}
        <PerformanceGraphs warehouseId={warehouseId} monthlyPerformance={monthlyPerformance} />

        {/* Freight cost breakdown card */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Landmark className="size-4 text-primary" />
              Freight Costs Financial Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border-l-2 border-primary pl-4 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fuel Costs</p>
                <p className="text-xl font-bold font-display mt-1 tabular-nums">
                  R$ {totalFuelCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalFreightSpent > 0 ? ((totalFuelCost / totalFreightSpent) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="border-l-2 border-primary pl-4 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Driver Labor Costs</p>
                <p className="text-xl font-bold font-display mt-1 tabular-nums">
                  R$ {totalLaborCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalFreightSpent > 0 ? ((totalLaborCost / totalFreightSpent) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="border-l-2 border-primary pl-4 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Maintenance Costs</p>
                <p className="text-xl font-bold font-display mt-1 tabular-nums">
                  R$ {totalMaintenanceCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalFreightSpent > 0 ? ((totalMaintenanceCost / totalFreightSpent) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Average Cost / Order"
            value={`R$ ${avgCostPerOrder.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={Receipt}
            description={`${reportSummary?.total_orders_analyzed ?? orders.length} routes analyzed`}
          />
          <StatCard
            label="Average Cost / km"
            value={`R$ ${avgCostPerKm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={Route}
            description="Freight spend by route distance"
          />
          <StatCard
            label="Cost / Revenue"
            value={`${costToRevenueRatio.toFixed(1)}%`}
            icon={Percent}
            description="Lower values improve margin"
          />
          <StatCard
            label="Operating Profit"
            value={`R$ ${netMargin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={ArrowUpRight}
            description="Delivered revenue less freight cost"
            accent
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Route className="size-4 text-primary" />
                Highest-Cost Delivery Routes
              </CardTitle>
              <CardDescription>Delivery cost compared with route revenue. Top six routes by freight spend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveryCostOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No delivery-cost data recorded for this selection.</p>
              ) : deliveryCostOrders.map((order) => {
                const costShare = largestRouteCost > 0 ? (order.total_delivery_cost / largestRouteCost) * 100 : 0
                const revenueShare = largestRouteCost > 0 ? Math.min(100, (order.revenue / largestRouteCost) * 100) : 0
                return (
                  <div key={order.order_id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <Link href={`/orders/${order.order_id}`} className="font-medium hover:text-primary hover:underline">
                          {order.order_id}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">{order.destination ?? "Destination unavailable"}</span>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">R$ {order.total_delivery_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${costShare}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                      <span>Cost</span>
                      <span>Revenue: R$ {order.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${revenueShare}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Route Profitability Detail
              </CardTitle>
              <CardDescription>Cost, distance, and margin by delivery route.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryCostOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No delivery-cost data recorded for this selection.</TableCell>
                      </TableRow>
                    ) : deliveryCostOrders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell><Link href={`/orders/${order.order_id}`} className="font-medium hover:text-primary hover:underline">{order.order_id}</Link></TableCell>
                        <TableCell className="text-right tabular-nums">{order.distance_km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</TableCell>
                        <TableCell className="text-right tabular-nums">R$ {order.total_delivery_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={order.net_margin >= 0 ? "default" : "destructive"} className="tabular-nums">
                            {order.margin_percent.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Package className="size-4 text-primary" />
                Product Sales Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Gross Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No product sales recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      productReport.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            R$ {p.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <User className="size-4 text-primary" />
                Top Clients by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Total Orders</TableHead>
                      <TableHead className="text-right">Spent (Delivered)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No client transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientReport.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.orderCount}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            R$ {c.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Warehouse Occupancy Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Warehouse className="size-4 text-primary" />
                Deposits Occupancy & Fuel Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredWarehouses.map((w) => {
                const volMax = w.volume_max || 1000
                const occupancyPct = Math.min(100, Math.max(0, (w.volume_actual / volMax) * 100))
                return (
                  <div key={w.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{w.location || `Warehouse ${w.id}`}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {w.volume_actual} / {volMax} m³ ({occupancyPct.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={occupancyPct} className="h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Type: {w.has_refrigeration ? "Cold Storage" : "Ambient"}</span>
                      <span>Local Fuel: R$ {(w.fuel_price ?? 0).toFixed(2)}/L</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Fleet Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                Fleet Operational Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Active on Route</span>
                <span className="font-semibold tabular-nums">{stats.trucksOnRoad}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Idle / In Warehouse</span>
                <span className="font-semibold tabular-nums">
                  {trucks.filter((t) => !t.is_traveling && !t.is_delivering).length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Flagged for Maintenance</span>
                <span className="font-semibold text-destructive tabular-nums">
                  {trucks.filter((t) => (t.truck_maintenance ?? 0) >= 3 || !t.is_valid).length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Fleet Size</span>
                <span className="font-semibold tabular-nums">{trucks.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
