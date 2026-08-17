"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, Text, RoundedBox, Edges } from "@react-three/drei";
import { motion } from "framer-motion";
import { Eye, Move3D, RotateCcw, ScanLine } from "lucide-react";
import { modules } from "@/data/popapopz";
import { useStudioStore } from "@/store/studio-store";
import type { MachineModule } from "@/types/engineering";
import * as THREE from "three";

interface ModuleMeshConfig {
  id: string;
  position: [number, number, number];
  explodedPosition: [number, number, number];
  scale: [number, number, number];
  labelOffset?: [number, number, number];
}

const moduleMeshes: ModuleMeshConfig[] = [
  { id: "controller", position: [0, 1.82, 0.72], explodedPosition: [0, 2.78, 1.1], scale: [2.05, 0.52, 0.25], labelOffset: [0, 0.55, 0.08] },
  { id: "prep", position: [0.1, 0.58, 0.78], explodedPosition: [0.1, 0.72, 1.72], scale: [1.45, 1.05, 0.36], labelOffset: [0, 0.78, 0.08] },
  { id: "cup", position: [-1.34, 0.1, 0.92], explodedPosition: [-2.5, 0.08, 1.35], scale: [0.48, 0.78, 0.34], labelOffset: [0, 0.65, 0.06] },
  { id: "flavor", position: [-0.66, 1.05, 0.9], explodedPosition: [-1.52, 1.55, 1.35], scale: [0.6, 0.52, 0.3], labelOffset: [0, 0.48, 0.08] },
  { id: "boba", position: [0.78, 1.03, 0.9], explodedPosition: [1.62, 1.55, 1.35], scale: [0.62, 0.52, 0.3], labelOffset: [0, 0.48, 0.08] },
  { id: "water", position: [1.22, 0.38, 0.58], explodedPosition: [2.32, 0.45, 1.08], scale: [0.42, 1.05, 0.28], labelOffset: [0, 0.8, 0.08] },
  { id: "electrical", position: [1.03, -0.98, 0.88], explodedPosition: [2.22, -1.0, 1.25], scale: [0.76, 0.58, 0.28], labelOffset: [0, 0.5, 0.08] },
  { id: "refrigeration", position: [-0.25, -1.26, 0.48], explodedPosition: [-0.25, -2.2, 0.9], scale: [1.86, 0.5, 0.32], labelOffset: [0, 0.45, 0.08] }
];

