import { bomItems, componentBuildPlans, decisions, modules, phases, prototypeStages, requirements } from "@/data/popapopz";
import type { AssignableWorkItem, AssignmentEntityType, DashboardSectionId } from "@/types/access";

function item(
  entityType: AssignmentEntityType,
  entityId: string,
  title: string,
  sectionId: DashboardSectionId,
  groupLabel: string,
  detail: string
): AssignableWorkItem {
  return {
    entityType,
    entityId,
    title,
    sectionId,
    groupLabel,
    detail
  };
}

export const assignableWorkItems: AssignableWorkItem[] = [
  ...componentBuildPlans.map((plan) =>
    item("component_build_plan", plan.id, plan.name, "modules", "Component build plans", `${plan.shortName} · ${plan.status}`)
  ),
  ...modules.map((module) =>
    item("machine_module", module.id, module.name, "machine", "Machine modules", `${module.shortName} · ${module.category}`)
  ),
  ...phases.map((phase) =>
    item("engineering_phase", phase.id, phase.title, "phases", "Engineering phases", `${phase.status} · ${phase.progress}%`)
  ),
  ...requirements.map((requirement) =>
    item("requirement", requirement.id, requirement.statement, "requirements", "Requirements", `${requirement.id} · ${requirement.area}`)
  ),
  ...decisions.map((decision) =>
    item("engineering_decision", decision.id, decision.title, "decisions", "Engineering decisions", `${decision.id} · ${decision.status}`)
  ),
  ...bomItems.map((bomItem) =>
    item("bom_item", bomItem.partNumber, bomItem.component, "bom", "Bill of materials", `${bomItem.partNumber} · ${bomItem.subsystem}`)
  ),
  ...prototypeStages.map((stage) =>
    item("prototype_stage", stage.id, stage.title, "prototype", "Prototype stages", `${stage.id} · ${stage.status}`)
  )
];

export function getAssignableWorkItem(entityType: AssignmentEntityType, entityId: string) {
  return assignableWorkItems.find((workItem) => workItem.entityType === entityType && workItem.entityId === entityId) ?? null;
}
