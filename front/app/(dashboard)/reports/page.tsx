import { BarChart3 } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"

export default function ReportsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader crumbs={[{ label: "Reports" }]} />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <EmptyState
          icon={BarChart3}
          title="Reports coming soon"
          description="Aggregated KPIs and exports will be available once the reporting backend API is connected."
        />
      </div>
    </div>
  )
}
