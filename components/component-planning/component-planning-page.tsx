"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, Cable, CheckCircle2, Clock3, Cuboid, IndianRupee, Search, UsersRound } from "lucide-react";
import { componentBuildPlans } from "@/data/popapopz";
import { ComponentAssemblySection } from "@/components/component-planning/component-assembly-section";
import { Component3DSection } from "@/components/component-planning/component-3d-section";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";
import { useAccessStore } from "@/store/access-store";
import type { EngineerWorkAssignment, EngineerWorkStaffing } from "@/types/access";
import type { ComponentBuildPlan, ModuleCategory, PhaseStatus } from "@/types/engineering";

const categoryLabels: Record<ModuleCategory, string> = {
  mechanical: "Mechanical",
  fluid: "Fluid",
  electrical: "Electrical",
  refrigeration: "Refrigeration",
  control: "Control",
  "food-contact": "Food Contact",
  safety: "Safety"
};

export function ComponentPlanningPage() {
  const [selectedId, setSelectedId] = useState(componentBuildPlans[0]?.id ?? "");
  const [category, setCategory] = useState<"all" | ModuleCategory>("all");
  const [status, setStatus] = useState<"all" | PhaseStatus>("all");
  const [query, setQuery] = useState("");
  const initialize = useAccessStore((state) => state.initialize);
  const authChecked = useAccessStore((state) => state.authChecked);
  const assignments = useAccessStore((state) => state.assignments);
  const staffing = useAccessStore((state) => state.staffing);

  useEffect(() => {
    if (!authChecked) void initialize();
  }, [authChecked, initialize]);

  useEffect(() => {
    function syncSelectedFromHash() {
      const hashId = window.location.hash.replace("#component-", "");
      if (hashId && componentBuildPlans.some((plan) => plan.id === hashId)) {
        setSelectedId(hashId);
      }
    }

    syncSelectedFromHash();
    window.addEventListener("hashchange", syncSelectedFromHash);
    return () => window.removeEventListener("hashchange", syncSelectedFromHash);
  }, []);

  const categories = useMemo(() => unique(componentBuildPlans.map((item) => item.category)), []);
  const statuses = useMemo(() => unique(componentBuildPlans.map((item) => item.status)), []);

  const filteredPlans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return componentBuildPlans.filter((plan) => {
      const matchesCategory = category === "all" || plan.category === category;
      const matchesStatus = status === "all" || plan.status === status;
      const haystack = [plan.name, plan.shortName, plan.purpose, plan.assemblyType, plan.prototypeDeliverable].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesCategory && matchesStatus && matchesQuery;
    });
  }, [category, query, status]);

  const selected = componentBuildPlans.find((plan) => plan.id === selectedId) ?? filteredPlans[0] ?? componentBuildPlans[0];
  const totals = useMemo(() => summarize(componentBuildPlans), []);
  const componentAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.entityType === "component_build_plan" || assignment.entityType === "machine_module"),
    [assignments]
  );
  const componentStaffing = useMemo(
    () => staffing.filter((item) => item.entityType === "component_build_plan" || item.entityType === "machine_module"),
    [staffing]
  );

  function selectPlan(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `/components#component-${id}`);
    window.setTimeout(() => document.getElementById("component-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-[2100px] space-y-4 p-4 2xl:px-6">
        <header className="panel rounded-lg p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="technical-label text-accent">POPAPOPZ Component Build Plan</p>
              <h1 className="mt-2 text-2xl font-semibold">Component-wise distribution, cost, duration, and manpower</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Prototype planning estimates in INR. Values are rough assumptions until supplier quotes, fabrication drawings, and bench tests are locked.
              </p>
            </div>
            <Link className="inline-flex items-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm hover:bg-white/[0.08]" href="/">
              <ArrowLeft className="h-4 w-4" />
              Machine Studio
            </Link>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <SummaryCard icon={IndianRupee} label="Prototype Cost Range" value={`${formatInr(totals.costMin)} - ${formatInr(totals.costMax)}`} />
          <SummaryCard icon={Clock3} label="Longest Single Build" value={totals.longestDuration} />
          <SummaryCard icon={UsersRound} label="Staffing Filled" value={`${componentStaffing.length} / ${totals.people} seats`} />
          <SummaryCard icon={Boxes} label="Component Blocks" value={`${componentBuildPlans.length} modules`} />
        </section>

        <section className="panel rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="w-full rounded-md border border-border bg-black/20 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-accent/70"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search components"
                value={query}
              />
            </label>
            <SelectFilter label="Category" value={category} onChange={(value) => setCategory(value as "all" | ModuleCategory)}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {categoryLabels[item]}
                </option>
              ))}
            </SelectFilter>
            <SelectFilter label="Status" value={status} onChange={(value) => setStatus(value as "all" | PhaseStatus)}>
              <option value="all">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectFilter>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_560px] 2xl:grid-cols-[minmax(0,1fr)_640px]">
          <div className="space-y-4">
            <ComponentAssemblySection selectedId={selected.id} onSelect={selectPlan} />
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {filteredPlans.map((plan) => (
                <ComponentCard
                  key={plan.id}
                  plan={plan}
                  active={selected.id === plan.id}
                  assignment={componentAssignments.find((assignment) => assignment.entityId === plan.id)}
                  staffingCount={staffingForPlan(componentStaffing, plan).length}
                  onSelect={() => selectPlan(plan.id)}
                />
              ))}
            </div>
            {filteredPlans.length === 0 ? (
              <div className="panel rounded-lg p-8 text-center text-sm text-muted">No components match the current filters.</div>
            ) : null}
          </div>
          <ComponentDetail plan={selected} assignment={componentAssignments.find((assignment) => assignment.entityId === selected.id)} staffing={staffingForPlan(componentStaffing, selected)} />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="panel min-w-0 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="technical-label text-muted">{label}</p>
          <p className="mt-1 truncate text-lg font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2">
      <span className="technical-label text-muted">{label}</span>
      <select className="rounded-md border border-border bg-slate-950 px-3 py-2 text-sm outline-none focus:border-accent/70" onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </select>
    </label>
  );
}

