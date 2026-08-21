import Link from "next/link"
import { Warehouse, Truck } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
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

export const dynamic = "force-dynamic"

export default async function DepositsPage() {
  const [deposits, trucks] = await Promise.all([
    api.warehouses.getAll(),
    api.trucks.getAll(),
  ])

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Deposits" }]} />
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {deposits.map((deposit) => {
            const label = deposit.location || `Warehouse ${deposit.id}`
            const { pct } = computeDepositUsage(deposit)
            const trucksParked = trucks.filter(
              (t) => t.current_deposit_id === deposit.id,
            ).length
            const parking = computeDepositParkingUsage(deposit, trucksParked)

            return (
              <Link key={deposit.id} href={`/deposits/${deposit.id}`} className="block">
                <Card className="h-full border border-border ring-0 transition-colors hover:bg-muted/30">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Warehouse className="size-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="truncate text-base">{label}</CardTitle>
                        <Badge
                          variant={parking.isFull ? "destructive" : parking.isNearCapacity ? "secondary" : "outline"}
                          className="text-[10px] shrink-0"
                        >
                          {parking.isFull ? "Parking Full" : `${parking.available} spots left`}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {deposit.id}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span>Storage Volume</span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <Progress value={pct} />
                        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                          {deposit.volume_actual} m³ of {deposit.volume_max ?? "—"} m³
                        </p>
                      </div>

                      <div>
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Truck className="size-3" />
                            Truck Parking
                          </span>
                          <span className="tabular-nums">
                            {parking.parked} / {parking.capacity} spots ({parking.pct}%)
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
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                      <div className="text-center">
                        <p className="text-sm font-semibold tabular-nums text-primary">
                          {parking.parked} <span className="text-[10px] font-normal text-muted-foreground">/ {parking.capacity}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Trucks parked</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          R$ {(deposit.fuel_price ?? 5.89).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Avg Gas / L</p>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            deposit.has_refrigeration
                              ? "bg-primary"
                              : "bg-muted-foreground/30",
                          )}
                          title={
                            deposit.has_refrigeration
                              ? "Refrigeration available"
                              : "No refrigeration"
                          }
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {deposit.has_refrigeration ? "Refrigerated" : "Ambient"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
