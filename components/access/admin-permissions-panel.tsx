"use client";

import { ShieldCheck } from "lucide-react";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";

export function AdminPermissionsPanel() {
  const session = useAccessStore((state) => state.session);
  const engineers = useAccessStore((state) => state.engineers);
  const selectedEngineerId = useAccessStore((state) => state.selectedEngineerId);
  const permissions = useAccessStore((state) => state.engineerPermissions);
  const setSelectedEngineerId = useAccessStore((state) => state.setSelectedEngineerId);
  const setEngineerPermission = useAccessStore((state) => state.setEngineerPermission);
  const selectedEngineer = engineers.find((engineer) => engineer.id === selectedEngineerId) ?? null;

  if (session?.role !== "admin") return null;

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="technical-label text-accent">Admin Permission Matrix</p>
          <h2 className="mt-2 text-xl font-semibold">
            {selectedEngineer ? `Section access for ${selectedEngineer.email}` : "Engineer section access"}
          </h2>
        </div>
        <ShieldCheck className="h-5 w-5 text-accent" />
      </div>
      <div className="mt-4 max-w-xl">
        <label className="block">
          <span className="technical-label text-muted">Select engineer</span>
          <select
            className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent disabled:opacity-60"
            disabled={engineers.length === 0}
            onChange={(event) => void setSelectedEngineerId(event.target.value)}
            value={selectedEngineerId ?? ""}
          >
            {engineers.length === 0 ? (
              <option value="">No engineer profiles found</option>
            ) : (
              engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.displayName} - {engineer.email}
                </option>
              ))
            )}
          </select>
        </label>
        {engineers.length === 0 ? (
          <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm leading-6 text-yellow-100">
            Create at least one Supabase Auth user with an engineer profile, then run the access migration again.
          </p>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {dashboardSections.map((section) => {
          const permission = permissions[section.id];
          return (
            <label key={section.id} className="flex min-h-32 cursor-pointer flex-col justify-between rounded-md border border-border/80 bg-black/20 p-3">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{section.label}</span>
                  <input
                    checked={permission?.canView ?? false}
                    className="mt-1 h-4 w-4 accent-cyan-300"
                    disabled={!selectedEngineer}
                    onChange={(event) => void setEngineerPermission(section.id, event.target.checked)}
                    type="checkbox"
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{section.description}</p>
              </div>
              <span className="technical-label mt-3 text-muted">{permission?.canView ? "Engineer can edit progress" : "Hidden from engineer"}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
