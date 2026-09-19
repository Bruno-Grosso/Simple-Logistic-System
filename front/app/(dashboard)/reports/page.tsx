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
  ArrowUpRight,
  Route,
  Receipt,
  Percent,
  Target,
  Calendar,
  CheckCircle2,
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
import { ExportCsvButton } from "@/components/export-csv-button"
import { ReportsAutoRefresher } from "@/components/reports-auto-refresher"
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"

export const dynamic = "force-dynamic"

interface ReportsPageProps {
  searchParams: Promise<{ warehouseId?: string; period?: string }> | { warehouseId?: string; period?: string }
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
  await requireRole("admin", "dispatcher", "manager")
  const searchParams = await props.searchParams
  const warehouseId = searchParams?.warehouseId || undefined
  const period = searchParams?.period || undefined

  const [warehouses, rawTrucks, monthlyPerformance, deliveryReport] = await Promise.all([
    api.warehouses.getAll(),
    api.trucks.getAll(),
    api.reports.getMonthlyPerformance(warehouseId, period),
    api.reports.getDeliveryCosts(warehouseId, period),
  ])

  // Filter trucks based on the selected warehouse
  const trucks = warehouseId
    ? rawTrucks.filter((t) => t.current_deposit_id === warehouseId)
    : rawTrucks

  // Summary and live figures directly from PostgreSQL database
  const reportSummary = deliveryReport.summary
  const totalFreightSpent = reportSummary.total_delivery_cost
  const totalFuelCost = reportSummary.total_fuel_cost
  const totalLaborCost = reportSummary.total_labor_cost
  const totalMaintenanceCost = reportSummary.total_maintenance_cost
  const totalRevenue = reportSummary.total_delivered_revenue
  const netMargin = reportSummary.net_operating_profit
  const avgCostPerKm = reportSummary.avg_cost_per_km
  const avgCostPerOrder = reportSummary.avg_delivery_cost_per_order
  const costToRevenueRatio = reportSummary.cost_to_revenue_ratio
  const marginPercent = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0
  const avgFreight = reportSummary.total_orders_analyzed > 0
    ? totalFreightSpent / reportSummary.total_orders_analyzed
    : 0

  const deliveryCostOrders = [...deliveryReport.orders]
    .sort((a, b) => b.total_delivery_cost - a.total_delivery_cost)
    .slice(0, 6)
  const largestRouteCost = deliveryCostOrders[0]?.total_delivery_cost ?? 0

  // 1. Client revenue contribution directly from DB
  const clientReport = (deliveryReport.top_clients && deliveryReport.top_clients.length > 0)
    ? deliveryReport.top_clients.map((c) => ({
        name: c.name,
        totalSpent: c.total_spent,
        orderCount: c.order_count,
      }))
    : []

