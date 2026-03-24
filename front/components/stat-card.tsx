import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  description?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "shadow-none",
        accent && "ring-1 ring-primary/25 bg-card/80",
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {value}
            </p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              accent
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
