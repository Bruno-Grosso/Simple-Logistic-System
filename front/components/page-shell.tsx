import { cn } from "@/lib/utils"

/**
 * Standard dashboard page wrapper: outer padding is always `p-6`; spacing from
 * the page header to main content uses `gap-6` across all routes.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 p-6",
        className,
      )}
    >
      {children}
    </div>
  )
}
