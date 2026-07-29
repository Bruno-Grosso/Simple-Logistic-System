"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { User, Product } from "@/types"

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
  const [deadline, setDeadline] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const [fetchedProducts, fetchedUsers] = await Promise.all([
          api.products.getAll(),
          api.users.getAll(),
        ])
        if (active) {
          setProducts(fetchedProducts)
          setUsers(fetchedUsers)
          if (fetchedProducts.length > 0) {
            setLines([{ productId: fetchedProducts[0].id, quantity: 1 }])
          }
        }
      } catch (err) {
        console.error("Failed to load products/users:", err)
      } finally {
        if (active) setLoadingData(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [])

  const clients = useMemo(() => users.filter((u) => u.role === "client"), [users])

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = products.find((x) => x.id === line.productId)
      const price = p?.price ?? 0
      return sum + price * line.quantity
    }, 0)
  }, [lines, products])

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
    if (!clientId || !destination || !deadline) return
    setLoading(true)
    try {
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
        router.push("/orders")
        router.refresh()
      } else {
        alert("Failed to create order")
      }
    } catch (err) {
      console.error("Error creating order:", err)
      alert("Error creating order")
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
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6" aria-label="Create order">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Delivery info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={destFieldId}>Destination</Label>
                <Input
                  id={destFieldId}
                  name="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Address or place name"
                  required
                  autoComplete="street-address"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={clientFieldId}>Client</Label>
                  <select
                    id={clientFieldId}
                    name="client"
                    className={selectClassName}
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    aria-label="Select client"
                  >
                    <option value="">Select client</option>
                    {clients.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
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
              <div className="space-y-2">
                <Label htmlFor={deadlineFieldId}>Deadline</Label>
                <Input
                  id={deadlineFieldId}
                  name="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
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
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading} aria-busy={loading}>
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
