"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Sparkles, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils"
import type { Deposit, Order, OrderRoute, Truck, User, OrderItem, Product } from "@/types"

type Props = {
  order: Order
  items?: OrderItem[]
  products?: Product[]
  routeSteps: OrderRoute[]
  trucks: Truck[]
  drivers: User[]
  warehouses: Deposit[]
}

export function ManageOrderDialog({ order, items = [], products = [], routeSteps, trucks, drivers, warehouses }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const primaryRoute = routeSteps[0]
  const [status, setStatus] = useState<Order["status"]>(order.status)
  const [truckId, setTruckId] = useState(primaryRoute?.truck_id || "")
  const [driverId, setDriverId] = useState(primaryRoute?.driver_id || "")
  const [warehouseId, setWarehouseId] = useState(primaryRoute?.deposit_id || "")
  const [recommending, setRecommending] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  async function handleAutoSelectData() {
    setRecommending(true)
    try {
      let targetWh = warehouseId || primaryRoute?.deposit_id || ""
      if (!targetWh && warehouses.length > 0) {
        const whWithSpace = warehouses.find((w) => {
          const parked = trucks.filter((t) => (t.current_deposit_id || (t as any).current_warehouse_id) === w.id).length
          const cap = w.truck_capacity || w.parking_capacity || 5
          return parked < cap
        }) || warehouses[0]
        targetWh = whWithSpace.id
        setWarehouseId(targetWh)
      }

      const res = await api.orders.suggestTruck(order.id, targetWh || undefined)
      if (res && res.success && res.best_truck) {
        setTruckId(res.best_truck.truck_id)
        if (res.suggested_driver) {
          setDriverId(res.suggested_driver.id)
        } else if (drivers.length > 0) {
          setDriverId(drivers[0].id)
        }
        toast.success(`Optimal auto-selection: ${res.best_truck.model} (Score: ${res.best_truck.score})`)
      } else {
        const matchingTruck = trucks.find((t) => t.is_valid !== false && !t.is_delivering && (targetWh ? t.current_deposit_id === targetWh : true)) || trucks[0]
        if (matchingTruck) setTruckId(matchingTruck.id)
        if (drivers.length > 0) setDriverId(drivers[0].id)
        toast.success("Auto-selected available truck and driver.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to auto-select data")
    } finally {
      setRecommending(false)
    }
  }

  function setDialogOpen(nextOpen: boolean) {
    if (nextOpen) {
      // The dialog stays mounted after closing. Restore the persisted values so
      // a cancelled edit is never accidentally submitted on the next opening.
      setStatus(order.status)
      setTruckId(primaryRoute?.truck_id || "")
      setDriverId(primaryRoute?.driver_id || "")
      setWarehouseId(primaryRoute?.deposit_id || "")
      setDialogError(null)
    }
    setOpen(nextOpen)
  }

  async function save() {
    setDialogError(null)
    const isShipped = order.status === "Shipped" || order.status === "Delivered"
    const assignmentChanged = Boolean(primaryRoute) && (
      truckId !== (primaryRoute?.truck_id || "") ||
      driverId !== (primaryRoute?.driver_id || "")
    )
    const needsNewAssignment = !primaryRoute && Boolean(truckId || driverId || warehouseId)

    if (isShipped && assignmentChanged) {
      const msg = `This order is already ${order.status.toLowerCase()} and its route assignment cannot be modified.`
      setDialogError(msg)
      toast.error(msg)
      return
    }

    // Status-only edits must not require an assignment. This is especially
    // important for older orders that do not yet have a route step.
    if ((assignmentChanged || needsNewAssignment) && (!truckId || !driverId || (!primaryRoute && !warehouseId))) {
      const msg = "Please select a truck, driver, and dispatch warehouse to complete route assignment."
      setDialogError(msg)
      toast.error(msg)
      return
    }
    setSaving(true)
    try {
      if (assignmentChanged || needsNewAssignment) {
        const assignment = { truck_id: truckId, driver_id: driverId }
        let routeResult = primaryRoute
          ? await api.orders.updateRouteStep(order.id, primaryRoute.step, assignment)
          : await api.orders.addRouteStep(order.id, {
              step: 1,
              warehouse_id: warehouseId,
              ...assignment,
              estimated_time: order.time_limit || null,
            })
        // A route can be removed after the detail page has loaded. In that case,
        // recreate the assignment instead of blocking the whole order update.
        if (!routeResult.success && primaryRoute && routeResult.status === 404) {
          routeResult = await api.orders.addRouteStep(order.id, {
            step: primaryRoute.step,
            warehouse_id: primaryRoute.deposit_id || warehouseId || null,
            ...assignment,
            estimated_time: primaryRoute.estimated_time || order.time_limit || null,
          })
        }
        if (!routeResult.success) throw new Error(routeResult.error || "Could not save assignment")
      }

      if (status !== order.status) {
        const statusResult = await api.orders.updateStatus(order.id, status)
        if (!statusResult.success) throw new Error(statusResult.error || "Could not update order status")
      }

      toast.success("Order updated")
      setOpen(false)
      router.refresh()
    } catch (error: unknown) {
      const msg = getErrorMessage(error, "Could not update this order. Please try again.")
      setDialogError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogTrigger
        data-testid="manage-order-trigger"
        onClick={() => setDialogOpen(true)}
        render={<Button size="sm" className="gap-1.5" />}
      >
        <Pencil className="size-3.5" /> Manage order
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {order.id}</DialogTitle>
          <DialogDescription>Set the current status and the truck-driver assignment for this order.</DialogDescription>
        </DialogHeader>

        {(order.status === "Shipped" || order.status === "Delivered") && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2"
          >
            <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>Cannot modify or recalculate an order that has already been shipped.</span>
          </div>
        )}

        {dialogError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
          >
            <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>{dialogError}</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground">Auto-Assign Dispatch</div>
            <div className="text-[11px] text-muted-foreground">Selects warehouse, optimal truck & driver</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoSelectData}
            disabled={recommending}
            className="h-8 gap-1.5 text-xs font-semibold bg-background hover:bg-muted"
            data-testid="auto-select-order-data"
          >
            {recommending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5 text-amber-500" />
            )}
            Auto-select valid & optimal data
          </Button>
        </div>
        <div className="grid gap-4 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="manage-order-status">Status</Label>
            <select id="manage-order-status" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          {!primaryRoute && <div className="grid gap-1.5">
            <Label htmlFor="manage-order-warehouse">Dispatch warehouse</Label>
            <select id="manage-order-warehouse" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.location || warehouse.id}</option>)}
            </select>
          </div>}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="manage-order-truck">Truck</Label>
              <button
                type="button"
                onClick={handleAutoSelectData}
                disabled={recommending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                {recommending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-amber-500" />
                )}
                Auto-Select Optimal
              </button>
            </div>
            <select id="manage-order-truck" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={truckId} onChange={(e) => setTruckId(e.target.value)}>
              <option value="">Select truck</option>
              {trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.model || truck.id} ({truck.id})</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="manage-order-driver">Truck driver</Label>
            <select id="manage-order-driver" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select driver</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">{saving && <Loader2 className="size-3.5 animate-spin" />} Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
