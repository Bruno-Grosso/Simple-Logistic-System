"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { Boxes, RefreshCw, Search, Truck as TruckIcon, Warehouse as WarehouseIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { ManageStockDialog } from "@/components/manage-stock-dialog"
import { api } from "@/lib/api"
import type { Deposit, Product, Stock, Truck } from "@/types"

interface StockTableLiveProps {
  initialStock: Stock[]
  warehouses: Deposit[]
  products: Product[]
  trucks: Truck[]
  isWarehouseWorker?: boolean
  userWarehouseId?: string
}

export function StockTableLive({
  initialStock,
  warehouses,
  products,
  trucks,
  isWarehouseWorker = false,
  userWarehouseId,
}: StockTableLiveProps) {
  const [stock, setStock] = useState<Stock[]>(initialStock)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [, startTransition] = useTransition()

  const productMap = new Map<string, Product>()
  products.forEach((p) => productMap.set(p.id, p))

  const warehouseMap = new Map<string, Deposit>()
  warehouses.forEach((w) => warehouseMap.set(w.id, w))

  const truckMap = new Map<string, Truck>()
  trucks.forEach((t) => truckMap.set(t.id, t))

  const fetchLiveStock = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true)
    try {
      const activeWarehouses = isWarehouseWorker && userWarehouseId
        ? warehouses.filter((w) => w.id === userWarehouseId)
        : warehouses

      const stockPromises = activeWarehouses.map((w) => api.warehouses.getStock(w.id))
      const cargoPromise = isWarehouseWorker ? Promise.resolve([]) : api.trucks.getCargo()

      const [stockResults, cargoResult] = await Promise.all([
        Promise.all(stockPromises),
        cargoPromise,
      ])

      const mergedStock: Stock[] = [...stockResults.flat(), ...(cargoResult || [])]
      startTransition(() => {
        setStock(mergedStock)
        setLastUpdated(new Date())
      })
    } catch (err) {
      console.error("Error fetching live stock:", err)
    } finally {
      if (showIndicator) setIsRefreshing(false)
    }
  }, [warehouses, isWarehouseWorker, userWarehouseId])

  // Periodic polling every 4 seconds + on tab focus
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveStock(false)
    }, 4000)

    const handleFocus = () => {
      fetchLiveStock(false)
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [fetchLiveStock])

  // Filtered rows
  const filteredStock = stock.filter((row) => {
    const product = productMap.get(row.product_id)
    const productName = product?.name?.toLowerCase() || ""
    const prodId = row.product_id.toLowerCase()
    const matchesSearch = !searchQuery || productName.includes(searchQuery.toLowerCase()) || prodId.includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (selectedLocation === "all") return true
    if (selectedLocation === "transit") return Boolean(row.truck_id)
    if (selectedLocation.startsWith("wh-")) {
      const whId = selectedLocation.replace("wh-", "")
      return row.deposit_id === whId
    }
    return true
  })

  const totalEntries = stock.length
  const inDeposits = stock.filter((s) => s.deposit_id).length
  const inTransit = stock.filter((s) => s.truck_id).length

  return (
    <div className="space-y-6">
      {/* Live Sync Status & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-foreground">Real-Time Sync</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Auto-refreshing every 4s · Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveStock(true)}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Total Stock Entries</p>
              <Boxes className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">
              {totalEntries}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Across all facilities & vehicles</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">In Warehouses</p>
              <WarehouseIcon className="size-4 text-chart-2" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {inDeposits}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Active storage in depots</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">In Transit (Cargo)</p>
              <TruckIcon className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">
              {inTransit}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Loaded onto dispatched trucks</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Locations</option>
            <option value="transit">🚚 In Transit (All Trucks)</option>
            {warehouses.map((w) => (
              <option key={w.id} value={`wh-${w.id}`}>
                🏢 {w.location || w.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      {filteredStock.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No stock items match your search"
          description="Adjust your search filters or add new stock entries via the Update Stock dialog."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Product</TableHead>
                <TableHead scope="col" className="text-right">
                  Quantity
                </TableHead>
                <TableHead scope="col">Location</TableHead>
                <TableHead scope="col">Type</TableHead>
                <TableHead scope="col">Updated / Arrived</TableHead>
                <TableHead scope="col" className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.map((row) => {
                const product = productMap.get(row.product_id)
                const inWarehouse = Boolean(row.deposit_id)
                const deposit = row.deposit_id ? warehouseMap.get(row.deposit_id) : undefined
                const truck = row.truck_id ? truckMap.get(row.truck_id) : undefined

                const locationLabel = inWarehouse
                  ? deposit
                    ? deposit.location
                    : `Warehouse ${row.deposit_id}`
                  : truck
                    ? `Truck · ${truck.model ?? row.truck_id} (${row.truck_id})`
                    : `Truck ${row.truck_id || "In transit"}`

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Boxes className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">{product?.name ?? row.product_id}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{row.product_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-foreground">
                      <span className="inline-block rounded-md bg-muted/50 px-2 py-0.5 text-sm font-bold text-primary">
                        {row.quantity.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        {inWarehouse ? (
                          <WarehouseIcon className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <TruckIcon className="size-3.5 text-primary shrink-0" />
                        )}
                        <span className="truncate max-w-[220px]">{locationLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inWarehouse ? (
                        <Badge variant="outline" className="border-chart-2/40 text-chart-2 bg-chart-2/10 text-xs">
                          Warehouse
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-primary/90 text-xs">
                          In transit
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground text-xs">
                      {row.arrived_at ? new Date(row.arrived_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {inWarehouse && row.deposit_id ? (
                        <ManageStockDialog
                          warehouses={warehouses}
                          products={products}
                          preselectedWarehouseId={row.deposit_id}
                          preselectedProductId={row.product_id}
                          initialQuantity={row.quantity}
                          iconOnly={true}
                          triggerLabel={`Edit stock for ${product?.name || row.product_id}`}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Loaded on truck</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
