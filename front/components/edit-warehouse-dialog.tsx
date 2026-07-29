"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Loader2 } from "lucide-react"
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
import type { Deposit } from "@/types"

interface EditWarehouseDialogProps {
  warehouse: Deposit
}

export function EditWarehouseDialog({ warehouse }: EditWarehouseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Parse location JSON safely
  let initialLabel = warehouse.location
  let initialLat = 0
  let initialLon = 0

  // Try to find if location was a JSON string or details are present
  try {
    // If it is just coords in name, or if we can extract it
    const latMatch = warehouse.location.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/)
    if (latMatch) {
      initialLat = Number(latMatch[1])
      initialLon = Number(latMatch[2])
      initialLabel = warehouse.location.split("(")[0].trim()
    }
  } catch {}

  // Parse size JSON safely
  let initialLength = 0
  let initialWidth = 0
  let initialHeight = 0
  if (warehouse.size) {
    try {
      const parsed = JSON.parse(warehouse.size)
      initialLength = parsed.l ?? parsed.length ?? 0
      initialWidth = parsed.w ?? parsed.width ?? 0
      initialHeight = parsed.h ?? parsed.height ?? 0
    } catch {}
  }

  const [label, setLabel] = useState(initialLabel)
  const [latitude, setLatitude] = useState(initialLat)
  const [longitude, setLongitude] = useState(initialLon)
  const [length, setLength] = useState(initialLength)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [volumeMax, setVolumeMax] = useState(warehouse.volume_max ?? 1000)
  const [fuelPrice, setFuelPrice] = useState(warehouse.fuel_price ?? 0)
  const [hasRefrigeration, setHasRefrigeration] = useState(warehouse.has_refrigeration ? "1" : "0")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const locationObj = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      label: label,
    }

    const sizeObj = {
      length: Number(length),
      width: Number(width),
      height: Number(height),
      l: Number(length),
      w: Number(width),
      h: Number(height),
    }

    try {
      const res = await api.warehouses.update(warehouse.id, {
        location: locationObj,
        size: sizeObj,
        volume_max: Number(volumeMax),
        fuel_price: Number(fuelPrice),
        has_refrigeration: Number(hasRefrigeration),
      })

      if (res.success) {
        toast.success("Warehouse updated successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to update warehouse")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data || "An error occurred while updating the warehouse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <Edit2 className="size-4" />
        Edit Warehouse
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Warehouse Details</DialogTitle>
            <DialogDescription>
              Modify warehouse locations, size dimensions, and operational characteristics.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location-label">Location Name / Label</Label>
              <Input
                id="location-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. New York Central WH"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (m)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (m)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (m)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume-max">Max Volume (m³)</Label>
                <Input
                  id="volume-max"
                  type="number"
                  value={volumeMax}
                  onChange={(e) => setVolumeMax(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel-price">Fuel Price (R$/L)</Label>
                <Input
                  id="fuel-price"
                  type="number"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="has-refrigeration">Refrigeration Capability</Label>
              <select
                id="has-refrigeration"
                value={hasRefrigeration}
                onChange={(e) => setHasRefrigeration(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="1">Refrigerated (Cold Storage)</option>
                <option value="0">Ambient Storage Only</option>
              </select>
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
