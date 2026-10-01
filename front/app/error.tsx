"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 shadow-lg space-y-4 text-center"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. Our logistics system encountered an issue.
          </p>
          {error.message && (
            <p className="mt-2 text-xs font-mono text-destructive bg-destructive/5 rounded p-2 border border-destructive/20 text-left overflow-x-auto">
              {error.message}
            </p>
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
            Try again
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard" />}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Home className="size-4" aria-hidden="true" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
