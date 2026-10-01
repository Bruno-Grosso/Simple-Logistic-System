"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Boxes, Loader2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils"
import type { Deposit, Product, Stock } from "@/types"

interface ManageStockDialogProps {
  warehouses: Deposit[]
  products: Product[]
  preselectedWarehouseId?: string
  preselectedProductId?: string
  initialQuantity?: number
  triggerLabel?: string
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
  triggerSize?: "default" | "sm" | "icon-sm" | "icon-xs"
  iconOnly?: boolean
}

export function ManageStockDialog({
  warehouses,
  products,
  preselectedWarehouseId,
  preselectedProductId,
  initialQuantity,
  triggerLabel = "Manage Stock",
  triggerVariant = "outline",
  triggerSize = "sm",
  iconOnly = false,
}: ManageStockDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [warehouseId, setWarehouseId] = useState(
    preselectedWarehouseId || (warehouses.length > 0 ? warehouses[0].id : "")
  )
  const [productId, setProductId] = useState(
    preselectedProductId || (products.length > 0 ? products[0].id : "")
  )
  const [quantity, setQuantity] = useState(
    initialQuantity !== undefined ? String(initialQuantity) : "50"
  )

  function onOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setDialogError(null)
      if (preselectedWarehouseId) setWarehouseId(preselectedWarehouseId)
      if (preselectedProductId) setProductId(preselectedProductId)
      if (initialQuantity !== undefined) setQuantity(String(initialQuantity))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setDialogError(null)
    if (!warehouseId) {
      const msg = "Please select a warehouse location."
      setDialogError(msg)
      return toast.error(msg)
    }
    if (!productId) {
      const msg = "Please select a product SKU."
      setDialogError(msg)
      return toast.error(msg)
    }
    const qNum = parseInt(quantity, 10)
    if (isNaN(qNum) || qNum < 0) {
      const msg = "Stock quantity must be a non-negative integer (0 or greater)."
      setDialogError(msg)
      return toast.error(msg)
    }

    setLoading(true)
    try {
      const res = await api.warehouses.updateStock(warehouseId, {
        product_id: productId,
        quantity: qNum,
      })

      if (res.success) {
        toast.success("Warehouse stock updated successfully")
        setOpen(false)
        router.refresh()
      } else {
        const msg = res.error || "Failed to update warehouse stock in database."
        setDialogError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      console.error(err)
      const msg = getErrorMessage(err, "An error occurred while updating stock.")
      setDialogError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!warehouseId || !productId) return
    if (!window.confirm("Remove this product from warehouse stock?")) return

    setDialogError(null)
    setLoading(true)
    try {
      const res = await api.warehouses.deleteStock(warehouseId, productId)
      if (res.success) {
        toast.success("Stock item removed from warehouse")
        setOpen(false)
        router.refresh()
      } else {
        const msg = res.error || "Failed to delete stock item from warehouse."
        setDialogError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      console.error(err)
      const msg = getErrorMessage(err, "An error occurred while removing stock.")
      setDialogError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        onClick={() => setOpen(true)}
        className={
          iconOnly
            ? "inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground p-1.5 transition-colors cursor-pointer"
            : triggerVariant === "outline"
            ? "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            : "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        }
        aria-label={triggerLabel}
        title={triggerLabel}
        data-testid="manage-stock-trigger"
      >
        {iconOnly ? (
          <Pencil className="size-3.5" />
        ) : (
          <>
            <Boxes className="size-4" />
            <span>{triggerLabel}</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Boxes className="size-5 text-primary" />
              <DialogTitle>Edit Warehouse Stock</DialogTitle>
            </div>
            <DialogDescription>
              Adjust product inventory levels or assign new products to warehouse storage.
            </DialogDescription>
          </DialogHeader>

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

          <div className="grid gap-4 py-2">
            {!preselectedWarehouseId && (
              <div className="space-y-1.5">
                <Label htmlFor="stock-warehouse-select">Warehouse</Label>
                <select
                  id="stock-warehouse-select"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.location || w.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="stock-product-select">Product</Label>
              <select
                id="stock-product-select"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={Boolean(preselectedProductId)}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock-quantity-input">Quantity (Units)</Label>
              <Input
                id="stock-quantity-input"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {preselectedProductId ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 gap-1"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="manage-stock-submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Stock
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
