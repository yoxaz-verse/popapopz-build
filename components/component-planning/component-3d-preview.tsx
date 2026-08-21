"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, RoundedBox, Text } from "@react-three/drei";
import { Focus, RotateCcw, Tags } from "lucide-react";
import type { ComponentBuildPlan } from "@/types/engineering";
import * as THREE from "three";

export type PrimitiveKind = "box" | "roundedBox" | "cylinder" | "sphere" | "screen" | "fan";

export interface PrimitiveSpec {
  kind: PrimitiveKind;
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  opacity?: number;
  label?: string;
  metalness?: number;
  roughness?: number;
}

export interface TubeSpec {
  points: [number, number, number][];
  color: string;
  label?: string;
}

export interface ComponentModelSpec {
  title: string;
  camera: [number, number, number];
  primitives: PrimitiveSpec[];
  tubes?: TubeSpec[];
}

const fallbackColor = "#22d3ee";

export function Component3DPreview({ plan }: { plan: ComponentBuildPlan }) {
  const [exploded, setExploded] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [viewKey, setViewKey] = useState(0);
  const spec = useMemo(() => getComponentModelSpec(plan), [plan]);

  return (
    <section className="overflow-hidden rounded-md border border-border/80 bg-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 px-3 py-2">
        <div>
          <p className="technical-label text-accent">3D Component View</p>
          <h3 className="mt-1 text-sm font-semibold">{spec.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <PreviewButton active={labelsVisible} label="Labels" icon={Tags} onClick={() => setLabelsVisible((value) => !value)} />
          <PreviewButton active={exploded} label="Explode" icon={Focus} onClick={() => setExploded((value) => !value)} />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white/[0.04] text-muted transition hover:border-accent hover:text-white"
            onClick={() => setViewKey((value) => value + 1)}
            title="Reset 3D view"
            type="button"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="h-[340px] min-h-[300px] bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(180deg,#111827,#07111d)]">
        <Canvas key={`${plan.id}-${viewKey}`} shadows dpr={[1, 1.75]} gl={{ preserveDrawingBuffer: true }}>
          <Suspense fallback={null}>
            <color attach="background" args={["#0b1220"]} />
            <PerspectiveCamera makeDefault position={spec.camera} fov={36} />
            <ambientLight intensity={0.95} />
            <hemisphereLight args={["#f8fafc", "#1e293b", 1.08]} />
            <directionalLight castShadow position={[3.5, 4.6, 4.2]} intensity={2.2} shadow-mapSize={[1024, 1024]} />
            <pointLight position={[-2.8, 1.8, 2.4]} intensity={0.8} color={plan.color} />
            <ComponentModel spec={spec} exploded={exploded} labelsVisible={labelsVisible} accent={plan.color} />
            <GroundRing color={plan.color} />
            <OrbitControls enablePan={false} makeDefault maxDistance={7.5} minDistance={2.2} target={[0, 0, 0]} />
          </Suspense>
        </Canvas>
      </div>
      <div className="grid gap-2 border-t border-border/80 p-3 text-xs text-muted sm:grid-cols-3">
        <span>Drag to orbit</span>
        <span>Scroll to zoom</span>
        <span>{plan.subComponents?.length ?? 0} modeled parts</span>
      </div>
    </section>
  );
}

export function PreviewButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
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

export function ComponentModel({
  spec,
  exploded,
  labelsVisible,
  accent,
  titleVisible = true
}: {
  spec: ComponentModelSpec;
  exploded: boolean;
  labelsVisible: boolean;
  accent: string;
  titleVisible?: boolean;
}) {
  return (
    <group>
      {spec.primitives.map((primitive, index) => (
        <Primitive key={`${primitive.label ?? primitive.kind}-${index}`} primitive={primitive} index={index} exploded={exploded} labelsVisible={labelsVisible} />
      ))}
      {spec.tubes?.map((tube, index) => (
        <ConnectionTube key={`${tube.label ?? "tube"}-${index}`} tube={tube} labelsVisible={labelsVisible} />
      ))}
      {titleVisible ? (
        <Text position={[0, -1.22, 0]} fontSize={0.1} color={accent} anchorX="center" anchorY="middle">
          {spec.title}
        </Text>
      ) : null}
    </group>
  );
}

function Primitive({ primitive, index, exploded, labelsVisible }: { primitive: PrimitiveSpec; index: number; exploded: boolean; labelsVisible: boolean }) {
  const direction = new THREE.Vector3(...primitive.position).normalize();
  if (direction.length() === 0) direction.set((index % 3) - 1, index % 2 ? 0.5 : -0.5, 0.4);
  const offset = exploded ? direction.multiplyScalar(0.22 + (index % 4) * 0.05) : new THREE.Vector3(0, 0, 0);
  const position: [number, number, number] = [primitive.position[0] + offset.x, primitive.position[1] + offset.y, primitive.position[2] + offset.z];
  const opacity = primitive.opacity ?? 1;
  const material = (
    <meshStandardMaterial color={primitive.color} roughness={primitive.roughness ?? 0.34} metalness={primitive.metalness ?? 0.28} transparent={opacity < 1} opacity={opacity} />
  );

  return (
    <group position={position} rotation={primitive.rotation ?? [0, 0, 0]}>
      {primitive.kind === "roundedBox" ? (
        <RoundedBox args={primitive.scale} radius={0.04} smoothness={3} castShadow receiveShadow>
          {material}
        </RoundedBox>
      ) : null}
      {primitive.kind === "box" || primitive.kind === "screen" ? (
        <mesh castShadow receiveShadow scale={primitive.scale}>
          <boxGeometry args={[1, 1, 1]} />
          {primitive.kind === "screen" ? <meshStandardMaterial color={primitive.color} emissive={primitive.color} emissiveIntensity={0.38} roughness={0.18} /> : material}
        </mesh>
      ) : null}
      {primitive.kind === "cylinder" ? (
        <mesh castShadow receiveShadow scale={primitive.scale}>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          {material}
        </mesh>
      ) : null}
      {primitive.kind === "sphere" ? (
        <mesh castShadow receiveShadow scale={primitive.scale}>
          <sphereGeometry args={[1, 24, 16]} />
          {material}
        </mesh>
      ) : null}
      {primitive.kind === "fan" ? <Fan color={primitive.color} scale={primitive.scale} /> : null}
      {labelsVisible && primitive.label ? (
        <Text position={[0, primitive.scale[1] * 0.75 + 0.08, 0]} fontSize={0.075} color="#e2e8f0" anchorX="center" anchorY="middle">
          {primitive.label}
        </Text>
      ) : null}
    </group>
  );
}

function Fan({ color, scale }: { color: string; scale: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 2;
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
        <mesh key={angle} rotation={[0, 0, angle]} position={[0.26, 0, 0.08]} scale={[0.38, 0.07, 0.03]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} roughness={0.28} metalness={0.32} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.72} roughness={0.2} />
      </mesh>
    </group>
  );
}

