"use client"

import { useRef, useState, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import type * as THREE from "three"
import { Loader2, RotateCcw, Play, Pause, Box, Warehouse as WarehouseIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Deposit } from "@/types"

// ─── Industrial Architectural Palette ──────────────────────────────────────────
const CONCRETE   = "#475569" // Yard concrete slab
const ASPHALT    = "#1e293b" // Apron surface
const WALL_PANEL = "#334155" // High-bay corrugated wall panels
const TRIM       = "#64748b" // Steel columns / trim
const ROOF       = "#1e293b" // Industrial steel roofing
const ACCENT     = "#d97706" // LogiSys Amber branding / trim
const GLASS      = "#38bdf8" // Office & skylight glass
const HAZARD_YEL = "#eab308" // Safety dock marking
const HAZARD_BLK = "#0f172a" // Safety dock stripe
const PALLET_WOOD= "#b45309" // Pine wooden pallets
const CARGO_BOX  = "#d97706" // Corrugated cardboard cargo
const COLD_BOX   = "#0284c7" // Refrigerated cargo container
const DOCK_RUBBER= "#090d16" // Heavy duty dock bumpers

// ─── Loading Bay Dock Door ────────────────────────────────────────────────────
function LoadingBay({ position, bayNumber, isOpen = false }: { position: [number, number, number]; bayNumber: string; isOpen?: boolean }) {
  return (
    <group position={position}>
      {/* Dock frame surround */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.2, 1.45, 0.12]} />
        <meshStandardMaterial color={TRIM} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Roll-up door panel */}
      <mesh position={[0, isOpen ? 1.05 : 0.65, 0.04]} castShadow>
        <boxGeometry args={[1.0, isOpen ? 0.65 : 1.3, 0.06]} />
        <meshStandardMaterial color={isOpen ? "#0f172a" : "#1e293b"} roughness={0.35} metalness={0.5} />
      </mesh>

      {/* Yellow / Black hazard bumper strip at base */}
      <mesh position={[0, 0.04, 0.12]}>
        <boxGeometry args={[1.3, 0.1, 0.08]} />
        <meshStandardMaterial color={HAZARD_YEL} roughness={0.6} />
      </mesh>

      {/* Rubber dock bumpers on both sides */}
      <mesh position={[-0.55, 0.25, 0.14]}>
        <boxGeometry args={[0.09, 0.45, 0.08]} />
        <meshStandardMaterial color={DOCK_RUBBER} roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.25, 0.14]}>
        <boxGeometry args={[0.09, 0.45, 0.08]} />
        <meshStandardMaterial color={DOCK_RUBBER} roughness={0.9} />
      </mesh>
    </group>
  )
}

// ─── Wooden Pallet Stack with Cargo ───────────────────────────────────────────
function PalletStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wood pallet base */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.08, 0.65]} />
        <meshStandardMaterial color={PALLET_WOOD} roughness={0.8} />
      </mesh>

      {/* Tier 1 cargo boxes */}
      <mesh position={[-0.14, 0.22, -0.14]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.26]} />
        <meshStandardMaterial color={CARGO_BOX} roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.22, -0.14]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.26]} />
        <meshStandardMaterial color={CARGO_BOX} roughness={0.6} />
      </mesh>
      <mesh position={[-0.14, 0.22, 0.14]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.26]} />
        <meshStandardMaterial color={COLD_BOX} roughness={0.5} />
      </mesh>
      <mesh position={[0.14, 0.22, 0.14]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.26]} />
        <meshStandardMaterial color={CARGO_BOX} roughness={0.6} />
      </mesh>

      {/* Tier 2 cargo boxes */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.48, 0.2, 0.48]} />
        <meshStandardMaterial color={CARGO_BOX} roughness={0.65} />
      </mesh>
    </group>
  )
}

