"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { Eye, Move3D, RotateCcw, ScanLine } from "lucide-react";
import { modules } from "@/data/popapopz";
import { useStudioStore } from "@/store/studio-store";
import type { MachineModule } from "@/types/engineering";

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
  const toggleExploded = useStudioStore((state) => state.toggleExploded);
  const toggleCutaway = useStudioStore((state) => state.toggleCutaway);
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const selected = modules.find((module) => module.id === selectedModuleId) ?? modules[0];

  return (
    <section id="machine-layout" className="panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <p className="technical-label text-accent">Interactive Machine View</p>
          <h2 className="mt-1 text-xl font-semibold">1850 x 850 x 800 mm POPAPOPZ Envelope</h2>
        </div>
        <div className="flex flex-wrap gap-2">
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
              <ambientLight intensity={0.8} />
              <directionalLight castShadow position={[3, 5, 4]} intensity={1.35} />
              <pointLight position={[-2.6, 2.4, 1.8]} intensity={1.2} color="#f97316" />
              <pointLight position={[2.6, 1.8, 1.8]} intensity={0.9} color="#22d3ee" />
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

  return (
    <group position={[0, -0.25, 0]} scale={0.86}>
      <CabinetShell cutaway={cutaway} />
      <StaticKioskDetails cutaway={cutaway} />
      {moduleMeshes.map((config) => {
        const machineModule = modules.find((item) => item.id === config.id);
        return machineModule ? <MachineModuleBlock key={config.id} config={config} module={machineModule} /> : null;
      })}
    </group>
  );
}

function CabinetShell({ cutaway }: { cutaway: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 3.95, 0.86]} />
        <meshStandardMaterial color="#080b10" roughness={0.48} metalness={0.18} />
      </mesh>
      <mesh position={[0, 2.42, 0.18]} castShadow>
        <boxGeometry args={[2.95, 0.38, 0.95]} />
        <meshStandardMaterial color="#ea580c" emissive="#7c2d12" emissiveIntensity={0.16} roughness={0.45} />
      </mesh>
      <mesh position={[0, -1.68, 0.22]} castShadow>
        <boxGeometry args={[2.92, 0.28, 1.0]} />
        <meshStandardMaterial color="#ea580c" emissive="#7c2d12" emissiveIntensity={0.12} roughness={0.45} />
      </mesh>
      <mesh position={[-1.54, 0.18, 0.52]} castShadow>
        <boxGeometry args={[0.18, 3.7, 0.38]} />
        <meshStandardMaterial color="#0b0f16" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[1.54, 0.18, 0.52]} castShadow>
        <boxGeometry args={[0.18, 3.7, 0.38]} />
        <meshStandardMaterial color="#0b0f16" roughness={0.35} metalness={0.25} />
      </mesh>
      <Trim position={[0, 1.62, 0.98]} scale={[2.66, 0.05, 0.05]} />
      <Trim position={[0, -0.58, 0.99]} scale={[2.75, 0.04, 0.05]} />
      <Trim position={[0, -1.58, 1.02]} scale={[2.75, 0.05, 0.05]} />
      {!cutaway ? (
        <mesh position={[0, 0.7, 1.03]} castShadow>
          <boxGeometry args={[2.38, 1.82, 0.035]} />
          <meshPhysicalMaterial color="#d8fbff" transparent opacity={0.22} roughness={0.04} metalness={0.05} transmission={0.15} />
        </mesh>
      ) : null}
      {cutaway ? (
        <mesh position={[0, 0.7, 1.04]}>
          <boxGeometry args={[2.38, 1.82, 0.025]} />
          <meshStandardMaterial color="#67e8f9" transparent opacity={0.08} wireframe />
        </mesh>
      ) : null}
    </group>
  );
}

