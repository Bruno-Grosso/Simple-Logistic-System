"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Trash2, Timer, Clock, Gauge, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn, getErrorMessage } from "@/lib/utils"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { computeDepositParkingUsage, calculateOrderETA } from "@/lib/calculations"
import type { User, Product, Deposit, Truck as TruckType } from "@/types"

const selectClassName = cn(
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
)

type Line = { productId: string; quantity: number }

export default function NewOrderPage() {
  const router = useRouter()
  const formId = useId()
  const [destination, setDestination] = useState("")
  const [clientId, setClientId] = useState("")
  const [receiverId, setReceiverId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [truckId, setTruckId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [deadline, setDeadline] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [warehouses, setWarehouses] = useState<Deposit[]>([])
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const [fetchedProducts, fetchedUsers, fetchedWarehouses, fetchedTrucks] = await Promise.all([
          api.products.getAll(),
          api.users.getAll(),
          api.warehouses.getAll(),
          api.trucks.getAll(),
        ])
        if (active) {
          setProducts(fetchedProducts)
          setUsers(fetchedUsers)
          setWarehouses(fetchedWarehouses)
          setTrucks(fetchedTrucks)
          if (fetchedWarehouses.length > 0) {
            setWarehouseId(fetchedWarehouses[0].id)
          }
          if (fetchedProducts.length > 0) {
            setLines([{ productId: fetchedProducts[0].id, quantity: 1 }])
          }
          const validClient = fetchedUsers.find((u) => u.role === "client" || u.rawRole === "customer")
          if (validClient) {
            setClientId(validClient.id)
          }
          const validDriver = fetchedUsers.find((u) => u.rawRole === "truck_driver")
          if (validDriver) {
            setDriverId(validDriver.id)
          }
          const validReceiver = fetchedUsers.find((u) => u.id !== validClient?.id && (u.rawRole === "warehouse_worker" || u.role === "admin"))
          if (validReceiver) {
            setReceiverId(validReceiver.id)
          }
        }
      } catch (err) {
        console.error("Failed to load initial data:", err)
      } finally {
        if (active) setLoadingData(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [])

  function handleAutoSelectValidData() {
    const validClient = clients[0] || users.find((u) => u.role === "client" || u.rawRole === "customer") || users[0]
    if (validClient) setClientId(validClient.id)

    if (lines.length === 0 && products.length > 0) {
      setLines([{ productId: products[0].id, quantity: 1 }])
    }
    const currentLines = lines.length > 0 ? lines : (products.length > 0 ? [{ productId: products[0].id, quantity: 1 }] : [])

    // Compute load & cold-chain needs
    const totalWeight = currentLines.reduce((sum, l) => {
      const p = products.find((x) => x.id === l.productId)
      return sum + (Number(p?.weight) || 1) * l.quantity
    }, 0)
    const totalVolume = currentLines.reduce((sum, l) => {
      const p = products.find((x) => x.id === l.productId)
      return sum + (Number(p?.volume) || 0.1) * l.quantity
    }, 0)
    const requiresCold = currentLines.some((l) => {
      const p = products.find((x) => x.id === l.productId)
      return Boolean(p?.is_cold)
    })

    // Find warehouse with parking and refrigeration if cold chain needed
    let targetWh = warehouses.find((w) => {
      const parked = trucks.filter((t) => t.current_deposit_id === w.id).length
      const p = computeDepositParkingUsage(w, parked)
      if (p.isFull) return false
      return requiresCold ? Boolean(w.has_refrigeration) : true
    })
    if (!targetWh) {
      targetWh = warehouses.find((w) => {
        const parked = trucks.filter((t) => t.current_deposit_id === w.id).length
        return !computeDepositParkingUsage(w, parked).isFull
      }) || warehouses[0]
    }
    if (targetWh) setWarehouseId(targetWh.id)

    // Suggest optimal truck matching capacity, location, and refrigeration
    const availableTrucks = trucks.filter((t) => t.is_valid !== false)
    const scoredTrucks = availableTrucks.map((t) => {
      let score = 100
      const remainingWeight = Math.max(0, Number(t.weight_max || 25000) - Number(t.weight_actual || 0))
      const remainingVolume = Math.max(0, Number(t.volume_max || 90) - Number(t.volume_actual || 0))
      if (totalWeight > remainingWeight || totalVolume > remainingVolume) {
        score -= 200
      }
      if (requiresCold && !t.has_refrigeration) {
        score -= 500
      }
      if (t.current_deposit_id === (targetWh?.id || warehouseId)) score += 50
      if (!t.is_delivering) score += 35
      if (requiresCold && t.has_refrigeration) score += 20
      if (!requiresCold && t.has_refrigeration) score -= 10
      score -= Number(t.truck_maintenance || 0) * 15
      score -= (Number(t.wear_percentage || 0) / 100) * 20
      return { truck: t, score }
    }).sort((a, b) => b.score - a.score)

    const optimalTruck = scoredTrucks[0]?.truck || trucks[0]
    if (optimalTruck) {
      setTruckId(optimalTruck.id)
    }

    const validDriver = drivers[0] || users.find((u) => u.rawRole === "truck_driver")
    if (validDriver) setDriverId(validDriver.id)

    const validReceiver = users.find((u) => u.id !== validClient?.id && (u.rawRole === "warehouse_worker" || u.role === "admin")) || users[1] || users[0]
    if (validReceiver) setReceiverId(validReceiver.id)

    if (!destination) {
      setDestination("Av. Lúcio Meira, Centro, Teresópolis - RJ")
    }

    if (!deadline) {
      const future = new Date()
      future.setDate(future.getDate() + 3)
      setDeadline(future.toISOString().split("T")[0])
    }

    if (optimalTruck) {
      toast.success(`Auto-selected optimal truck: ${optimalTruck.model || optimalTruck.id} (Cold-chain & capacity verified)`)
    }
  }

  const clients = useMemo(() => users.filter((u) => u.role === "client"), [users])
  const drivers = useMemo(() => users.filter((u) => u.rawRole === "truck_driver"), [users])

  const selectedWarehouse = useMemo(() => warehouses.find((w) => w.id === warehouseId), [warehouses, warehouseId])
  const selectedWhParkedTrucks = useMemo(() => trucks.filter((t) => t.current_deposit_id === warehouseId).length, [trucks, warehouseId])
  const selectedWhParking = useMemo(() => (selectedWarehouse ? computeDepositParkingUsage(selectedWarehouse, selectedWhParkedTrucks) : null), [selectedWarehouse, selectedWhParkedTrucks])

  const selectedTruck = useMemo(() => {
    if (truckId) {
      const found = trucks.find((t) => t.id === truckId)
      if (found) return found
    }
    return trucks.find((t) => t.current_deposit_id === warehouseId && !t.is_delivering) || trucks[0]
  }, [trucks, truckId, warehouseId])

  const estimatedDistance = useMemo(() => {
    if (!destination) return 100
    const lower = destination.toLowerCase()
    if (lower.includes("friburgo")) return 140
    if (lower.includes("teresópolis") || lower.includes("teresopolis")) return 95
    if (lower.includes("petrópolis") || lower.includes("petropolis")) return 65
    if (lower.includes("rio") || lower.includes("capital")) return 160
    return 115
  }, [destination])

  const estimatedETA = useMemo(() => {
    return calculateOrderETA(estimatedDistance, {
      truck: selectedTruck,
      timeLimit: deadline || undefined,
    })
  }, [estimatedDistance, selectedTruck, deadline])

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId)
      const price = p?.price ?? 0
      return sum + price * line.quantity
    }, 0)
  }, [lines, products])

  const orderWeight = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId)
      return sum + (p?.weight ?? 0) * (Number(line.quantity) || 0)
    }, 0)
  }, [lines, products])

  const orderVolume = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId)
      return sum + (p?.volume ?? 0) * (Number(line.quantity) || 0)
    }, 0)
  }, [lines, products])

  const hasColdItem = useMemo(() => {
    return lines.some((line) => {
      const p = products.find((x) => x.id === line.productId)
      return Boolean(p?.is_cold)
    })
  }, [lines, products])

  const overCapacity = useMemo(() => {
    if (!selectedTruck || selectedTruck.weight_max == null) return false
    return orderWeight > selectedTruck.weight_max
  }, [selectedTruck, orderWeight])

  const isColdConflict = useMemo(() => {
    if (!selectedTruck) return false
    return hasColdItem && (selectedTruck.has_refrigeration === false || (selectedTruck.has_refrigeration as any) === 0)
  }, [selectedTruck, hasColdItem])

  function addLine() {
    setLines((prev) => [
      ...prev,
      { productId: products[0]?.id ?? prev[prev.length - 1]?.productId ?? "", quantity: 1 },
    ])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const errs: Record<string, string> = {}

    if (!destination.trim()) {
      errs.destination = "Destination address is required."
    }
    if (!clientId) {
      errs.client = "Please select a client account."
    }
    if (!deadline) {
      errs.deadline = "Delivery deadline date and time is required."
    }
    if (lines.length === 0) {
      errs.lines = "Order must contain at least one product item."
    } else {
      const invalidLine = lines.find((l) => !l.productId || l.quantity < 1 || isNaN(l.quantity))
      if (invalidLine) {
        errs.lines = "All order items must have a valid product and quantity of at least 1."
      }
    }

    if (truckId && selectedTruck) {
      if (overCapacity) {
        errs.truck = `Order weight (${orderWeight.toFixed(1)} kg) exceeds truck payload capacity (${selectedTruck.weight_max} kg).`
      }
      if (isColdConflict) {
        errs.truck = "This order contains cold-chain items, but the selected truck does not have refrigeration."
      }
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const firstErr = Object.values(errs)[0]
      setFormError(firstErr)
      toast.error(firstErr)
      return
    }

    setFieldErrors({})
    setLoading(true)
    try {
      let geocodedDestination = null
      try {
        geocodedDestination = await api.geo.addressToCoordinates(destination)
      } catch {
        // Allow offline / test environment fallback
      }

      const orderId = `ORD-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`
      const payload = {
        id: orderId,
        client_id: clientId,
        final_destination: destination,
        time_limit: deadline,
        price: total,
        status: "Pending" as const,
        items: lines.map((line) => ({
          product_id: line.productId,
          quantity: line.quantity,
        })),
      }
      const res = await api.orders.create(payload)
      if (res.success) {
        if (warehouseId) {
          const assignedTruck = truckId || selectedTruck?.id || trucks[0]?.id || "TRK-001"
          const routeResult = await api.orders.addRouteStep(orderId, {
            step: 1,
            warehouse_id: warehouseId,
            truck_id: assignedTruck,
            driver_id: driverId || null,
            destination_warehouse_id: null,
            estimated_time: deadline,
          })
          if (!routeResult.success) {
            throw new Error(routeResult.error || "The order was created, but its truck and driver assignment could not be saved.")
          }
        }
        toast.success(`Order ${orderId} created successfully!`)
        router.push("/orders")
        router.refresh()
      } else {
        const errorMsg = res.error || "Failed to create order. Please verify input data."
        setFormError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error("Error creating order:", err)
      const errorMsg = getErrorMessage(err, "An error occurred while creating the order. Please try again.")
      setFormError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const destFieldId = `order-destination-${formId}`
  const clientFieldId = `order-client-${formId}`
  const receiverFieldId = `order-receiver-${formId}`
  const deadlineFieldId = `order-deadline-${formId}`

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: "Orders", href: "/orders" },
          { label: "New Order" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl space-y-6" aria-label="Create order">
          {formError && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive flex items-center gap-2.5"
            >
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-lg">Delivery info</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoSelectValidData}
                className="gap-1.5 text-xs font-normal"
                data-testid="auto-select-order-data"
              >
                <Sparkles className="size-3.5 text-primary" />
                Auto-select valid order data
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={destFieldId}>Destination</Label>
                <Input
                  id={destFieldId}
                  name="destination"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value)
                    if (fieldErrors.destination) {
                      setFieldErrors((prev) => {
                        const next = { ...prev }
                        delete next.destination
                        return next
                      })
                    }
                  }}
                  placeholder="Address or place name"
                  required
                  autoComplete="street-address"
                  aria-invalid={Boolean(fieldErrors.destination)}
                  className={fieldErrors.destination ? "border-destructive focus-visible:ring-destructive/30" : ""}
                />
                {fieldErrors.destination && (
                  <p className="text-xs font-medium text-destructive mt-1" role="alert">
                    {fieldErrors.destination}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={clientFieldId}>Client</Label>
                  <select
                    id={clientFieldId}
                    name="client"
                    className={cn(
                      selectClassName,
                      fieldErrors.client && "border-destructive focus-visible:ring-destructive/30"
                    )}
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value)
                      if (fieldErrors.client) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.client
                          return next
                        })
                      }
                    }}
                    required
                    aria-label="Select client"
                    aria-invalid={Boolean(fieldErrors.client)}
                  >
                    <option value="">Select client</option>
                    {clients.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.client && (
                    <p className="text-xs font-medium text-destructive mt-1" role="alert">
                      {fieldErrors.client}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={receiverFieldId}>Receiver</Label>
                  <select
                    id={receiverFieldId}
                    name="receiver"
                    className={selectClassName}
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    required
                    aria-label="Select receiver"
                  >
                    <option value="">Select receiver</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-warehouse">Dispatch Warehouse</Label>
                    {selectedWhParking && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selectedWhParking.isFull
                            ? "text-destructive"
                            : selectedWhParking.isNearCapacity
                            ? "text-amber-500"
                            : "text-emerald-500"
                        )}
                      >
                        {selectedWhParking.isFull
                          ? "Parking Full"
                          : `${selectedWhParking.available} spots open`}
                      </span>
                    )}
                  </div>
                  <select
                    id="order-warehouse"
                    name="warehouse"
                    className={selectClassName}
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                    aria-label="Select dispatch warehouse"
                  >
                    <option value="">Select dispatch warehouse</option>
                    {warehouses.map((w) => {
                      const parkedCount = trucks.filter((t) => t.current_deposit_id === w.id).length
                      const p = computeDepositParkingUsage(w, parkedCount)
                      return (
                        <option key={w.id} value={w.id}>
                          {w.location || `Warehouse ${w.id}`} ({p.parked}/{p.capacity} trucks)
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-truck">Assigned Truck (Optimal)</Label>
                    {selectedTruck && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        {selectedTruck.has_refrigeration ? "❄️ Cold-chain" : "Dry Freight"} • {selectedTruck.weight_max || 25000}kg
                      </span>
                    )}
                  </div>
                  <select
                    id="order-truck"
                    name="truck"
                    className={selectClassName}
                    value={truckId || selectedTruck?.id || ""}
                    onChange={(e) => setTruckId(e.target.value)}
                    aria-label="Select truck"
                  >
                    <option value="">Auto-select optimal truck</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.model || t.id} ({t.has_refrigeration ? "Refrigerated" : "Standard"}, {t.weight_max || 25000}kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="order-driver">Assigned Driver</Label>
                  <select
                    id="order-driver"
                    name="driver"
                    className={selectClassName}
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  >
                    <option value="">Select driver (optional)</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={deadlineFieldId}>Deadline</Label>
                  <Input
                    id={deadlineFieldId}
                    name="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value)
                      if (fieldErrors.deadline) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.deadline
                          return next
                        })
                      }
                    }}
                    required
                    aria-invalid={Boolean(fieldErrors.deadline)}
                    className={fieldErrors.deadline ? "border-destructive focus-visible:ring-destructive/30" : ""}
                  />
                  {fieldErrors.deadline && (
                    <p className="text-xs font-medium text-destructive mt-1" role="alert">
                      {fieldErrors.deadline}
                    </p>
                  )}
                </div>
              </div>
              {fieldErrors.truck && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2"
                >
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.truck}</span>
                </div>
              )}

              {/* Real-time Order ETA Estimation Preview */}
              {destination && (
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Timer className="size-3.5 text-primary" />
                      Estimated Transit & Arrival (ETA)
                    </span>
                    {deadline && (
                      <div className="flex items-center gap-1.5">
                        {estimatedETA.compliance_status === "on_time" ? (
                          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1 py-0">
                            <ShieldCheck className="size-2.5" />
                            Within Deadline
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] gap-1 py-0">
                            <AlertTriangle className="size-2.5" />
                            Tight / Late Risk
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Est. Duration</span>
                      <span className="font-medium text-foreground">~{estimatedETA.formatted_duration_avg}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Driving Window</span>
                      <span className="font-medium text-foreground">{estimatedETA.driving_hours_min}h – {estimatedETA.driving_hours_max}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Speed Range</span>
                      <span className="font-medium text-foreground">{estimatedETA.min_speed_kmh} – {estimatedETA.max_speed_kmh} km/h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Rest Stops</span>
                      <span className="font-medium text-foreground">{estimatedETA.rest_hours_avg}h (8h limit)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedWhParking?.isFull && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <strong>Warning:</strong> Selected warehouse parking is at full capacity ({selectedWhParking.parked}/{selectedWhParking.capacity} trucks).
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3" aria-label="Product line items">
                {lines.map((line, index) => {
                  const prodFieldId = `order-line-product-${formId}-${index}`
                  const qtyFieldId = `order-line-qty-${formId}-${index}`
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor={prodFieldId}>Product</Label>
                        <select
                          id={prodFieldId}
                          className={selectClassName}
                          value={line.productId}
                          onChange={(e) => updateLine(index, { productId: e.target.value })}
                          aria-label={`Product for line ${index + 1}`}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full space-y-2 sm:w-28">
                        <Label htmlFor={qtyFieldId}>Quantity</Label>
                        <Input
                          id={qtyFieldId}
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          className="tabular-nums"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })
                          }
                          aria-label={`Quantity for line ${index + 1}`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="shrink-0"
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 1}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        <span className="sr-only sm:not-sr-only sm:ml-1">Remove</span>
                      </Button>
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" onClick={addLine} aria-label="Add product line">
                  <Plus className="size-4" aria-hidden />
                  Add item
                </Button>
                <p className="text-sm tabular-nums">
                  <span className="text-muted-foreground">Total </span>
                  <span className="font-semibold text-foreground">
                    R$ {total.toLocaleString("pt-BR")}
                  </span>
                </p>
              </div>
              {fieldErrors.lines && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2"
                >
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{fieldErrors.lines}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {formError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive flex items-center gap-2.5"
            >
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" data-testid="submit-order-button" disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Submitting…
                </>
              ) : (
                "Submit order"
              )}
            </Button>
            <Link href="/orders" className={cn(buttonVariants({ variant: "ghost" }))}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
