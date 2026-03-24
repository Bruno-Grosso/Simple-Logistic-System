"use client"

import { useId, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PRODUCTS, USERS } from "@/lib/mock-data"

const selectClassName = cn(
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
)

type Line = { productId: string; quantity: number }

export default function NewOrderPage() {
  const formId = useId()
  const [destination, setDestination] = useState("")
  const [clientId, setClientId] = useState("")
  const [receiverId, setReceiverId] = useState("")
  const [deadline, setDeadline] = useState("")
  const [lines, setLines] = useState<Line[]>([
    { productId: PRODUCTS[0]?.id ?? "", quantity: 1 },
  ])
  const [loading, setLoading] = useState(false)

  const clients = useMemo(() => USERS.filter((u) => u.role === "client"), [])

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = PRODUCTS.find((x) => x.id === line.productId)
      const price = p?.price ?? 0
      return sum + price * line.quantity
    }, 0)
  }, [lines])

  function addLine() {
    setLines((prev) => [
      ...prev,
      { productId: PRODUCTS[0]?.id ?? prev[prev.length - 1]?.productId ?? "", quantity: 1 },
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
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
  }

  const destFieldId = `order-destination-${formId}`
  const clientFieldId = `order-client-${formId}`
  const receiverFieldId = `order-receiver-${formId}`
  const deadlineFieldId = `order-deadline-${formId}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        crumbs={[
          { label: "Orders", href: "/orders" },
          { label: "New Order" },
        ]}
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
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
                    {USERS.map((u) => (
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
                          {PRODUCTS.map((p) => (
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
    </div>
  )
}
