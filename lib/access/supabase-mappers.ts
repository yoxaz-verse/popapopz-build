import type {
  AuthSession,
  AssignmentEntityType,
  DashboardSectionId,
  DashboardSectionPermission,
  EngineerProfile,
  EngineerWorkAssignment,
  SectionProgress,
  SectionProgressStatus,
  UserRole
} from "@/types/access";

export interface ProfileRow {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
}

export interface PermissionRow {
  section_id: DashboardSectionId;
  can_view: boolean;
  can_edit_progress: boolean;
}

export interface ProgressRow {
  section_id: DashboardSectionId;
  percent: number;
  status: SectionProgressStatus;
  note: string | null;
  updated_by_email: string | null;
  updated_at: string;
}

export interface AssignmentRow {
  id: string;
  engineer_id: string;
  entity_type: AssignmentEntityType;
  entity_id: string;
  title: string;
  section_id: DashboardSectionId;
  status: EngineerWorkAssignment["status"];
  progress_percent: number;
  note: string | null;
  assigned_by_email: string | null;
  updated_at: string;
  engineer?: {
    email: string | null;
    display_name: string | null;
  } | null;
}

export function mapProfileToSession(profile: ProfileRow): AuthSession {
  return {
    userId: profile.id,
    role: profile.role,
    username: profile.email,
    displayName: profile.display_name || profile.email
  };
}

export function mapProfileToEngineer(profile: ProfileRow): EngineerProfile {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name || profile.email
  };
}

export function mapPermissionRows(rows: PermissionRow[]): Record<DashboardSectionId, DashboardSectionPermission> {
  return rows.reduce((acc, row) => {
    acc[row.section_id] = {
      sectionId: row.section_id,
      canView: row.can_view,
      canEditProgress: row.can_edit_progress
    };

    return acc;
  }, {} as Record<DashboardSectionId, DashboardSectionPermission>);
}

export function mapProgressRows(rows: ProgressRow[]): Record<DashboardSectionId, SectionProgress> {
  return rows.reduce((acc, row) => {
    acc[row.section_id] = {
      sectionId: row.section_id,
      percent: row.percent,
      status: row.status,
      note: row.note || "",
      updatedBy: row.updated_by_email || "Unknown user",
      updatedAt: row.updated_at
    };

    return acc;
  }, {} as Record<DashboardSectionId, SectionProgress>);
}

export function mapAssignmentRows(rows: AssignmentRow[]): EngineerWorkAssignment[] {
  return rows.map((row) => ({
    id: row.id,
    engineerId: row.engineer_id,
    engineerEmail: row.engineer?.email || "Unknown engineer",
    engineerName: row.engineer?.display_name || row.engineer?.email || "Unknown engineer",
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    sectionId: row.section_id,
    status: row.status,
    progressPercent: row.progress_percent,
    note: row.note || "",
    assignedBy: row.assigned_by_email || "Unknown user",
    updatedAt: row.updated_at
  }));
}
