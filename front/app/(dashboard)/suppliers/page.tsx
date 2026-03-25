import { Factory } from "lucide-react"

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
import { SUPPLIERS } from "@/lib/mock-data"

export default function SuppliersPage() {
  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Suppliers" }]} />
      <div className="min-h-0 flex-1">
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Address</TableHead>
                <TableHead scope="col" className="text-right">
                  Latitude
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Longitude
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUPPLIERS.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Factory className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    {s.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {s.latitude != null ? s.latitude : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {s.longitude != null ? s.longitude : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  )
}
