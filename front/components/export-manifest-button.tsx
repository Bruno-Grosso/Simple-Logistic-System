"use client"

import { useState } from "react"
import { Download, FileText, Printer } from "lucide-react"
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
import { api } from "@/lib/api"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils"
import type { Order, OrderItem, Product, Truck, User, Deposit } from "@/types"

type Props = {
  order: Order
  items?: OrderItem[]
  products?: Product[]
  client?: User
  truck?: Truck
  driver?: User
  warehouse?: Deposit
}

export function ExportManifestButton({
  order,
  items = [],
  products = [],
  client,
  truck,
  driver,
  warehouse,
}: Props) {
  const [open, setOpen] = useState(false)

  const productMap = new Map(products.map((p) => [p.id, p]))
  const totalWeight = items.reduce((sum, it) => {
    const p = productMap.get(it.product_id)
    return sum + (p?.weight || 0) * it.quantity
  }, 0)
  const totalVolume = items.reduce((sum, it) => {
    const p = productMap.get(it.product_id)
    return sum + (p?.volume || 0) * it.quantity
  }, 0)

  function handleDownloadCsv() {
    try {
      if (!order?.id) {
        toast.error("Invalid order identifier for manifest export.")
        return
      }
      const url = api.orders.exportManifestCsvUrl(order.id)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `shipping-manifest-${order.id}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Manifest download started.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to download shipping manifest."))
    }
  }

  function handlePrint() {
    try {
      window.print()
    } catch (err) {
      toast.error("Could not trigger print dialog. Please try using your browser print shortcut.")
    }
  }

  let destLabel = order.final_destination || "—"
  if (order.final_destination) {
    try {
      const parsed = JSON.parse(order.final_destination)
      if (parsed?.label) destLabel = parsed.label
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <FileText className="size-3.5" />
        Export Manifest
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <FileText className="size-5 text-primary" />
            Shipping Manifest & Bill of Lading
          </DialogTitle>
          <DialogDescription>
            Official freight documentation for transport order #{order.id}.
          </DialogDescription>
        </DialogHeader>

        {/* Printable Manifest Preview */}
        <div id="printable-manifest" className="rounded-lg border border-border bg-card p-6 space-y-5 text-sm text-foreground">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight font-display text-primary">LOGISYS</h2>
              <p className="text-xs text-muted-foreground">Logistics & Supply Chain Management</p>
              <p className="text-xs text-muted-foreground font-mono">Região Serrana Hub — RJ</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-bold text-primary">
                MANIFEST #{order.id}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {new Date().toLocaleDateString("pt-BR")}
              </p>
              <p className="text-xs font-semibold text-foreground">Status: {order.status}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border pb-4 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Shipper / Origin</p>
              <p className="font-medium text-foreground">{warehouse?.location || "Petrópolis Hub (WH-001)"}</p>
              <p className="text-muted-foreground">LogiSys Central Depósito</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Consignee / Client</p>
              <p className="font-medium text-foreground">{client?.name || `Client ${order.client_id}`}</p>
              <p className="text-muted-foreground">{destLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Carrier Vehicle</p>
              <p className="font-medium text-foreground">{truck ? `${truck.model} (${truck.id})` : "Truck Assigned"}</p>
              <p className="text-muted-foreground">Capacity: {truck?.weight_max ?? 25000} kg</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Driver</p>
              <p className="font-medium text-foreground">{driver?.name || "Designated Driver"}</p>
              <p className="text-muted-foreground">Deadline: {order.time_limit || "Immediate"}</p>
            </div>
          </div>

          {/* Cargo Table */}
          <div>
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Itemized Cargo Manifest</p>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-2 font-medium">Item</th>
                    <th className="p-2 font-medium text-right">Qty</th>
                    <th className="p-2 font-medium text-right">Unit Wt (kg)</th>
                    <th className="p-2 font-medium text-right">Total Wt (kg)</th>
                    <th className="p-2 font-medium text-right">Vol (m³)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-muted-foreground">
                        General logistics freight package
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const p = productMap.get(it.product_id)
                      const w = Number(p?.weight || 0)
                      const v = Number(p?.volume || 0)
                      return (
                        <tr key={it.product_id}>
                          <td className="p-2 font-medium">
                            {p?.name || it.product_id}
                            {p?.is_cold ? " (Refrig)" : ""}
                          </td>
                          <td className="p-2 text-right tabular-nums">{it.quantity}</td>
                          <td className="p-2 text-right tabular-nums">{w.toFixed(2)}</td>
                          <td className="p-2 text-right tabular-nums">{(w * it.quantity).toFixed(2)}</td>
                          <td className="p-2 text-right tabular-nums">{(v * it.quantity).toFixed(3)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary & Signatures */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border pt-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">
                Total Cargo Weight: <strong className="text-foreground">{totalWeight.toFixed(2)} kg</strong>
              </p>
              <p className="text-muted-foreground">
                Total Cargo Volume: <strong className="text-foreground">{totalVolume.toFixed(3)} m³</strong>
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-muted-foreground">
                Declared Freight Value: <strong className="text-foreground">R$ {Number(order.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border text-center text-[10px] text-muted-foreground">
            <div>
              <div className="border-b border-muted-foreground/40 mb-1 h-8" />
              <span>Dispatcher Signature</span>
            </div>
            <div>
              <div className="border-b border-muted-foreground/40 mb-1 h-8" />
              <span>Driver / Carrier</span>
            </div>
            <div>
              <div className="border-b border-muted-foreground/40 mb-1 h-8" />
              <span>Receiver Sign-off</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-3.5" />
            Print / Save as PDF
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button size="sm" onClick={handleDownloadCsv} className="gap-1.5">
              <Download className="size-3.5" />
              Download CSV
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
