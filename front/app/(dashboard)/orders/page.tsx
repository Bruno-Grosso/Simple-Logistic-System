import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { getCurrentUserProfile } from "@/lib/auth/get-user"
import { ExportCsvButton } from "@/components/export-csv-button"
import { MultiStopPlannerDialog } from "@/components/multi-stop-planner-dialog"
import { ActiveMultiRoutesPanel } from "@/components/active-multi-routes-panel"
import { OrdersTableInteractive } from "@/components/orders-table-interactive"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const { user } = await getCurrentUserProfile()
  const role = user.rawRole || user.role
  const isOrderManager = role === "admin" || role === "dispatcher"
  const orderFilters =
    role === "client" ? { clientId: user.id } :
    role === "truck_driver" ? { driverId: user.id } :
    role === "warehouse_worker" && user.warehouse_id ? { warehouseId: user.warehouse_id } : undefined
  const orders = await api.orders.getAll(orderFilters)
  const [users, trucks, warehouses, allRoutes, activeMultiRoutesData] = await Promise.all([
    isOrderManager ? api.users.getAll() : Promise.resolve([user]),
    isOrderManager || role === "truck_driver" ? api.trucks.getAll() : Promise.resolve([]),
    isOrderManager ? api.warehouses.getAll() : Promise.resolve([]),
    api.orders.getAllRoutes(),
    isOrderManager || role === "truck_driver" ? api.routes.getActiveMultiRoutes() : Promise.resolve(null),
  ])

  const activeFleetRoutes = activeMultiRoutesData?.multi_routes || []

  return (
    <PageShell>
      <PageHeader
        crumbs={[{ label: "Orders" }]}
        actions={
          <div className="flex items-center gap-2">
            {isOrderManager && (
              <MultiStopPlannerDialog
                orders={orders}
                trucks={trucks}
                warehouses={warehouses}
              />
            )}
            <ExportCsvButton
              url={api.orders.exportCsvUrl()}
              filename="orders-logisys.csv"
              label="Export CSV"
            />
            {isOrderManager && (
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
            )}
          </div>
        }
      />
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        {/* Active Multi-Routing & Fleet Circuits Panel */}
        {isOrderManager && (
          <ActiveMultiRoutesPanel routes={activeFleetRoutes} />
        )}

        <OrdersTableInteractive
          initialOrders={orders}
          users={users}
          trucks={trucks}
          warehouses={warehouses}
          allRoutes={allRoutes}
          activeFleetRoutes={activeFleetRoutes}
          isOrderManager={isOrderManager}
        />
      </div>
    </PageShell>
  )
}

