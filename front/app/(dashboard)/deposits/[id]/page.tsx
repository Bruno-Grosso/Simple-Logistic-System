import Link from "next/link"
import { notFound } from "next/navigation"
import { Package, Truck, AlertTriangle, ShieldCheck } from "lucide-react"

import { InfoField } from "@/components/info-field"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { EditWarehouseDialog } from "@/components/edit-warehouse-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { computeDepositUsage, computeDepositParkingUsage } from "@/lib/calculations"
import type { Product } from "@/types"

function formatDepositSize(size: string | undefined): string {
  if (!size) return "—"
  try {
    const parsed = JSON.parse(size)
    const l = parsed.l ?? parsed.length
    const w = parsed.w ?? parsed.width
    const h = parsed.h ?? parsed.height
    if (l != null && w != null && h != null) {
      return `${l} × ${w} × ${h} m`
    }
  } catch {
    /* fall through */
  }
  return size
}

export default async function DepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deposit = await api.warehouses.getById(id)
  if (!deposit) notFound()

  const [stock, trucks, products] = await Promise.all([
    api.warehouses.getStock(deposit.id),
    api.trucks.getAll(),
    api.products.getAll(),
  ])

  const productMap = new Map<string, Product>()
  products.forEach((p) => productMap.set(p.id, p))

  const name = deposit.location || `Deposit ${deposit.id}`
  const { pct } = computeDepositUsage(deposit)
  const parked = trucks.filter((t) => t.current_deposit_id === deposit.id)
  const inbound = trucks.filter((t) => t.destination_deposit_id === deposit.id)
  const parking = computeDepositParkingUsage(deposit, parked.length)

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: "Deposits", href: "/deposits" },
          { label: name },
        ]}
        actions={<EditWarehouseDialog warehouse={deposit} />}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deposit details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-4">
                  <InfoField label="Location" value={name} />
                  <InfoField label="Size" value={formatDepositSize(deposit.size)} />
                  <InfoField
                    label="Refrigeration"
                    value={deposit.has_refrigeration ? "Yes" : "No"}
                  />
                  <InfoField
                    label="Parking Capacity"
                    value={`${parking.capacity} trucks max`}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Capacity utilization</span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                    {deposit.volume_actual} m³ of {deposit.volume_max ?? "—"} m³
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Parking Capacity & Status Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-5 text-primary" />
                  Parking Bay Status
                </CardTitle>
                <Badge
                  variant={parking.isFull ? "destructive" : parking.isNearCapacity ? "secondary" : "outline"}
                >
                  {parking.statusLabel}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoField label="Total Capacity" value={`${parking.capacity} spots`} />
                  <InfoField label="Parked Trucks" value={`${parking.parked} trucks`} />
                  <InfoField label="Available Spots" value={`${parking.available} spots`} />
                  <InfoField label="Inbound Trucks" value={`${inbound.length} trucks`} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Parking Occupancy</span>
                    <span className="tabular-nums">
                      {parking.parked} / {parking.capacity} ({parking.pct}%)
                    </span>
                  </div>
                  <Progress
                    value={parking.pct}
                    className={cn(
                      parking.isFull && "[&>div]:bg-destructive",
                      parking.isNearCapacity && "[&>div]:bg-amber-500"
                    )}
                  />
                </div>

                {parking.isFull ? (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>
                      <strong>Parking Bay Full:</strong> No additional trucks can be dispatched to or parked at this warehouse until a bay is freed.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>Parking is available. New truck routes and order arrivals can be accommodated.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {stock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No stock items in this warehouse.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {stock.map((item) => {
                      const product = productMap.get(item.product_id)
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Package
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            <span className="font-medium">{product?.name ?? item.product_id}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm tabular-nums">
                            <span className="text-muted-foreground">
                              <span className="sr-only">Quantity </span>
                              {item.quantity} units
                            </span>
                            <span className="text-muted-foreground">
                              Arrived{" "}
                              {new Date(item.arrived_at).toLocaleDateString(undefined, {
                                dateStyle: "medium",
                              })}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Parked trucks ({parked.length}/{parking.capacity})</CardTitle>
              </CardHeader>
              <CardContent>
                {parked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trucks parked here.</p>
                ) : (
                  <ul className="space-y-3">
                    {parked.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/fleet/${t.id}`}
                          className="flex items-start gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50"
                        >
                          <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {t.model ?? t.id}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inbound trucks ({inbound.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {inbound.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inbound trucks.</p>
                ) : (
                  <ul className="space-y-3">
                    {inbound.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/fleet/${t.id}`}
                          className="flex items-start gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-muted/50"
                        >
                          <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {t.model ?? t.id}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
