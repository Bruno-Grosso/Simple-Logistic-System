import Link from "next/link"
import { SearchX, LayoutDashboard, Package, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div
        role="status"
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4 text-center"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-widest">
            404 — Not Found
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Resource or Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            The requested page, order, warehouse, or vehicle could not be found or you do not have permission to view it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
          <Button
            nativeButton={false}
            render={<Link href="/dashboard" />}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Go to Dashboard
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/orders" />}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Package className="size-4" aria-hidden="true" />
            View Orders
          </Button>
        </div>
      </div>
    </div>
  )
}