// ─── Parked Docked Truck ──────────────────────────────────────────────────────
function DockedTruck({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trailer back docked to bay */}
      <mesh position={[0, 0.65, 1.1]} castShadow>
        <boxGeometry args={[0.9, 0.95, 2.0]} />
        <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* White roof refrigeration unit */}
      <mesh position={[0, 1.18, 0.2]} castShadow>
        <boxGeometry args={[0.7, 0.2, 0.35]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Truck cabin */}
      <mesh position={[0, 0.6, 2.5]} castShadow>
        <boxGeometry args={[0.85, 1.0, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Cabin windshield */}
      <mesh position={[0, 0.75, 2.91]}>
        <boxGeometry args={[0.75, 0.4, 0.04]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.6} roughness={0.1} />
      </mesh>
      {/* Wheels */}
      <mesh position={[-0.45, 0.2, 1.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.2, 1.0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[-0.45, 0.2, 2.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.2, 2.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ─── High-Mast Lighting Pole ──────────────────────────────────────────────────
function LightPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base & Mast */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.4, 8]} />
        <meshStandardMaterial color={TRIM} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lamp Head */}
      <mesh position={[0, 2.42, 0.1]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Spotlight bulb emitter */}
      <mesh position={[0, 2.38, 0.12]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// ─── Full Logistics Distribution Center Facility ──────────────────────────────
function WarehouseModel({ deposit, hasTruck }: { deposit?: Deposit; hasTruck?: boolean }) {
  const modelRef = useRef<THREE.Group>(null)

  // Gentle idle rotation sway
  useFrame(({ clock }) => {
    if (!modelRef.current) return
    modelRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.04
  })

  return (
    <group ref={modelRef} position={[0, -0.6, 0]}>
      {/* ── Concrete Ground & Parking Staging Yard ── */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[8.8, 0.1, 7.8]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Painted Yellow Parking Stall Lines */}
      {[-2.1, -0.7, 0.7, 2.1].map((x, i) => (
        <mesh key={i} position={[x, 0.055, 1.6]}>
          <boxGeometry args={[0.06, 0.01, 2.8]} />
          <meshStandardMaterial color={HAZARD_YEL} roughness={0.4} />
        </mesh>
      ))}

      {/* ── Main High-Bay Warehouse Structure ── */}
      <mesh position={[0, 1.25, -1.8]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 2.4, 3.4]} />
        <meshStandardMaterial color={WALL_PANEL} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Modern Industrial Fascia / Amber Header Band */}
      <mesh position={[0, 2.45, -0.08]} castShadow>
        <boxGeometry args={[5.84, 0.35, 0.08]} />
        <meshStandardMaterial color={ACCENT} roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Pitched Warehouse Roof */}
      <mesh position={[0, 2.65, -1.8]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[6.1, 0.18, 3.7]} />
        <meshStandardMaterial color={ROOF} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Rooftop HVAC Ventilation Units */}
      <mesh position={[-1.6, 2.85, -1.8]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.7]} />
        <meshStandardMaterial color={TRIM} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[1.4, 2.85, -2.1]} castShadow>
        <boxGeometry args={[0.8, 0.35, 0.6]} />
        <meshStandardMaterial color={TRIM} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Rooftop Skylight Strips */}
      <mesh position={[0, 2.76, -1.8]}>
        <boxGeometry args={[1.8, 0.06, 2.6]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.6} roughness={0.1} />
      </mesh>

      {/* ── 3 Loading Bays on Front Façade ── */}
      <LoadingBay position={[-1.4, 0.05, -0.09]} bayNumber="01" isOpen={Boolean(hasTruck)} />
      <LoadingBay position={[0, 0.05, -0.09]} bayNumber="02" isOpen={false} />
      <LoadingBay position={[1.4, 0.05, -0.09]} bayNumber="03" isOpen={true} />

      {/* ── Modern 2-Story Office & Admin Wing (Right Annex) ── */}
      <group position={[3.2, 0.8, -1.2]}>
        {/* Annex building shell */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 2.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Blue tinted architectural glass ribbon */}
        <mesh position={[0.76, 0.2, 0]}>
          <boxGeometry args={[0.04, 0.9, 1.8]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.7} roughness={0.05} metalness={0.2} />
        </mesh>
        {/* Front glass entrance */}
        <mesh position={[0, 0, 1.11]}>
          <boxGeometry args={[0.9, 1.1, 0.04]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.7} roughness={0.05} />
        </mesh>
        {/* Entrance canopy */}
        <mesh position={[0, 0.7, 1.3]}>
          <boxGeometry args={[1.1, 0.08, 0.5]} />
          <meshStandardMaterial color={ACCENT} roughness={0.3} metalness={0.3} />
        </mesh>
      </group>

      {/* ── Parked Logistics Truck at Bay 01 ── */}
      {hasTruck && <DockedTruck position={[-1.4, 0.05, 0.05]} />}

      {/* ── Staged Cargo Pallets on Loading Apron ── */}
      <PalletStack position={[1.4, 0.05, 1.1]} />
      <PalletStack position={[2.2, 0.05, 1.2]} />
      <PalletStack position={[2.2, 0.05, 1.9]} />

      {/* ── Floodlight Lighting Towers ── */}
      <LightPole position={[-3.8, 0.05, 2.9]} />
      <LightPole position={[3.8, 0.05, 2.9]} />
      <LightPole position={[-3.8, 0.05, -3.2]} />
    </group>
  )
}

