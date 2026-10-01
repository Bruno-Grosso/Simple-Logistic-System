"use client"

import { useRef, useState, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import type * as THREE from "three"
import { Loader2, RotateCcw, Play, Pause, Snowflake, AlertTriangle, Truck as TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Truck } from "@/types"

// ─── Palette ──────────────────────────────────────────────────────────────────
const AMBER  = "#d97706"   // primary accent (amber-600)
const DARK   = "#1c2333"   // cabin shadow
const GLASS  = "#60a5fa"   // windshield blue
const WHEEL  = "#0f172a"   // almost-black tires
const CHROME = "#94a3b8"   // bumper / trim
const REFRIG = "#f8fafc"   // white refrigeration unit
const HAZARD = "#ef4444"   // hazard red/orange

// ─── Low-poly truck group ─────────────────────────────────────────────────────
function TruckModel({ truck }: { truck?: Truck }) {
  const group = useRef<THREE.Group>(null)
  const isRefrig = Boolean(truck?.has_refrigeration)
  const isHighMaintenance = Boolean(truck && (!truck.is_valid || (truck.truck_maintenance ?? 0) >= 3))

  // gentle idle sway
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.06
  })

  return (
    <group ref={group} position={[0, -0.55, 0]}>

      {/* ── Cargo trailer ──────────────────────────────────────────────── */}
      <mesh position={[0.55, 0.62, 0]} castShadow>
        <boxGeometry args={[2.1, 1.0, 1.0]} />
        <meshStandardMaterial color={AMBER} roughness={0.45} metalness={0.1} />
      </mesh>

      {/* Trailer front face accent stripe */}
      <mesh position={[-0.49, 0.62, 0]} castShadow>
        <boxGeometry args={[0.03, 1.01, 1.01]} />
        <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ── Optional Refrigeration Chiller Unit (Front-mounted on trailer) ── */}
      {isRefrig && (
        <group position={[-0.56, 0.95, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.42, 0.75]} />
            <meshStandardMaterial color={REFRIG} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Chiller intake vent grill */}
          <mesh position={[-0.1, 0, 0]}>
            <boxGeometry args={[0.02, 0.28, 0.55]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
          {/* Blue LED indicator for cold chain */}
          <mesh position={[-0.1, 0.14, 0.25]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* ── Cabin ──────────────────────────────────────────────────────── */}
      <mesh position={[-0.82, 0.7, 0]} castShadow>
        <boxGeometry args={[0.9, 1.18, 0.98]} />
        <meshStandardMaterial color={DARK} roughness={0.5} metalness={0.15} />
      </mesh>

      {/* Windshield */}
      <mesh position={[-1.27, 0.82, 0]}>
        <boxGeometry args={[0.02, 0.5, 0.7]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.55} roughness={0.05} />
      </mesh>

      {/* Side windows */}
      <mesh position={[-0.82, 0.9, 0.5]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.5} roughness={0.05} />
      </mesh>
      <mesh position={[-0.82, 0.9, -0.5]}>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.5} roughness={0.05} />
      </mesh>

      {/* Amber stripe along cabin bottom */}
      <mesh position={[-0.82, 0.13, 0]}>
        <boxGeometry args={[0.91, 0.06, 1.0]} />
        <meshStandardMaterial color={AMBER} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Optional Rooftop Amber Hazard Beacon if maintenance required */}
      {isHighMaintenance && (
        <mesh position={[-0.82, 1.34, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
          <meshStandardMaterial color={HAZARD} emissive={HAZARD} emissiveIntensity={2} />
        </mesh>
      )}

      {/* ── Chassis / frame ────────────────────────────────────────────── */}
      <mesh position={[0, 0.1, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.12, 0.12]} />
        <meshStandardMaterial color={CHROME} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.12, 0.12]} />
        <meshStandardMaterial color={CHROME} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* ── Front bumper ───────────────────────────────────────────────── */}
      <mesh position={[-1.31, 0.22, 0]}>
        <boxGeometry args={[0.1, 0.22, 0.96]} />
        <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ── Exhaust stack ──────────────────────────────────────────────── */}
      <mesh position={[-0.55, 1.45, 0.44]}>
        <cylinderGeometry args={[0.035, 0.035, 0.55, 8]} />
        <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ── Wheels — front pair ────────────────────────────────────────── */}
      <Wheel position={[-0.98, -0.07, 0.56]} />
      <Wheel position={[-0.98, -0.07, -0.56]} />

      {/* ── Wheels — rear pair (drive axle) ────────────────────────────── */}
      <Wheel position={[0.55, -0.07, 0.62]} />
      <Wheel position={[0.55, -0.07, -0.62]} />
      <Wheel position={[0.55, -0.07, 0.38]} />
      <Wheel position={[0.55, -0.07, -0.38]} />

      {/* ── Tail lights ────────────────────────────────────────────────── */}
      <mesh position={[1.61, 0.55, 0.48]}>
        <boxGeometry args={[0.02, 0.12, 0.06]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
      </mesh>
      <mesh position={[1.61, 0.55, -0.48]}>
        <boxGeometry args={[0.02, 0.12, 0.06]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
      </mesh>

      {/* ── Headlights ─────────────────────────────────────────────────── */}
      <mesh position={[-1.31, 0.4, 0.3]}>
        <boxGeometry args={[0.02, 0.1, 0.16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-1.31, 0.4, -0.3]}>
        <boxGeometry args={[0.02, 0.1, 0.16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={1.2} />
      </mesh>

    </group>
  )
}

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tire */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.18, 16]} />
        <meshStandardMaterial color={WHEEL} roughness={0.9} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.2, 6]} />
        <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  )
}

