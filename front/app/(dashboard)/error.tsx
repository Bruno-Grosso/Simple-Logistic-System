"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/page-shell"
import { PageHeader } from "@/components/page-header"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard page error:", error)
  }, [error])

  return (
    <PageShell>
      <PageHeader crumbs={[{ label: "System Error" }]} />
      <div className="flex flex-1 items-center justify-center p-6">
        <div
          role="alert"
          aria-live="assertive"
          className="w-full max-w-lg rounded-xl border border-destructive/30 bg-card p-6 shadow-sm space-y-4 text-center"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Unable to load this logistics section
            </h2>
            <p className="text-sm text-muted-foreground">
              We encountered an issue fetching data or communicating with the backend database. You can retry loading the data or navigate to another section.
            </p>
            {error.message && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
                <span className="text-xs font-semibold text-destructive uppercase tracking-wider block mb-1">
                  Error Details
                </span>
                <p className="text-xs font-mono text-destructive break-words">
                  {error.message}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
            <Button
              onClick={() => reset()}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry loading
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard" />}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
