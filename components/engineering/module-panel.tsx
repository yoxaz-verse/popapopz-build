"use client";

import { modules } from "@/data/popapopz";
import { useStudioStore } from "@/store/studio-store";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";

export function ModulePanel() {
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const selected = modules.find((module) => module.id === selectedModuleId) ?? modules[0];

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
        <div className="grid gap-3 sm:grid-cols-3">
          {selected.channels ? <SmallFact label="Channels" value={selected.channels} /> : null}
          {selected.portionRange ? <SmallFact label="Portion Range" value={selected.portionRange} /> : null}
          {selected.targetAccuracy ? <SmallFact label="Target Accuracy" value={selected.targetAccuracy} /> : null}
        </div>
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

function SmallFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-black/20 p-3">
      <p className="technical-label text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
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
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map(([title, items]) => (
        <div key={title} className="rounded-md border border-border/80 bg-white/[0.03] p-3">
          <h3 className="technical-label text-muted">{title}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
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