// ─── Exported Interactive Component ───────────────────────────────────────────
export interface DepositSceneProps {
  deposit?: Deposit
  trucksParked?: number
  className?: string
}

export function DepositScene({ deposit, trucksParked = 1, className = "h-72 w-full" }: DepositSceneProps) {
  const [autoRotate, setAutoRotate] = useState(true)
  const controlsRef = useRef<any>(null)

  function resetCamera() {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const facilityLabel = deposit?.location?.split("(")[0]?.trim() || "LogiSys Distribution Center"
  const maxCapacity = deposit?.volume_max ? `${deposit.volume_max.toLocaleString("pt-BR")} m³` : "5.000 m³"
  const parkingCapacity = deposit?.truck_capacity ?? 5

  return (
    <div className="relative rounded-xl border border-border/80 bg-gradient-to-b from-card to-muted/20 overflow-hidden shadow-sm">
      {/* Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/60 shadow-xs">
          <WarehouseIcon className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground tracking-tight">{facilityLabel}</span>
          <Badge variant="outline" className="text-[10px] ml-1 bg-primary/10 text-primary border-primary/20">
            3D Facility Twin
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-background/80 backdrop-blur-md p-1 rounded-lg border border-border/60 shadow-xs">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Pause rotation" : "Auto rotate"}
            aria-label={autoRotate ? "Pause auto rotation" : "Enable auto rotation"}
          >
            {autoRotate ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={resetCamera}
            title="Reset 3D view"
            aria-label="Reset 3D camera view"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className={className} aria-label="Interactive 3D model of logistics warehouse facility">
        <Canvas
          shadows
          camera={{ position: [5.8, 4.6, 6.8], fov: 42 }}
          gl={{ antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[8, 12, 6]}
            intensity={2.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={25}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />
          <pointLight position={[-4, 3, 2]} intensity={0.9} color="#38bdf8" />
          <pointLight position={[3, 2, 2]} intensity={0.9} color="#fbbf24" />

          <Environment preset="city" />

          <Suspense fallback={null}>
            <WarehouseModel deposit={deposit} hasTruck={trucksParked > 0} />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            minDistance={4}
            maxDistance={15}
            minPolarAngle={Math.PI / 12}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Footer Info Overlay */}
      <div className="border-t border-border/50 bg-background/60 backdrop-blur-xs px-3.5 py-2 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            3 Loading Bays Active
          </span>
          <span>•</span>
          <span>Max Storage: <strong className="text-foreground font-medium">{maxCapacity}</strong></span>
          <span>•</span>
          <span>Truck Parking: <strong className="text-foreground font-medium">{trucksParked}/{parkingCapacity} bays</strong></span>
        </div>
        <span className="text-[11px] text-muted-foreground/80 italic">Drag to orbit • Scroll to zoom</span>
      </div>
    </div>
  )
}
