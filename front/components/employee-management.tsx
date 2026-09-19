"use client"

import { useState } from "react"
import { AlertCircle, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import type { Deposit, User } from "@/types"

export function EmployeeManagement({ employees, warehouses }: { employees: User[]; warehouses: Deposit[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const [employeeList, setEmployeeList] = useState(employees)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<string>("warehouse_worker")
  const [warehouseId, setWarehouseId] = useState("")
  const [wage, setWage] = useState("45")
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const rolesNeedWarehouse = ["warehouse_worker", "inventory_manager", "maintenance_technician"]

  function edit(employee?: User) {
    setDialogError(null)
    setEditing(employee || null)
    setName(employee?.name || "")
    setEmail(employee?.email || "")
    setPassword("")
    setRole(employee?.rawRole || "warehouse_worker")
    setWarehouseId(employee?.warehouse_id || warehouses[0]?.id || "")
    setWage(String(employee?.wage ?? 45))
    setActive(employee?.is_active ?? true)
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setDialogError(null)

    if (!name.trim()) {
      const msg = "Please enter an employee name."
      setDialogError(msg)
      toast.error(msg)
      return
    }

    const wageNum = Number(wage)
    if (isNaN(wageNum) || wageNum < 0) {
      const msg = "Hourly wage must be a non-negative number."
      setDialogError(msg)
      toast.error(msg)
      return
    }

    if (!editing && !password) {
      const msg = "Password is required for new employees."
      setDialogError(msg)
      toast.error(msg)
      return
    }

    if (password && password.length < 8) {
      const msg = "Password must be at least 8 characters long."
      setDialogError(msg)
      toast.error(msg)
      return
    }

    if (rolesNeedWarehouse.includes(role) && !warehouseId) {
      const msg = "Please select an assigned warehouse for this role."
      setDialogError(msg)
      toast.error(msg)
      return
    }

    setSaving(true)
    const payload = {
      name: name.trim(),
      role,
      warehouse_id: rolesNeedWarehouse.includes(role) ? warehouseId || null : null,
      wage: wageNum,
      is_active: active ? 1 : 0,
    }

    try {
      if (editing) {
        const result = await api.users.update(editing.id, { ...payload, password: password || undefined })
        setSaving(false)
        if (!result.success) {
          const err = result.error || "Could not save employee"
          setDialogError(err)
          return toast.error(err)
        }
        if (result.user) setEmployeeList((current) => current.map((employee) => employee.id === editing.id ? result.user! : employee))
        toast.success("Employee updated")
      } else {
        const result = await api.users.createEmployee({ ...payload, email, password })
        setSaving(false)
        if (!result.success) {
          const err = result.error || "Could not save employee"
          setDialogError(err)
          return toast.error(err)
        }
        if (result.employee) setEmployeeList((current) => [...current, result.employee!])
        toast.success("Employee added")
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      setSaving(false)
      const errMessage = getErrorMessage(err, "An error occurred while saving the employee.")
      setDialogError(errMessage)
      toast.error(errMessage)
    }
  }

  async function remove(employee: User) {
    if (!window.confirm(`Remove ${employee.name}? This cannot be undone.`)) return
    try {
      const result = await api.users.remove(employee.id)
      if (!result.success) return toast.error(result.error || "Could not remove employee")
      setEmployeeList((current) => current.filter((candidate) => candidate.id !== employee.id))
      toast.success("Employee removed")
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove employee."))
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => edit()} data-testid="add-employee-button" className="gap-1.5">
          <Plus className="size-4" /> Add employee
        </Button>
      </div>
      {employeeList.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No employees yet"
          description="Add a warehouse worker, truck driver, dispatcher, or technician to start assigning work."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Hourly wage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeList.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium">{employee.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{employee.id}</p>
                  </TableCell>
                  <TableCell className="capitalize">
                    {(employee.rawRole || employee.role).replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    {warehouses.find((warehouse) => warehouse.id === employee.warehouse_id)?.location || "—"}
                  </TableCell>
                  <TableCell>R$ {(employee.wage ?? 45).toFixed(2)}/h</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.is_active ? "outline" : "secondary"}
                      className={employee.is_active ? "border-chart-2 text-chart-2" : ""}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => edit(employee)} aria-label={`Edit ${employee.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => remove(employee)} aria-label={`Remove ${employee.name}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>Manage role, warehouse assignment, pay, and active status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} noValidate className="grid gap-4 py-2">
            {dialogError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2 font-medium"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{dialogError}</span>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="employee-name">Name</Label>
              <Input id="employee-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {!editing && (
              <>
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </>
            )}
            {editing && (
              <div className="grid gap-1.5">
                <Label>New password (optional)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Role</Label>
                <select
                  data-testid="employee-role-select"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="warehouse_worker">Warehouse worker</option>
                  <option value="truck_driver">Truck driver</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="inventory_manager">Inventory manager</option>
                  <option value="maintenance_technician">Maintenance technician</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Hourly wage</Label>
                <Input type="number" min="0" step="0.01" value={wage} onChange={(e) => setWage(e.target.value)} required />
              </div>
            </div>
            {rolesNeedWarehouse.includes(role) && (
              <div className="grid gap-1.5">
                <Label>Assigned warehouse</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.location || warehouse.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active employee
            </label>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
