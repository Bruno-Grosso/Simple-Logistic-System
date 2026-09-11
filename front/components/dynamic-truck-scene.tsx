"use client"

import dynamic from "next/dynamic"
import { Loader2, Truck } from "lucide-react"
import type { TruckSceneProps } from "./truck-scene"

const TruckSceneComponent = dynamic(
  () => import("./truck-scene").then((mod) => mod.TruckScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-muted/20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs font-medium">Loading 3D Vehicle Twin…</span>
      </div>
    ),
  }
)

export function DynamicTruckScene(props: TruckSceneProps) {
  return <TruckSceneComponent {...props} />
}
