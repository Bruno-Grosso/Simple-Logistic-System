import { Box } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PRODUCTS } from "@/lib/mock-data"

function isExpired(isoDate: string | undefined): boolean {
  if (!isoDate) return false
  const d = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader crumbs={[{ label: "Products" }]} />
      <div className="flex-1 p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table className="min-w-[650px]">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Product</TableHead>
                <TableHead scope="col">Flags</TableHead>
                <TableHead scope="col">Expires</TableHead>
                <TableHead scope="col" className="text-right">
                  Price
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Volume
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Weight
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PRODUCTS.map((p) => {
                const expired = p.expire_date ? isExpired(p.expire_date) : false
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Box className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.is_cold && <Badge variant="default">cold</Badge>}
                        {p.is_fragile && <Badge variant="secondary">fragile</Badge>}
                        {!p.is_cold && !p.is_fragile && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.expire_date ? (
                        <span
                          className={cn(
                            "tabular-nums",
                            expired && "text-destructive",
                          )}
                        >
                          {new Date(p.expire_date).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.price != null
                        ? new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: "BRL",
                          }).format(p.price)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.volume != null ? `${p.volume} m³` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.weight != null ? `${p.weight} kg` : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