export function MachineViewport() {
  const exploded = useStudioStore((state) => state.exploded);
  const cutaway = useStudioStore((state) => state.cutaway);
  const machineColor = useStudioStore((state) => state.machineColor);
  const toggleExploded = useStudioStore((state) => state.toggleExploded);
  const toggleCutaway = useStudioStore((state) => state.toggleCutaway);
  const setMachineColor = useStudioStore((state) => state.setMachineColor);
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const selected = modules.find((module) => module.id === selectedModuleId) ?? modules[0];

  const colors = [
    { label: "Orange", hex: "#ea580c" },
    { label: "Cyan", hex: "#06b6d4" },
    { label: "Emerald", hex: "#10b981" },
    { label: "Violet", hex: "#8b5cf6" },
    { label: "Rose", hex: "#f43f5e" }
  ];

  return (
    <section id="machine-layout" className="panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <p className="technical-label text-accent">Interactive Machine View</p>
          <h2 className="mt-1 text-xl font-semibold">1850 x 850 x 800 mm POPAPOPZ Envelope</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border-r border-border/80 pr-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Chassis:</span>
            <div className="flex gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  className={`h-5 w-5 rounded-full border transition-all ${
                    machineColor === c.hex
                      ? "border-white scale-110 ring-2 ring-emerald-500/25"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setMachineColor(c.hex)}
                  title={c.label}
                  type="button"
                />
              ))}
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm hover:bg-white/[0.08]"
            onClick={toggleExploded}
            type="button"
          >
            {exploded ? <RotateCcw className="h-4 w-4" /> : <Move3D className="h-4 w-4" />}
            {exploded ? "Reset View" : "Exploded View"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm hover:bg-white/[0.08]"
            onClick={toggleCutaway}
            type="button"
          >
            {cutaway ? <Eye className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
            {cutaway ? "Show Panels" : "Cutaway Mode"}
          </button>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="h-[560px] min-h-[440px] bg-[radial-gradient(circle_at_50%_35%,rgba(45,212,191,0.12),transparent_38%)]">
          <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
            <Suspense fallback={<LoadingLabel />}>
              <PerspectiveCamera makeDefault position={[0, 0.55, 7]} fov={42} />
              <ambientLight intensity={0.35} />
              <directionalLight 
                castShadow 
                position={[3, 8, 5]} 
                intensity={1.5} 
                shadow-mapSize={[2048, 2048]} 
                shadow-bias={-0.0001} 
              />
              <spotLight 
                position={[0, 3, 2.5]} 
                angle={0.45} 
                penumbra={0.8} 
                intensity={2.8} 
                color="#34d399" 
                castShadow 
                shadow-bias={-0.0001} 
              />
              <pointLight position={[-2.6, 2.4, 1.8]} intensity={1.5} color="#ea580c" />
              <pointLight position={[2.6, 1.8, 1.8]} intensity={1.2} color="#06b6d4" />
              <MachineModel />
              <GridFloor />
              <OrbitControls enablePan={false} minDistance={3.4} maxDistance={7.5} maxPolarAngle={Math.PI / 1.65} />
            </Suspense>
          </Canvas>
        </div>
        <div className="border-t border-border/80 p-4 xl:border-l xl:border-t-0">
          <p className="technical-label text-muted">Current Selection</p>
          <div className="mt-3 rounded-md border border-border/80 bg-black/20 p-3">
            <div className="text-lg font-semibold">{selected.shortName}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selected.purpose}</p>
          </div>
          <div className="mt-4 grid gap-2">
            {modules.map((module) => (
              <ModuleButton key={module.id} module={module} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MachineModel() {
  const cutaway = useStudioStore((state) => state.cutaway);
  const machineColor = useStudioStore((state) => state.machineColor);

  return (
    <group position={[0, -0.25, 0]} scale={0.86}>
      <CabinetShell cutaway={cutaway} machineColor={machineColor} />
      <StaticKioskDetails cutaway={cutaway} />
      {moduleMeshes.map((config) => {
        const machineModule = modules.find((item) => item.id === config.id);
        return machineModule ? <MachineModuleBlock key={config.id} config={config} module={machineModule} /> : null;
      })}
    </group>
  );
}

function CabinetShell({ cutaway, machineColor }: { cutaway: boolean; machineColor: string }) {
  return (
    <group>
      {/* Main Back Panel */}
      <mesh position={[0, 0.18, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 3.95, 0.5]} />
        <meshStandardMaterial color="#0b0f16" roughness={0.65} metalness={0.15} />
      </mesh>

      {/* Main Structural Frame - Bevelled Corners using RoundedBox */}
      <RoundedBox position={[0, 0.18, 0.08]} args={[2.85, 3.95, 0.86]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#080b10" roughness={0.48} metalness={0.25} />
      </RoundedBox>

      {/* Custom Chassis Accent Header */}
      <RoundedBox position={[0, 2.42, 0.18]} args={[2.95, 0.38, 0.95]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color={machineColor} emissive={machineColor} emissiveIntensity={0.12} roughness={0.35} metalness={0.4} />
      </RoundedBox>

      {/* Custom Chassis Accent Footer */}
      <RoundedBox position={[0, -1.68, 0.22]} args={[2.92, 0.28, 1.0]} radius={0.04} smoothness={4} castShadow>
        <meshStandardMaterial color={machineColor} emissive={machineColor} emissiveIntensity={0.08} roughness={0.35} metalness={0.4} />
      </RoundedBox>

      {/* Side Pillar Left */}
      <mesh position={[-1.54, 0.18, 0.52]} castShadow>
        <boxGeometry args={[0.18, 3.7, 0.38]} />
        <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* Side Pillar Right */}
      <mesh position={[1.54, 0.18, 0.52]} castShadow>
        <boxGeometry args={[0.18, 3.7, 0.38]} />
        <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.5} />
      </mesh>

      <Trim position={[0, 1.62, 0.98]} scale={[2.66, 0.05, 0.05]} color={machineColor} />
      <Trim position={[0, -0.58, 0.99]} scale={[2.75, 0.04, 0.05]} color={machineColor} />
      <Trim position={[0, -1.58, 1.02]} scale={[2.75, 0.05, 0.05]} color={machineColor} />

      {/* Premium Glass Cover (Transparent / Reflective in Normal, Wireframe in Cutaway) */}
      {!cutaway ? (
        <mesh position={[0, 0.7, 1.03]} castShadow>
          <boxGeometry args={[2.38, 1.82, 0.035]} />
          <meshPhysicalMaterial 
            color="#d1f5ff" 
            transparent 
            opacity={0.18} 
            roughness={0.05} 
            metalness={0.1}
            transmission={0.95}
            ior={1.5}
            thickness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0.7, 1.04]}>
          <boxGeometry args={[2.38, 1.82, 0.025]} />
          <meshStandardMaterial color="#22d3ee" transparent opacity={0.08} wireframe />
        </mesh>
      )}
    </group>
  );
}

function StaticKioskDetails({ cutaway }: { cutaway: boolean }) {
  return (
    <group>
      {/* Positioned signs exactly on the header front face (Z = 0.655) */}
      <SignPanel position={[0, 2.68, 0.695]} scale={[1.05, 0.42, 0.08]} text="POPAPOPZ" color="#101827" textColor="#f8fafc" />
      <SignPanel position={[-0.98, 2.44, 0.68]} scale={[0.82, 0.28, 0.05]} text="24/7" color="#064e3b" textColor="#e0f2fe" />
      <SignPanel position={[0.98, 2.44, 0.68]} scale={[0.82, 0.28, 0.05]} text="BUBBLE TEA" color="#064e3b" textColor="#d1fae5" fontSize={0.105} />
      <Text position={[0, 1.48, 1.06]} fontSize={0.12} color="#fde047" anchorX="center" anchorY="middle">
        MILK TEA
      </Text>
      {/* Positioned text exactly on the footer front face (Z = 0.72) */}
      <Text position={[0, -1.62, 0.732]} fontSize={0.16} color="#eff6ff" anchorX="center" anchorY="middle">
        ORDER HERE
      </Text>
      <GlowStrip position={[0, -1.46, 1.03]} scale={[1.08, 0.035, 0.035]} color="#a5b4fc" />
      <GlowStrip position={[-0.82, -0.62, 1.04]} scale={[0.94, 0.035, 0.035]} color="#fdba74" />
      <GlowStrip position={[0.88, -0.62, 1.04]} scale={[0.95, 0.035, 0.035]} color="#fdba74" />
      {!cutaway ? <QrGraphic /> : null}
    </group>
  );
}

function SignPanel({
  position,
  scale,
  text,
  color,
  textColor,
  fontSize = 0.16
}: {
  position: [number, number, number];
  scale: [number, number, number];
  text: string;
  color: string;
  textColor: string;
  fontSize?: number;
}) {
  return (
    <group position={position}>
      <mesh castShadow scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={textColor} emissiveIntensity={0.16} roughness={0.32} />
      </mesh>
      <Text position={[0, 0, scale[2] + 0.012]} fontSize={fontSize} color={textColor} anchorX="center" anchorY="middle" outlineWidth={0.006} outlineColor="#312e81">
        {text}
      </Text>
    </group>
  );
}

function Trim({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.3} />
    </mesh>
  );
}

function GlowStrip({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
    </mesh>
  );
}

function QrGraphic() {
  const squares = [
    [-0.08, 0.08],
    [0, 0.08],
    [0.08, 0.08],
    [-0.08, 0],
    [0.08, 0],
    [-0.08, -0.08],
    [0, -0.08],
    [0.08, -0.08],
    [0.04, 0.0],
    [-0.04, -0.04]
  ] as const;

  return (
    <group position={[0.9, -1.05, 0.52]}>
      <mesh scale={[0.46, 0.32, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fff7ed" emissive="#fb923c" emissiveIntensity={0.18} />
      </mesh>
      <Text position={[-0.1, 0.02, 0.025]} fontSize={0.12} color="#fb923c" anchorX="center" anchorY="middle">
        SCAN
      </Text>
      <Text position={[-0.11, -0.11, 0.025]} fontSize={0.105} color="#fb923c" anchorX="center" anchorY="middle">
        ME
      </Text>
      {squares.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[0.13 + x, y, 0.035]} scale={[0.025, 0.025, 0.006]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function MachineModuleBlock({ config, module }: { config: ModuleMeshConfig; module: MachineModule }) {
  const exploded = useStudioStore((state) => state.exploded);
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const hoveredModuleId = useStudioStore((state) => state.hoveredModuleId);
  const setSelectedModuleId = useStudioStore((state) => state.setSelectedModuleId);
  const setHoveredModuleId = useStudioStore((state) => state.setHoveredModuleId);
  const active = selectedModuleId === module.id || hoveredModuleId === module.id;
  const position = exploded ? config.explodedPosition : config.position;
  const labelPosition = config.labelOffset ?? [0, config.scale[1] * 0.7, 0.08];

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedModuleId(module.id);
      }}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHoveredModuleId(module.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHoveredModuleId(null);
        document.body.style.cursor = "default";
      }}
    >
      <mesh scale={config.scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.02} depthWrite={false} />
      </mesh>
      <ModuleVisual moduleId={module.id} color={module.color} active={active} />
      {active ? <SelectionFrame scale={config.scale} color={module.color} /> : null}
      {active ? (
        <Html center position={labelPosition}>
          <div className="pointer-events-none w-48 rounded-md border border-accent/40 bg-slate-950/95 p-2.5 text-xs shadow-panel backdrop-blur-sm">
            <div className="technical-label text-accent font-semibold">{module.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase text-emerald-400">{module.status}</div>
            <div className="mt-1.5 text-slate-300 leading-normal">{module.purpose}</div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function SelectionFrame({ scale, color }: { scale: [number, number, number]; color: string }) {
  return (
    <mesh scale={[scale[0] * 1.05, scale[1] * 1.05, scale[2] * 1.05]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
      <Edges color={color} scale={1.0} />
    </mesh>
  );
}

function PulsingLED({ position, color, interval = 4 }: { position: [number, number, number]; color: string; interval?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * interval) * 0.35;
    }
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry args={[0.015, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} />
    </mesh>
  );
}

function ModuleVisual({ moduleId, color, active }: { moduleId: string; color: string; active: boolean }) {
  const cutaway = useStudioStore((state) => state.cutaway);

  if (moduleId === "controller") {
    return (
      <group>
        {/* Main industrial control PLC housing */}
        <RoundedBox args={[1.8, 0.44, 0.16]} radius={0.02} smoothness={3}>
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
        </RoundedBox>
        {/* Screens/Displays */}
        <ScreenPanel position={[-0.45, 0.02, 0.085]} scale={[0.62, 0.28, 0.01]} color="#0c4a6e" />
        <ScreenPanel position={[0.25, 0.02, 0.085]} scale={[0.62, 0.28, 0.01]} color="#4c0519" />
        {/* Visual feedback text */}
        <Text position={[-0.45, 0.02, 0.092]} fontSize={0.05} color="#38bdf8" anchorX="center" anchorY="middle">
          SYS OK
        </Text>
        <Text position={[0.25, 0.02, 0.092]} fontSize={0.05} color="#fda4af" anchorX="center" anchorY="middle">
          D-VALVE
        </Text>
        {/* Diagnostic LED Indicators */}
        <PulsingLED position={[-0.82, 0.12, 0.09]} color="#10b981" interval={6} />
        <PulsingLED position={[-0.82, 0.0, 0.09]} color="#f59e0b" interval={4} />
        <PulsingLED position={[-0.82, -0.12, 0.09]} color="#3b82f6" interval={3} />
        
        <PulsingLED position={[0.68, 0.12, 0.09]} color="#10b981" interval={5} />
        <PulsingLED position={[0.68, 0.0, 0.09]} color="#ef4444" interval={2} />
      </group>
    );
  }

  if (moduleId === "prep") {
    return (
      <group>
        {/* Chamber enclosure back wall */}
        <mesh position={[0, 0, -0.08]} scale={[1.25, 0.9, 0.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Drip Tray Grill */}
        <group position={[0, -0.42, 0.05]}>
          <mesh scale={[1.1, 0.08, 0.3]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Slots/Lines */}
          {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset) => (
            <mesh key={zOffset} position={[0, 0.045, zOffset * 0.25]} scale={[1.0, 0.005, 0.015]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#0f172a" roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* Dynamic Cup Holder shuttle platform */}
        <mesh position={[-0.35, -0.38, 0.15]} scale={[0.26, 0.04, 0.26]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} metalness={0.3} />
        </mesh>
        
        {/* Detailed components */}
        <RobotArm active={active} color={color} />
        <NozzleTree color={color} />
      </group>
    );
  }

  if (moduleId === "cup") {
    return (
      <group>
        {/* Dispenser metal bracket */}
        <RoundedBox args={[0.42, 0.68, 0.28]} radius={0.01} smoothness={2} position={[0, -0.05, 0.0]} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
        </RoundedBox>
        
        {/* 4 Cup Magazine Columns */}
        {[-0.15, -0.05, 0.05, 0.15].map((x, colIdx) => (
          <group key={x} position={[x, 0.05, 0.08]}>
            {/* Transparent outer tube */}
            <mesh scale={[0.065, 0.58, 0.065]}>
              <cylinderGeometry args={[1, 1, 1, 16]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.15} transmission={0.9} roughness={0.1} />
            </mesh>
            
            {/* Stack of nested cups */}
            {[0.2, 0.1, 0.0, -0.1, -0.2].map((y, cupIdx) => (
              <mesh key={cupIdx} position={[0, y - 0.02, 0]} rotation={[Math.PI, 0, 0]} scale={[0.055, 0.09, 0.055]}>
                <cylinderGeometry args={[0.8, 1, 1, 16, 1, true]} />
                <meshStandardMaterial color={colIdx % 2 === 0 ? "#f8fafc" : "#fef08a"} roughness={0.3} side={THREE.DoubleSide} />
              </mesh>
            ))}
            
            {/* LED Fill Level indicator */}
            <mesh position={[0, 0.32, 0.03]} scale={[0.015, 0.015, 0.015]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (moduleId === "flavor") {
    return (
      <group>
        {/* Flavor Cabinet Shelf Rack */}
        <mesh position={[0, -0.24, 0.0]} scale={[0.54, 0.03, 0.25]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* 4 Syrup Bottles */}
        {[-0.2, -0.07, 0.07, 0.2].map((x, index) => {
          const liquidColor = ["#f97316", "#db2777", "#eab308", "#10b981"][index];
          return (
            <group key={x} position={[x, 0.04, 0.06]}>
              {/* Bottle glass body */}
              <RoundedBox args={[0.1, 0.38, 0.1]} radius={0.015} smoothness={2} castShadow>
                <meshPhysicalMaterial color="#ffffff" transparent opacity={0.2} transmission={0.95} roughness={0.05} />
              </RoundedBox>
              
              {/* Colored liquid inside bottle */}
              <mesh position={[0, -0.03, 0]} scale={[0.088, 0.3, 0.088]} castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshPhysicalMaterial color={liquidColor} roughness={0.1} transmission={0.7} opacity={0.8} />
              </mesh>
              
              {/* Bottle Neck */}
              <mesh position={[0, 0.21, 0]} scale={[0.035, 0.08, 0.035]}>
                <cylinderGeometry args={[1, 1, 1, 16]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.6} />
              </mesh>
              
              {/* Bottle Cap */}
              <mesh position={[0, 0.25, 0]} scale={[0.042, 0.02, 0.042]}>
                <cylinderGeometry args={[1, 1, 1, 16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} />
              </mesh>
              
              {/* Fluid Delivery Tube curving downwards */}
              <mesh position={[0, -0.22, -0.02]} rotation={[Math.PI / 6, 0, 0]} scale={[0.01, 0.12, 0.01]}>
                <cylinderGeometry args={[1, 1, 1, 8]} />
                <meshStandardMaterial color={liquidColor} transparent opacity={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (moduleId === "boba") {
    return (
      <group>
        {/* Hopper Support Plate */}
        <mesh position={[0, -0.24, 0.0]} scale={[0.54, 0.03, 0.24]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.2} />
        </mesh>
        
        {/* 3 Translucent Boba Hoppers */}
        {[-0.18, 0, 0.18].map((x, hopIdx) => (
          <group key={x} position={[x, 0.06, 0.06]}>
            {/* Tapered Funnel Hopper Body */}
            <mesh scale={[0.08, 0.34, 0.08]} castShadow>
              <cylinderGeometry args={[1.0, 0.55, 1, 24]} />
              <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.22} transmission={0.92} roughness={0.1} />
            </mesh>
            
            {/* Cluster of realistic boba spheres inside */}
            {[-0.08, -0.02, 0.04].map((y, idx) => (
              <group key={idx} position={[0, y + 0.04, 0]}>
                {[-0.03, 0.0, 0.03].map((bx, bIdx) => (
                  <mesh key={bIdx} position={[bx, 0, (bIdx % 2 === 0 ? 0.025 : -0.025)]} scale={[0.024, 0.024, 0.024]}>
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshStandardMaterial color={hopIdx === 0 ? "#111827" : hopIdx === 1 ? "#ea580c" : "#f1c40f"} roughness={0.18} />
                  </mesh>
                ))}
              </group>
            ))}
            
            {/* Dosing Valve Gate housing under the hopper */}
            <mesh position={[0, -0.2, 0]} scale={[0.06, 0.06, 0.06]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            
            {/* Valve Stepper Motor */}
            <mesh position={[0, -0.2, -0.04]} scale={[0.045, 0.045, 0.04]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (moduleId === "water") {
    return (
      <group>
        {/* Main CO2 High-Pressure cylinder */}
        <group position={[-0.09, 0.0, 0.02]}>
          <mesh scale={[0.13, 0.74, 0.13]} castShadow>
            <cylinderGeometry args={[1, 1, 1, 24]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Cylinder Dome top */}
          <mesh position={[0, 0.37, 0]} scale={[0.13, 0.08, 0.13]}>
            <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
          </mesh>
          
          {/* Brass Regulator & Valve Block */}
          <group position={[0, 0.44, 0]}>
            <mesh scale={[0.038, 0.06, 0.038]}>
              <cylinderGeometry args={[1, 1, 1, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Dual Gauges */}
            <mesh position={[0.03, 0.02, 0.0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.025, 0.015, 0.025]}>
              <cylinderGeometry args={[1, 1, 1, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            <mesh position={[-0.03, 0.02, 0.0]} rotation={[0, 0, Math.PI / 2]} scale={[0.025, 0.015, 0.025]}>
              <cylinderGeometry args={[1, 1, 1, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>
            {/* Regulator Knob */}
            <mesh position={[0, 0.04, 0.03]} rotation={[Math.PI / 2, 0, 0]} scale={[0.022, 0.012, 0.022]}>
              <cylinderGeometry args={[1, 1, 1, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* High-Pressure water carbonation tank */}
        <group position={[0.11, -0.05, 0.04]}>
          <mesh scale={[0.09, 0.58, 0.09]} castShadow>
            <cylinderGeometry args={[1, 1, 1, 24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Carbonator Dome Top */}
          <mesh position={[0, 0.29, 0]} scale={[0.09, 0.05, 0.09]}>
            <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
          </mesh>
          
          {/* Braided water tubes curving into the tank */}
          {[-0.05, 0.05].map((tx) => (
            <mesh key={tx} position={[tx, 0.35, -0.02]} rotation={[Math.PI / 4, 0, 0]} scale={[0.008, 0.1, 0.008]}>
              <cylinderGeometry args={[1, 1, 1, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  if (moduleId === "electrical") {
    // If cutaway is active, show the DIN-rail wiring details
    if (cutaway) {
      return (
        <group>
          {/* Backplate */}
          <mesh position={[0, 0, -0.06]} scale={[0.66, 0.48, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {/* DIN Rail */}
          <mesh position={[0, 0.06, -0.04]} scale={[0.6, 0.03, 0.015]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Circuit Breaker blocks */}
          {[-0.2, -0.14, -0.08, -0.02, 0.04, 0.1].map((x, idx) => (
            <mesh key={x} position={[x, 0.06, -0.02]} scale={[0.04, 0.12, 0.04]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={idx % 3 === 0 ? "#ef4444" : idx % 3 === 1 ? "#3b82f6" : "#eab308"} roughness={0.4} />
            </mesh>
          ))}
          
          {/* MeanWell Switch Mode Power Supply block */}
          <mesh position={[0.2, -0.08, -0.02]} scale={[0.14, 0.18, 0.06]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Bundle of wires */}
          {[-0.15, 0.0, 0.15].map((wz, wireIdx) => (
            <mesh key={wz} position={[wz, -0.15, -0.03]} rotation={[0, 0, Math.PI / 2]} scale={[0.008, 0.28, 0.008]}>
              <cylinderGeometry args={[1, 1, 1, 8]} />
              <meshStandardMaterial color={wireIdx === 0 ? "#3b82f6" : wireIdx === 1 ? "#ef4444" : "#10b981"} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    }
    
    // Normal state: front payment kiosk details
    return (
      <group>
        {/* Payment terminal bezel */}
        <RoundedBox args={[0.62, 0.44, 0.06]} radius={0.015} smoothness={2} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
        </RoundedBox>
        {/* HMI interface details */}
        <ScreenPanel position={[-0.16, 0.04, 0.035]} scale={[0.22, 0.28, 0.01]} color="#1e3a8a" />
        <ScreenPanel position={[0.16, 0.04, 0.035]} scale={[0.22, 0.28, 0.01]} color="#111827" />
        {/* Screen labels */}
        <Text position={[-0.16, 0.04, 0.042]} fontSize={0.045} color="#60a5fa" anchorX="center" anchorY="middle">
          SWIPE
        </Text>
        <Text position={[0.16, 0.04, 0.042]} fontSize={0.04} color="#34d399" anchorX="center" anchorY="middle">
          TAP
        </Text>
        {/* Indicator LEDs */}
        <PulsingLED position={[-0.16, -0.14, 0.035]} color="#10b981" interval={3} />
        <PulsingLED position={[0.16, -0.14, 0.035]} color="#10b981" interval={3} />
      </group>
    );
  }

  // default: Refrigeration Module
  return (
    <group>
      {/* Insulated cooler enclosure cabinet */}
      <RoundedBox args={[1.72, 0.42, 0.22]} radius={0.015} smoothness={2} castShadow>
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      
      {/* Condenser / Fan grid vents */}
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0.0, 0.115]}>
          {/* Vent Ring Bezel */}
          <mesh scale={[0.18, 0.18, 0.01]}>
            <cylinderGeometry args={[1, 1, 1, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          
          {/* Fan Hub */}
          <mesh position={[0, 0, 0.01]} scale={[0.045, 0.045, 0.01]}>
            <cylinderGeometry args={[1, 1, 1, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.3} />
          </mesh>
          
          {/* 4 Fan Blades */}
          {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle, bladeIdx) => (
            <mesh key={bladeIdx} position={[0, 0, 0.005]} rotation={[0, 0, angle]} scale={[0.015, 0.14, 0.003]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Cooling Compressors / Tanks visible through back grid */}
      <group position={[0, -0.05, -0.02]}>
        <mesh scale={[0.16, 0.22, 0.16]} castShadow>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.11, 0]} scale={[0.16, 0.08, 0.16]}>
          <sphereGeometry args={[1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function ScreenPanel({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.2} />
    </mesh>
  );
}

function RobotArm({ active, color }: { active: boolean; color: string }) {
  const baseRef = useRef<THREE.Group>(null);
  const forearmRef = useRef<THREE.Group>(null);
  
  // Smoothly animates the robot arm joints, resetting to rest when active is false
  useFrame((state) => {
    if (baseRef.current && forearmRef.current) {
      const t = state.clock.elapsedTime;
      const targetBaseY = active ? -0.42 + Math.sin(t * 1.5) * 0.18 : -0.42;
      const targetForearmX = active ? Math.cos(t * 1.5) * 0.12 : 0;
      
      baseRef.current.rotation.y = THREE.MathUtils.lerp(baseRef.current.rotation.y, targetBaseY, 0.1);
      forearmRef.current.rotation.x = THREE.MathUtils.lerp(forearmRef.current.rotation.x, targetForearmX, 0.1);
    }
  });

  return (
    <group position={[0.0, -0.08, 0.18]} ref={baseRef} rotation={[0, -0.42, 0]}>
      {/* Robot Base Mount */}
      <mesh position={[0, -0.15, 0]} scale={[0.1, 0.08, 0.1]} castShadow>
        <cylinderGeometry args={[1, 1.2, 1, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
      </mesh>
      
      {/* Joint 1 (Base pivot) */}
      <mesh position={[0, -0.08, 0]} scale={[0.065, 0.065, 0.065]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Main Link (Arm Segment 1) */}
      <mesh position={[0.0, 0.08, 0]} rotation={[0, 0, Math.PI / 8]} scale={[0.038, 0.28, 0.038]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
      </mesh>
      
      {/* Joint 2 (Elbow pivot) */}
      <mesh position={[0.09, 0.2, 0]} scale={[0.05, 0.05, 0.05]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={active ? 0.35 : 0.08} />
      </mesh>

      {/* Forearm Link (Arm Segment 2) - Pivot on parent group around elbow */}
      <group position={[0.09, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]} ref={forearmRef}>
        <mesh position={[0.1, -0.1, 0]} scale={[0.03, 0.22, 0.03]} castShadow>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Joint 3 (Wrist/End-Effector mount) - perfectly aligned on end of segment */}
        <mesh position={[0.2, -0.2, 0]} scale={[0.042, 0.042, 0.042]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Cup grabber ring / Claw assembly - aligned on end of segment */}
        <group position={[0.2, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Circular grip claw */}
          <mesh scale={[0.08, 0.02, 0.08]}>
            <cylinderGeometry args={[1, 1.05, 1, 24, 1, true]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          {/* Glow ring in claw */}
          <mesh scale={[0.075, 0.008, 0.075]} position={[0, 0.01, 0]}>
            <cylinderGeometry args={[1, 1.01, 1, 24, 1, true]} />
            <meshBasicMaterial color={color} transparent opacity={0.65} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function NozzleTree({ color }: { color: string }) {
  return (
    <group position={[0.42, 0.02, 0.15]}>
      {/* Manifold mount block */}
      <RoundedBox args={[0.22, 0.06, 0.12]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </RoundedBox>
      
      {/* Stainless dispense nozzles */}
      {[-0.07, 0, 0.07].map((x, nozzleIdx) => (
        <group key={x} position={[x, -0.11, 0.0]}>
          {/* Curved steel tube */}
          <mesh rotation={[0, 0, 0]} scale={[0.014, 0.16, 0.014]} castShadow>
            <cylinderGeometry args={[1, 1, 1, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Glowing nozzle outlet ring */}
          <mesh position={[0, -0.08, 0]} scale={[0.018, 0.006, 0.018]}>
            <cylinderGeometry args={[1, 1, 1, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          
          {/* Dispensing stream (semi-transparent cylinder) */}
          <mesh position={[0, -0.23, 0]} scale={[0.008, 0.3, 0.008]}>
            <cylinderGeometry args={[1, 1, 1, 8]} />
            <meshPhysicalMaterial color={color} transparent opacity={nozzleIdx === 1 ? 0.65 : 0.0} transmission={0.9} roughness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GridFloor() {
  return (
    <group position={[0, -1.9, 0]}>
      <gridHelper args={[5, 20, "#164e63", "#1f2937"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#020617" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function ModuleButton({ module }: { module: MachineModule }) {
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const setSelectedModuleId = useStudioStore((state) => state.setSelectedModuleId);
  const active = selectedModuleId === module.id;

  return (
    <motion.button
      animate={{ borderColor: active ? module.color : "rgba(51, 65, 85, 0.8)" }}
      className="flex items-center justify-between gap-3 rounded-md border bg-white/[0.03] px-3 py-2 text-left text-sm hover:bg-white/[0.07]"
      onClick={() => setSelectedModuleId(module.id)}
      type="button"
    >
      <span>{module.shortName}</span>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: module.color }} />
    </motion.button>
  );
}

function LoadingLabel() {
  return (
    <Html center>
      <div className="technical-label rounded border border-border bg-black/60 px-3 py-2 text-muted">Loading machine viewport</div>
    </Html>
  );
}
