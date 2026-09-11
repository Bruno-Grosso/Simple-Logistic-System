"use client"

import dynamic from "next/dynamic"
import { Loader2, Warehouse } from "lucide-react"
import type { DepositSceneProps } from "./deposit-scene"

const DepositSceneComponent = dynamic(
  () => import("./deposit-scene").then((mod) => mod.DepositScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-muted/20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs font-medium">Loading 3D Facility Twin…</span>
      </div>
    ),
  }
)

export function DynamicDepositScene(props: DepositSceneProps) {
  return <DepositSceneComponent {...props} />
}
