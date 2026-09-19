"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Warehouse, Calendar } from "lucide-react"

import type { Deposit } from "@/types"

interface ReportFiltersProps {
  warehouses: Deposit[]
  availablePeriods?: Array<{ value: string; label: string }>
}

const DEFAULT_PERIOD_OPTIONS = [
  { value: "", label: "All Periods (Full Year 2026)" },
  { value: "Q1", label: "Q1 (Jan - Mar 2026)" },
  { value: "Q2", label: "Q2 (Apr - Jun 2026)" },
  { value: "6M_H1", label: "H1 (Jan - Jun 2026)" },
  { value: "6M_H2", label: "H2 (Jul - Dec 2026)" },
  { value: "Q3", label: "Q3 (Jul - Sep 2026)" },
  { value: "Q4", label: "Q4 (Oct - Dec 2026)" },
  { value: "2026-03", label: "March 2026 (Active Orders)" },
  { value: "2026-04", label: "April 2026 (Active Orders)" },
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "October 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "December 2026" },
]

export function ReportFilters({ warehouses, availablePeriods }: ReportFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWarehouseId = searchParams.get("warehouseId") || ""
  const currentPeriod = searchParams.get("period") || ""

  // Automatically merge dynamically discovered periods with defaults
  const options = React.useMemo(() => {
    const list = availablePeriods && availablePeriods.length > 0
      ? [...availablePeriods]
      : [...DEFAULT_PERIOD_OPTIONS]

    if (currentPeriod && !list.some((o) => o.value === currentPeriod)) {
      list.push({ value: currentPeriod, label: currentPeriod })
    }
    return list
  }, [availablePeriods, currentPeriod])

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

  function handlePeriodChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const params = new URLSearchParams(window.location.search)
    if (val) {
      params.set("period", val)
    } else {
      params.delete("period")
    }
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Location Filter */}
      <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted text-primary shrink-0">
          <Warehouse className="size-3.5" />
        </div>
        <div className="min-w-[130px] sm:min-w-[160px]">
          <label htmlFor="warehouse-filter" className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Location
          </label>
          <select
            id="warehouse-filter"
            value={currentWarehouseId}
            onChange={handleWarehouseChange}
            className="block w-full border-0 bg-transparent p-0 text-xs font-medium text-foreground focus:ring-0 focus:outline-none cursor-pointer"
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

      {/* Period Filter */}
      <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted text-primary shrink-0">
          <Calendar className="size-3.5" />
        </div>
        <div className="min-w-[140px] sm:min-w-[170px]">
          <label htmlFor="period-filter" className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Period / Timeframe
          </label>
          <select
            id="period-filter"
            value={currentPeriod}
            onChange={handlePeriodChange}
            className="block w-full border-0 bg-transparent p-0 text-xs font-medium text-foreground focus:ring-0 focus:outline-none cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
