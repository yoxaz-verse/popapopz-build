import { phases } from "@/data/popapopz";
import type {
  DashboardSectionDefinition,
  DashboardSectionId,
  DashboardSectionPermission,
  SectionProgress
} from "@/types/access";

export const dashboardSections: DashboardSectionDefinition[] = [
  { id: "overview", label: "Overview", description: "Project summary and overall completion.", anchor: "product-requirements" },
  { id: "machine", label: "Machine", description: "Interactive machine packaging and controls.", anchor: "machine-layout" },
  { id: "architecture", label: "Architecture", description: "Subsystem architecture paths.", anchor: "architecture" },
  { id: "modules", label: "Modules", description: "Selected module engineering detail.", anchor: "modules" },
  { id: "phases", label: "Phases", description: "Engineering workflow phases.", anchor: "phase-tracker" },
  { id: "requirements", label: "Requirements", description: "Requirements database.", anchor: "requirements-page" },
  { id: "decisions", label: "Decisions", description: "Open engineering decisions.", anchor: "engineering-decision-page" },
  { id: "bom", label: "BOM", description: "Bill of materials workspace.", anchor: "bom" },
  { id: "prototype", label: "Prototype", description: "Prototype development tracker.", anchor: "prototype-development" },
  { id: "manufacturing", label: "Manufacturing", description: "Manufacturing planning layer.", anchor: "manufacturing" }
];

export const defaultEngineerPermissions: Record<DashboardSectionId, DashboardSectionPermission> =
  dashboardSections.reduce((acc, section) => {
    const enabledByDefault: DashboardSectionId[] = ["overview", "machine", "modules", "phases", "requirements"];
    const canView = enabledByDefault.includes(section.id);

    acc[section.id] = {
      sectionId: section.id,
      canView,
      canEditProgress: canView
    };

    return acc;
  }, {} as Record<DashboardSectionId, DashboardSectionPermission>);

const now = new Date().toISOString();
const phaseAverage = Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length);

export const defaultSectionProgress: Record<DashboardSectionId, SectionProgress> = {
  overview: {
    sectionId: "overview",
    percent: phaseAverage,
    status: "In Progress",
    note: "Seeded from current engineering phase average.",
    updatedBy: "System seed",
    updatedAt: now
  },
  machine: {
    sectionId: "machine",
    percent: 45,
    status: "In Progress",
    note: "Machine viewport and module packaging skeleton are active.",
    updatedBy: "System seed",
    updatedAt: now
  },
  architecture: {
    sectionId: "architecture",
    percent: 52,
    status: "Review",
    note: "Subsystem paths are available for review.",
    updatedBy: "System seed",
    updatedAt: now
  },
  modules: {
    sectionId: "modules",
    percent: 48,
    status: "In Progress",
    note: "Module detail workspace is connected to selection state.",
    updatedBy: "System seed",
    updatedAt: now
  },
  phases: {
    sectionId: "phases",
    percent: phaseAverage,
    status: "In Progress",
    note: "Seeded from existing phase tracker data.",
    updatedBy: "System seed",
    updatedAt: now
  },
  requirements: {
    sectionId: "requirements",
    percent: 58,
    status: "Review",
    note: "Requirements table is ready for structured updates.",
    updatedBy: "System seed",
    updatedAt: now
  },
  decisions: {
    sectionId: "decisions",
    percent: 32,
    status: "In Progress",
    note: "Open decisions need validation and approval flow.",
    updatedBy: "System seed",
    updatedAt: now
  },
  bom: {
    sectionId: "bom",
    percent: 25,
    status: "Not Started",
    note: "BOM hooks are present; cost/source validation remains.",
    updatedBy: "System seed",
    updatedAt: now
  },
  prototype: {
    sectionId: "prototype",
    percent: 30,
    status: "In Progress",
    note: "Prototype stages are defined for P0 planning.",
    updatedBy: "System seed",
    updatedAt: now
  },
  manufacturing: {
    sectionId: "manufacturing",
    percent: 12,
    status: "Not Started",
    note: "Manufacturing layer is a planning placeholder.",
    updatedBy: "System seed",
    updatedAt: now
  }
};

export function getAllSectionIds() {
  return dashboardSections.map((section) => section.id);
}
