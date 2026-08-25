import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"
import { EmployeeManagement } from "@/components/employee-management"
import { api } from "@/lib/api"
import { requireRole } from "@/lib/auth/require-role"

export const dynamic = "force-dynamic"

export default async function EmployeesPage() {
  await requireRole("admin")
  const [users, warehouses] = await Promise.all([api.users.getAll(), api.warehouses.getAll()])
  const employees = users.filter((user) => user.rawRole === "warehouse_worker" || user.rawRole === "truck_driver")
  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Employees" }]} />
      <div className="min-h-0 flex-1 space-y-4"><EmployeeManagement employees={employees} warehouses={warehouses} /></div>
    </PageShell>
  )
}
