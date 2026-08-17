import { architecturePaths } from "@/data/popapopz";
import { EvidenceBadge } from "@/components/ui/status-badge";
import { ArrowDown } from "lucide-react";

export function ArchitectureDiagram() {
  return (
    <section id="system-architecture" className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="technical-label text-accent">System Architecture</p>
          <h2 className="mt-2 text-xl font-semibold">Subsystem Flow Map</h2>
        </div>
        <span className="technical-label text-muted">Interactive wiring planned for next phase</span>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {architecturePaths.map((path) => (
          <article key={path.id} className="rounded-md border border-border/80 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{path.title}</h3>
              <EvidenceBadge status={path.status} />
            </div>
            <div className="space-y-2">
              {path.nodes.map((node, index) => (
                <div key={node}>
                  <div className="rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">{node}</div>
                  {index < path.nodes.length - 1 ? <ArrowDown className="mx-auto my-1 h-4 w-4 text-accent" /> : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
