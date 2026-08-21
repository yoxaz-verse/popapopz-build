"use client";

import { create } from "zustand";
import { getAssignableWorkItem, getRequiredRoleSeatCount } from "@/lib/access/assignable-work";
import { dashboardSections, defaultEngineerPermissions, defaultSectionProgress } from "@/lib/access/sections";
import {
  mapAssignmentRows,
  mapPermissionRows,
  mapProfileToEngineer,
  mapProfileToSession,
  mapProgressRows,
  mapStaffingRows,
  type AssignmentRow,
  type PermissionRow,
  type ProfileRow,
  type ProgressRow,
  type StaffingRow
} from "@/lib/access/supabase-mappers";
import { supabase, supabaseConfigError } from "@/lib/supabase/client";
import type {
  AuthSession,
  AssignmentEntityType,
  DashboardSectionId,
  DashboardSectionPermission,
  EngineerProfile,
  EngineerWorkAssignment,
  EngineerWorkStaffing,
  SectionProgress,
  SectionProgressStatus,
  UserRole
} from "@/types/access";

const requestTimeoutMs = 5000;

type SupabaseResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

interface AccessState {
  session: AuthSession | null;
  engineers: EngineerProfile[];
  selectedEngineerId: string | null;
  assignments: EngineerWorkAssignment[];
  staffing: EngineerWorkStaffing[];
  engineerPermissions: Record<DashboardSectionId, DashboardSectionPermission>;
  progress: Record<DashboardSectionId, SectionProgress>;
  loading: boolean;
  authChecked: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (role: UserRole, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshDashboardData: () => Promise<void>;
  setSelectedEngineerId: (engineerId: string) => Promise<void>;
  setEngineerPermission: (sectionId: DashboardSectionId, canView: boolean) => Promise<void>;
  assignWorkItem: (update: { engineerId: string; entityType: AssignmentEntityType; entityId: string }) => Promise<void>;
  unassignWorkItem: (entityType: AssignmentEntityType, entityId: string) => Promise<void>;
  assignStaffingSeat: (update: { engineerId: string; entityType: AssignmentEntityType; entityId: string; roleName: string }) => Promise<void>;
  removeStaffingSeat: (staffingId: string) => Promise<void>;
  updateWorkAssignment: (
    assignmentId: string,
    update: { progressPercent: number; status: EngineerWorkAssignment["status"]; note: string }
  ) => Promise<void>;
  updateSectionProgress: (sectionId: DashboardSectionId, update: { percent: number; status: SectionProgressStatus; note: string }) => Promise<void>;
  canViewSection: (sectionId: DashboardSectionId) => boolean;
  canEditSectionProgress: (sectionId: DashboardSectionId) => boolean;
  visibleSectionIds: () => DashboardSectionId[];
}

function withTimeout<T>(promise: PromiseLike<T>, label: string, timeoutMs = requestTimeoutMs) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} timed out. Check Supabase setup and network access.`)), timeoutMs);
    })
  ]);
}

function getSupabaseClient() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase client is not configured.");
  }

  return supabase;
}

function accessErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Unable to connect to Supabase.";

  if (/relation .*profiles.* does not exist|section_progress|engineer_section_permissions|engineer_work_assignments|engineer_work_staffing|schema cache|PGRST/i.test(message)) {
    return "Supabase database is not ready. Create the Auth users, then run supabase/migrations/20260821_access_progress.sql in the Supabase SQL Editor.";
  }

  if (/No rows|JSON object requested|profile/i.test(message)) {
    return "No profile was found for this Supabase user. Create the Auth users, then run supabase/migrations/20260821_access_progress.sql.";
  }

  return message;
}

async function loadCurrentProfile() {
  const supabaseClient = getSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await withTimeout(supabaseClient.auth.getUser(), "Supabase auth check");

  if (userError && !/auth session missing/i.test(userError.message)) throw userError;
  if (!user) return null;

  const { data, error } = (await withTimeout(
    supabaseClient.from("profiles").select("id,email,role,display_name").eq("id", user.id).single<ProfileRow>(),
    "Profile lookup"
  )) as SupabaseResponse<ProfileRow>;

  if (error) throw error;
  if (!data) {
    throw new Error("No profile found for this Supabase user. Run the database migration after creating the Auth user.");
  }
  return data;
}

async function loadEngineers() {
  const supabaseClient = getSupabaseClient();
  const { data, error } = (await withTimeout(
    supabaseClient.from("profiles").select("id,email,role,display_name").eq("role", "engineer").order("email").returns<ProfileRow[]>(),
    "Engineer profile loading"
  )) as SupabaseResponse<ProfileRow[]>;

  if (error) throw error;
  return (data || []).map(mapProfileToEngineer);
}

async function loadPermissionsForUser(userId: string) {
  const supabaseClient = getSupabaseClient();
  const { data, error } = (await withTimeout(
    supabaseClient
      .from("engineer_section_permissions")
      .select("section_id,can_view,can_edit_progress")
      .eq("user_id", userId)
      .returns<PermissionRow[]>(),
    "Permission loading"
  )) as SupabaseResponse<PermissionRow[]>;

  if (error) throw error;

  return {
    ...defaultEngineerPermissions,
    ...mapPermissionRows(data || [])
  };
}

async function loadProgress() {
  const supabaseClient = getSupabaseClient();
  const { data, error } = (await withTimeout(
    supabaseClient
      .from("section_progress_with_user")
      .select("section_id,percent,status,note,updated_by_email,updated_at")
      .returns<ProgressRow[]>(),
    "Progress loading"
  )) as SupabaseResponse<ProgressRow[]>;

  if (error) throw error;

  return {
    ...defaultSectionProgress,
    ...mapProgressRows(data || [])
  };
}

async function loadAssignments(session: AuthSession) {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("engineer_work_assignments")
    .select(
      "id,engineer_id,entity_type,entity_id,title,section_id,status,progress_percent,note,assigned_by_email,updated_at,engineer:profiles!engineer_work_assignments_engineer_id_fkey(email,display_name)"
    )
    .order("updated_at", { ascending: false });

  if (session.role === "engineer") {
    query = query.eq("engineer_id", session.userId);
  }

  const { data, error } = (await withTimeout(query.returns<AssignmentRow[]>(), "Work assignment loading")) as SupabaseResponse<AssignmentRow[]>;

  if (error) throw error;
  return mapAssignmentRows(data || []);
}

async function loadStaffing(session: AuthSession) {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from("engineer_work_staffing")
    .select(
      "id,engineer_id,entity_type,entity_id,title,section_id,role_name,assigned_by_email,created_at,engineer:profiles!engineer_work_staffing_engineer_id_fkey(email,display_name)"
    )
    .order("created_at", { ascending: false });

  if (session.role === "engineer") {
    query = query.eq("engineer_id", session.userId);
  }

  const { data, error } = (await withTimeout(query.returns<StaffingRow[]>(), "Staffing assignment loading")) as SupabaseResponse<StaffingRow[]>;

  if (error) throw error;
  return mapStaffingRows(data || []);
}

export const useAccessStore = create<AccessState>((set, get) => ({
  session: null,
  engineers: [],
  selectedEngineerId: null,
  assignments: [],
  staffing: [],
  engineerPermissions: defaultEngineerPermissions,
  progress: defaultSectionProgress,
  loading: false,
  authChecked: false,
  error: null,
  initialize: async () => {
    set({ loading: true, authChecked: false, error: null });

    try {
      const profile = await loadCurrentProfile();

      if (!profile) {
        set({ session: null, loading: false, authChecked: true });
        return;
      }

      set({ session: mapProfileToSession(profile) });
      await get().refreshDashboardData();
      set({ loading: false, authChecked: true });
    } catch (error) {
      set({ session: null, loading: false, authChecked: true, error: accessErrorMessage(error) });
    }
  },
  login: async (role, email, password) => {
    set({ loading: true, error: null });

    try {
      const supabaseClient = getSupabaseClient();
      const { error: signInError } = (await withTimeout(
        supabaseClient.auth.signInWithPassword({
          email,
          password
        }),
        "Supabase sign-in"
      )) as SupabaseResponse<unknown>;

      if (signInError) throw signInError;

      const profile = await loadCurrentProfile();

      if (!profile) {
        throw new Error("No profile found for this Supabase user. Run the database migration after creating the Auth user.");
      }

      if (profile.role !== role) {
        await withTimeout(supabaseClient.auth.signOut(), "Supabase sign-out");
        throw new Error(`This account is registered as ${profile.role}, not ${role}.`);
      }

      set({ session: mapProfileToSession(profile) });
      await get().refreshDashboardData();
      set({ loading: false, authChecked: true });
      return true;
    } catch (error) {
      set({ session: null, loading: false, authChecked: true, error: accessErrorMessage(error) });
      return false;
    }
  },
  logout: async () => {
    const supabaseClient = supabase ? getSupabaseClient() : null;
    if (supabaseClient) {
      await withTimeout(supabaseClient.auth.signOut(), "Supabase sign-out").catch(() => null);
    }
    set({
      session: null,
      engineers: [],
      selectedEngineerId: null,
      assignments: [],
      staffing: [],
      engineerPermissions: defaultEngineerPermissions,
      progress: defaultSectionProgress,
      loading: false,
      authChecked: true,
      error: null
    });
  },
  refreshDashboardData: async () => {
    const session = get().session;
    if (!session) return;

    const progressPromise = loadProgress();
    const assignmentsPromise = loadAssignments(session);
    const staffingPromise = loadStaffing(session);

    if (session.role === "admin") {
      const engineers = await loadEngineers();
      const selectedEngineerId =
        get().selectedEngineerId && engineers.some((engineer) => engineer.id === get().selectedEngineerId)
          ? get().selectedEngineerId
          : engineers[0]?.id ?? null;
      const engineerPermissions = selectedEngineerId ? await loadPermissionsForUser(selectedEngineerId) : defaultEngineerPermissions;
      const [progress, assignments, staffing] = await Promise.all([progressPromise, assignmentsPromise, staffingPromise]);

      set({
        engineers,
        selectedEngineerId,
        engineerPermissions,
        progress,
        assignments,
        staffing
      });
      return;
    }

    const [engineerPermissions, progress, assignments, staffing] = await Promise.all([
      loadPermissionsForUser(session.userId),
      progressPromise,
      assignmentsPromise,
      staffingPromise
    ]);

    set({
      engineers: [],
      selectedEngineerId: session.userId,
      engineerPermissions,
      progress,
      assignments,
      staffing
    });
  },
  setSelectedEngineerId: async (engineerId) => {
    const previousPermissions = get().engineerPermissions;

    set({
      selectedEngineerId: engineerId,
      engineerPermissions: defaultEngineerPermissions,
      error: null
    });

    try {
      const engineerPermissions = await loadPermissionsForUser(engineerId);
      set({ engineerPermissions });
    } catch (error) {
      set({
        engineerPermissions: previousPermissions,
        error: accessErrorMessage(error)
      });
    }
  },
  setEngineerPermission: async (sectionId, canView) => {
    const session = get().session;
    const targetEngineerId = session?.role === "admin" ? get().selectedEngineerId : session?.userId;

    if (!targetEngineerId) {
      set({ error: "Select an engineer before changing permissions." });
      return;
    }

    const previous = get().engineerPermissions;
    const nextPermission = {
      sectionId,
      canView,
      canEditProgress: canView
    };

    set({
      engineerPermissions: {
        ...previous,
        [sectionId]: nextPermission
      },
      error: null
    });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient.from("engineer_section_permissions").upsert({
          user_id: targetEngineerId,
          section_id: sectionId,
          can_view: canView,
          can_edit_progress: canView
        }),
        "Permission update"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
    } catch (error) {
      set({
        engineerPermissions: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  assignWorkItem: async ({ engineerId, entityType, entityId }) => {
    const session = get().session;
    const workItem = getAssignableWorkItem(entityType, entityId);

    if (!session || session.role !== "admin") {
      set({ error: "Only admin can assign engineering work." });
      return;
    }

    if (!workItem) {
      set({ error: "This engineering work item is not available for assignment." });
      return;
    }

    if (!engineerId) {
      set({ error: "Select an engineer before assigning work." });
      return;
    }

    const previous = get().assignments;
    const engineer = get().engineers.find((item) => item.id === engineerId);
    const optimisticAssignment: EngineerWorkAssignment = {
      id: `${entityType}:${entityId}`,
      engineerId,
      engineerEmail: engineer?.email ?? "Selected engineer",
      engineerName: engineer?.displayName ?? engineer?.email ?? "Selected engineer",
      entityType,
      entityId,
      title: workItem.title,
      sectionId: workItem.sectionId,
      status: "Assigned",
      progressPercent: 0,
      note: "",
      assignedBy: session.username,
      updatedAt: new Date().toISOString()
    };

    set({
      assignments: [optimisticAssignment, ...previous.filter((assignment) => assignment.entityType !== entityType || assignment.entityId !== entityId)],
      error: null
    });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient.from("engineer_work_assignments").upsert(
          {
            engineer_id: engineerId,
            entity_type: entityType,
            entity_id: entityId,
            title: workItem.title,
            section_id: workItem.sectionId,
            status: "Assigned",
            progress_percent: 0,
            note: ""
          },
          { onConflict: "entity_type,entity_id" }
        ),
        "Work assignment update"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        assignments: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  unassignWorkItem: async (entityType, entityId) => {
    const session = get().session;

    if (!session || session.role !== "admin") {
      set({ error: "Only admin can unassign engineering work." });
      return;
    }

    const previous = get().assignments;
    set({
      assignments: previous.filter((assignment) => assignment.entityType !== entityType || assignment.entityId !== entityId),
      error: null
    });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient.from("engineer_work_assignments").delete().eq("entity_type", entityType).eq("entity_id", entityId),
        "Work assignment removal"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        assignments: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  assignStaffingSeat: async ({ engineerId, entityType, entityId, roleName }) => {
    const session = get().session;
    const workItem = getAssignableWorkItem(entityType, entityId);

    if (!session || session.role !== "admin") {
      set({ error: "Only admin can assign staffing seats." });
      return;
    }

    if (!workItem) {
      set({ error: "This work item is not available for staffing." });
      return;
    }

    const existing = get().staffing.filter(
      (item) => item.entityType === entityType && item.entityId === entityId && item.roleName === roleName
    );
    const duplicate = existing.some((item) => item.engineerId === engineerId);
    const requiredSeats = getRequiredRoleSeatCount(entityType, entityId, roleName);

    if (duplicate) {
      set({ error: "That engineer is already assigned to this role seat." });
      return;
    }

    if (requiredSeats > 0 && existing.length >= requiredSeats) {
      set({ error: `${roleName} already has ${existing.length} assigned out of ${requiredSeats} needed. Remove a seat before assigning another engineer.` });
      return;
    }

    const previous = get().staffing;
    const engineer = get().engineers.find((item) => item.id === engineerId);
    const optimisticStaffing: EngineerWorkStaffing = {
      id: `${entityType}:${entityId}:${roleName}:${engineerId}`,
      engineerId,
      engineerEmail: engineer?.email ?? "Selected engineer",
      engineerName: engineer?.displayName ?? engineer?.email ?? "Selected engineer",
      entityType,
      entityId,
      title: workItem.title,
      sectionId: workItem.sectionId,
      roleName,
      assignedBy: session.username,
      createdAt: new Date().toISOString()
    };

    set({ staffing: [optimisticStaffing, ...previous], error: null });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient.from("engineer_work_staffing").insert({
          engineer_id: engineerId,
          entity_type: entityType,
          entity_id: entityId,
          title: workItem.title,
          section_id: workItem.sectionId,
          role_name: roleName
        }),
        "Staffing seat update"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        staffing: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  removeStaffingSeat: async (staffingId) => {
    const session = get().session;

    if (!session || session.role !== "admin") {
      set({ error: "Only admin can remove staffing seats." });
      return;
    }

    const previous = get().staffing;
    set({
      staffing: previous.filter((item) => item.id !== staffingId),
      error: null
    });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient.from("engineer_work_staffing").delete().eq("id", staffingId),
        "Staffing seat removal"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        staffing: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  updateWorkAssignment: async (assignmentId, update) => {
    const previous = get().assignments;
    const nextAssignments = previous.map((assignment) =>
      assignment.id === assignmentId
        ? {
            ...assignment,
            progressPercent: Math.min(100, Math.max(0, Math.round(update.progressPercent))),
            status: update.status,
            note: update.note,
            updatedAt: new Date().toISOString()
          }
        : assignment
    );

    set({ assignments: nextAssignments, error: null });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient
          .from("engineer_work_assignments")
          .update({
            progress_percent: Math.min(100, Math.max(0, Math.round(update.progressPercent))),
            status: update.status,
            note: update.note
          })
          .eq("id", assignmentId),
        "Work assignment progress update"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        assignments: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  updateSectionProgress: async (sectionId, update) => {
    const previous = get().progress;
    const session = get().session;
    const nextProgress = {
      sectionId,
      percent: Math.min(100, Math.max(0, Math.round(update.percent))),
      status: update.status,
      note: update.note,
      updatedBy: session?.username ?? "Unknown user",
      updatedAt: new Date().toISOString()
    };

    set({
      progress: {
        ...previous,
        [sectionId]: nextProgress
      },
      error: null
    });

    try {
      const supabaseClient = getSupabaseClient();
      const { error } = (await withTimeout(
        supabaseClient
          .from("section_progress")
          .update({
            percent: nextProgress.percent,
            status: nextProgress.status,
            note: nextProgress.note
          })
          .eq("section_id", sectionId),
        "Progress update"
      )) as SupabaseResponse<unknown>;

      if (error) throw error;
      await get().refreshDashboardData();
    } catch (error) {
      set({
        progress: previous,
        error: accessErrorMessage(error)
      });
    }
  },
  canViewSection: (sectionId) => {
    const { session, engineerPermissions } = get();
    if (!session) return false;
    if (session.role === "admin") return true;
    return engineerPermissions[sectionId]?.canView ?? false;
  },
  canEditSectionProgress: (sectionId) => {
    const { session, engineerPermissions } = get();
    if (!session) return false;
    if (session.role === "admin") return true;
    return engineerPermissions[sectionId]?.canEditProgress ?? false;
  },
  visibleSectionIds: () => dashboardSections.map((section) => section.id).filter((sectionId) => get().canViewSection(sectionId))
}));
