"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Html, Line, OrbitControls, PerspectiveCamera, RoundedBox, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { Eye, Focus, Home, Move3D, RotateCcw, Ruler, ScanLine, Tags } from "lucide-react";
import { modules } from "@/data/popapopz";
import { useStudioStore } from "@/store/studio-store";
import type { ViewPreset } from "@/store/studio-store";
import type { MachineModule } from "@/types/engineering";
import * as THREE from "three";

interface ModuleMeshConfig {
  id: string;
  position: [number, number, number];
  explodedPosition: [number, number, number];
  isolatePosition: [number, number, number];
  scale: [number, number, number];
  labelOffset?: [number, number, number];
  zoneLabel: string;
}

const themeColors: Record<string, { accent: string; glow: string }> = {
  "#ea580c": { accent: "#ea580c", glow: "#ff782e" },
  "#06b6d4": { accent: "#06b6d4", glow: "#22d3ee" },
  "#10b981": { accent: "#10b981", glow: "#34d399" },
  "#8b5cf6": { accent: "#8b5cf6", glow: "#a78bfa" },
  "#f43f5e": { accent: "#f43f5e", glow: "#fb7185" }
};

const bodyThemes: Record<string, { main: string; back: string; pillars: string; roughness: number; metalness: number }> = {
  "#080b10": { main: "#273449", back: "#1f2a3b", pillars: "#3c4a60", roughness: 0.46, metalness: 0.18 },
  "#f8fafc": { main: "#f8fafc", back: "#e2e8f0", pillars: "#cbd5e1", roughness: 0.35, metalness: 0.1 },
  "#475569": { main: "#64748b", back: "#475569", pillars: "#94a3b8", roughness: 0.44, metalness: 0.34 },
  "#0f1e36": { main: "#2f4b69", back: "#243b5a", pillars: "#416281", roughness: 0.44, metalness: 0.22 }
};

const moduleMeshes: ModuleMeshConfig[] = [
  { id: "controller", position: [0, 1.16, 0.84], explodedPosition: [0, 2.38, 1.22], isolatePosition: [0, 0.42, 1.35], scale: [2.18, 0.58, 0.24], labelOffset: [0, 0.48, 0.08], zoneLabel: "HMI / order queue at 1350-1500 mm" },
  { id: "cup", position: [-1.14, 0.84, 0.78], explodedPosition: [-2.42, 1.02, 1.28], isolatePosition: [0, 0.42, 1.35], scale: [0.64, 1.1, 0.34], labelOffset: [0, 0.7, 0.08], zoneLabel: "Cup magazine feeds down to belly handoff" },
  { id: "flavor", position: [-0.36, 0.62, 0.84], explodedPosition: [-1.48, 1.12, 1.42], isolatePosition: [0, 0.32, 1.35], scale: [0.74, 0.54, 0.34], labelOffset: [0, 0.42, 0.08], zoneLabel: "Flavor cartridges above nozzle tree" },
  { id: "boba", position: [0.66, 0.62, 0.84], explodedPosition: [1.58, 1.12, 1.42], isolatePosition: [0, 0.32, 1.35], scale: [0.78, 0.58, 0.34], labelOffset: [0, 0.43, 0.08], zoneLabel: "Low-shear boba dose and drain" },
  { id: "prep", position: [0, 0.04, 0.92], explodedPosition: [0, 0.08, 1.94], isolatePosition: [0, 0.18, 1.38], scale: [1.5, 0.78, 0.42], labelOffset: [0, 0.54, 0.08], zoneLabel: "Pickup and prep at 950-1100 mm" },
  { id: "water", position: [1.04, -0.72, 0.58], explodedPosition: [2.32, -0.7, 1.1], isolatePosition: [0, 0.08, 1.3], scale: [0.62, 0.95, 0.34], labelOffset: [0, 0.66, 0.08], zoneLabel: "Water / CO2 lower technical bay" },
  { id: "electrical", position: [1.05, -1.4, 0.8], explodedPosition: [2.22, -1.55, 1.16], isolatePosition: [0, 0.06, 1.28], scale: [0.82, 0.58, 0.28], labelOffset: [0, 0.44, 0.08], zoneLabel: "Dry electrical bay" },
  { id: "refrigeration", position: [-0.6, -1.18, 0.55], explodedPosition: [-1.6, -1.75, 1.03], isolatePosition: [0, 0.08, 1.28], scale: [1.08, 0.78, 0.34], labelOffset: [0, 0.54, 0.08], zoneLabel: "Lower cooled bay" },
  { id: "waste", position: [-0.1, -1.72, 0.78], explodedPosition: [-0.1, -2.42, 1.16], isolatePosition: [0, 0.04, 1.25], scale: [1.72, 0.42, 0.32], labelOffset: [0, 0.32, 0.08], zoneLabel: "Lowest removable waste drawer" }
];

