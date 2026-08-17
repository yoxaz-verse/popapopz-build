import type { EvidenceStatus, PhaseStatus } from "@/types/engineering";
import { cn } from "@/lib/utils";

const evidenceStyles: Record<EvidenceStatus, string> = {
  ASSUMPTION: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  PROPOSED: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  "TO VALIDATE": "border-warning/50 bg-warning/15 text-yellow-100",
  CALCULATED: "border-violet-400/40 bg-violet-400/10 text-violet-100",
  "COMPONENT RATED": "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
  "EXPERIMENTALLY VALIDATED": "border-success/50 bg-success/15 text-emerald-100",
  APPROVED: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  FROZEN: "border-blue-300/40 bg-blue-300/10 text-blue-100"
};

const phaseStyles: Record<PhaseStatus, string> = {
  "Not Started": "border-slate-500/40 bg-slate-500/10 text-slate-300",
  "In Progress": "border-accent/40 bg-accent/10 text-cyan-100",
  Review: "border-warning/50 bg-warning/15 text-yellow-100",
  Approved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  Prototype: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100",
  Validated: "border-success/50 bg-success/15 text-emerald-100",
  Frozen: "border-blue-300/40 bg-blue-300/10 text-blue-100"
};

export function EvidenceBadge({ status, className }: { status: EvidenceStatus; className?: string }) {
  return (
    <span className={cn("technical-label inline-flex rounded px-2 py-1 border", evidenceStyles[status], className)}>
      {status}
    </span>
  );
}

export function PhaseBadge({ status, className }: { status: PhaseStatus; className?: string }) {
  return (
    <span className={cn("technical-label inline-flex rounded px-2 py-1 border", phaseStyles[status], className)}>
      {status}
    </span>
  );
}
