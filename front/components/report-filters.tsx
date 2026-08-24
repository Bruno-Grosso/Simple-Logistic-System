"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Warehouse } from "lucide-react"

import type { Deposit } from "@/types"

interface ReportFiltersProps {
  warehouses: Deposit[]
}

export function ReportFilters({ warehouses }: ReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWarehouseId = searchParams.get("warehouseId") || ""

  function handleWarehouseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const params = new URLSearchParams(window.location.search)
    if (val) {
      params.set("warehouseId", val)
    } else {
      params.delete("warehouseId")
    }
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-primary">
        <Warehouse className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor="warehouse-filter" className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Filter by Location
        </label>
        <select
          id="warehouse-filter"
          value={currentWarehouseId}
          onChange={handleWarehouseChange}
          className="block w-full border-0 bg-transparent p-0 text-sm font-medium text-foreground focus:ring-0 focus:outline-none"
        >
          <option value="" className="bg-background text-foreground">All Warehouses / Deposits</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id} className="bg-background text-foreground">
              {w.location}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
