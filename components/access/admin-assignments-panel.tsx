"use client";

import { useMemo, useState } from "react";
import { ClipboardList, UserPlus, UserRoundCheck, X } from "lucide-react";
import { assignableWorkItems, getComponentWorkPlan } from "@/lib/access/assignable-work";
import { useAccessStore } from "@/store/access-store";
import type { AssignmentEntityType } from "@/types/access";

function workItemValue(entityType: AssignmentEntityType, entityId: string) {
  return `${entityType}::${entityId}`;
}

function parseWorkItemValue(value: string) {
  const [entityType, entityId] = value.split("::") as [AssignmentEntityType, string];
  return { entityType, entityId };
}

export function AdminAssignmentsPanel() {
  const session = useAccessStore((state) => state.session);
  const engineers = useAccessStore((state) => state.engineers);
  const assignments = useAccessStore((state) => state.assignments);
  const staffing = useAccessStore((state) => state.staffing);
  const selectedEngineerId = useAccessStore((state) => state.selectedEngineerId);
  const assignWorkItem = useAccessStore((state) => state.assignWorkItem);
  const unassignWorkItem = useAccessStore((state) => state.unassignWorkItem);
  const assignStaffingSeat = useAccessStore((state) => state.assignStaffingSeat);
  const removeStaffingSeat = useAccessStore((state) => state.removeStaffingSeat);
  const [engineerId, setEngineerId] = useState(selectedEngineerId ?? "");
  const [staffingEngineerId, setStaffingEngineerId] = useState(selectedEngineerId ?? "");
  const [roleName, setRoleName] = useState("");
  const [workItemSelection, setWorkItemSelection] = useState(() =>
    assignableWorkItems[0] ? workItemValue(assignableWorkItems[0].entityType, assignableWorkItems[0].entityId) : ""
  );

  const assignmentsByItem = useMemo(
    () => new Map(assignments.map((assignment) => [workItemValue(assignment.entityType, assignment.entityId), assignment])),
    [assignments]
  );

  const selectedWorkItem = useMemo(() => {
    if (!workItemSelection) return null;
    const { entityType, entityId } = parseWorkItemValue(workItemSelection);
    return getComponentWorkPlan(entityType, entityId);
  }, [workItemSelection]);

  const groupedWorkItems = useMemo(() => {
    return assignableWorkItems.reduce(
      (acc, workItem) => {
        acc[workItem.groupLabel] = [...(acc[workItem.groupLabel] ?? []), workItem];
        return acc;
      },
      {} as Record<string, typeof assignableWorkItems>
    );
  }, []);

  if (session?.role !== "admin") return null;

  function handleAssign() {
    const targetEngineerId = engineerId || selectedEngineerId || engineers[0]?.id || "";
    const { entityType, entityId } = parseWorkItemValue(workItemSelection);
    void assignWorkItem({ engineerId: targetEngineerId, entityType, entityId });
  }

  function handleAssignStaffing() {
    const targetEngineerId = staffingEngineerId || selectedEngineerId || engineers[0]?.id || "";
    const { entityType, entityId } = parseWorkItemValue(workItemSelection);
    const nextRoleName = roleName || selectedWorkItem?.peopleNeeded[0]?.role || "";
    void assignStaffingSeat({ engineerId: targetEngineerId, entityType, entityId, roleName: nextRoleName });
  }

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="technical-label text-accent">Admin Work Assignment</p>
          <h2 className="mt-2 text-xl font-semibold">Assign specific engineering work</h2>
        </div>
        <ClipboardList className="h-5 w-5 text-accent" />
      </div>

      {engineers.length === 0 ? (
        <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm leading-6 text-yellow-100">
          Create engineer Auth users and profiles before assigning specific work.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,320px)_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="technical-label text-muted">Engineer owner</span>
            <select
              className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
              onChange={(event) => setEngineerId(event.target.value)}
              value={engineerId || selectedEngineerId || engineers[0]?.id || ""}
            >
              {engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.displayName} - {engineer.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="technical-label text-muted">Specific work item</span>
            <select
              className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
              onChange={(event) => setWorkItemSelection(event.target.value)}
              value={workItemSelection}
            >
              {Object.entries(groupedWorkItems).map(([groupLabel, workItems]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {workItems.map((workItem) => {
                    const value = workItemValue(workItem.entityType, workItem.entityId);
                    const assignment = assignmentsByItem.get(value);
                    return (
                      <option key={value} value={value}>
                        {workItem.title} {assignment ? `- owned by ${assignment.engineerEmail}` : ""}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 self-end rounded-md border border-accent/60 bg-accent/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-accent/25 disabled:opacity-60"
            disabled={!workItemSelection || engineers.length === 0}
            onClick={handleAssign}
            type="button"
          >
            <UserRoundCheck className="h-4 w-4" />
            Assign / Reassign
          </button>
        </div>
      )}

      {selectedWorkItem && engineers.length > 0 ? (
        <div className="mt-4 rounded-md border border-border/80 bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="technical-label text-muted">Role seat staffing</p>
              <h3 className="mt-1 font-semibold">{selectedWorkItem.name}</h3>
            </div>
            <span className="technical-label rounded border border-accent/40 bg-accent/10 px-2 py-1 text-cyan-100">
              {staffingForItem(staffing, selectedWorkItem.id).length} / {selectedWorkItem.peopleNeeded.reduce((total, item) => total + item.count, 0)} seats
            </span>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(180px,260px)_minmax(160px,220px)_auto]">
            <label className="block">
              <span className="technical-label text-muted">Engineer</span>
              <select
                className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
                onChange={(event) => setStaffingEngineerId(event.target.value)}
                value={staffingEngineerId || selectedEngineerId || engineers[0]?.id || ""}
              >
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.displayName} - {engineer.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="technical-label text-muted">Role seat</span>
              <select
                className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
                onChange={(event) => setRoleName(event.target.value)}
                value={roleName || selectedWorkItem.peopleNeeded[0]?.role || ""}
              >
                {selectedWorkItem.peopleNeeded.map((role) => {
                  const filled = staffingForItem(staffing, selectedWorkItem.id).filter((item) => item.roleName === role.role).length;
                  return (
                    <option key={role.role} value={role.role}>
                      {role.role} - {filled}/{role.count}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 self-end rounded-md border border-border bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition hover:border-accent hover:text-white"
              onClick={handleAssignStaffing}
              type="button"
            >
              <UserPlus className="h-4 w-4" />
              Fill Seat
            </button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {selectedWorkItem.peopleNeeded.map((role) => {
              const assigned = staffingForItem(staffing, selectedWorkItem.id).filter((item) => item.roleName === role.role);
              return (
                <div className="rounded-md border border-border/70 bg-white/[0.03] p-3" key={role.role}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{role.role}</span>
                    <span className="font-mono text-xs text-accent">{assigned.length}/{role.count}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {assigned.length === 0 ? <p className="text-xs text-muted">No engineer assigned.</p> : null}
                    {assigned.map((item) => (
                      <div className="flex items-center justify-between gap-2 rounded border border-border/60 bg-black/20 px-2 py-1 text-xs" key={item.id}>
                        <span className="truncate">{item.engineerEmail}</span>
                        <button
                          aria-label={`Remove ${item.engineerEmail} from ${role.role}`}
                          className="text-muted transition hover:text-red-100"
                          onClick={() => void removeStaffingSeat(item.id)}
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {assignments.length === 0 ? (
          <p className="rounded-md border border-border/80 bg-black/20 px-3 py-4 text-sm text-muted">No specific work has been assigned yet.</p>
        ) : (
          assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-md border border-border/80 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="technical-label text-accent">{assignment.sectionId.replace("-", " ")}</p>
                  <h3 className="mt-1 font-semibold">{assignment.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {assignment.entityType.replaceAll("_", " ")} · {assignment.entityId}
                  </p>
                </div>
                <button
                  aria-label={`Unassign ${assignment.title}`}
                  className="rounded border border-border bg-black/30 p-2 text-muted transition hover:border-danger hover:text-red-100"
                  onClick={() => void unassignWorkItem(assignment.entityType, assignment.entityId)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 h-2 rounded bg-white/10">
                <div className="h-2 rounded bg-accent" style={{ width: `${assignment.progressPercent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>Owner: {assignment.engineerEmail}</span>
                <span>
                  {assignment.status} · {assignment.progressPercent}% · {staffingForItem(staffing, assignment.entityId).length} staff
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function staffingForItem(staffing: ReturnType<typeof useAccessStore.getState>["staffing"], entityId: string) {
  return staffing.filter((item) => item.entityId === entityId);
}