function ConnectionTube({ tube, labelsVisible }: { tube: TubeSpec; labelsVisible: boolean }) {
  const points = tube.points.map((point) => new THREE.Vector3(...point));
  const mid = tube.points[Math.floor(tube.points.length / 2)];

  return (
    <group>
      <Line points={points} color={tube.color} lineWidth={2.5} transparent opacity={0.85} />
      {labelsVisible && tube.label ? (
        <Text position={[mid[0], mid[1] + 0.1, mid[2]]} fontSize={0.065} color={tube.color} anchorX="center" anchorY="middle">
          {tube.label}
        </Text>
      ) : null}
    </group>
  );
}

export function GroundRing({ color }: { color: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
        <circleGeometry args={[1.55, 64]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.72} roughness={0.58} />
      </mesh>
      <Line points={[[-1.2, -1.03, -1.2], [1.2, -1.03, -1.2], [1.2, -1.03, 1.2], [-1.2, -1.03, 1.2], [-1.2, -1.03, -1.2]]} color={color} lineWidth={1.2} transparent opacity={0.5} />
    </group>
  );
}

export function getComponentModelSpec(plan: ComponentBuildPlan): ComponentModelSpec {
  const color = plan.color || fallbackColor;
  const muted = "#475569";
  const metal = "#94a3b8";
  const fluid = "#38bdf8";
  const food = "#f8fafc";

  const specs: Record<string, ComponentModelSpec> = {
    refrigeration: {
      title: "Insulated refrigeration package",
      camera: [2.8, 1.8, 3.4],
      primitives: [
        p("roundedBox", [0, 0, 0], [1.55, 1.25, 0.9], "#1e293b", "insulated bay", 0.42),
        p("fan", [0.48, 0.18, 0.52], [0.58, 0.58, 0.58], color, "condenser fan"),
        p("box", [-0.48, -0.42, 0.24], [0.5, 0.34, 0.42], muted, "compressor", 1),
        p("cylinder", [-0.38, 0.18, 0.52], [0.07, 0.56, 0.07], metal, "cooling coil", 1, [Math.PI / 2, 0, 0]),
        p("box", [0, -0.56, -0.48], [1.35, 0.08, 0.16], color, "slide rail", 1)
      ],
      tubes: [tube([[-0.44, -0.2, 0.24], [-0.1, 0.18, 0.5], [0.38, 0.18, 0.5]], fluid, "refrigerant loop")]
    },
    water: {
      title: "Water and carbonation service bay",
      camera: [3, 1.7, 3.5],
      primitives: [
        p("cylinder", [-0.66, 0, 0], [0.18, 0.92, 0.18], "#dbeafe", "filter", 0.5),
        p("cylinder", [0.62, 0, 0], [0.2, 1.08, 0.2], "#bae6fd", "CO2 cylinder", 0.65),
        p("box", [0, -0.4, 0.05], [0.44, 0.28, 0.38], muted, "pump"),
        p("box", [0, 0.32, 0.05], [1.22, 0.14, 0.16], metal, "valve rail"),
        p("sphere", [-0.22, 0.32, 0.28], [0.08, 0.08, 0.08], color, "pressure sensor")
      ],
      tubes: [tube([[-0.66, 0.45, 0], [-0.2, 0.34, 0.14], [0.62, 0.48, 0]], fluid, "water / CO2 path")]
    },
    flavor: {
      title: "Flavor cartridge rack",
      camera: [2.6, 1.5, 3.2],
      primitives: [
        p("box", [0, -0.42, 0], [1.45, 0.12, 0.48], metal, "rack base"),
        ...[-0.54, -0.18, 0.18, 0.54].map((x, index) => p("roundedBox", [x, 0.08, 0], [0.22, 0.92, 0.32], ["#f472b6", "#facc15", "#38bdf8", "#34d399"][index], `cartridge ${index + 1}`, 0.9)),
        ...[-0.54, -0.18, 0.18, 0.54].map((x) => p("cylinder", [x, -0.62, 0.18], [0.055, 0.16, 0.055], muted, "pump", 1, [Math.PI / 2, 0, 0]))
      ],
      tubes: [-0.54, -0.18, 0.18, 0.54].map((x, index) => tube([[x, -0.42, 0.18], [x, -0.82, 0.48], [0, -0.92, 0.52]], ["#f472b6", "#facc15", "#38bdf8", "#34d399"][index], `channel ${index + 1}`))
    },
    boba: {
      title: "Low-shear boba dosing cassette",
      camera: [2.8, 1.7, 3.2],
      primitives: [
        p("cylinder", [-0.42, 0.2, 0], [0.28, 0.85, 0.28], "#fef3c7", "immersed cartridge", 0.5),
        p("cylinder", [0.28, -0.16, 0.1], [0.28, 0.28, 0.28], metal, "strainer cup", 1),
        p("box", [0.3, -0.52, 0.1], [0.5, 0.08, 0.5], muted, "load-cell tray"),
        p("cylinder", [0.7, -0.5, 0.02], [0.05, 0.42, 0.05], fluid, "drain", 1, [0, 0, Math.PI / 4]),
        ...Array.from({ length: 18 }, (_, index) => p("sphere", [-0.5 + (index % 6) * 0.035, 0.05 + Math.floor(index / 6) * 0.08, 0.1 + (index % 3) * 0.04], [0.025, 0.025, 0.025], index % 2 ? "#fb923c" : "#111827", "pearls"))
      ],
      tubes: [tube([[-0.18, -0.12, 0], [0.22, -0.18, 0.08], [0.58, -0.48, 0.02]], color, "soft release")]
    },
    cup: {
      title: "Cup magazine and escapement",
      camera: [2.8, 1.7, 3.2],
      primitives: [
        p("box", [0, 0, 0], [1.15, 1.32, 0.24], "#1e293b", "magazine frame", 0.38),
        ...[-0.36, 0, 0.36].flatMap((x) => Array.from({ length: 5 }, (_, index) => p("cylinder", [x, 0.48 - index * 0.2, 0.08], [0.09, 0.035, 0.09], index % 2 ? "#fef08a" : food, "stacked cups", 1, [Math.PI, 0, 0]))),
        p("box", [0, -0.58, 0.18], [1.0, 0.08, 0.22], color, "escapement gate"),
        p("box", [0.34, -0.8, 0.34], [0.68, 0.08, 0.16], metal, "handoff chute", 1, [0, 0, -0.22])
      ]
    },
    electrical: {
      title: "Protected AC/DC electrical panel",
      camera: [2.6, 1.6, 3.1],
      primitives: [
        p("box", [0, 0, -0.05], [1.45, 1.1, 0.12], "#cbd5e1", "backplate"),
        p("box", [0, 0.34, 0.05], [1.24, 0.08, 0.08], metal, "DIN rail"),
        ...[-0.48, -0.24, 0, 0.24, 0.48].map((x, index) => p("box", [x, 0.2, 0.14], [0.14, 0.24, 0.14], index % 2 ? "#3b82f6" : "#ef4444", "fuse block")),
        p("box", [-0.38, -0.32, 0.12], [0.42, 0.3, 0.16], muted, "24V supply"),
        p("box", [0.34, -0.32, 0.12], [0.48, 0.28, 0.16], "#f8fafc", "terminal strip")
      ],
      tubes: [tube([[-0.55, 0.58, 0.18], [-0.1, 0.02, 0.22], [0.5, -0.44, 0.2]], "#fb7185", "wire bundle")]
    },
    controller: {
      title: "PLC controller and HMI",
      camera: [2.5, 1.5, 3.2],
      primitives: [
        p("screen", [0, 0.36, 0.05], [1.15, 0.52, 0.05], "#22d3ee", "HMI screen"),
        p("box", [0, -0.3, 0], [1.24, 0.5, 0.12], "#1e293b", "control board"),
        ...[-0.45, -0.15, 0.15, 0.45].map((x) => p("box", [x, -0.18, 0.12], [0.18, 0.22, 0.12], color, "I/O block")),
        p("box", [0.48, -0.52, 0.1], [0.28, 0.16, 0.12], muted, "edge gateway")
      ],
      tubes: [tube([[-0.45, -0.18, 0.2], [-0.2, -0.62, 0.32], [0.5, -0.56, 0.18]], "#a78bfa", "I/O harness")]
    },
    "software-hmi": {
      title: "Software HMI package",
      camera: [2.4, 1.35, 3],
      primitives: [
        p("screen", [0, 0.2, 0], [1.28, 0.7, 0.06], "#818cf8", "order queue UI"),
        ...[-0.36, 0, 0.36].map((x, index) => p("box", [x, -0.34, 0.1], [0.26, 0.16, 0.08], ["#22d3ee", "#34d399", "#facc15"][index], "state tile")),
        p("box", [0, -0.62, 0], [1.0, 0.08, 0.12], muted, "service mode")
      ],
      tubes: [tube([[-0.52, -0.55, 0.12], [0, -0.78, 0.28], [0.52, -0.55, 0.12]], "#818cf8", "telemetry loop")]
    },
    prep: {
      title: "Pickup and preparation chamber",
      camera: [2.8, 1.7, 3.2],
      primitives: [
        p("roundedBox", [0, 0, 0], [1.32, 0.86, 0.8], "#1e293b", "prep chamber", 0.35),
        p("box", [0, -0.24, 0.36], [0.72, 0.08, 0.34], metal, "cup shuttle"),
        p("box", [0, 0.36, 0.34], [0.88, 0.08, 0.08], color, "nozzle mount"),
        p("box", [0.5, -0.02, 0.42], [0.08, 0.48, 0.04], "#d1f5ff", "pickup door", 0.35)
      ],
      tubes: [tube([[0, 0.36, 0.45], [0, 0.04, 0.5], [0, -0.3, 0.44]], fluid, "dispense path")]
    },
    waste: {
      title: "Waste drain drawer",
      camera: [2.7, 1.45, 3.1],
      primitives: [
        p("roundedBox", [0, -0.1, 0], [1.4, 0.52, 0.76], "#3f2a24", "sealed tank", 0.82),
        p("box", [0, 0.24, 0.44], [1.15, 0.1, 0.1], color, "drain manifold"),
        p("sphere", [0.54, -0.04, 0.42], [0.08, 0.08, 0.08], "#34d399", "level sensor"),
        p("box", [0, -0.44, 0.05], [1.52, 0.08, 0.86], muted, "drawer rails")
      ],
      tubes: [tube([[-0.52, 0.24, 0.44], [0, 0.34, 0.5], [0.52, 0.24, 0.44]], fluid, "waste inlet")]
    },
    frame: {
      title: "Frame and enclosure skeleton",
      camera: [3, 1.8, 3.6],
      primitives: [
        p("box", [0, -0.78, 0], [1.6, 0.08, 0.78], metal, "base rail"),
        ...[-0.72, 0.72].flatMap((x) => [-0.34, 0.34].map((z) => p("box", [x, 0.02, z], [0.08, 1.58, 0.08], metal, "upright"))),
        ...[-0.66, 0, 0.66].map((y) => p("box", [0, y, 0.42], [1.52, 0.055, 0.08], color, "module datum rail")),
        p("box", [0, 0.78, 0], [1.62, 0.08, 0.78], metal, "top frame")
      ]
    },
    "nozzle-tree": {
      title: "Nozzle tree manifold",
      camera: [2.55, 1.35, 3.1],
      primitives: [
        p("box", [0, 0.18, 0], [1.25, 0.16, 0.18], metal, "manifold bar"),
        ...[-0.45, -0.15, 0.15, 0.45].map((x, index) => p("cylinder", [x, -0.16, 0], [0.045, 0.28, 0.045], ["#f472b6", "#38bdf8", "#facc15", "#34d399"][index], "dispense outlet", 1, [0, 0, 0])),
        p("cylinder", [0.62, -0.12, 0], [0.055, 0.24, 0.055], "#e0f2fe", "rinse nozzle"),
        ...[-0.5, 0, 0.5].map((x) => p("sphere", [x, 0.34, 0.08], [0.07, 0.07, 0.07], color, "quick-connect"))
      ],
      tubes: [tube([[-0.6, 0.34, 0.08], [0, 0.5, 0.16], [0.6, 0.34, 0.08]], fluid, "inlet header")]
    },
    "sensors-actuators": {
      title: "Sensors and actuator harness",
      camera: [2.8, 1.45, 3.2],
      primitives: [
        p("box", [0, 0, 0], [1.28, 0.08, 0.08], "#14b8a6", "harness trunk"),
        ...[-0.5, -0.18, 0.18, 0.5].map((x, index) => p("sphere", [x, 0.32, 0.16], [0.08, 0.08, 0.08], index % 2 ? "#facc15" : "#38bdf8", "sensor node")),
        ...[-0.42, 0, 0.42].map((x) => p("box", [x, -0.32, 0.12], [0.18, 0.16, 0.12], muted, "keyed plug"))
      ],
      tubes: [
        ...[-0.5, -0.18, 0.18, 0.5].map((x) => tube([[x, 0, 0], [x, 0.2, 0.1], [x, 0.32, 0.16]], "#22d3ee", "sensor branch")),
        ...[-0.42, 0, 0.42].map((x) => tube([[x, 0, 0], [x, -0.2, 0.08], [x, -0.32, 0.12]], "#34d399", "actuator branch"))
      ]
    }
  };

  return specs[plan.id] ?? specs[plan.sourceModuleId ?? ""] ?? {
    title: `${plan.name} concept model`,
    camera: [2.8, 1.6, 3.2],
    primitives: [
      p("roundedBox", [0, 0, 0], [1.1, 0.78, 0.72], color, plan.shortName, 0.65),
      p("box", [0, -0.56, 0.38], [1.25, 0.08, 0.18], muted, "mounting rail"),
      p("sphere", [0.45, 0.32, 0.4], [0.08, 0.08, 0.08], "#facc15", "service point")
    ],
    tubes: [tube([[-0.55, 0.18, 0.35], [0, 0.44, 0.46], [0.55, 0.18, 0.35]], color, "connection path")]
  };
}

function p(
  kind: PrimitiveKind,
  position: [number, number, number],
  scale: [number, number, number],
  color: string,
  label?: string,
  opacity = 1,
  rotation?: [number, number, number]
): PrimitiveSpec {
  return { kind, position, scale, color, label, opacity, rotation, metalness: kind === "box" ? 0.28 : 0.18 };
}

function tube(points: [number, number, number][], color: string, label?: string): TubeSpec {
  return { points, color, label };
}