// ─── Ground shadow plane ──────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <shadowMaterial transparent opacity={0.18} />
    </mesh>
  )
}

// ─── Exported canvas wrapper ──────────────────────────────────────────────────
export interface TruckSceneProps {
  truck?: Truck
  className?: string
  showOverlay?: boolean
}

export function TruckScene({ truck, className = "h-52 w-full", showOverlay = false }: TruckSceneProps) {
  const [autoRotate, setAutoRotate] = useState(true)
  const controlsRef = useRef<any>(null)

  function resetCamera() {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const modelLabel = truck?.model || "Standard Logistics Hauler"
  const isRefrig = Boolean(truck?.has_refrigeration)
  const isMaintenance = Boolean(truck && (!truck.is_valid || (truck.truck_maintenance ?? 0) >= 3))

  return (
    <div className="relative rounded-xl border border-border/80 bg-gradient-to-b from-card to-muted/20 overflow-hidden shadow-sm">
      {/* Header Overlay Controls if showOverlay is true */}
      {showOverlay && (
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/60 shadow-xs">
            <TruckIcon className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground tracking-tight">{modelLabel}</span>
            <Badge variant="outline" className="text-[10px] ml-1 bg-primary/10 text-primary border-primary/20">
              3D Vehicle Twin
            </Badge>
            {isRefrig && (
              <Badge variant="secondary" className="text-[10px] gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                <Snowflake className="size-2.5" />
                Cold Cargo
              </Badge>
            )}
            {isMaintenance && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="size-2.5" />
                Maintenance
              </Badge>
            )}
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
      )}

      {/* 3D Canvas */}
      <div className={className} aria-label="Interactive 3D truck">
        <Canvas
          shadows
          camera={{ position: [-3, 2.2, 4], fov: 40 }}
          gl={{ antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[4, 6, 3]}
            intensity={2.5}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <pointLight position={[-4, 2, -2]} intensity={0.6} color="#d97706" />

          <Environment preset="city" />

          <Suspense fallback={null}>
            <TruckModel truck={truck} />
          </Suspense>
          <Ground />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={3}
            maxDistance={9}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate={autoRotate}
            autoRotateSpeed={0.6}
          />
        </Canvas>
      </div>

      {/* Footer info if showOverlay is true */}
      {showOverlay && (
        <div className="border-t border-border/50 bg-background/60 backdrop-blur-xs px-3.5 py-2 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-3">
            <span>Payload: <strong className="text-foreground font-medium">{truck?.weight_max ? `${(truck.weight_max / 1000).toFixed(1)}t` : "25t"}</strong></span>
            <span>•</span>
            <span>Volume: <strong className="text-foreground font-medium">{truck?.volume_max ?? 90} m³</strong></span>
            <span>•</span>
            <span>Speed: <strong className="text-foreground font-medium">{truck?.speed ?? 80} km/h</strong></span>
          </div>
          <span className="text-[11px] text-muted-foreground/80 italic">Drag to orbit • Scroll to zoom</span>
        </div>
      )}
    </div>
  )
}
