"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Boxes, Clock3, IndianRupee, Layers3, Search, UsersRound } from "lucide-react";
import { componentBuildPlans } from "@/data/popapopz";
import { EvidenceBadge, PhaseBadge } from "@/components/ui/status-badge";
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

const assemblyOrder = ["frame", "electrical", "refrigeration", "water", "waste", "prep", "nozzle-tree", "flavor", "boba", "cup", "controller", "sensors-actuators", "software-hmi"];

export function ComponentPlanningPage() {
  const [selectedId, setSelectedId] = useState(componentBuildPlans[0]?.id ?? "");
  const [category, setCategory] = useState<"all" | ModuleCategory>("all");
  const [status, setStatus] = useState<"all" | PhaseStatus>("all");
  const [query, setQuery] = useState("");

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

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-[1720px] space-y-4 p-4">
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
          <SummaryCard icon={UsersRound} label="Peak Planning Load" value={`${totals.people} role seats`} />
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

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <AssemblyMap selectedId={selected.id} onSelect={setSelectedId} />
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPlans.map((plan) => (
                <ComponentCard key={plan.id} plan={plan} active={selected.id === plan.id} onSelect={() => setSelectedId(plan.id)} />
              ))}
            </div>
            {filteredPlans.length === 0 ? (
              <div className="panel rounded-lg p-8 text-center text-sm text-muted">No components match the current filters.</div>
            ) : null}
          </div>
          <ComponentDetail plan={selected} />
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

function AssemblyMap({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const orderedPlans = assemblyOrder.map((id) => componentBuildPlans.find((plan) => plan.id === id)).filter(Boolean) as ComponentBuildPlan[];
  return (
    <div className="panel overflow-hidden rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <p className="technical-label text-accent">Modular Assembly Map</p>
          <h2 className="mt-1 text-xl font-semibold">Lego-style build sequence</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-yellow-100">
          <Layers3 className="h-4 w-4" />
          Base first, slide-in modules next
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative min-h-[420px] overflow-hidden rounded-md border border-border/80 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.11),transparent_35%),linear-gradient(180deg,#111827,#0b1120)] p-4">
          <div className="absolute left-1/2 top-8 h-[340px] w-[190px] -translate-x-1/2 rounded-md border border-slate-500/60 bg-slate-300/8" />
          <div className="absolute left-1/2 top-10 h-[330px] w-[150px] -translate-x-1/2 rounded-sm border-x-8 border-slate-500/70 border-b-[18px] border-b-slate-500/80" />
          <div className="relative mx-auto grid h-[370px] max-w-[360px] grid-rows-[52px_56px_78px_70px_64px] gap-2 pt-7">
            <MapRow plans={orderedPlans.filter((plan) => ["controller", "software-hmi"].includes(plan.id))} selectedId={selectedId} onSelect={onSelect} />
            <MapRow plans={orderedPlans.filter((plan) => ["cup", "flavor", "boba"].includes(plan.id))} selectedId={selectedId} onSelect={onSelect} />
            <MapRow plans={orderedPlans.filter((plan) => ["prep", "nozzle-tree"].includes(plan.id))} selectedId={selectedId} onSelect={onSelect} />
            <MapRow plans={orderedPlans.filter((plan) => ["water", "refrigeration", "electrical"].includes(plan.id))} selectedId={selectedId} onSelect={onSelect} />
            <MapRow plans={orderedPlans.filter((plan) => ["waste", "sensors-actuators", "frame"].includes(plan.id))} selectedId={selectedId} onSelect={onSelect} />
          </div>
        </div>
        <ol className="grid content-start gap-2">
          {orderedPlans.map((plan, index) => (
            <li key={plan.id}>
              <button
                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                  selectedId === plan.id ? "border-accent/70 bg-accent/10" : "border-border/80 bg-white/[0.03] hover:bg-white/[0.07]"
                }`}
                onClick={() => onSelect(plan.id)}
                type="button"
              >
                <span className="technical-label w-6 text-muted">{String(index + 1).padStart(2, "0")}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                <span className="min-w-0 truncate">{plan.shortName}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function MapRow({ plans, selectedId, onSelect }: { plans: ComponentBuildPlan[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-2">
      {plans.map((plan) => (
        <button
          className={`relative min-w-0 rounded-md border px-2 py-2 text-xs font-semibold transition ${
            selectedId === plan.id ? "scale-[1.03] border-white text-white shadow-[0_0_24px_rgba(34,211,238,0.28)]" : "border-white/15 text-slate-100 hover:border-white/40"
          }`}
          key={plan.id}
          onClick={() => onSelect(plan.id)}
          style={{ backgroundColor: `${plan.color}33` }}
          type="button"
        >
          <span className="absolute -top-1 left-3 h-2 w-4 rounded-b bg-black/35" />
          <span className="absolute -top-1 right-3 h-2 w-4 rounded-b bg-black/35" />
          <span className="block truncate">{plan.shortName}</span>
        </button>
      ))}
    </div>
  );
}

function ComponentCard({ plan, active, onSelect }: { plan: ComponentBuildPlan; active: boolean; onSelect: () => void }) {
  return (
    <button
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
        <MiniMetric label="Cost" value={`${formatInr(plan.estimatedCostInr.min)}-${formatShortInr(plan.estimatedCostInr.max)}`} />
        <MiniMetric label="Duration" value={plan.buildDuration} />
        <MiniMetric label="People" value={`${sumPeople(plan.peopleNeeded)}`} />
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

function ComponentDetail({ plan }: { plan: ComponentBuildPlan }) {
  return (
    <aside className="panel rounded-lg p-5 xl:sticky xl:top-4">
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
        <MiniMetric label="INR Estimate" value={`${formatInr(plan.estimatedCostInr.min)} - ${formatInr(plan.estimatedCostInr.max)}`} />
        <MiniMetric label="Duration" value={plan.buildDuration} />
        <MiniMetric label="People" value={`${sumPeople(plan.peopleNeeded)} seats`} />
      </div>
      <div className="mt-5 space-y-5">
        <InfoBlock title="Prototype Deliverable" items={[plan.prototypeDeliverable]} />
        <InfoBlock title="Assembly Type" items={[plan.assemblyType]} />
        <PeopleBlock people={plan.peopleNeeded} />
        <InfoBlock title="Dependencies" items={plan.dependencies} />
        <NumberedBlock title="Creation Steps" items={plan.creationSteps} />
        <InfoBlock title="Fitment Notes" items={plan.fitmentNotes} />
      </div>
    </aside>
  );
}

function PeopleBlock({ people }: { people: ComponentBuildPlan["peopleNeeded"] }) {
  return (
    <div>
      <h3 className="technical-label text-muted">People Needed</h3>
      <div className="mt-2 grid gap-2">
        {people.map((item) => (
          <div className="flex items-center justify-between rounded-md border border-border/80 bg-white/[0.03] px-3 py-2 text-sm" key={item.role}>
            <span>{item.role}</span>
            <span className="font-mono text-accent">{item.count}</span>
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
    costMin: plans.reduce((total, plan) => total + plan.estimatedCostInr.min, 0),
    costMax: plans.reduce((total, plan) => total + plan.estimatedCostInr.max, 0),
    people: plans.reduce((max, plan) => Math.max(max, sumPeople(plan.peopleNeeded)), 0),
    longestDuration: plans.reduce((longest, plan) => Math.max(longest, extractMaxWeeks(plan.buildDuration)), 0) + " weeks"
  };
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
