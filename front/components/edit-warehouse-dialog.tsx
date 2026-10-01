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
import type { Deposit } from "@/types"

interface EditWarehouseDialogProps {
  warehouse: Deposit
}

export function EditWarehouseDialog({ warehouse }: EditWarehouseDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Parse location JSON safely
  let initialLabel = warehouse.location
  let initialLat = warehouse.latitude ?? 0
  let initialLon = warehouse.longitude ?? 0
  if (warehouse.location && typeof warehouse.location === "object") {
    initialLabel = (warehouse.location as any).label || (warehouse.location as any).address || ""
    initialLat = (warehouse.location as any).lat ?? initialLat
    initialLon = (warehouse.location as any).lon ?? initialLon
  } else if (typeof warehouse.location === "string") {
    try {
      const parsed = JSON.parse(warehouse.location)
      if (parsed.label) initialLabel = parsed.label
      if (parsed.lat) initialLat = parsed.lat
      if (parsed.lon) initialLon = parsed.lon
    } catch {}
  }

  // Parse size JSON safely
  let initialL = 0, initialW = 0, initialH = 0
  if (warehouse.size && typeof warehouse.size === "object") {
    initialL = (warehouse.size as any).length ?? (warehouse.size as any).l ?? 0
    initialW = (warehouse.size as any).width ?? (warehouse.size as any).w ?? 0
    initialH = (warehouse.size as any).height ?? (warehouse.size as any).h ?? 0
  } else if (typeof warehouse.size === "string") {
    try {
      const parsed = JSON.parse(warehouse.size)
      initialL = parsed.length ?? parsed.l ?? 0
      initialW = parsed.width ?? parsed.w ?? 0
      initialH = parsed.height ?? parsed.h ?? 0
    } catch {}
  }

  const [label, setLabel] = useState(initialLabel)
  const [latitude, setLatitude] = useState(initialLat)
  const [longitude, setLongitude] = useState(initialLon)
  const [length, setLength] = useState(initialL)
  const [width, setWidth] = useState(initialW)
  const [height, setHeight] = useState(initialH)
  const [volumeMax, setVolumeMax] = useState(warehouse.volume_max ?? 0)
  const [fuelPrice, setFuelPrice] = useState(warehouse.fuel_price ?? 0)
  const [hasRefrigeration, setHasRefrigeration] = useState(Boolean(warehouse.has_refrigeration))
  const [truckCapacity, setTruckCapacity] = useState(warehouse.truck_capacity ?? 0)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setDialogError(null)

    if (!label.trim()) {
      const msg = "Warehouse location label cannot be empty."
      setDialogError(msg)
      return toast.error(msg)
    }

    const volNum = Number(volumeMax)
    if (isNaN(volNum) || volNum <= 0) {
      const msg = "Maximum storage volume must be greater than 0 m³."
      setDialogError(msg)
      return toast.error(msg)
    }

    const capNum = Number(truckCapacity)
    if (isNaN(capNum) || capNum < 0) {
      const msg = "Truck parking capacity must be 0 or greater."
      setDialogError(msg)
      return toast.error(msg)
    }

    const fuelNum = Number(fuelPrice)
    if (isNaN(fuelNum) || fuelNum < 0) {
      const msg = "Fuel price must be a valid positive number."
      setDialogError(msg)
      return toast.error(msg)
    }

    setLoading(true)

    const locationObj = {
      label: label.trim(),
      address: label.trim(),
      lat: Number(latitude),
      lon: Number(longitude),
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
        volume_max: volNum,
        fuel_price: fuelNum,
        has_refrigeration: hasRefrigeration ? 1 : 0,
        truck_capacity: capNum,
      })

      if (res.success) {
        toast.success("Warehouse updated successfully")
        setOpen(false)
        router.refresh()
      } else {
        const msg = res.error || "Failed to update warehouse in database."
        setDialogError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      console.error(err)
      const msg = getErrorMessage(err, "An error occurred while updating the warehouse.")
      setDialogError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDialogError(null); }}>
      <DialogTrigger
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <Edit2 className="size-4" />
        Edit Warehouse
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Warehouse Details</DialogTitle>
            <DialogDescription>
              Modify warehouse locations, size dimensions, and operational characteristics.
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="truck-capacity">Truck Parking Capacity (spots)</Label>
                <Input
                  id="truck-capacity"
                  type="number"
                  min={1}
                  step={1}
                  value={truckCapacity}
                  onChange={(e) => setTruckCapacity(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="has-refrigeration">Refrigeration Capability</Label>
                <select
                  id="has-refrigeration"
                  value={hasRefrigeration ? "1" : "0"}
                  onChange={(e) => setHasRefrigeration(e.target.value === "1")}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">Refrigerated (Cold Storage)</option>
                  <option value="0">Ambient Storage Only</option>
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
