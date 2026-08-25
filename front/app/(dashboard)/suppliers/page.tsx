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
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"

export default async function SuppliersPage() {
  await requireRole("admin")
  const suppliers = await api.suppliers.getAll()

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Suppliers" }]} />
      <div className="min-h-0 flex-1">
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Address / Location</TableHead>
                <TableHead scope="col" className="text-right">
                  ID
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
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
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {s.id}
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
