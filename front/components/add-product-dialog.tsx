"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, PackagePlus } from "lucide-react"
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

export function AddProductDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [price, setPrice] = useState("25.00")
  const [volume, setVolume] = useState("0.1")
  const [weight, setWeight] = useState("1.0")
  const [length, setLength] = useState("0.5")
  const [width, setWidth] = useState("0.5")
  const [height, setHeight] = useState("0.5")
  const [isCold, setIsCold] = useState("0")
  const [isFragile, setIsFragile] = useState("0")
  const [expireDate, setExpireDate] = useState("")

  function resetForm() {
    setName("")
    setPrice("25.00")
    setVolume("0.1")
    setWeight("1.0")
    setLength("0.5")
    setWidth("0.5")
    setHeight("0.5")
    setIsCold("0")
    setIsFragile("0")
    setExpireDate("")
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error("Product name is required")

    setLoading(true)
    try {
      const sizeObj = {
        length: Number(length) || 0.5,
        width: Number(width) || 0.5,
        height: Number(height) || 0.5,
        l: Number(length) || 0.5,
        w: Number(width) || 0.5,
        h: Number(height) || 0.5,
      }

      const res = await api.products.create({
        name: name.trim(),
        price: Number(price) || 0,
        volume: Number(volume) || 0.1,
        weight: Number(weight) || 1.0,
        is_cold: isCold === "1",
        is_fragile: isFragile === "1",
        expire_date: expireDate || null,
        size: sizeObj,
      })

      if (res.success) {
        toast.success(`Product "${name}" created successfully`)
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(res.error || "Failed to create product")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "An error occurred while creating the product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="add-product-button"
      >
        <Plus className="size-4" />
        <span>Add product</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <PackagePlus className="size-5 text-primary" />
              <DialogTitle>Add New Product</DialogTitle>
            </div>
            <DialogDescription>
              Register a new SKU with handling criteria, physical dimensions, and price.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-product-name">Product Name</Label>
              <Input
                id="new-product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic Dairy Pack"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-product-price">Price (R$)</Label>
                <Input
                  id="new-product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-expire-date">Expiration Date (optional)</Label>
                <Input
                  id="new-expire-date"
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-product-volume">Volume (m³)</Label>
                <Input
                  id="new-product-volume"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-product-weight">Weight (kg)</Label>
                <Input
                  id="new-product-weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-size-length">Length (m)</Label>
                <Input
                  id="new-size-length"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-size-width">Width (m)</Label>
                <Input
                  id="new-size-width"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-size-height">Height (m)</Label>
                <Input
                  id="new-size-height"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-is-cold">Refrigeration</Label>
                <select
                  id="new-is-cold"
                  value={isCold}
                  onChange={(e) => setIsCold(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="0">No (Ambient)</option>
                  <option value="1">Yes (Cold Chain)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-is-fragile">Fragility</Label>
                <select
                  id="new-is-fragile"
                  value={isFragile}
                  onChange={(e) => setIsFragile(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="0">Standard</option>
                  <option value="1">Fragile</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="add-product-submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
