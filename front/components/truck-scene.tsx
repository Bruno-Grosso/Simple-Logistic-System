"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import type * as THREE from "three"

// ─── Palette ──────────────────────────────────────────────────────────────────
const AMBER  = "#d97706"   // primary accent (amber-600)
const DARK   = "#1c2333"   // cabin shadow
const GLASS  = "#60a5fa"   // windshield blue
const WHEEL  = "#0f172a"   // almost-black tires
const CHROME = "#94a3b8"   // bumper / trim

// ─── Low-poly truck group ─────────────────────────────────────────────────────
function Truck() {
  const group = useRef<THREE.Group>(null)

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
export function TruckScene() {
  return (
    <div className="h-52 w-full cursor-grab active:cursor-grabbing" aria-label="Interactive 3D truck">
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

        <Truck />
        <Ground />

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={9}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  )
}
