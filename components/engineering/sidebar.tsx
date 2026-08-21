"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";
import { Boxes, ClipboardList, Factory, Gauge, Layers3, ShieldCheck } from "lucide-react";
import Link from "next/link";

const sectionIcons = [ClipboardList, Boxes, Gauge, ShieldCheck, Factory];

export function Sidebar() {
  const session = useAccessStore((state) => state.session);
  const engineerPermissions = useAccessStore((state) => state.engineerPermissions);
  const sections = useMemo(() => {
    if (session?.role === "admin") return dashboardSections;
    return dashboardSections.filter((section) => engineerPermissions[section.id]?.canView);
  }, [engineerPermissions, session]);

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-border/80 bg-black/20 lg:flex lg:flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="technical-label text-accent">POPAPOPZ</div>
        <h1 className="mt-2 text-lg font-semibold leading-tight">Engineering Studio</h1>
        <p className="mt-2 text-xs leading-5 text-muted">Smart beverage dispensing system digital twin.</p>
        <Link className="mt-4 flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent hover:bg-accent/15" href="/components">
          <Layers3 className="h-4 w-4" />
          Component Build Plan
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section, index) => {
          const Icon = sectionIcons[index % sectionIcons.length];
          return (
            <a
              href={`#${section.anchor}`}
              key={section.id}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition",
                "text-slate-100",
                "hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="technical-label w-7 text-muted">{String(index + 1).padStart(2, "0")}</span>
              <Icon className="h-4 w-4 text-muted group-hover:text-accent" />
              <span className="truncate">{section.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
