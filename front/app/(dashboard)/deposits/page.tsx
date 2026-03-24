import Link from "next/link"
import { Warehouse } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { DEPOSITS, TRUCKS, getDepositLabel, getStockByDeposit } from "@/lib/mock-data"

export default function DepositsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader crumbs={[{ label: "Deposits" }]} />
      <div className="flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DEPOSITS.map((deposit) => {
            const label = getDepositLabel(deposit)
            const pct = deposit.volume_max
              ? Math.round((deposit.volume_actual / deposit.volume_max) * 100)
              : 0
            const stockEntries = getStockByDeposit(deposit.id).length
            const trucksParked = TRUCKS.filter(
              (t) => t.current_deposit_id === deposit.id,
            ).length

            return (
              <Link key={deposit.id} href={`/deposits/${deposit.id}`} className="block">
                <Card className="h-full transition-colors hover:bg-muted/30">
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Warehouse className="size-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{label}</CardTitle>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {deposit.id}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>Capacity</span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        {deposit.volume_actual} m³ of {deposit.volume_max ?? "—"} m³
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 border-t pt-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold tabular-nums text-primary">
                          {stockEntries}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Stock entries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold tabular-nums text-primary">
                          {trucksParked}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Trucks parked</p>
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
                        <p className="text-[10px] text-muted-foreground">Refrigeration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