  // 2. Product performance directly from DB
  const productReport = (deliveryReport.top_products && deliveryReport.top_products.length > 0)
    ? deliveryReport.top_products.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        totalRevenue: p.total_revenue,
      }))
    : []

  // Monthly Target & Operations Pacing Analysis directly from DB
  const monthlyTargetOrders = reportSummary.monthly_target_orders ?? (warehouseId ? 25 : 75)
  const completedThisMonth = reportSummary.completed_orders ?? 0
  const ordersNeededRemaining = reportSummary.orders_needed_this_month ?? Math.max(0, monthlyTargetOrders - completedThisMonth)
  const targetCompletionPct = monthlyTargetOrders > 0
    ? Math.min(100, Math.round((completedThisMonth / monthlyTargetOrders) * 100))
    : 100

  // Pacing calculations
  const now = new Date()
  const currentDay = now.getDate()
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemainingInMonth = Math.max(1, daysInCurrentMonth - currentDay)
  const requiredOrdersPerDay = reportSummary.required_daily_run_rate ?? (Math.round((ordersNeededRemaining / daysRemainingInMonth) * 10) / 10)
  const currentDailyRunRate = currentDay > 0 ? Math.round((completedThisMonth / currentDay) * 10) / 10 : 0
  const projectedMonthEndCompletions = reportSummary.projected_month_end_completions ?? Math.round(completedThisMonth + currentDailyRunRate * daysRemainingInMonth)
  const targetStatus = completedThisMonth >= monthlyTargetOrders
    ? "Target Met"
    : projectedMonthEndCompletions >= monthlyTargetOrders
      ? "On Track"
      : "Pace Action Required"

  const stats = {
    trucksOnRoad: trucks.filter((t) => t.is_traveling || t.is_delivering).length,
  }

  // Filter warehouse occupancy view if filtered
  const filteredWarehouses = warehouseId
    ? warehouses.filter((w) => w.id === warehouseId)
    : warehouses

  return (
    <PageShell>
      <PageHeader 
        crumbs={[{ label: "Reports" }]} 
        actions={
          <div className="flex items-center gap-2">
            <ReportFilters warehouses={warehouses} availablePeriods={deliveryReport.available_periods} />
            <ExportCsvButton
              url={api.reports.exportDeliveryCostsCsvUrl(warehouseId, period)}
              filename={`delivery-costs-report${warehouseId ? `-${warehouseId}` : ""}${period ? `-${period}` : ""}.csv`}
              label="Export CSV"
            />
          </div>
        }
      />
      <ReportsAutoRefresher />
      
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        {/* Active Filters Pill */}
        {(warehouseId || period) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border">
            <span className="font-semibold text-foreground">Active Database Query:</span>
            {warehouseId && (
              <Badge variant="secondary" className="font-medium text-[11px]">
                Location: {warehouses.find((w) => w.id === warehouseId)?.location || warehouseId}
              </Badge>
            )}
            {period && (
              <Badge variant="secondary" className="font-medium text-[11px]">
                Period: {deliveryReport.period_label || period}
              </Badge>
            )}
          </div>
        )}

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
            value={`${completedThisMonth} / ${monthlyTargetOrders}`}
            icon={Package}
            description={
              ordersNeededRemaining > 0
                ? `${ordersNeededRemaining} more needed this period (${targetCompletionPct}%)`
                : `Period goal achieved (${targetCompletionPct}%)`
            }
          />
        </div>

        {/* Performance Graphs (Profit vs Costs Area Chart & Operational Breakdown) */}
        <PerformanceGraphs warehouseId={warehouseId} period={period} monthlyPerformance={monthlyPerformance} />

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
            description={`${reportSummary?.total_orders_analyzed ?? deliveryCostOrders.length} routes analyzed`}
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

        {/* Monthly Order Completion Target & Pacing Card */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Target className="size-4 text-primary" />
                  Monthly Order Completion Target & Operational Pace
                </CardTitle>
                <CardDescription>
                  Tracking needed vs completed orders for the current month to maintain logistic capacity and profitability goals.
                </CardDescription>
              </div>
              <Badge
                variant={
                  targetStatus === "Target Met"
                    ? "default"
                    : targetStatus === "On Track"
                      ? "secondary"
                      : "destructive"
                }
                className="w-fit self-start sm:self-auto"
              >
                {targetStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Progress bar and primary numbers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>{completedThisMonth} orders completed</span>
                  <span className="text-muted-foreground font-normal">of {monthlyTargetOrders} monthly target</span>
                </span>
                <span className="tabular-nums font-bold text-primary">{targetCompletionPct}%</span>
              </div>
              <Progress value={targetCompletionPct} className="h-3 rounded-full" />
            </div>

            {/* Pacing details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Orders Needed to Complete</p>
                <p className="text-2xl font-bold font-display mt-1 text-foreground tabular-nums">
                  {ordersNeededRemaining} <span className="text-xs font-normal text-muted-foreground">orders</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersNeededRemaining === 0 ? "Target achieved for this period" : "Remaining to hit month plan"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Required Daily Run Rate</p>
                <p className="text-2xl font-bold font-display mt-1 text-primary tabular-nums">
                  {requiredOrdersPerDay} <span className="text-xs font-normal text-muted-foreground">orders/day</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Over remaining {daysRemainingInMonth} days in month
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Current Daily Velocity</p>
                <p className="text-2xl font-bold font-display mt-1 text-foreground tabular-nums">
                  {currentDailyRunRate} <span className="text-xs font-normal text-muted-foreground">orders/day</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {currentDay} elapsed days
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Projected Month-End</p>
                <p className="text-2xl font-bold font-display mt-1 text-foreground tabular-nums">
                  {projectedMonthEndCompletions} <span className="text-xs font-normal text-muted-foreground">orders</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {projectedMonthEndCompletions >= monthlyTargetOrders
                    ? `+${projectedMonthEndCompletions - monthlyTargetOrders} above target pace`
                    : `${monthlyTargetOrders - projectedMonthEndCompletions} below target pace`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
