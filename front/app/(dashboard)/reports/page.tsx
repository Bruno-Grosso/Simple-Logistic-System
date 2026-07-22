import { BarChart3, TrendingUp, DollarSign, Package, Truck } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { api } from "@/lib/api"
import { computeDashboardStats } from "@/lib/calculations"

export default async function ReportsPage() {
  const [orders, trucks, freightCosts] = await Promise.all([
    api.orders.getAll(),
    api.trucks.getAll(),
    api.freightCost.getAll(),
  ])

  const stats = computeDashboardStats(orders, trucks)
  const totalFreightSpent = freightCosts.reduce((acc, fc) => acc + (fc.total_cost || 0), 0)

  const deliveredOrders = orders.filter((o) => o.status === "Delivered")
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.price || 0), 0)
  const netMargin = totalRevenue - totalFreightSpent

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Reports" }]} />
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Gross Revenue"
            value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`}
            icon={TrendingUp}
            description="From delivered orders"
            accent
          />
          <StatCard
            label="Total Freight Cost"
            value={`R$ ${totalFreightSpent.toLocaleString("pt-BR")}`}
            icon={DollarSign}
            description="Fuel & labor expenses"
          />
          <StatCard
            label="Estimated Net Margin"
            value={`R$ ${netMargin.toLocaleString("pt-BR")}`}
            icon={BarChart3}
            description="Revenue minus freight cost"
          />
          <StatCard
            label="Completed Orders"
            value={deliveredOrders.length}
            icon={Package}
            description="Successfully delivered"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Pending Dispatch</span>
                <span className="font-semibold tabular-nums">{stats.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">In Transit</span>
                <span className="font-semibold tabular-nums">{stats.ordersInProgress}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-semibold tabular-nums">{stats.deliveredThisMonth}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Fleet Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Active on Route</span>
                <span className="font-semibold tabular-nums">{stats.trucksOnRoad}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border pb-2">
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
