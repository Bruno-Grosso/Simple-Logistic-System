"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  variant?: "ghost" | "inline"
}

export function CopyButton({
  value,
  label = "Copy to clipboard",
  className,
  variant = "ghost",
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Copied "${value}" to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        data-testid="copy-button"
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors group",
          className
        )}
        title={label}
        aria-label={`${label}: ${value}`}
      >
        <span>{value}</span>
        {copied ? (
          <Check className="size-3 text-emerald-500 shrink-0" />
        ) : (
          <Copy className="size-3 opacity-60 group-hover:opacity-100 shrink-0" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      data-testid="copy-button"
      onClick={handleCopy}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
        className
      )}
      title={label}
      aria-label={`${label}: ${value}`}
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}
