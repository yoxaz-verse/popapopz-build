"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Edges, Line, OrbitControls, PerspectiveCamera, RoundedBox, Text } from "@react-three/drei";
import { Eye, Focus, Home, Layers3, Move3D, Tags } from "lucide-react";
import { componentBuildPlans } from "@/data/popapopz";
import { ComponentModel, getComponentModelSpec, PreviewButton } from "@/components/component-planning/component-3d-preview";
import type { ComponentBuildPlan } from "@/types/engineering";

type AssemblyMode = "assembled" | "exploded" | "isolate";
type AssemblyView = "front" | "side" | "top";

interface AssemblyPlacement {
  id: string;
  position: [number, number, number];
  explodedPosition: [number, number, number];
  scale: number;
  label: string;
}

const assemblyPlacements: AssemblyPlacement[] = [
  { id: "frame", position: [0, -0.04, -0.08], explodedPosition: [-2.6, -0.28, -0.62], scale: 1.62, label: "Frame datum" },
  { id: "controller", position: [0, 1.42, 0.6], explodedPosition: [0, 2.58, 1.18], scale: 0.5, label: "Chest HMI" },
  { id: "software-hmi", position: [0.66, 1.62, 0.64], explodedPosition: [1.92, 2.45, 1.2], scale: 0.38, label: "Software UI" },
  { id: "cup", position: [-0.95, 0.82, 0.48], explodedPosition: [-2.58, 0.95, 1.2], scale: 0.62, label: "Cup magazine" },
  { id: "flavor", position: [-0.28, 0.68, 0.64], explodedPosition: [-1.58, 1.22, 1.2], scale: 0.5, label: "Flavor rack" },
  { id: "boba", position: [0.62, 0.68, 0.64], explodedPosition: [1.58, 1.18, 1.22], scale: 0.5, label: "Boba cassette" },
  { id: "nozzle-tree", position: [0.28, 0.22, 0.76], explodedPosition: [1.72, 0.18, 1.42], scale: 0.48, label: "Nozzle tree" },
  { id: "prep", position: [0, -0.1, 0.62], explodedPosition: [0, -0.02, 1.7], scale: 0.68, label: "Pickup chamber" },
  { id: "water", position: [0.9, -0.98, 0.4], explodedPosition: [2.34, -1.08, 1.0], scale: 0.5, label: "Water / CO2" },
  { id: "refrigeration", position: [-0.56, -1.12, 0.32], explodedPosition: [-1.75, -1.78, 0.98], scale: 0.58, label: "Cooled bay" },
  { id: "electrical", position: [0.9, -1.46, 0.62], explodedPosition: [2.26, -1.72, 1.18], scale: 0.54, label: "Dry electrical" },
  { id: "waste", position: [-0.12, -1.78, 0.52], explodedPosition: [-0.12, -2.58, 1.08], scale: 0.58, label: "Waste drawer" },
  { id: "sensors-actuators", position: [0, -0.58, 0.92], explodedPosition: [0, -0.68, 1.96], scale: 0.46, label: "Harness" }
];

const viewPresets: Record<AssemblyView, { label: string; position: [number, number, number]; target: [number, number, number] }> = {
  front: { label: "Front", position: [0, 0.1, 6.8], target: [0, -0.15, 0.5] },
  side: { label: "Side", position: [5.6, 0.25, 3.25], target: [0, -0.1, 0.45] },
  top: { label: "Top", position: [0, 6.2, 0.8], target: [0, -0.18, 0.38] }
};

