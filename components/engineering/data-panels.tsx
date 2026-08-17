import { bomItems, decisions, prototypeStages, requirements } from "@/data/popapopz";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";
import { ClipboardCheck, Factory, Search } from "lucide-react";

export function RequirementsPanel() {
  return (
    <section id="requirements-page" className="panel rounded-lg p-5">
      <PanelHeader eyebrow="Requirements Database" title="Engineering Requirements" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="technical-label border-b border-border text-muted">
            <tr>
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Area</th>
              <th className="py-3 pr-4">Statement</th>
              <th className="py-3 pr-4">Priority</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Owner</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement) => (
              <tr key={requirement.id} className="border-b border-border/60">
                <td className="py-3 pr-4 font-mono text-xs text-accent">{requirement.id}</td>
                <td className="py-3 pr-4">{requirement.area}</td>
                <td className="py-3 pr-4 text-slate-300">{requirement.statement}</td>
                <td className="py-3 pr-4">{requirement.priority}</td>
                <td className="py-3 pr-4"><EvidenceBadge status={requirement.status} /></td>
                <td className="py-3">{requirement.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DecisionPanel() {
  return (
    <section id="engineering-decision-page" className="panel rounded-lg p-5">
      <PanelHeader eyebrow="Engineering Decision System" title="Open Design Decisions" />
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {decisions.map((decision) => (
          <article key={decision.id} className="rounded-md border border-border/80 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-accent">{decision.id}</p>
                <h3 className="mt-2 font-semibold">{decision.title}</h3>
              </div>
              <span className="technical-label rounded border border-warning/40 bg-warning/10 px-2 py-1 text-yellow-100">{decision.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{decision.problem}</p>
            <div className="mt-3">
              <p className="technical-label text-muted">Options</p>
              <p className="mt-1 text-sm text-slate-300">{decision.options.join(" / ")}</p>
            </div>
            <div className="mt-3 rounded border border-white/10 bg-white/[0.03] p-3">
              <p className="technical-label text-muted">Recommendation</p>
              <p className="mt-1 text-sm font-medium">{decision.recommendation}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{decision.reason}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BomPanel() {
  return (
    <section id="bom" className="panel rounded-lg p-5">
      <PanelHeader eyebrow="BOM System" title="Bill of Materials" action="Search / filter / export hooks ready" />
      <div className="mt-4 flex max-w-sm items-center gap-2 rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-muted">
        <Search className="h-4 w-4" />
        Static search placeholder
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="technical-label border-b border-border text-muted">
            <tr>
              <th className="py-3 pr-4">Part Number</th>
              <th className="py-3 pr-4">Component</th>
              <th className="py-3 pr-4">Subsystem</th>
              <th className="py-3 pr-4">Specification</th>
              <th className="py-3 pr-4">Qty</th>
              <th className="py-3 pr-4">Criticality</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((item) => (
              <tr key={item.partNumber} className="border-b border-border/60">
                <td className="py-3 pr-4 font-mono text-xs text-accent">{item.partNumber}</td>
                <td className="py-3 pr-4">{item.component}</td>
                <td className="py-3 pr-4">{item.subsystem}</td>
                <td className="py-3 pr-4 text-slate-300">{item.specification}</td>
                <td className="py-3 pr-4">{item.quantity}</td>
                <td className="py-3 pr-4">{item.criticality}</td>
                <td className="py-3"><EvidenceBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PrototypePanel() {
  return (
    <section id="prototype-development" className="panel rounded-lg p-5">
      <PanelHeader eyebrow="Prototype Development Tracker" title="P0 to Commercial Prototype" />
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {prototypeStages.map((stage) => (
          <article key={stage.id} className="rounded-md border border-border/80 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-accent">{stage.id}</p>
                <h3 className="mt-2 font-semibold">{stage.title}</h3>
              </div>
              <PhaseBadge status={stage.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{stage.objective}</p>
            <MiniList title="Required Features" items={stage.requiredFeatures} />
            <MiniList title="Exit Criteria" items={stage.exitCriteria} />
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="technical-label text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      </div>
      {action ? <span className="technical-label text-muted">{action}</span> : null}
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="technical-label text-muted">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ManufacturingNote() {
  return (
    <section id="manufacturing" className="panel rounded-lg p-5">
      <div className="flex items-center gap-3">
        <Factory className="h-5 w-5 text-accent" />
        <div>
          <p className="technical-label text-muted">Next Manufacturing Layer</p>
          <h2 className="text-lg font-semibold">Frame, sheet metal, food-contact assembly, calibration, safety testing.</h2>
        </div>
      </div>
    </section>
  );
}
