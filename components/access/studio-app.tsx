"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ArchitectureDiagram } from "@/components/diagrams/architecture-diagram";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { AdminAssignmentsPanel } from "@/components/access/admin-assignments-panel";
import { AdminPermissionsPanel } from "@/components/access/admin-permissions-panel";
import { MyAssignmentsPanel } from "@/components/access/my-assignments-panel";
import { SectionGate } from "@/components/access/section-gate";
import { BomPanel, DecisionPanel, ManufacturingNote, PrototypePanel, RequirementsPanel } from "@/components/engineering/data-panels";
import { ModulePanel } from "@/components/engineering/module-panel";
import { PhaseTracker } from "@/components/engineering/phase-tracker";
import { Sidebar } from "@/components/engineering/sidebar";
import { MachineSection } from "@/components/machine/machine-section";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";

export function StudioApp() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const session = useAccessStore((state) => state.session);
  const logout = useAccessStore((state) => state.logout);
  const initialize = useAccessStore((state) => state.initialize);
  const loading = useAccessStore((state) => state.loading);
  const authChecked = useAccessStore((state) => state.authChecked);
  const error = useAccessStore((state) => state.error);
  const engineerPermissions = useAccessStore((state) => state.engineerPermissions);
  const progress = useAccessStore((state) => state.progress);

  useEffect(() => {
    setMounted(true);
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && authChecked && !loading && !session && !error) {
      router.replace("/login/engineer");
    }
  }, [authChecked, error, loading, mounted, router, session]);

  const visibleSectionIds = useMemo(() => {
    if (!session) return [];
    if (session.role === "admin") return dashboardSections.map((section) => section.id);
    return dashboardSections.filter((section) => engineerPermissions[section.id]?.canView).map((section) => section.id);
  }, [engineerPermissions, session]);

  const overallCompletion = useMemo(() => {
    if (visibleSectionIds.length === 0) return 0;
    return Math.round(visibleSectionIds.reduce((sum, sectionId) => sum + (progress[sectionId]?.percent ?? 0), 0) / visibleSectionIds.length);
  }, [progress, visibleSectionIds]);

  if (!mounted || loading || !authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center text-foreground">
        <div className="panel rounded-lg p-6 text-center">
          <p className="technical-label text-accent">POPAPOPZ</p>
          <h1 className="mt-2 text-xl font-semibold">Checking access</h1>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 text-foreground">
        <div className="panel w-full max-w-xl rounded-lg p-6 text-center">
          <p className="technical-label text-accent">POPAPOPZ</p>
          <h1 className="mt-2 text-xl font-semibold">{error ? "Supabase setup needs attention" : "Redirecting to login"}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {error ||
              "No active Supabase session was found. Use one of the login pages below to enter the engineering dashboard."}
          </p>
          {error ? (
            <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-5 text-yellow-100">
              Create the Auth users, then run `supabase/migrations/20260821_access_progress.sql` in Supabase SQL Editor.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110" href="/login/engineer">
              Engineer Login
            </Link>
            <Link className="rounded-md border border-border bg-black/20 px-4 py-2 text-sm text-slate-200 transition hover:border-accent hover:text-white" href="/login/admin">
              Admin Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  function handleLogout() {
    void logout();
    router.replace("/login/engineer");
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3">
              <div>
                <p className="technical-label text-accent">POPAPOPZ</p>
                <h1 className="text-base font-semibold">Engineering Studio</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="technical-label rounded border border-border bg-black/20 px-2 py-1 text-muted">
                  {session.displayName} / {session.role}
                </span>
                <span className="technical-label rounded border border-accent/40 bg-accent/10 px-2 py-1 text-cyan-100">
                  Visible progress {overallCompletion}%
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-slate-200 transition hover:border-accent hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1720px] space-y-4 p-4">
            {error ? <div className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-red-100">{error}</div> : null}
            <AdminAssignmentsPanel />
            <AdminPermissionsPanel />
            <MyAssignmentsPanel />
            <SectionGate sectionId="overview">
              <ProjectDashboard />
            </SectionGate>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <SectionGate sectionId="machine">
                  <MachineSection />
                </SectionGate>
                <SectionGate sectionId="architecture">
                  <ArchitectureDiagram />
                </SectionGate>
              </div>
              <SectionGate sectionId="modules">
                <ModulePanel />
              </SectionGate>
            </div>
            <SectionGate sectionId="phases">
              <PhaseTracker />
            </SectionGate>
            <SectionGate sectionId="requirements">
              <RequirementsPanel />
            </SectionGate>
            <SectionGate sectionId="decisions">
              <DecisionPanel />
            </SectionGate>
            <SectionGate sectionId="bom">
              <BomPanel />
            </SectionGate>
            <SectionGate sectionId="prototype">
              <PrototypePanel />
            </SectionGate>
            <SectionGate sectionId="manufacturing">
              <ManufacturingNote />
            </SectionGate>
          </div>
        </div>
      </div>
    </main>
  );
}
