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
import {
  EMPLOYEES,
  getDepositById,
  getDepositLabel,
  getUserById,
} from "@/lib/mock-data"

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function EmployeesPage() {
  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Employees" }]} />
      <div className="min-h-0 flex-1">
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Position</TableHead>
                <TableHead scope="col">Deposit</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">
                  Hours / day
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Cost / hour
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EMPLOYEES.map((e) => {
                const user = getUserById(e.user_id)
                const deposit = e.deposit_id ? getDepositById(e.deposit_id) : undefined
                const depositName = deposit ? getDepositLabel(deposit) : "—"
                const available = e.is_able

                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback
                            className={cn(
                              "bg-primary/15 text-xs font-medium text-primary",
                            )}
                          >
                            {user ? initialsFromName(user.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user?.name ?? e.user_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user?.work_position ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{depositName}</TableCell>
                    <TableCell>
                      {available ? (
                        <Badge
                          variant="outline"
                          className="border-chart-2 text-chart-2"
                        >
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {e.max_work_hours_per_day ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {e.hourly_cost != null
                        ? new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: "BRL",
                          }).format(e.hourly_cost)
                        : "—"}
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
