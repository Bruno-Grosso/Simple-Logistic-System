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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { User, Deposit } from "@/types"

export const dynamic = "force-dynamic"

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default async function EmployeesPage() {
  const [users, deposits] = await Promise.all([
    api.users.getAll(),
    api.warehouses.getAll(),
  ])

  // Filter for workers/staff (non-clients or all employees)
  const staff = users.filter((u) => u.role !== "client")

  const depositMap = new Map<string, Deposit>()
  deposits.forEach((d) => depositMap.set(d.id, d))

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Employees" }]} />
      <div className="min-h-0 flex-1">
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Role / Position</TableHead>
                <TableHead scope="col">ID</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((u) => {
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className={cn("bg-primary/15 text-xs font-medium text-primary")}>
                            {initialsFromName(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {u.work_position || u.role.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-chart-2 text-chart-2">
                        Active
                      </Badge>
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
