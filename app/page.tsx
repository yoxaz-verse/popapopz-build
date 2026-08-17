import { ArchitectureDiagram } from "@/components/diagrams/architecture-diagram";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";
import { BomPanel, DecisionPanel, ManufacturingNote, PrototypePanel, RequirementsPanel } from "@/components/engineering/data-panels";
import { ModulePanel } from "@/components/engineering/module-panel";
import { PhaseTracker } from "@/components/engineering/phase-tracker";
import { Sidebar } from "@/components/engineering/sidebar";
import { MachineSection } from "@/components/machine/machine-section";

export default function Home() {
  return (
    <main className="min-h-screen text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
            <p className="technical-label text-accent">POPAPOPZ</p>
            <h1 className="text-base font-semibold">Engineering Studio</h1>
          </header>

          <div className="mx-auto max-w-[1720px] space-y-4 p-4">
            <ProjectDashboard />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <MachineSection />
                <ArchitectureDiagram />
              </div>
              <ModulePanel />
            </div>
            <PhaseTracker />
            <RequirementsPanel />
            <DecisionPanel />
            <BomPanel />
            <PrototypePanel />
            <ManufacturingNote />
          </div>
        </div>
      </div>
    </main>
  );
}
