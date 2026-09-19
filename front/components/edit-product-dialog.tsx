"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Loader2, AlertTriangle } from "lucide-react"
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
import type { Product } from "@/types"

interface EditProductDialogProps {
  product: Product
}

export function EditProductDialog({ product }: EditProductDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Parse size JSON safely
  let initialLength = 0
  let initialWidth = 0
  let initialHeight = 0
  if (product.size && typeof product.size === "object") {
    initialLength = (product.size as any).length ?? (product.size as any).l ?? 0
    initialWidth = (product.size as any).width ?? (product.size as any).w ?? 0
    initialHeight = (product.size as any).height ?? (product.size as any).h ?? 0
  } else if (typeof product.size === "string") {
    try {
      const parsed = JSON.parse(product.size)
      initialLength = parsed.l ?? parsed.length ?? 0
      initialWidth = parsed.w ?? parsed.width ?? 0
      initialHeight = parsed.h ?? parsed.height ?? 0
    } catch {}
  }

  let initialExpireDate = ""
  if (product.expire_date) {
    try {
      initialExpireDate = new Date(product.expire_date).toISOString().split("T")[0]
    } catch {}
  }

  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(product.price ?? 0)
  const [volume, setVolume] = useState(product.volume ?? 0)
  const [weight, setWeight] = useState(product.weight ?? 0)
  const [length, setLength] = useState(initialLength)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [isCold, setIsCold] = useState(product.is_cold ? "1" : "0")
  const [isFragile, setIsFragile] = useState(product.is_fragile ? "1" : "0")
  const [expireDate, setExpireDate] = useState(initialExpireDate)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDialogError(null)

    if (!name.trim()) {
      const msg = "Product name cannot be empty."
      setDialogError(msg)
      return toast.error(msg)
    }

    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum < 0) {
      const msg = "Product price must be 0 or greater."
      setDialogError(msg)
      return toast.error(msg)
    }

    const weightNum = Number(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      const msg = "Product weight must be greater than 0 kg."
      setDialogError(msg)
      return toast.error(msg)
    }

    const volumeNum = Number(volume)
    if (isNaN(volumeNum) || volumeNum <= 0) {
      const msg = "Product volume must be greater than 0 m³."
      setDialogError(msg)
      return toast.error(msg)
    }

    setLoading(true)

    const sizeObj = {
      length: Number(length),
      width: Number(width),
      height: Number(height),
      l: Number(length),
      w: Number(width),
      h: Number(height),
    }

    try {
      const res = await api.products.update(product.id, {
        name: name.trim(),
        price: priceNum,
        volume: volumeNum,
        weight: weightNum,
        is_cold: Number(isCold),
        is_fragile: Number(isFragile),
        expire_date: expireDate || null,
        size: sizeObj,
      })

      if (res.success) {
        toast.success("Product updated successfully")
        setOpen(false)
        router.refresh()
      } else {
        const msg = res.error || "Failed to update product in database."
        setDialogError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      console.error(err)
      const msg = getErrorMessage(err, "An error occurred while updating the product.")
      setDialogError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDialogError(null); }}>
      <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <Edit2 className="size-3.5" />
        <span>Edit</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
            <DialogDescription>
              Modify specifications, pricing, and handling flags for this product.
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

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (R$)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expire-date">Expiration Date</Label>
                <Input
                  id="expire-date"
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-volume">Volume (m³)</Label>
                <Input
                  id="product-volume"
                  type="number"
                  step="0.001"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-weight">Weight (kg)</Label>
                <Input
                  id="product-weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size-length">Length (m)</Label>
                <Input
                  id="size-length"
                  type="number"
                  step="0.01"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-width">Width (m)</Label>
                <Input
                  id="size-width"
                  type="number"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-height">Height (m)</Label>
                <Input
                  id="size-height"
                  type="number"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="is-cold">Requires Refrigeration</Label>
                <select
                  id="is-cold"
                  value={isCold}
                  onChange={(e) => setIsCold(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">Yes (Cold Chain)</option>
                  <option value="0">No (Ambient)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is-fragile">Handling Type</Label>
                <select
                  id="is-fragile"
                  value={isFragile}
                  onChange={(e) => setIsFragile(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">Fragile</option>
                  <option value="0">Standard</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
