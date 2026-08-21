"use client";

import { ChangeEvent } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import { useAccessStore } from "@/store/access-store";
import type { WorkAssignmentStatus } from "@/types/access";

const assignmentStatuses: WorkAssignmentStatus[] = ["Assigned", "In Progress", "Review", "Done", "Blocked"];

export function MyAssignmentsPanel() {
  const session = useAccessStore((state) => state.session);
  const assignments = useAccessStore((state) => state.assignments);
  const updateWorkAssignment = useAccessStore((state) => state.updateWorkAssignment);

  if (session?.role !== "engineer") return null;

  function handlePercentChange(assignmentId: string, event: ChangeEvent<HTMLInputElement>) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return;
    void updateWorkAssignment(assignmentId, {
      progressPercent: Number(event.target.value),
      status: assignment.status,
      note: assignment.note
    });
  }

  function handleStatusChange(assignmentId: string, event: ChangeEvent<HTMLSelectElement>) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return;
    void updateWorkAssignment(assignmentId, {
      progressPercent: assignment.progressPercent,
      status: event.target.value as WorkAssignmentStatus,
      note: assignment.note
    });
  }

  function handleNoteChange(assignmentId: string, event: ChangeEvent<HTMLInputElement>) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) return;
    void updateWorkAssignment(assignmentId, {
      progressPercent: assignment.progressPercent,
      status: assignment.status,
      note: event.target.value
    });
  }

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="technical-label text-accent">My Assigned Work</p>
          <h2 className="mt-2 text-xl font-semibold">Specific engineering ownership</h2>
        </div>
        <ClipboardCheck className="h-5 w-5 text-accent" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {assignments.length === 0 ? (
          <p className="rounded-md border border-border/80 bg-black/20 px-3 py-4 text-sm text-muted">
            No specific work has been assigned to your engineer profile yet.
          </p>
        ) : (
          assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-md border border-border/80 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="technical-label text-accent">{assignment.sectionId}</p>
                  <h3 className="mt-1 font-semibold">{assignment.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {assignment.entityType.replaceAll("_", " ")} · {assignment.entityId}
                  </p>
                </div>
                <span className="technical-label rounded border border-accent/40 bg-accent/10 px-2 py-1 text-cyan-100">
                  {assignment.progressPercent}%
                </span>
              </div>

              <div className="mt-3 h-2 rounded bg-white/10">
                <div className="h-2 rounded bg-accent transition-all" style={{ width: `${assignment.progressPercent}%` }} />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[160px_180px_minmax(0,1fr)]">
                <label className="block">
                  <span className="technical-label text-muted">Percent</span>
                  <input
                    className="mt-2 w-full accent-cyan-300"
                    max={100}
                    min={0}
                    onChange={(event) => handlePercentChange(assignment.id, event)}
                    type="range"
                    value={assignment.progressPercent}
                  />
                </label>
                <label className="block">
                  <span className="technical-label text-muted">Status</span>
                  <select
                    className="mt-2 w-full rounded-md border border-border bg-black/30 px-2 py-2 text-sm outline-none focus:border-accent"
                    onChange={(event) => handleStatusChange(assignment.id, event)}
                    value={assignment.status}
                  >
                    {assignmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="technical-label text-muted">Update note</span>
                  <input
                    className="mt-2 w-full rounded-md border border-border bg-black/30 px-2 py-2 text-sm outline-none focus:border-accent"
                    onChange={(event) => handleNoteChange(assignment.id, event)}
                    value={assignment.note}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  Assigned by {assignment.assignedBy} · updated {new Date(assignment.updatedAt).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Save className="h-3.5 w-3.5" />
                  Supabase assignment
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
