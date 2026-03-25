import Link from "next/link"
import { notFound } from "next/navigation"
import { Package, Truck } from "lucide-react"

import { InfoField } from "@/components/info-field"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  TRUCKS,
  getDepositById,
  getDepositLabel,
  getProductById,
  getStockByDeposit,
} from "@/lib/mock-data"

function formatDepositSize(size: string | undefined): string {
  if (!size) return "—"
  try {
    const { l, w, h } = JSON.parse(size) as { l?: number; w?: number; h?: number }
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
  const deposit = getDepositById(id)
  if (!deposit) notFound()

  const name = getDepositLabel(deposit)
  const pct = deposit.volume_max
    ? Math.round((deposit.volume_actual / deposit.volume_max) * 100)
    : 0
  const stock = getStockByDeposit(deposit.id)
  const parked = TRUCKS.filter((t) => t.current_deposit_id === deposit.id)
  const inbound = TRUCKS.filter((t) => t.destination_deposit_id === deposit.id)

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: "Deposits", href: "/deposits" },
          { label: name },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deposit details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  <InfoField label="Location" value={name} />
                  <InfoField label="Size" value={formatDepositSize(deposit.size)} />
                  <InfoField
                    label="Refrigeration"
                    value={deposit.has_refrigeration ? "Yes" : "No"}
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

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {stock.map((item) => {
                    const product = getProductById(item.product_id)
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Parked trucks</CardTitle>
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
                <CardTitle>Inbound trucks</CardTitle>
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
