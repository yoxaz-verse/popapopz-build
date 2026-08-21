export type EvidenceStatus =
  | "ASSUMPTION"
  | "PROPOSED"
  | "TO VALIDATE"
  | "CALCULATED"
  | "COMPONENT RATED"
  | "EXPERIMENTALLY VALIDATED"
  | "APPROVED"
  | "FROZEN";

export type PhaseStatus =
  | "Not Started"
  | "In Progress"
  | "Review"
  | "Approved"
  | "Prototype"
  | "Validated"
  | "Frozen";

export type ModuleCategory =
  | "mechanical"
  | "fluid"
  | "electrical"
  | "refrigeration"
  | "control"
  | "food-contact"
  | "safety";

export interface CostRangeInr {
  min: number;
  max: number;
}

export interface PeopleRequirement {
  role: string;
  count: number;
}

export interface ComponentPlanning {
  estimatedCostInr: CostRangeInr;
  buildDuration: string;
  peopleNeeded: PeopleRequirement[];
  assemblyType: string;
  dependencies: string[];
  prototypeDeliverable: string;
  creationSteps: string[];
  fitmentNotes: string[];
}

export interface MachineTarget {
  label: string;
  value: string;
  status: EvidenceStatus;
}

export interface Machine {
  id: string;
  name: string;
  envelopeMm: {
    height: number;
    width: number;
    depth: number;
  };
  type: string;
  prototype: string;
  targets: MachineTarget[];
}

export interface MachineModule {
  id: string;
  name: string;
  shortName: string;
  category: ModuleCategory;
  status: PhaseStatus;
  evidence: EvidenceStatus;
  purpose: string;
  architecture: string;
  channels?: string;
  portionRange?: string;
  targetAccuracy?: string;
  inputs: string[];
  outputs: string[];
  sensors: string[];
  actuators: string[];
  safety: string[];
  cleaning: string[];
  maintenance: string[];
  openDecisions: string[];
  handlingSequence?: string[];
  fluidCircuits?: string[];
  wasteStreams?: string[];
  validationMetrics?: string[];
  engineeringRisks?: string[];
  zone?: string;
  heightMm?: string;
  diameterMm?: string;
  serviceAccess?: string;
  validationNotes?: string[];
  planning?: ComponentPlanning;
  color: string;
}

export interface ComponentBuildPlan extends ComponentPlanning {
  id: string;
  name: string;
  shortName: string;
  category: ModuleCategory;
  status: PhaseStatus;
  evidence: EvidenceStatus;
  purpose: string;
  color: string;
  sourceModuleId?: string;
}

export interface EngineeringPhase {
  id: string;
  title: string;
  status: PhaseStatus;
  progress: number;
  objective: string;
  validation: string;
}

export interface Requirement {
  id: string;
  area: string;
  statement: string;
  priority: "Must" | "Should" | "Could";
  status: EvidenceStatus;
  owner: string;
}

export interface EngineeringDecision {
  id: string;
  title: string;
  subsystem: string;
  problem: string;
  options: string[];
  recommendation: string;
  reason: string;
  costImpact: string;
  reliabilityImpact: string;
  foodSafetyImpact: string;
  manufacturingImpact: string;
  status: "Open" | "Review" | "Approved" | "Frozen";
}

export interface BOMItem {
  partNumber: string;
  component: string;
  subsystem: string;
  specification: string;
  quantity: number;
  material: string;
  supplierCategory: string;
  estimatedCost: string;
  leadTime: string;
  criticality: "Low" | "Medium" | "High";
  alternative: string;
  status: EvidenceStatus;
}

export interface PrototypeStage {
  id: string;
  title: string;
  status: PhaseStatus;
  objective: string;
  requiredFeatures: string[];
  tests: string[];
  openRisks: string[];
  exitCriteria: string[];
}

export interface ArchitecturePath {
  id: string;
  title: string;
  status: EvidenceStatus;
  nodes: string[];
}
