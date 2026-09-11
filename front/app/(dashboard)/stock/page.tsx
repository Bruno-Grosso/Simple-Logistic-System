import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"
import { ManageStockDialog } from "@/components/manage-stock-dialog"
import { StockTableLive } from "@/components/stock-table-live"
import type { Stock } from "@/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StockPage() {
  const user = await requireRole("admin", "inventory_manager", "warehouse_worker")
  const isWarehouseWorker = (user.rawRole || user.role) === "warehouse_worker"
  const [warehouses, products, trucks] = await Promise.all([
    isWarehouseWorker && user.warehouse_id
      ? api.warehouses.getById(user.warehouse_id).then((warehouse) => (warehouse ? [warehouse] : []))
      : api.warehouses.getAll(),
    api.products.getAll(),
    isWarehouseWorker ? Promise.resolve([]) : api.trucks.getAll(),
  ])

  // Fetch stock from all warehouses and truck cargo
  const stockPromises = warehouses.map((w) => api.warehouses.getStock(w.id))
  const cargoPromise = isWarehouseWorker ? Promise.resolve([]) : api.trucks.getCargo()
  const [stockResults, cargoResults] = await Promise.all([
    Promise.all(stockPromises),
    cargoPromise,
  ])
  const allStock: Stock[] = [...stockResults.flat(), ...(cargoResults || [])]

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader crumbs={[{ label: "Stock" }]} />
        <ManageStockDialog
          warehouses={warehouses}
          products={products}
          triggerLabel="Update Stock"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        <StockTableLive
          initialStock={allStock}
          warehouses={warehouses}
          products={products}
          trucks={trucks}
          isWarehouseWorker={isWarehouseWorker}
          userWarehouseId={user.warehouse_id || undefined}
        />
      </div>
    </PageShell>
  )
}