function StaticKioskDetails({ cutaway }: { cutaway: boolean }) {
  return (
    <group>
      <SignPanel position={[0, 2.68, 1.02]} scale={[1.05, 0.42, 0.08]} text="POPAPOPZ" color="#101827" textColor="#f8fafc" />
      <SignPanel position={[-0.98, 2.44, 1.04]} scale={[0.82, 0.28, 0.05]} text="24/7" color="#064e3b" textColor="#e0f2fe" />
      <SignPanel position={[0.98, 2.44, 1.04]} scale={[0.82, 0.28, 0.05]} text="BUBBLE TEA" color="#064e3b" textColor="#d1fae5" fontSize={0.105} />
      <Text position={[0, 1.48, 1.06]} fontSize={0.12} color="#fde047" anchorX="center" anchorY="middle">
        MILK TEA
      </Text>
      <Text position={[0, -1.62, 1.1]} fontSize={0.16} color="#eff6ff" anchorX="center" anchorY="middle">
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

function Trim({ position, scale }: { position: [number, number, number]; scale: [number, number, number] }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#fb923c" emissive="#f97316" emissiveIntensity={0.55} roughness={0.3} />
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
    <group position={[0.9, -1.05, 1.075]}>
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
      <mesh
        scale={config.scale}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.02} depthWrite={false} />
      </mesh>
      <ModuleVisual moduleId={module.id} color={module.color} active={active} />
      {active ? <SelectionFrame scale={config.scale} color={module.color} /> : null}
      {active ? (
        <Html center position={labelPosition}>
          <div className="pointer-events-none w-44 rounded-md border border-accent/40 bg-slate-950/90 p-2 text-xs shadow-panel">
            <div className="technical-label text-accent">{module.name}</div>
            <div className="mt-1 text-slate-200">{module.status}</div>
            <div className="mt-1 text-muted">{module.purpose}</div>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function SelectionFrame({ scale, color }: { scale: [number, number, number]; color: string }) {
  return (
    <mesh scale={[scale[0] * 1.06, scale[1] * 1.06, scale[2] * 1.06]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.32} wireframe />
    </mesh>
  );
}

function ModuleVisual({ moduleId, color, active }: { moduleId: string; color: string; active: boolean }) {
  const glow = active ? 0.65 : 0.18;

  if (moduleId === "controller") {
    return (
      <group>
        <ScreenPanel position={[-0.62, 0.05, 0.04]} scale={[0.72, 0.32, 0.04]} color="#dbeafe" />
        <ScreenPanel position={[0.18, 0.05, 0.04]} scale={[0.72, 0.32, 0.04]} color="#e0f2fe" />
        <ScreenPanel position={[0.84, -0.02, 0.045]} scale={[0.38, 0.28, 0.04]} color="#fef3c7" />
        <Text position={[-0.62, -0.02, 0.075]} fontSize={0.07} color="#1e3a8a" anchorX="center" anchorY="middle">
          MENU
        </Text>
        <Text position={[0.18, -0.02, 0.075]} fontSize={0.065} color="#be123c" anchorX="center" anchorY="middle">
          OFFER
        </Text>
      </group>
    );
  }

  if (moduleId === "prep") {
    return (
      <group>
        <mesh position={[0, -0.02, -0.02]} scale={[1.02, 0.76, 0.16]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.2} roughness={0.2} />
        </mesh>
        <RobotArm active={active} color={color} />
        <NozzleTree color={color} />
        <mesh position={[-0.35, -0.36, 0.17]} scale={[0.2, 0.08, 0.2]}>
          <cylinderGeometry args={[0.5, 0.42, 1, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
      </group>
    );
  }

  if (moduleId === "cup") {
    return (
      <group>
        <mesh position={[0, -0.18, 0.05]} scale={[0.78, 0.62, 0.32]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#0f172a" emissive={color} emissiveIntensity={glow * 0.18} roughness={0.45} />
        </mesh>
        {[-0.18, -0.04, 0.1, 0.24].map((x) => (
          <mesh key={x} position={[x, 0.22, 0.23]} rotation={[Math.PI / 2, 0, 0]} scale={[0.075, 0.075, 0.42]}>
            <cylinderGeometry args={[1, 1, 1, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.28} />
          </mesh>
        ))}
        <Text position={[0, -0.02, 0.235]} fontSize={0.055} color="#fde68a" anchorX="center" anchorY="middle">
          CUPS
        </Text>
      </group>
    );
  }

  if (moduleId === "flavor") {
    return (
      <group>
        {[-0.24, -0.08, 0.08, 0.24].map((x, index) => (
          <mesh key={x} position={[x, 0, 0.08]} scale={[0.1, 0.52, 0.12]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={["#f97316", "#ec4899", "#facc15", "#22c55e"][index]} transparent opacity={0.82} emissive={color} emissiveIntensity={active ? 0.18 : 0.04} />
          </mesh>
        ))}
        <Text position={[0, -0.36, 0.12]} fontSize={0.06} color="#fdf2f8" anchorX="center" anchorY="middle">
          FLAVOR
        </Text>
      </group>
    );
  }

  if (moduleId === "boba") {
    return (
      <group>
        {[-0.22, 0, 0.22].map((x) => (
          <group key={x} position={[x, 0, 0.08]}>
            <mesh scale={[0.12, 0.5, 0.12]}>
              <cylinderGeometry args={[1, 1, 1, 32]} />
              <meshStandardMaterial color="#fef08a" transparent opacity={0.72} emissive={color} emissiveIntensity={active ? 0.14 : 0.04} />
            </mesh>
            {[0.1, 0.0, -0.1].map((y, index) => (
              <mesh key={`${x}-${y}-${index}`} position={[0.02 * index, y, 0.13]} scale={[0.025, 0.025, 0.025]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color="#fb923c" />
              </mesh>
            ))}
          </group>
        ))}
        <Text position={[0, -0.36, 0.13]} fontSize={0.055} color="#fef9c3" anchorX="center" anchorY="middle">
          BOBA
        </Text>
      </group>
    );
  }

  if (moduleId === "water") {
    return (
      <group>
        <mesh position={[0, 0, 0]} scale={[0.18, 0.82, 0.18]}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.68} emissive="#38bdf8" emissiveIntensity={active ? 0.28 : 0.1} />
        </mesh>
        {[-0.22, 0.22].map((y) => (
          <mesh key={y} position={[-0.02, y, 0.18]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[0.035, 0.035, 0.58]}>
            <cylinderGeometry args={[1, 1, 1, 16]} />
            <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.38} />
          </mesh>
        ))}
        <Text position={[0, -0.66, 0.16]} fontSize={0.05} color="#e0f2fe" anchorX="center" anchorY="middle">
          WATER / CO2
        </Text>
      </group>
    );
  }

  if (moduleId === "electrical") {
    return (
      <group>
        <mesh position={[0, 0, 0.04]} scale={[0.9, 0.62, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ea580c" emissive="#fb923c" emissiveIntensity={active ? 0.34 : 0.12} roughness={0.4} />
        </mesh>
        <ScreenPanel position={[-0.22, 0.08, 0.12]} scale={[0.25, 0.34, 0.035]} color="#fef3c7" />
        <ScreenPanel position={[0.2, 0.08, 0.12]} scale={[0.28, 0.34, 0.035]} color="#111827" />
        <Text position={[-0.22, 0.08, 0.15]} fontSize={0.06} color="#f97316" anchorX="center" anchorY="middle">
          QR
        </Text>
        <Text position={[0.2, 0.08, 0.15]} fontSize={0.045} color="#fde68a" anchorX="center" anchorY="middle">
          PAY
        </Text>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0, 0.03]} scale={[1, 0.76, 0.2]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#172554" emissive={color} emissiveIntensity={active ? 0.28 : 0.08} roughness={0.42} />
      </mesh>
      <Text position={[0, 0, 0.16]} fontSize={0.06} color="#bfdbfe" anchorX="center" anchorY="middle">
        CHILLER
      </Text>
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
  return (
    <group position={[0.15, -0.02, 0.2]} rotation={[0, 0, -0.42]}>
      <mesh position={[-0.24, 0.12, 0]} rotation={[0, 0, Math.PI / 4]} scale={[0.045, 0.045, 0.45]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#e5e7eb" emissive={color} emissiveIntensity={active ? 0.12 : 0.02} roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0.1, -0.1, 0]} rotation={[0, 0, -Math.PI / 4]} scale={[0.04, 0.04, 0.42]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#d1d5db" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0.34, -0.28, 0]} scale={[0.07, 0.07, 0.07]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function NozzleTree({ color }: { color: string }) {
  return (
    <group position={[0.44, -0.23, 0.2]}>
      {[-0.08, 0, 0.08].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.025, 0.025, 0.22]}>
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} />
        </mesh>
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