const ergonomicReferences = [
  { label: "HMI / queue screen 1420 mm", y: 1.0, color: "#a78bfa", x: 1.86 },
  { label: "Pickup / drink handoff 1030 mm", y: 0.21, color: "#34d399", x: 1.86 },
  { label: "Cup clearance dia. 105 mm ASSUMED", y: -0.05, color: "#facc15", x: -1.92 },
  { label: "Overall envelope 1850 x 850 x 800 mm", y: -2.05, color: "#22d3ee", x: 0 }
];

const viewPresets: Record<ViewPreset, { label: string; position: [number, number, number]; target: [number, number, number] }> = {
  front: { label: "Front", position: [0, 0.28, 7.1], target: [0, -0.04, 0.45] },
  left: { label: "Left", position: [-5.8, 0.35, 3.35], target: [0, -0.02, 0.45] },
  right: { label: "Right", position: [5.8, 0.35, 3.35], target: [0, -0.02, 0.45] },
  top: { label: "Top", position: [0, 6.3, 0.75], target: [0, -0.1, 0.35] }
};

export function MachineViewport() {
  const exploded = useStudioStore((state) => state.exploded);
  const cutaway = useStudioStore((state) => state.cutaway);
  const isolated = useStudioStore((state) => state.isolated);
  const guidesVisible = useStudioStore((state) => state.guidesVisible);
  const labelsVisible = useStudioStore((state) => state.labelsVisible);
  const viewPreset = useStudioStore((state) => state.viewPreset);
  const machineColor = useStudioStore((state) => state.machineColor);
  const bodyColor = useStudioStore((state) => state.bodyColor);
  const toggleExploded = useStudioStore((state) => state.toggleExploded);
  const toggleCutaway = useStudioStore((state) => state.toggleCutaway);
  const toggleIsolated = useStudioStore((state) => state.toggleIsolated);
  const toggleGuides = useStudioStore((state) => state.toggleGuides);
  const toggleLabels = useStudioStore((state) => state.toggleLabels);
  const setViewPreset = useStudioStore((state) => state.setViewPreset);
  const setMachineColor = useStudioStore((state) => state.setMachineColor);
  const setBodyColor = useStudioStore((state) => state.setBodyColor);
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const selected = modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  const colors = ["#ea580c", "#06b6d4", "#10b981", "#8b5cf6", "#f43f5e"];
  const bodyColors = ["#080b10", "#f8fafc", "#475569", "#0f1e36"];

  return (
    <section id="machine-layout" className="panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <p className="technical-label text-accent">Interactive Ergonomic Machine View</p>
          <h2 className="mt-1 text-xl font-semibold">1850 x 850 x 800 mm POPAPOPZ Packaging Model</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Swatches label="Trim" values={colors} selected={machineColor} onSelect={setMachineColor} />
          <Swatches label="Cabinet" values={bodyColors} selected={bodyColor} onSelect={setBodyColor} />
          <ViewportToggle active={guidesVisible} onClick={toggleGuides} activeLabel="Guides On" inactiveLabel="Guides Off" activeIcon={Ruler} inactiveIcon={Ruler} />
          <ViewportToggle active={labelsVisible} onClick={toggleLabels} activeLabel="Labels On" inactiveLabel="Labels Off" activeIcon={Tags} inactiveIcon={Tags} />
          <ViewportToggle active={exploded} onClick={toggleExploded} activeLabel="Reset View" inactiveLabel="Exploded View" activeIcon={RotateCcw} inactiveIcon={Move3D} />
          <ViewportToggle active={cutaway} onClick={toggleCutaway} activeLabel="Show Panels" inactiveLabel="Cutaway Mode" activeIcon={Eye} inactiveIcon={ScanLine} />
          <ViewportToggle active={isolated} onClick={toggleIsolated} activeLabel="Show Assembly" inactiveLabel="Isolate Part" activeIcon={RotateCcw} inactiveIcon={Focus} />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 pt-1">
          <span className="technical-label mr-1 text-muted">View</span>
          {(Object.keys(viewPresets) as ViewPreset[]).map((preset) => (
            <button
              key={preset}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                viewPreset === preset ? "border-accent/70 bg-accent/10 text-accent" : "border-border bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
              onClick={() => setViewPreset(preset)}
              type="button"
            >
              {viewPresets[preset].label}
            </button>
          ))}
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-1.5 text-sm hover:bg-white/[0.08]"
            onClick={() => setViewPreset("front")}
            type="button"
          >
            <Home className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="h-[680px] min-h-[560px] bg-[radial-gradient(circle_at_50%_12%,rgba(56,189,248,0.16),transparent_34%),linear-gradient(180deg,#1b2535_0%,#111827_58%,#0b1120_100%)]">
          <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
            <Suspense fallback={<LoadingLabel />}>
              <color attach="background" args={["#141e2c"]} />
              <PerspectiveCamera makeDefault position={viewPresets.front.position} fov={36} />
              <ambientLight intensity={0.82} />
              <hemisphereLight args={["#f8fafc", "#334155", 1.12]} />
              <directionalLight castShadow position={[3.8, 7, 5.2]} intensity={2.55} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />
              <directionalLight position={[-3.5, 2.4, 3]} intensity={1.18} color="#e0f2fe" />
              <spotLight position={[0, 3.1, 3]} angle={0.5} penumbra={0.8} intensity={1.9} color="#ffffff" castShadow shadow-bias={-0.0001} />
              <pointLight position={[-2.8, 2.2, 1.8]} intensity={0.85} color="#fb923c" />
              <pointLight position={[2.8, 1.8, 1.8]} intensity={1.05} color="#22d3ee" />
              <CameraRig />
              <MachineModel />
              <GridFloor />
            </Suspense>
          </Canvas>
        </div>
        <div className="border-t border-border/80 p-4 xl:border-l xl:border-t-0">
          <p className="technical-label text-muted">Current Selection</p>
          <div className="mt-3 rounded-md border border-border/80 bg-black/20 p-3">
            <div className="text-lg font-semibold">{selected.shortName}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selected.purpose}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {selected.heightMm ? <div>Height: {selected.heightMm}</div> : null}
              {selected.diameterMm ? <div>Diameter: {selected.diameterMm}</div> : null}
            </div>
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

function Swatches({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (color: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-r border-border/80 pr-3">
      <span className="font-mono text-xs font-semibold uppercase tracking-normal text-slate-400">{label}:</span>
      <div className="flex gap-1.5">
        {values.map((hex) => (
          <button
            key={hex}
            className={`h-5 w-5 rounded-full border transition-all ${selected === hex ? "scale-110 border-white ring-2 ring-emerald-500/25" : "border-transparent hover:scale-105"}`}
            style={{ backgroundColor: hex }}
            onClick={() => onSelect(hex)}
            title={hex}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function ViewportToggle({
  active,
  onClick,
  activeLabel,
  inactiveLabel,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon
}: {
  active: boolean;
  onClick: () => void;
  activeLabel: string;
  inactiveLabel: string;
  activeIcon: React.ComponentType<{ className?: string }>;
  inactiveIcon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
        active ? "border-accent/70 bg-accent/10 text-accent" : "border-border bg-white/[0.04] hover:bg-white/[0.08]"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

function MachineModel() {
  const cutaway = useStudioStore((state) => state.cutaway);
  const isolated = useStudioStore((state) => state.isolated);
  const guidesVisible = useStudioStore((state) => state.guidesVisible);
  const labelsVisible = useStudioStore((state) => state.labelsVisible);
  const machineColor = useStudioStore((state) => state.machineColor);
  const bodyColor = useStudioStore((state) => state.bodyColor);

  return (
    <group position={[0, -0.02, 0]} scale={0.92}>
      <CabinetShell cutaway={cutaway || isolated} machineColor={machineColor} bodyColor={bodyColor} isolated={isolated} />
      <StaticKioskDetails cutaway={cutaway || isolated} labelsVisible={labelsVisible} />
      {guidesVisible ? <ErgonomicReferences labelsVisible={labelsVisible} /> : null}
      {guidesVisible ? <CupTravelPath labelsVisible={labelsVisible} /> : null}
      {moduleMeshes.map((config) => {
        const machineModule = modules.find((item) => item.id === config.id);
        return machineModule ? <MachineModuleBlock key={config.id} config={config} module={machineModule} /> : null;
      })}
    </group>
  );
}

function CameraRig() {
  const viewPreset = useStudioStore((state) => state.viewPreset);
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  useEffect(() => {
    const preset = viewPresets[viewPreset];
    camera.position.set(...preset.position);
    camera.lookAt(...preset.target);
    if (controlsRef.current) {
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
    }
  }, [camera, viewPreset]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      makeDefault
      minDistance={4.2}
      maxDistance={8.8}
      maxPolarAngle={Math.PI / 1.52}
      target={viewPresets.front.target}
    />
  );
}

function CabinetShell({ cutaway, machineColor, bodyColor, isolated }: { cutaway: boolean; machineColor: string; bodyColor: string; isolated: boolean }) {
  const theme = themeColors[machineColor] ?? themeColors["#ea580c"];
  const bTheme = bodyThemes[bodyColor] ?? bodyThemes["#080b10"];
  const panelOpacity = cutaway ? 0.26 : 1;

  return (
    <group>
      <mesh position={[0, 0, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 3.72, 0.5]} />
        <meshStandardMaterial color={bTheme.back} roughness={bTheme.roughness} metalness={bTheme.metalness} transparent opacity={isolated ? 0.12 : panelOpacity} />
      </mesh>
      <RoundedBox position={[0, 0, 0.08]} args={[2.85, 3.72, 0.84]} radius={0.055} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={bTheme.main} roughness={bTheme.roughness} metalness={bTheme.metalness} transparent opacity={isolated ? 0.1 : panelOpacity} />
        <Edges color={theme.accent} />
      </RoundedBox>
      <Trim position={[0, 1.82, 0.62]} scale={[2.92, 0.16, 0.12]} color={theme.accent} />
      <Trim position={[0, 0.98, 0.98]} scale={[2.54, 0.04, 0.04]} color={theme.glow} />
      <Trim position={[0, 0.22, 1]} scale={[2.54, 0.04, 0.04]} color="#34d399" />
      <Trim position={[0, -1.84, 0.64]} scale={[2.92, 0.16, 0.12]} color={theme.accent} />
      {[-1.54, 1.54].map((x) => (
        <mesh key={x} position={[x, 0, 0.48]} castShadow>
          <boxGeometry args={[0.16, 3.58, 0.32]} />
          <meshStandardMaterial color={bTheme.pillars} roughness={bTheme.roughness} metalness={bTheme.metalness} transparent opacity={isolated ? 0.18 : 1} />
        </mesh>
      ))}
      {!cutaway ? (
        <mesh position={[0, 0.52, 1.03]} castShadow>
          <boxGeometry args={[2.42, 1.82, 0.035]} />
          <meshPhysicalMaterial color="#d1f5ff" transparent opacity={0.16} roughness={0.05} metalness={0.1} transmission={0.9} ior={1.5} thickness={0.04} />
        </mesh>
      ) : null}
    </group>
  );
}

function StaticKioskDetails({ cutaway, labelsVisible }: { cutaway: boolean; labelsVisible: boolean }) {
  return (
    <group>
      <SignPanel position={[0, 1.82, 0.72]} scale={[1.12, 0.22, 0.05]} text="POPAPOPZ" color="#101827" textColor="#f8fafc" fontSize={0.13} />
      {labelsVisible ? (
        <>
          <Text position={[0, 1.54, 0.86]} fontSize={0.085} color="#0891b2" anchorX="center" anchorY="middle">
            QUEUE - ORDER - DISPENSE
          </Text>
          <Text position={[0, -1.84, 0.74]} fontSize={0.12} color="#1f2937" anchorX="center" anchorY="middle">
            SERVICE DRAWERS BELOW
          </Text>
        </>
      ) : null}
      {!cutaway ? <QrGraphic /> : null}
    </group>
  );
}

function ErgonomicReferences({ labelsVisible }: { labelsVisible: boolean }) {
  return (
    <group>
      {ergonomicReferences.map((ref) => (
        <DimensionCallout key={ref.label} {...ref} labelsVisible={labelsVisible} />
      ))}
      <Line points={[[-1.52, -1.86, 0.98], [-1.52, 1.86, 0.98]]} color="#0891b2" lineWidth={1} transparent opacity={0.32} />
      <Line points={[[-1.62, -1.86, 0.98], [-1.38, -1.86, 0.98]]} color="#0891b2" lineWidth={1} transparent opacity={0.32} />
      <Line points={[[-1.62, 1.86, 0.98], [-1.38, 1.86, 0.98]]} color="#0891b2" lineWidth={1} transparent opacity={0.32} />
      {labelsVisible ? (
        <Text position={[-1.8, 0, 1.02]} rotation={[0, 0, Math.PI / 2]} fontSize={0.062} color="#0891b2" anchorX="center" anchorY="middle">
          1850 mm HEIGHT
        </Text>
      ) : null}
    </group>
  );
}

function DimensionCallout({ label, y, color, x, labelsVisible }: { label: string; y: number; color: string; x: number; labelsVisible: boolean }) {
  const labelX = x >= 0 ? 2.22 : -2.28;
  const anchorX = x < 0 ? "right" : x > 0 ? "left" : "center";
  return (
    <group>
      <Line points={[[-1.36, y, 1.16], [1.36, y, 1.16]]} color={color} lineWidth={1} transparent opacity={0.38} />
      {x !== 0 ? <Line points={[[x > 0 ? 1.36 : -1.36, y, 1.16], [labelX, y, 1.16]]} color={color} lineWidth={1} transparent opacity={0.38} /> : null}
      {labelsVisible ? (
        <Text position={[x === 0 ? 0 : labelX, y + 0.055, 1.18]} fontSize={0.055} color={color} anchorX={anchorX} anchorY="middle" outlineWidth={0.002} outlineColor="#f8fafc">
          {label}
        </Text>
      ) : null}
    </group>
  );
}

function CupTravelPath({ labelsVisible }: { labelsVisible: boolean }) {
  return (
    <group>
      <Line points={[[-1.18, 1.2, 1.18], [-1.18, 0.42, 1.18], [-0.66, 0.22, 1.18], [-0.06, 0.08, 1.18]]} color="#ca8a04" lineWidth={2} transparent opacity={0.5} />
      {labelsVisible ? (
        <Text position={[-1.36, 0.34, 1.2]} fontSize={0.052} color="#ca8a04" anchorX="right" anchorY="middle" outlineWidth={0.002} outlineColor="#f8fafc">
          CUP FEED PATH
        </Text>
      ) : null}
    </group>
  );
}

function MachineModuleBlock({ config, module }: { config: ModuleMeshConfig; module: MachineModule }) {
  const exploded = useStudioStore((state) => state.exploded);
  const isolated = useStudioStore((state) => state.isolated);
  const labelsVisible = useStudioStore((state) => state.labelsVisible);
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const hoveredModuleId = useStudioStore((state) => state.hoveredModuleId);
  const setSelectedModuleId = useStudioStore((state) => state.setSelectedModuleId);
  const setHoveredModuleId = useStudioStore((state) => state.setHoveredModuleId);
  const active = selectedModuleId === module.id || hoveredModuleId === module.id;
  const selected = selectedModuleId === module.id;
  const position = isolated && selected ? config.isolatePosition : exploded ? config.explodedPosition : config.position;
  const showGhost = isolated && !selected;
  const labelPosition = config.labelOffset ?? [0, config.scale[1] * 0.68, 0.08];

  return (
    <group
      position={position}
      scale={isolated && selected ? 1.2 : 1}
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
      {showGhost ? <GhostModule scale={config.scale} color={module.color} /> : <ModuleVisual moduleId={module.id} color={module.color} active={active} labelsVisible={labelsVisible} />}
      {active || selected ? <SelectionFrame scale={config.scale} color={module.color} /> : null}
      {labelsVisible && (active || isolated || exploded) && !showGhost ? (
        <group position={labelPosition}>
          <Text fontSize={0.065} color={module.color} anchorX="center" anchorY="middle" outlineWidth={0.004} outlineColor="#020617">
            {module.shortName}
          </Text>
          <Text position={[0, -0.1, 0]} fontSize={0.045} color="#cbd5e1" anchorX="center" anchorY="middle">
            {config.zoneLabel}
          </Text>
        </group>
      ) : null}
    </group>
  );
}

function GhostModule({ scale, color }: { scale: [number, number, number]; color: string }) {
  return (
    <mesh scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
      <Edges color={color} scale={1} />
    </mesh>
  );
}

function SelectionFrame({ scale, color }: { scale: [number, number, number]; color: string }) {
  return (
    <mesh scale={[scale[0] * 1.06, scale[1] * 1.06, scale[2] * 1.06]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.09} />
      <Edges color={color} scale={1} />
    </mesh>
  );
}

function ModuleVisual({ moduleId, color, active, labelsVisible }: { moduleId: string; color: string; active: boolean; labelsVisible: boolean }) {
  if (moduleId === "controller") return <ControllerVisual color={color} labelsVisible={labelsVisible} />;
  if (moduleId === "prep") return <PrepVisual color={color} active={active} labelsVisible={labelsVisible} />;
  if (moduleId === "cup") return <CupVisual />;
  if (moduleId === "flavor") return <FlavorVisual />;
  if (moduleId === "boba") return <BobaVisual color={color} />;
  if (moduleId === "water") return <WaterVisual />;
  if (moduleId === "electrical") return <ElectricalVisual />;
  if (moduleId === "waste") return <WasteVisual color={color} labelsVisible={labelsVisible} />;
  return <RefrigerationVisual />;
}

function ControllerVisual({ color, labelsVisible }: { color: string; labelsVisible: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.85, 0.48, 0.14]} radius={0.02} smoothness={3} castShadow>
        <meshStandardMaterial color="#263447" roughness={0.34} metalness={0.58} />
      </RoundedBox>
      <ScreenPanel position={[-0.42, 0.03, 0.08]} scale={[0.66, 0.3, 0.012]} color="#0c4a6e" />
      <ScreenPanel position={[0.38, 0.03, 0.08]} scale={[0.66, 0.3, 0.012]} color="#172554" />
      {labelsVisible ? (
        <>
          <Text position={[-0.42, 0.06, 0.095]} fontSize={0.05} color="#67e8f9" anchorX="center" anchorY="middle">
            QUEUE 07
          </Text>
          <Text position={[0.38, 0.06, 0.095]} fontSize={0.048} color="#c4b5fd" anchorX="center" anchorY="middle">
            ORDER FLOW
          </Text>
        </>
      ) : null}
      <PulsingLED position={[-0.82, -0.08, 0.09]} color="#10b981" interval={4} />
      <PulsingLED position={[0.78, -0.08, 0.09]} color={color} interval={6} />
    </group>
  );
}

function PrepVisual({ color, active, labelsVisible }: { color: string; active: boolean; labelsVisible: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.32, 0.64, 0.34]} radius={0.025} smoothness={3} castShadow>
        <meshPhysicalMaterial color="#d1f5ff" transparent opacity={0.18} transmission={0.7} roughness={0.05} />
        <Edges color={color} />
      </RoundedBox>
      <mesh position={[0, -0.24, 0.06]} scale={[1.08, 0.08, 0.28]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#475569" roughness={0.18} metalness={0.85} />
      </mesh>
      <mesh position={[-0.26, -0.16, 0.18]} scale={[0.18, 0.16, 0.18]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1, 32, 1, true]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.34} side={THREE.DoubleSide} />
      </mesh>
      <NozzleTree color={color} />
      <RobotArm active={active} color={color} />
      {labelsVisible ? (
        <Text position={[0.22, -0.05, 0.23]} fontSize={0.05} color="#ca8a04" anchorX="left" anchorY="middle" outlineWidth={0.002} outlineColor="#f8fafc">
          PICKUP 1030 mm
        </Text>
      ) : null}
    </group>
  );
}

function CupVisual() {
  return (
    <group>
      <RoundedBox args={[0.5, 0.92, 0.25]} radius={0.015} smoothness={2} position={[0, 0.02, 0]} castShadow>
        <meshStandardMaterial color="#334155" roughness={0.42} metalness={0.65} />
      </RoundedBox>
      {[-0.18, -0.06, 0.06, 0.18].map((x, colIdx) => (
        <group key={x} position={[x, 0.09, 0.08]}>
          <mesh scale={[0.065, 0.68, 0.065]}>
            <cylinderGeometry args={[1, 1, 1, 18]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.16} transmission={0.86} roughness={0.08} />
          </mesh>
          {[0.28, 0.16, 0.04, -0.08, -0.2].map((y, cupIdx) => (
            <mesh key={cupIdx} position={[0, y, 0]} rotation={[Math.PI, 0, 0]} scale={[0.055, 0.09, 0.055]}>
              <cylinderGeometry args={[0.75, 1, 1, 18, 1, true]} />
              <meshStandardMaterial color={colIdx % 2 === 0 ? "#f8fafc" : "#fef08a"} roughness={0.32} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
      <Line points={[[0, -0.38, 0.15], [0.38, -0.5, 0.18], [0.8, -0.56, 0.18]]} color="#facc15" lineWidth={2} />
    </group>
  );
}

function FlavorVisual() {
  return (
    <group>
      <mesh position={[0, -0.22, 0]} scale={[0.64, 0.035, 0.25]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.2} />
      </mesh>
      {[-0.24, -0.08, 0.08, 0.24].map((x, index) => {
        const liquidColor = ["#f97316", "#db2777", "#eab308", "#10b981"][index];
        return (
          <group key={x} position={[x, 0.02, 0.05]}>
            <RoundedBox args={[0.12, 0.42, 0.1]} radius={0.015} smoothness={2} castShadow>
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.2} transmission={0.88} roughness={0.05} />
            </RoundedBox>
            <mesh position={[0, -0.05, 0]} scale={[0.096, 0.31, 0.08]} castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={liquidColor} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.27, -0.02]} rotation={[Math.PI / 6, 0, 0]} scale={[0.01, 0.16, 0.01]}>
              <cylinderGeometry args={[1, 1, 1, 8]} />
              <meshStandardMaterial color={liquidColor} transparent opacity={0.65} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BobaVisual({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} scale={[0.62, 0.035, 0.24]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#475569" metalness={0.62} roughness={0.22} />
      </mesh>
      {[-0.2, 0, 0.2].map((x, hopIdx) => (
        <group key={x} position={[x, 0.06, 0.06]}>
          <mesh scale={[0.09, 0.36, 0.09]} castShadow>
            <cylinderGeometry args={[1, 0.55, 1, 24]} />
            <meshPhysicalMaterial color="#dbeafe" transparent opacity={0.24} transmission={0.88} roughness={0.08} />
          </mesh>
          {[-0.08, -0.02, 0.04].map((y, idx) => (
            <group key={idx} position={[0, y + 0.04, 0]}>
              {[-0.03, 0, 0.03].map((bx, bIdx) => (
                <mesh key={bIdx} position={[bx, 0, bIdx % 2 === 0 ? 0.025 : -0.025]} scale={[0.024, 0.024, 0.024]}>
                  <sphereGeometry args={[1, 10, 10]} />
                  <meshStandardMaterial color={hopIdx === 0 ? "#111827" : hopIdx === 1 ? "#ea580c" : "#f1c40f"} roughness={0.18} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, -0.22, 0]} scale={[0.075, 0.06, 0.075]} castShadow>
            <cylinderGeometry args={[1, 1, 1, 18]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <Line points={[[0, -0.22, 0.1], [0.18, -0.38, 0.18], [0.18, -0.52, 0.18]]} color={color} lineWidth={2} transparent opacity={0.8} />
    </group>
  );
}

function WaterVisual() {
  return (
    <group>
      <CylinderTank position={[-0.16, 0, 0.02]} scale={[0.14, 0.74, 0.14]} color="#64748b" />
      <CylinderTank position={[0.14, -0.04, 0.05]} scale={[0.1, 0.58, 0.1]} color="#0284c7" />
      <ValveBlock position={[0, 0.42, 0.06]} color="#d97706" />
      <Line points={[[-0.16, 0.35, 0.08], [0.14, 0.27, 0.08], [0.32, 0.08, 0.08]]} color="#e2e8f0" lineWidth={2} />
    </group>
  );
}

function ElectricalVisual() {
  return (
    <group>
      <mesh position={[0, 0, -0.05]} scale={[0.72, 0.48, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, -0.03]} scale={[0.64, 0.03, 0.015]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      {[-0.24, -0.16, -0.08, 0, 0.08, 0.16].map((x, idx) => (
        <mesh key={x} position={[x, 0.08, 0]} scale={[0.045, 0.14, 0.045]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={idx % 3 === 0 ? "#ef4444" : idx % 3 === 1 ? "#3b82f6" : "#eab308"} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.22, -0.12, 0]} scale={[0.16, 0.18, 0.06]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function WasteVisual({ color, labelsVisible }: { color: string; labelsVisible: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.46, 0.3, 0.24]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color="#633116" roughness={0.42} metalness={0.2} />
        <Edges color={color} />
      </RoundedBox>
      <mesh position={[0, 0.12, 0.12]} scale={[1.18, 0.04, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {[-0.46, -0.18, 0.12, 0.42].map((x) => (
        <Line key={x} points={[[x, 0.28, 0.16], [x * 0.65, 0.1, 0.16], [0, 0.02, 0.16]]} color="#fb923c" lineWidth={1} transparent opacity={0.75} />
      ))}
      {labelsVisible ? (
        <Text position={[0, -0.02, 0.16]} fontSize={0.055} color="#fed7aa" anchorX="center" anchorY="middle">
          SEALED WASTE
        </Text>
      ) : null}
    </group>
  );
}

function RefrigerationVisual() {
  return (
    <group>
      <RoundedBox args={[0.95, 0.58, 0.28]} radius={0.018} smoothness={2} castShadow>
        <meshStandardMaterial color="#475569" metalness={0.52} roughness={0.32} />
      </RoundedBox>
      {[-0.24, 0.24].map((x) => (
        <FanVent key={x} position={[x, 0, 0.15]} />
      ))}
      <CylinderTank position={[0, -0.1, -0.02]} scale={[0.16, 0.24, 0.16]} color="#111827" />
    </group>
  );
}

function SignPanel({ position, scale, text, color, textColor, fontSize = 0.16 }: { position: [number, number, number]; scale: [number, number, number]; text: string; color: string; textColor: string; fontSize?: number }) {
  return (
    <group position={position}>
      <mesh castShadow scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} emissive={textColor} emissiveIntensity={0.14} roughness={0.32} />
      </mesh>
      <Text position={[0, 0, scale[2] + 0.012]} fontSize={fontSize} color={textColor} anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#312e81">
        {text}
      </Text>
    </group>
  );
}

function Trim({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} />
    </mesh>
  );
}

function QrGraphic() {
  const squares = [[-0.08, 0.08], [0, 0.08], [0.08, 0.08], [-0.08, 0], [0.08, 0], [-0.08, -0.08], [0, -0.08], [0.08, -0.08], [0.04, 0], [-0.04, -0.04]] as const;
  return (
    <group position={[1.03, -0.1, 0.96]}>
      <mesh scale={[0.36, 0.26, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fff7ed" emissive="#fb923c" emissiveIntensity={0.16} />
      </mesh>
      {squares.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.035]} scale={[0.025, 0.025, 0.006]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
    </group>
  );
}

function ScreenPanel({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.2} />
    </mesh>
  );
}

function PulsingLED({ position, color, interval = 4 }: { position: [number, number, number]; color: string; interval?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.42 + Math.sin(state.clock.elapsedTime * interval) * 0.32;
    }
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry args={[0.017, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} />
    </mesh>
  );
}

function RobotArm({ active, color }: { active: boolean; color: string }) {
  const baseRef = useRef<THREE.Group>(null);
  const forearmRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (baseRef.current && forearmRef.current) {
      const t = state.clock.elapsedTime;
      baseRef.current.rotation.y = THREE.MathUtils.lerp(baseRef.current.rotation.y, active ? -0.35 + Math.sin(t * 1.5) * 0.16 : -0.35, 0.1);
      forearmRef.current.rotation.x = THREE.MathUtils.lerp(forearmRef.current.rotation.x, active ? Math.cos(t * 1.5) * 0.1 : 0, 0.1);
    }
  });
  return (
    <group position={[0.05, -0.04, 0.18]} ref={baseRef} rotation={[0, -0.35, 0]}>
      <mesh position={[0, -0.14, 0]} scale={[0.08, 0.06, 0.08]} castShadow>
        <cylinderGeometry args={[1, 1.2, 1, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.02, 0.04, 0]} rotation={[0, 0, Math.PI / 8]} scale={[0.03, 0.24, 0.03]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
      </mesh>
      <group position={[0.08, 0.16, 0]} rotation={[0, 0, -Math.PI / 4]} ref={forearmRef}>
        <mesh position={[0.08, -0.08, 0]} scale={[0.026, 0.18, 0.026]} castShadow>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        <group position={[0.18, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh scale={[0.072, 0.018, 0.072]}>
            <cylinderGeometry args={[1, 1.05, 1, 24, 1, true]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <mesh scale={[0.066, 0.008, 0.066]} position={[0, 0.01, 0]}>
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
    <group position={[0.34, 0.16, 0.18]}>
      <RoundedBox args={[0.28, 0.06, 0.12]} radius={0.008} smoothness={2} castShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </RoundedBox>
      {[-0.09, 0, 0.09].map((x, nozzleIdx) => (
        <group key={x} position={[x, -0.11, 0]}>
          <mesh scale={[0.014, 0.16, 0.014]} castShadow>
            <cylinderGeometry args={[1, 1, 1, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.08, 0]} scale={[0.018, 0.006, 0.018]}>
            <cylinderGeometry args={[1, 1, 1, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.22, 0]} scale={[0.008, 0.24, 0.008]}>
            <cylinderGeometry args={[1, 1, 1, 8]} />
            <meshPhysicalMaterial color={color} transparent opacity={nozzleIdx === 1 ? 0.62 : 0} transmission={0.85} roughness={0.05} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CylinderTank({ position, scale, color }: { position: [number, number, number]; scale: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh scale={scale} castShadow>
        <cylinderGeometry args={[1, 1, 1, 24]} />
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.82} />
      </mesh>
      <mesh position={[0, scale[1] * 0.5, 0]} scale={[scale[0], scale[1] * 0.12, scale[2]]}>
        <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.82} />
      </mesh>
    </group>
  );
}

function ValveBlock({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh scale={[0.05, 0.05, 0.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.78} roughness={0.22} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.03, 0.012, 0.03]}>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function FanVent({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh scale={[0.18, 0.18, 0.012]}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.01]} scale={[0.045, 0.045, 0.01]}>
        <cylinderGeometry args={[1, 1, 1, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>
      {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map((angle) => (
        <mesh key={angle} position={[0, 0, 0.016]} rotation={[0, 0, angle]} scale={[0.014, 0.13, 0.003]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function GridFloor() {
  return (
    <group position={[0, -1.96, 0]}>
      <gridHelper args={[5, 20, "#22d3ee", "#334155"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#101827" transparent opacity={0.88} roughness={0.62} />
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