export function ComponentAssemblyViewport({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<AssemblyMode>("assembled");
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [view, setView] = useState<AssemblyView>("front");
  const selected = componentBuildPlans.find((plan) => plan.id === selectedId) ?? componentBuildPlans[0];

  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <p className="technical-label text-accent">3D Component Assembly Browser</p>
          <h2 className="mt-1 text-xl font-semibold">Proper part-by-part machine components</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PreviewButton active={labelsVisible} label="Labels" icon={Tags} onClick={() => setLabelsVisible((value) => !value)} />
          <ModeButton active={mode === "assembled"} label="Assembled" icon={Layers3} onClick={() => setMode("assembled")} />
          <ModeButton active={mode === "exploded"} label="Exploded" icon={Move3D} onClick={() => setMode("exploded")} />
          <ModeButton active={mode === "isolate"} label="Isolate" icon={Focus} onClick={() => setMode("isolate")} />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 pt-1">
          <span className="technical-label mr-1 text-muted">View</span>
          {(Object.keys(viewPresets) as AssemblyView[]).map((preset) => (
            <button
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                view === preset ? "border-accent/70 bg-accent/10 text-accent" : "border-border bg-white/[0.04] hover:bg-white/[0.08]"
              }`}
              key={preset}
              onClick={() => setView(preset)}
              type="button"
            >
              {viewPresets[preset].label}
            </button>
          ))}
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-1.5 text-sm hover:bg-white/[0.08]" onClick={() => setView("front")} type="button">
            <Home className="h-4 w-4" />
            Reset
          </button>
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted md:flex">
            <Eye className="h-4 w-4 text-accent" />
            Click any 3D module to select it
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="h-[720px] min-h-[560px] bg-[radial-gradient(circle_at_50%_14%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(180deg,#162235_0%,#0d1524_62%,#080d17_100%)]">
          <Canvas shadows dpr={[1, 1.75]} gl={{ preserveDrawingBuffer: true }}>
            <Suspense fallback={null}>
              <color attach="background" args={["#101827"]} />
              <PerspectiveCamera makeDefault position={viewPresets.front.position} fov={37} />
              <ambientLight intensity={0.84} />
              <hemisphereLight args={["#f8fafc", "#334155", 1.06]} />
              <directionalLight castShadow position={[3.8, 6.4, 5.2]} intensity={2.25} shadow-mapSize={[2048, 2048]} />
              <directionalLight position={[-3.5, 2.2, 3]} intensity={0.92} color="#bae6fd" />
              <pointLight position={[-2.4, 1.8, 2.2]} intensity={0.75} color="#fb923c" />
              <pointLight position={[2.5, 1.8, 2.2]} intensity={0.95} color="#22d3ee" />
              <AssemblyCameraRig view={view} />
              <MachineEnvelope />
              <AssemblyModel selectedId={selected.id} mode={mode} labelsVisible={labelsVisible} onSelect={onSelect} />
              <AssemblyFloor />
            </Suspense>
          </Canvas>
        </div>
        <div className="border-t border-border/80 p-4 xl:border-l xl:border-t-0">
          <p className="technical-label text-muted">Current 3D Selection</p>
          <div className="mt-3 rounded-md border border-border/80 bg-black/20 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.color }} />
              <div className="text-lg font-semibold">{selected.shortName}</div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selected.assemblyType}</p>
          </div>
          <div className="mt-4 grid gap-2">
            {assemblyPlacements.map((placement, index) => {
              const plan = componentBuildPlans.find((item) => item.id === placement.id);
              if (!plan) return null;
              return (
                <button
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                    selected.id === plan.id ? "border-accent/70 bg-accent/10" : "border-border/80 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                  key={plan.id}
                  onClick={() => onSelect(plan.id)}
                  type="button"
                >
                  <span className="technical-label w-6 text-muted">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="min-w-0 truncate">{plan.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition ${
        active ? "border-accent/70 bg-accent/10 text-accent" : "border-border bg-white/[0.04] text-muted hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function AssemblyCameraRig({ view }: { view: AssemblyView }) {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  useEffect(() => {
    const preset = viewPresets[view];
    camera.position.set(...preset.position);
    camera.lookAt(...preset.target);
    if (controlsRef.current) {
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
    }
  }, [camera, view]);

  return <OrbitControls ref={controlsRef} enablePan={false} makeDefault maxDistance={8.6} maxPolarAngle={Math.PI / 1.5} minDistance={3.2} target={viewPresets.front.target} />;
}

function AssemblyModel({ selectedId, mode, labelsVisible, onSelect }: { selectedId: string; mode: AssemblyMode; labelsVisible: boolean; onSelect: (id: string) => void }) {
  return (
    <group position={[0, -0.05, 0]} scale={0.92}>
      {assemblyPlacements.map((placement) => {
        const plan = componentBuildPlans.find((item) => item.id === placement.id);
        if (!plan) return null;
        return <AssemblyComponent key={placement.id} labelsVisible={labelsVisible} mode={mode} onSelect={onSelect} placement={placement} plan={plan} selected={selectedId === placement.id} />;
      })}
    </group>
  );
}

function AssemblyComponent({
  labelsVisible,
  mode,
  onSelect,
  placement,
  plan,
  selected
}: {
  labelsVisible: boolean;
  mode: AssemblyMode;
  onSelect: (id: string) => void;
  placement: AssemblyPlacement;
  plan: ComponentBuildPlan;
  selected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const spec = useMemo(() => getComponentModelSpec(plan), [plan]);
  const isolatedGhost = mode === "isolate" && !selected;
  const position = mode === "exploded" ? placement.explodedPosition : mode === "isolate" && selected ? [0, 0.05, 1.32] : placement.position;
  const active = selected || hovered;
  const internalLabelsVisible = labelsVisible && (active || mode !== "assembled");

  return (
    <group
      position={position as [number, number, number]}
      scale={mode === "isolate" && selected ? placement.scale * 1.45 : placement.scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(plan.id);
      }}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <group>
        {isolatedGhost ? (
          <GhostBlock color={plan.color} />
        ) : (
          <group scale={active ? 1.04 : 1}>
            <ComponentModel accent={plan.color} exploded={mode === "exploded" && selected} labelsVisible={internalLabelsVisible} spec={spec} titleVisible={false} />
          </group>
        )}
        <HitTarget />
        {active ? <SelectionCage color={plan.color} /> : null}
        {labelsVisible && !isolatedGhost ? (
          <Text position={[0, 0.98, 0]} fontSize={0.1} color={plan.color} anchorX="center" anchorY="middle" outlineWidth={0.004} outlineColor="#020617">
            {placement.label}
          </Text>
        ) : null}
      </group>
    </group>
  );
}

function HitTarget() {
  return (
    <mesh scale={[1.72, 1.72, 1.72]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function GhostBlock({ color }: { color: string }) {
  return (
    <mesh scale={[1.65, 1.35, 1.1]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
      <Edges color={color} scale={1} />
    </mesh>
  );
}

function SelectionCage({ color }: { color: string }) {
  return (
    <mesh scale={[1.78, 1.42, 1.18]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
      <Edges color={color} scale={1} />
    </mesh>
  );
}

function MachineEnvelope() {
  return (
    <group position={[0, -0.08, 0.05]} scale={[1, 1, 1]}>
      <Line points={[[-1.55, -1.95, -0.18], [1.55, -1.95, -0.18], [1.55, 1.86, -0.18], [-1.55, 1.86, -0.18], [-1.55, -1.95, -0.18]]} color="#94a3b8" lineWidth={1.1} transparent opacity={0.42} />
      <Line points={[[-1.55, -1.95, 0.98], [1.55, -1.95, 0.98], [1.55, 1.86, 0.98], [-1.55, 1.86, 0.98], [-1.55, -1.95, 0.98]]} color="#22d3ee" lineWidth={1.1} transparent opacity={0.35} />
      {[[-1.55, -1.95], [1.55, -1.95], [1.55, 1.86], [-1.55, 1.86]].map(([x, y]) => (
        <Line key={`${x}-${y}`} points={[[x, y, -0.18], [x, y, 0.98]]} color="#64748b" lineWidth={1} transparent opacity={0.38} />
      ))}
      <RoundedBox args={[3.1, 3.86, 1.16]} position={[0, -0.04, 0.4]} radius={0.04} smoothness={2}>
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.035} depthWrite={false} />
      </RoundedBox>
    </group>
  );
}

function AssemblyFloor() {
  return (
    <group position={[0, -2.05, 0.4]}>
      <gridHelper args={[5.5, 22, "#22d3ee", "#334155"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[5.5, 5.5]} />
        <meshStandardMaterial color="#0b1120" transparent opacity={0.82} roughness={0.62} />
      </mesh>
    </group>
  );
}
