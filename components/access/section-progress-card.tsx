"use client";

import { ChangeEvent } from "react";
import { Save } from "lucide-react";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";
import type { DashboardSectionId, SectionProgressStatus } from "@/types/access";

const progressStatuses: SectionProgressStatus[] = ["Not Started", "In Progress", "Review", "Complete", "Blocked"];

export function SectionProgressCard({ sectionId }: { sectionId: DashboardSectionId }) {
  const section = dashboardSections.find((item) => item.id === sectionId);
  const progress = useAccessStore((state) => state.progress[sectionId]);
  const canEdit = useAccessStore((state) => state.canEditSectionProgress(sectionId));
  const updateSectionProgress = useAccessStore((state) => state.updateSectionProgress);

  if (!section || !progress) return null;

  function handlePercentChange(event: ChangeEvent<HTMLInputElement>) {
    void updateSectionProgress(sectionId, {
      ...progress,
      percent: Number(event.target.value)
    });
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    void updateSectionProgress(sectionId, {
      ...progress,
      status: event.target.value as SectionProgressStatus
    });
  }

  function handleNoteChange(event: ChangeEvent<HTMLInputElement>) {
    void updateSectionProgress(sectionId, {
      ...progress,
      note: event.target.value
    });
  }

  return (
    <div className="rounded-md border border-border/80 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="technical-label text-muted">{section.label} progress</p>
          <p className="mt-1 text-sm text-slate-300">{progress.note}</p>
        </div>
        <span className="technical-label rounded border border-accent/40 bg-accent/10 px-2 py-1 text-cyan-100">
          {progress.percent}%
        </span>
      </div>

      <div className="mt-3 h-2 rounded bg-white/10">
        <div className="h-2 rounded bg-accent transition-all" style={{ width: `${progress.percent}%` }} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[160px_180px_minmax(0,1fr)]">
        <label className="block">
          <span className="technical-label text-muted">Percent</span>
          <input
            className="mt-2 w-full accent-cyan-300"
            disabled={!canEdit}
            max={100}
            min={0}
            onChange={handlePercentChange}
            type="range"
            value={progress.percent}
          />
        </label>
        <label className="block">
          <span className="technical-label text-muted">Status</span>
          <select
            className="mt-2 w-full rounded-md border border-border bg-black/30 px-2 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
            disabled={!canEdit}
            onChange={handleStatusChange}
            value={progress.status}
          >
            {progressStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="technical-label text-muted">Update note</span>
          <input
            className="mt-2 w-full rounded-md border border-border bg-black/30 px-2 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
            disabled={!canEdit}
            onChange={handleNoteChange}
            value={progress.note}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          Updated by {progress.updatedBy} on {new Date(progress.updatedAt).toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <Save className="h-3.5 w-3.5" />
          Supabase database
        </span>
      </div>
    </div>
  );
}