function ComponentCard({
  plan,
  active,
  assignment,
  staffingCount,
  onSelect
}: {
  plan: ComponentBuildPlan;
  active: boolean;
  assignment?: EngineerWorkAssignment;
  staffingCount: number;
  onSelect: () => void;
}) {
  const requiredSeats = sumPeople(plan.peopleNeeded);
  const total = costTotal(plan);
  return (
    <button
      id={`component-${plan.id}`}
      className={`min-w-0 rounded-lg border p-4 text-left transition ${
        active ? "border-accent/70 bg-accent/[0.06]" : "border-border/80 bg-white/[0.03] hover:bg-white/[0.07]"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="technical-label text-muted">{categoryLabels[plan.category]}</p>
          <h3 className="mt-1 truncate text-lg font-semibold">{plan.name}</h3>
        </div>
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: plan.color }} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{plan.purpose}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Cost" value={`${formatInr(total.min)}-${formatShortInr(total.max)}`} />
        <MiniMetric label="Duration" value={plan.buildDuration} />
        <MiniMetric label="People" value={`${staffingCount}/${requiredSeats}`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">Owner: {assignment?.engineerEmail ?? "Unassigned"}</span>
        <span className="inline-flex items-center gap-1">
          <Cuboid className="h-3.5 w-3.5 text-accent" />
          3D model · {plan.subComponents?.length ?? 0} parts
        </span>
      </div>
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-black/20 p-2">
      <p className="technical-label text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function ComponentDetail({ plan, assignment, staffing }: { plan: ComponentBuildPlan; assignment?: EngineerWorkAssignment; staffing: EngineerWorkStaffing[] }) {
  const total = costTotal(plan);
  const requiredSeats = sumPeople(plan.peopleNeeded);
  return (
    <aside id="component-detail" className="panel rounded-lg p-5 xl:sticky xl:top-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="technical-label text-accent">Selected Component</p>
          <h2 className="mt-2 text-xl font-semibold">{plan.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <PhaseBadge status={plan.status} />
          <EvidenceBadge status={plan.evidence} />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <MiniMetric label="INR Estimate" value={`${formatInr(total.min)} - ${formatInr(total.max)}`} />
        <MiniMetric label="Duration" value={plan.buildDuration} />
        <MiniMetric label="People" value={`${staffing.length} / ${requiredSeats} assigned`} />
      </div>
      <div className="mt-5 space-y-5">
        <Component3DSection plan={plan} />
        <OwnerBlock assignment={assignment} />
        <StaffingBlock plan={plan} staffing={staffing} />
        <CostBreakdown plan={plan} />
        <ConnectionBlock plan={plan} />
        <BuildStructureBlock plan={plan} />
        <InfoBlock title="Sub-components" items={plan.subComponents ?? []} />
        <InfoBlock title="Prototype Deliverable" items={[plan.prototypeDeliverable]} />
        <InfoBlock title="Assembly Type" items={[plan.assemblyType]} />
        <InfoBlock title="Dependencies" items={plan.dependencies} />
        <InfoBlock title="Materials" items={plan.materials ?? []} />
        <InfoBlock title="Tools" items={plan.tools ?? []} />
        <InfoBlock title="Risks" items={plan.risks ?? []} />
        <InfoBlock title="Validation Checks" items={plan.validationChecks ?? []} />
        <InfoBlock title="Fitment Notes" items={plan.fitmentNotes} />
      </div>
    </aside>
  );
}

function OwnerBlock({ assignment }: { assignment?: EngineerWorkAssignment }) {
  return (
    <div className="rounded-md border border-border/80 bg-white/[0.03] p-3">
      <h3 className="technical-label text-muted">Responsible Owner</h3>
      <p className="mt-2 text-sm font-semibold">{assignment?.engineerEmail ?? "No owner assigned yet"}</p>
      <p className="mt-1 text-xs text-muted">{assignment ? `${assignment.status} · ${assignment.progressPercent}% complete` : "Assign an engineer from the admin dashboard."}</p>
    </div>
  );
}

function StaffingBlock({ plan, staffing }: { plan: ComponentBuildPlan; staffing: EngineerWorkStaffing[] }) {
  return (
    <div>
      <h3 className="technical-label text-muted">People Assigned / Needed</h3>
      <div className="mt-2 grid gap-2">
        {plan.peopleNeeded.map((item) => {
          const assigned = staffing.filter((staff) => staff.roleName === item.role);
          return (
          <div className="flex items-center justify-between rounded-md border border-border/80 bg-white/[0.03] px-3 py-2 text-sm" key={item.role}>
            <div className="min-w-0">
              <span>{item.role}</span>
              <p className="mt-1 truncate text-xs text-muted">{assigned.map((staff) => staff.engineerEmail).join(", ") || "No engineer assigned"}</p>
            </div>
            <span className={`font-mono ${assigned.length >= item.count ? "text-success" : "text-accent"}`}>
              {assigned.length}/{item.count}
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function CostBreakdown({ plan }: { plan: ComponentBuildPlan }) {
  const rows = plan.costItems ?? [];
  const total = costTotal(plan);

  return (
    <div>
      <h3 className="technical-label text-muted">Specific Cost Breakdown</h3>
      <div className="mt-2 overflow-hidden rounded-md border border-border/80">
        <table className="w-full text-left text-xs">
          <thead className="technical-label bg-white/[0.04] text-muted">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Range</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-border/70" key={`${row.label}-${row.category}`}>
                <td className="px-3 py-2">
                  <p className="font-medium text-slate-100">{row.label}</p>
                  <p className="mt-1 text-muted">{row.category} · {row.notes}</p>
                </td>
                <td className="px-3 py-2 font-mono text-muted">{row.quantity}</td>
                <td className="px-3 py-2 font-mono text-accent">
                  {formatInr(row.unitCostInr.min * row.quantity)} - {formatInr(row.unitCostInr.max * row.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-accent/30 bg-accent/10">
              <td className="px-3 py-2 font-semibold" colSpan={2}>Calculated total</td>
              <td className="px-3 py-2 font-mono text-cyan-100">{formatInr(total.min)} - {formatInr(total.max)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ConnectionBlock({ plan }: { plan: ComponentBuildPlan }) {
  return (
    <div>
      <h3 className="technical-label text-muted">How This Connects</h3>
      <div className="mt-2 grid gap-2">
        {(plan.connections ?? []).map((connection) => (
          <div className="rounded-md border border-border/80 bg-white/[0.03] p-3 text-sm" key={`${connection.type}-${connection.connectsTo}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-medium">
                <Cable className="h-4 w-4 text-accent" />
                {connection.connectsTo}
              </span>
              <span className="technical-label text-muted">{connection.type}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{connection.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildStructureBlock({ plan }: { plan: ComponentBuildPlan }) {
  const structure = plan.buildStructure;
  if (!structure) return <NumberedBlock title="Creation Steps" items={plan.creationSteps} />;

  const groups = [
    ["Preparation", structure.preparation],
    ["Fabrication / Procurement", structure.fabricationProcurement],
    ["Assembly", structure.assembly],
    ["Integration", structure.integration],
    ["Validation", structure.validation]
  ] as const;

  return (
    <div>
      <h3 className="technical-label text-muted">Build Structure</h3>
      <div className="mt-2 grid gap-2">
        {groups.map(([label, items], index) => (
          <div className="rounded-md border border-border/80 bg-white/[0.03] p-3" key={label}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-black/30 font-mono text-[11px] text-accent">{index + 1}</span>
              <p className="text-sm font-semibold">{label}</p>
            </div>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
              {items.map((item) => (
                <li className="flex gap-2" key={item}>
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="technical-label text-muted">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-200">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberedBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="technical-label text-muted">{title}</h3>
      <ol className="mt-2 space-y-2 text-sm text-slate-200">
        {items.map((item, index) => (
          <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2" key={item}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/40 bg-black/30 font-mono text-[11px] text-accent">{index + 1}</span>
            <span className="leading-6">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function summarize(plans: ComponentBuildPlan[]) {
  return {
    costMin: plans.reduce((total, plan) => total + costTotal(plan).min, 0),
    costMax: plans.reduce((total, plan) => total + costTotal(plan).max, 0),
    people: plans.reduce((total, plan) => total + sumPeople(plan.peopleNeeded), 0),
    longestDuration: plans.reduce((longest, plan) => Math.max(longest, extractMaxWeeks(plan.buildDuration)), 0) + " weeks"
  };
}

function staffingForPlan(staffing: EngineerWorkStaffing[], plan: ComponentBuildPlan) {
  return staffing.filter((item) => item.entityId === plan.id || item.entityId === plan.sourceModuleId);
}

function costTotal(plan: ComponentBuildPlan) {
  if (!plan.costItems?.length) return plan.estimatedCostInr;
  return plan.costItems.reduce(
    (total, item) => ({
      min: total.min + item.unitCostInr.min * item.quantity,
      max: total.max + item.unitCostInr.max * item.quantity
    }),
    { min: 0, max: 0 }
  );
}

function sumPeople(people: ComponentBuildPlan["peopleNeeded"]) {
  return people.reduce((total, item) => total + item.count, 0);
}

function extractMaxWeeks(duration: string) {
  const matches = duration.match(/\d+/g)?.map(Number) ?? [0];
  return Math.max(...matches);
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0, style: "currency", currency: "INR" }).format(value);
}

function formatShortInr(value: number) {
  if (value >= 100000) return `${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}
