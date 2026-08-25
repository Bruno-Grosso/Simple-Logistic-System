"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import type { Deposit, Order, OrderRoute, Truck, User } from "@/types"

type Props = {
  order: Order
  routeSteps: OrderRoute[]
  trucks: Truck[]
  drivers: User[]
  warehouses: Deposit[]
}

export function ManageOrderDialog({ order, routeSteps, trucks, drivers, warehouses }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const primaryRoute = routeSteps[0]
  const [status, setStatus] = useState<Order["status"]>(order.status)
  const [truckId, setTruckId] = useState(primaryRoute?.truck_id || "")
  const [driverId, setDriverId] = useState(primaryRoute?.driver_id || "")
  const [warehouseId, setWarehouseId] = useState(primaryRoute?.deposit_id || "")

  function setDialogOpen(nextOpen: boolean) {
    if (nextOpen) {
      // The dialog stays mounted after closing. Restore the persisted values so
      // a cancelled edit is never accidentally submitted on the next opening.
      setStatus(order.status)
      setTruckId(primaryRoute?.truck_id || "")
      setDriverId(primaryRoute?.driver_id || "")
      setWarehouseId(primaryRoute?.deposit_id || "")
    }
    setOpen(nextOpen)
  }

  async function save() {
    const assignmentChanged = Boolean(primaryRoute) && (
      truckId !== (primaryRoute?.truck_id || "") ||
      driverId !== (primaryRoute?.driver_id || "")
    )
    const needsNewAssignment = !primaryRoute && Boolean(truckId || driverId || warehouseId)

    // Status-only edits must not require an assignment. This is especially
    // important for older orders that do not yet have a route step.
    if ((assignmentChanged || needsNewAssignment) && (!truckId || !driverId || (!primaryRoute && !warehouseId))) {
      toast.error("Choose a truck, driver, and dispatch warehouse.")
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
      toast.error(error instanceof Error ? error.message : "Could not update this order")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Pencil className="size-3.5" /> Manage order
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {order.id}</DialogTitle>
          <DialogDescription>Set the current status and the truck-driver assignment for this order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
            <Label htmlFor="manage-order-truck">Truck</Label>
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
