import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function PageHeader({
  crumbs,
  actions,
  className,
  titleClassName,
}: {
  crumbs: Crumb[];
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        {crumbs.map((c, i) => (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />}
            {c.href ? (
              <Link
                href={c.href}
                className="font-sans font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "font-display text-xl font-semibold tracking-tight text-foreground leading-tight sm:text-2xl",
                  titleClassName,
                )}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>
      {actions}
    </div>
  );
}
