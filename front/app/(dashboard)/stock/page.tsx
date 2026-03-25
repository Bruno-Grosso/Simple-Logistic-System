import { Boxes } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { STOCK, getDepositById, getDepositLabel, getProductById, getTruckById } from "@/lib/mock-data"

export default function StockPage() {
  const totalEntries = STOCK.length
  const inDeposits = STOCK.filter((s) => s.deposit_id).length
  const inTransit = STOCK.filter((s) => s.truck_id).length

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Stock" }]} />
      <div className="min-h-0 flex-1 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground">Total entries</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {totalEntries}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground">In deposits</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {inDeposits}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground">In transit</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                {inTransit}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Product</TableHead>
                <TableHead scope="col" className="text-right">
                  Quantity
                </TableHead>
                <TableHead scope="col">Location</TableHead>
                <TableHead scope="col">Type</TableHead>
                <TableHead scope="col">Arrived</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STOCK.map((row) => {
                const product = getProductById(row.product_id)
                const inWarehouse = Boolean(row.deposit_id)
                const deposit = row.deposit_id ? getDepositById(row.deposit_id) : undefined
                const truck = row.truck_id ? getTruckById(row.truck_id) : undefined

                const locationLabel = inWarehouse
                  ? deposit
                    ? getDepositLabel(deposit)
                    : "—"
                  : truck
                    ? `Truck · ${truck.model ?? row.truck_id}`
                    : "In transit"

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Boxes className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-medium">{product?.name ?? row.product_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-primary">
                      {row.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{locationLabel}</TableCell>
                    <TableCell>
                      {inWarehouse ? (
                        <Badge
                          variant="outline"
                          className="border-chart-2 text-chart-2"
                        >
                          Warehouse
                        </Badge>
                      ) : (
                        <Badge variant="default">In transit</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(row.arrived_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  )
}
