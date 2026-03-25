import { BarChart3 } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { PageShell } from "@/components/page-shell"

export default function ReportsPage() {
  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "Reports" }]} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="Reports coming soon"
          description="Aggregated KPIs and exports will be available once the reporting backend API is connected."
        />
      </div>
    </PageShell>
  )
}
