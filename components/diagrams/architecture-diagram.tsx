"use client";

import { architecturePaths } from "@/data/popapopz";
import { EvidenceBadge } from "@/components/ui/status-badge";
import { ArrowDown } from "lucide-react";
import { useStudioStore } from "@/store/studio-store";

export function ArchitectureDiagram() {
  const selectedModuleId = useStudioStore((state) => state.selectedModuleId);
  const setSelectedModuleId = useStudioStore((state) => state.setSelectedModuleId);
  const setHoveredModuleId = useStudioStore((state) => state.setHoveredModuleId);

  return (
    <section id="system-architecture" className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="technical-label text-accent">System Architecture</p>
          <h2 className="mt-2 text-xl font-semibold">Subsystem Flow Map</h2>
        </div>
        <span className="technical-label text-accent flex items-center gap-1.5 font-mono text-[11px] animate-pulse">
          <span className="h-2 w-2 rounded-full bg-accent inline-block"></span>
          Interactive Subsystem Inspector
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-4">
        {architecturePaths.map((path) => {
          const isActive = selectedModuleId === path.id;
          return (
            <article
              key={path.id}
              className={`min-w-0 cursor-pointer rounded-md border p-4 transition-all duration-300 ${
                isActive
                  ? "border-accent/80 bg-accent/[0.04] shadow-panel shadow-accent/5"
                  : "border-border/80 bg-black/20 hover:border-slate-700 hover:bg-black/30"
              }`}
              onClick={() => {
                setSelectedModuleId(path.id);
                const viewport = document.getElementById("machine-layout");
                if (viewport) {
                  viewport.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              onMouseEnter={() => setHoveredModuleId(path.id)}
              onMouseLeave={() => setHoveredModuleId(null)}
            >
              <div className="mb-4 flex min-h-[4.25rem] flex-col items-start justify-between gap-2">
                <h3 className={`text-sm font-semibold leading-snug transition-colors duration-250 ${isActive ? "text-accent" : "text-white"}`}>{path.title}</h3>
                <EvidenceBadge status={path.status} className="max-w-full whitespace-normal text-[10px] leading-tight" />
              </div>
              <div className="space-y-2">
                {path.nodes.map((node, index) => (
                  <div key={node}>
                    <div className={`rounded border px-3 py-2 text-sm transition-all duration-250 ${
                      isActive
                        ? "border-accent/40 bg-accent/[0.08] text-white font-medium shadow-sm"
                        : "border-white/10 bg-white/[0.04] text-slate-300"
                    }`}>
                      {node}
                    </div>
                    {index < path.nodes.length - 1 ? (
                      <ArrowDown className={`mx-auto my-1 h-4 w-4 transition-colors duration-250 ${isActive ? "text-accent" : "text-slate-600"}`} />
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
