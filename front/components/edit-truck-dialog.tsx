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
import type { Truck, Deposit } from "@/types"

interface EditTruckDialogProps {
  truck: Truck
  warehouses: Deposit[]
}

export function EditTruckDialog({ truck, warehouses }: EditTruckDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Parse size JSON safely
  let initialLength = 0
  let initialWidth = 0
  let initialHeight = 0
  if (truck.size) {
    try {
      const parsed = JSON.parse(truck.size)
      initialLength = parsed.l ?? parsed.length ?? 0
      initialWidth = parsed.w ?? parsed.width ?? 0
      initialHeight = parsed.h ?? parsed.height ?? 0
    } catch {}
  }

  const [model, setModel] = useState(truck.model ?? "")
  const [speed, setSpeed] = useState(truck.speed ?? 80)
  const [volumeMax, setVolumeMax] = useState(truck.volume_max ?? 90)
  const [weightMax, setWeightMax] = useState(truck.weight_max ?? 25000)
  const [length, setLength] = useState(initialLength)
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [fuelCapacity, setFuelCapacity] = useState(truck.fuel_capacity ?? 500)
  const [fuelCurrent, setFuelCurrent] = useState(truck.fuel_current ?? 400)
  const [fuelConsumption, setFuelConsumption] = useState(truck.fuel_consumption ?? 0.3)
  const [isValid, setIsValid] = useState(truck.is_valid ? "1" : "0")
  const [hasRefrigeration, setHasRefrigeration] = useState(truck.has_refrigeration ? "1" : "0")
  const [currentWarehouseId, setCurrentWarehouseId] = useState(truck.current_deposit_id ?? "")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      const res = await api.trucks.update(truck.id, {
        model,
        speed: Number(speed),
        is_valid: Number(isValid),
        size: sizeObj,
        volume_max: Number(volumeMax),
        weight_max: Number(weightMax),
        has_refrigeration: Number(hasRefrigeration),
        fuel_capacity: Number(fuelCapacity),
        fuel_current: Number(fuelCurrent),
        fuel_consumption: Number(fuelConsumption),
        current_warehouse_id: currentWarehouseId || null,
      })

      if (res.success) {
        toast.success("Truck updated successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to update truck")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data || "An error occurred while updating the truck")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <Edit2 className="size-4" />
        Edit Truck
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Truck Details</DialogTitle>
            <DialogDescription>
              Modify truck technical specs, operational status, and current location.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="truck-model">Model Name</Label>
                <Input
                  id="truck-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Volvo FH16"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="truck-speed">Top Speed (km/h)</Label>
                <Input
                  id="truck-speed"
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="truck-volume">Cargo Volume (m³)</Label>
                <Input
                  id="truck-volume"
                  type="number"
                  value={volumeMax}
                  onChange={(e) => setVolumeMax(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="truck-weight">Max Weight (kg)</Label>
                <Input
                  id="truck-weight"
                  type="number"
                  value={weightMax}
                  onChange={(e) => setWeightMax(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-length">Length (m)</Label>
                <Input
                  id="t-length"
                  type="number"
                  step="0.01"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-width">Width (m)</Label>
                <Input
                  id="t-width"
                  type="number"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-height">Height (m)</Label>
                <Input
                  id="t-height"
                  type="number"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel-cap">Fuel Cap (L)</Label>
                <Input
                  id="fuel-cap"
                  type="number"
                  value={fuelCapacity}
                  onChange={(e) => setFuelCapacity(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel-curr">Current Fuel (L)</Label>
                <Input
                  id="fuel-curr"
                  type="number"
                  value={fuelCurrent}
                  onChange={(e) => setFuelCurrent(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel-cons">Consump. (L/km)</Label>
                <Input
                  id="fuel-cons"
                  type="number"
                  step="0.01"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="is-valid">Status</Label>
                <select
                  id="is-valid"
                  value={isValid}
                  onChange={(e) => setIsValid(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">Operational</option>
                  <option value="0">Out of Service / Maintenance</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="has-refrigeration">Refrigeration</Label>
                <select
                  id="has-refrigeration"
                  value={hasRefrigeration}
                  onChange={(e) => setHasRefrigeration(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">Yes (Cold Storage)</option>
                  <option value="0">No (Standard Ambient)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-warehouse">Current Location (Warehouse)</Label>
              <select
                id="current-warehouse"
                value={currentWarehouseId}
                onChange={(e) => setCurrentWarehouseId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— En Route / None —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.location} ({w.id})
                  </option>
                ))}
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
