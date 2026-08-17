import { decisions, machine, phases } from "@/data/popapopz";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";
import { AlertTriangle, CheckCircle2, GitBranch, TimerReset } from "lucide-react";

export function ProjectDashboard() {
  const openDecisions = decisions.filter((decision) => decision.status === "Open").length;
  const criticalRisks = decisions.filter((decision) => decision.reliabilityImpact === "High" || decision.foodSafetyImpact === "High").length;
  const overallCompletion = Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length);
  const currentPhase = phases[0];

  return (
    <section id="product-requirements" className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="panel rounded-lg p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="technical-label text-accent">POPAPOPZ</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">Smart Beverage Dispensing System</h2>
            <p className="mt-1 text-sm text-muted">Engineering Development Studio</p>
          </div>
          <PhaseBadge status={currentPhase.status} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={GitBranch} label="Current Phase" value={`Phase ${currentPhase.id}`} detail={currentPhase.title} />
          <MetricCard icon={CheckCircle2} label="Completion" value={`${overallCompletion}%`} detail="Foundation estimate" />
          <MetricCard icon={AlertTriangle} label="Open Decisions" value={`${openDecisions}`} detail="Require validation" />
          <MetricCard icon={TimerReset} label="Prototype" value="P0" detail="In Development" />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Overall engineering progress</span>
            <span>{overallCompletion}%</span>
          </div>
          <div className="h-2 rounded bg-white/10">
            <div className="h-2 rounded bg-accent" style={{ width: `${overallCompletion}%` }} />
          </div>
        </div>
      </div>

      <div className="panel rounded-lg p-5">
        <p className="technical-label text-warning">TARGET - NOT YET VALIDATED</p>
        <div className="mt-4 grid gap-3">
          {machine.targets.map((target) => (
            <div key={target.label} className="rounded-md border border-border/80 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">{target.label}</span>
                <EvidenceBadge status={target.status} />
              </div>
              <div className="mt-2 text-lg font-semibold">{target.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-white/[0.03] p-3">
      <Icon className="h-4 w-4 text-accent" />
      <p className="technical-label mt-3 text-muted">{label}</p>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
