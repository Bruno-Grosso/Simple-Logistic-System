"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = {
  url: string
  filename: string
  label?: string
  size?: "sm" | "default"
  variant?: "outline" | "default" | "secondary"
}

export function ExportCsvButton({
  url,
  filename,
  label = "Export CSV",
  size = "sm",
  variant = "outline",
}: Props) {
  function handleDownload() {
    try {
      if (!url) {
        toast.error("Download URL is not configured.")
        return
      }
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("CSV export download started.")
    } catch (err: any) {
      toast.error(err?.message || "Failed to download CSV export file.")
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleDownload}
      data-testid="export-csv-button"
      data-url={url}
      className="gap-1.5 h-8 text-xs shrink-0"
    >
      <Download className="size-3.5" />
      {label}
    </Button>
  )
}
