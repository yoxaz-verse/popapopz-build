export type UserRole = "admin" | "engineer";

export type DashboardSectionId =
  | "overview"
  | "machine"
  | "architecture"
  | "modules"
  | "phases"
  | "requirements"
  | "decisions"
  | "bom"
  | "prototype"
  | "manufacturing";

export type SectionProgressStatus = "Not Started" | "In Progress" | "Review" | "Complete" | "Blocked";

export type AssignmentEntityType =
  | "component_build_plan"
  | "machine_module"
  | "engineering_phase"
  | "requirement"
  | "engineering_decision"
  | "bom_item"
  | "prototype_stage";

export type WorkAssignmentStatus = "Assigned" | "In Progress" | "Review" | "Done" | "Blocked";

export interface AuthSession {
  userId: string;
  role: UserRole;
  username: string;
  displayName: string;
}

export interface EngineerProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface DashboardSectionPermission {
  sectionId: DashboardSectionId;
  canView: boolean;
  canEditProgress: boolean;
}

export interface SectionProgress {
  sectionId: DashboardSectionId;
  percent: number;
  status: SectionProgressStatus;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DashboardSectionDefinition {
  id: DashboardSectionId;
  label: string;
  description: string;
  anchor: string;
}

export interface AssignableWorkItem {
  entityType: AssignmentEntityType;
  entityId: string;
  title: string;
  sectionId: DashboardSectionId;
  groupLabel: string;
  detail: string;
}

export interface EngineerWorkAssignment {
  id: string;
  engineerId: string;
  engineerEmail: string;
  engineerName: string;
  entityType: AssignmentEntityType;
  entityId: string;
  title: string;
  sectionId: DashboardSectionId;
  status: WorkAssignmentStatus;
  progressPercent: number;
  note: string;
  assignedBy: string;
  updatedAt: string;
}

export interface EngineerWorkStaffing {
  id: string;
  engineerId: string;
  engineerEmail: string;
  engineerName: string;
  entityType: AssignmentEntityType;
  entityId: string;
  title: string;
  sectionId: DashboardSectionId;
  roleName: string;
  assignedBy: string;
  createdAt: string;
}
