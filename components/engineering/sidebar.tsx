"use client";

import { navigationSections } from "@/data/popapopz";
import { cn } from "@/lib/utils";
import { Boxes, ClipboardList, Factory, Gauge, ShieldCheck } from "lucide-react";

const sectionIcons = [ClipboardList, Boxes, Gauge, ShieldCheck, Factory];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-border/80 bg-black/20 lg:flex lg:flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="technical-label text-accent">POPAPOPZ</div>
        <h1 className="mt-2 text-lg font-semibold leading-tight">Engineering Studio</h1>
        <p className="mt-2 text-xs leading-5 text-muted">Smart beverage dispensing system digital twin.</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {navigationSections.map((section, index) => {
          const Icon = sectionIcons[index % sectionIcons.length];
          const active = index < 10;
          return (
            <a
              href={`#${section.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}`}
              key={section}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition",
                active && "text-slate-100",
                "hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="technical-label w-7 text-muted">{String(index + 1).padStart(2, "0")}</span>
              <Icon className="h-4 w-4 text-muted group-hover:text-accent" />
              <span className="truncate">{section}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
