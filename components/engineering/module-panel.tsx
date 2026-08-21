"use client";

import { modules } from "@/data/popapopz";
import { useStudioStore } from "@/store/studio-store";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";

export function ModulePanel() {
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const selected = modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  const engineeringGroupCandidates: [string, string[]][] = [
    ["Fluid Circuits", selected.fluidCircuits ?? []],
    ["Waste Streams", selected.wasteStreams ?? []],
    ["Validation Metrics", selected.validationMetrics ?? []],
    ["Engineering Risks", selected.engineeringRisks ?? []]
  ];
  const engineeringGroups = engineeringGroupCandidates.filter(([, items]) => items.length > 0);

  return (
    <aside className="panel rounded-lg p-5 xl:sticky xl:top-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="technical-label text-accent">Selected Module</p>
          <h2 className="mt-2 text-xl font-semibold">{selected.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <PhaseBadge status={selected.status} />
          <EvidenceBadge status={selected.evidence} />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <InfoBlock title="Purpose" items={[selected.purpose]} />
        <InfoBlock title="Current Architecture" items={[selected.architecture]} />
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {selected.channels ? <SmallFact label="Channels" value={selected.channels} /> : null}
          {selected.portionRange ? <SmallFact label="Portion Range" value={selected.portionRange} /> : null}
          {selected.targetAccuracy ? <SmallFact label="Target Accuracy" value={selected.targetAccuracy} /> : null}
          {selected.zone ? <SmallFact label="Machine Zone" value={selected.zone} /> : null}
          {selected.heightMm ? <SmallFact label="Ergonomic Height" value={selected.heightMm} /> : null}
          {selected.diameterMm ? <SmallFact label="Diameter Basis" value={selected.diameterMm} /> : null}
        </div>
        {selected.serviceAccess ? <InfoBlock title="Service Access" items={[selected.serviceAccess]} /> : null}
        {selected.validationNotes ? <InfoBlock title="Validation Notes" items={selected.validationNotes} /> : null}
        {selected.handlingSequence ? <SequenceBlock title="Handling Sequence" items={selected.handlingSequence} /> : null}
        {engineeringGroups.length > 0 ? <InfoGrid groups={engineeringGroups} /> : null}
        <InfoGrid
          groups={[
            ["Inputs", selected.inputs],
            ["Outputs", selected.outputs],
            ["Sensors", selected.sensors],
            ["Actuators", selected.actuators],
            ["Safety", selected.safety],
            ["Cleaning", selected.cleaning],
            ["Maintenance", selected.maintenance],
            ["Open Decisions", selected.openDecisions]
          ]}
        />
      </div>
    </aside>
  );
}

function SequenceBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-accent/30 bg-accent/[0.04] p-3">
      <h3 className="technical-label text-accent">{title}</h3>
      <ol className="mt-3 space-y-2.5 text-sm text-slate-100">
        {items.map((item, index) => (
          <li key={item} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-black/30 font-mono text-[11px] text-accent">
              {index + 1}
            </span>
            <span className="min-w-0 leading-6">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SmallFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border/80 bg-black/20 p-3">
      <p className="technical-label text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug">{value}</p>
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="technical-label text-muted">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function InfoGrid({ groups }: { groups: [string, string[]][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {groups.map(([title, items]) => (
        <div key={title} className="min-w-0 rounded-md border border-border/80 bg-white/[0.03] p-3">
          <h3 className="technical-label text-muted">{title}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
            {items.map((item) => (
              <li key={item} className="flex min-w-0 gap-2 leading-6">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
