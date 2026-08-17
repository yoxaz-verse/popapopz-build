import { phases } from "@/data/popapopz";
import { PhaseBadge } from "@/components/ui/status-badge";

export function PhaseTracker() {
  return (
    <section className="panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="technical-label text-accent">Engineering Workflow</p>
          <h2 className="mt-2 text-xl font-semibold">Phase Tracker</h2>
        </div>
        <span className="technical-label text-muted">Assumptions remain visible until validated</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {phases.map((phase) => (
          <article key={phase.id} className="rounded-md border border-border/80 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="technical-label text-muted">Phase {phase.id}</span>
              <PhaseBadge status={phase.status} />
            </div>
            <h3 className="mt-3 min-h-10 text-sm font-semibold">{phase.title}</h3>
            <p className="mt-2 min-h-16 text-xs leading-5 text-muted">{phase.objective}</p>
            <div className="mt-3 h-1.5 rounded bg-white/10">
              <div className="h-1.5 rounded bg-accent" style={{ width: `${phase.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{phase.progress}% complete</p>
          </article>
        ))}
      </div>
    </section>
  );
}
