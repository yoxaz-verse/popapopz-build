"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, ShieldOff, ShieldPlus, UserCog, UserPlus, UsersRound, X } from "lucide-react";
import { dashboardSections } from "@/lib/access/sections";
import { useAccessStore } from "@/store/access-store";

function makeTemporaryPassword() {
  const bytes = new Uint8Array(8);
  window.crypto.getRandomValues(bytes);
  return `Ppz-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function AdminEngineersPanel() {
  const session = useAccessStore((state) => state.session);
  const engineers = useAccessStore((state) => state.engineers);
  const selectedEngineerId = useAccessStore((state) => state.selectedEngineerId);
  const permissions = useAccessStore((state) => state.engineerPermissions);
  const assignments = useAccessStore((state) => state.assignments);
  const staffing = useAccessStore((state) => state.staffing);
  const setSelectedEngineerId = useAccessStore((state) => state.setSelectedEngineerId);
  const createEngineer = useAccessStore((state) => state.createEngineer);
  const updateEngineerProfile = useAccessStore((state) => state.updateEngineerProfile);
  const setEngineerActive = useAccessStore((state) => state.setEngineerActive);
  const resetEngineerPassword = useAccessStore((state) => state.resetEngineerPassword);
  const transferEngineerWork = useAccessStore((state) => state.transferEngineerWork);
  const clearEngineerStaffing = useAccessStore((state) => state.clearEngineerStaffing);

  const selectedEngineer = useMemo(
    () => engineers.find((engineer) => engineer.id === selectedEngineerId) ?? engineers[0] ?? null,
    [engineers, selectedEngineerId]
  );
  const activeEngineers = useMemo(() => engineers.filter((engineer) => engineer.active), [engineers]);
  const transferTargets = useMemo(
    () => activeEngineers.filter((engineer) => engineer.id !== selectedEngineer?.id),
    [activeEngineers, selectedEngineer]
  );
  const selectedOwnedWork = useMemo(
    () => (selectedEngineer ? assignments.filter((assignment) => assignment.engineerId === selectedEngineer.id) : []),
    [assignments, selectedEngineer]
  );
  const selectedStaffing = useMemo(
    () => (selectedEngineer ? staffing.filter((item) => item.engineerId === selectedEngineer.id) : []),
    [selectedEngineer, staffing]
  );
  const visibleSections = useMemo(() => Object.values(permissions).filter((permission) => permission.canView).length, [permissions]);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (selectedEngineer) {
      setDisplayName(selectedEngineer.displayName);
      setTransferTargetId((current) => (transferTargets.some((engineer) => engineer.id === current) ? current : transferTargets[0]?.id ?? ""));
    }
  }, [selectedEngineer, transferTargets]);

  if (session?.role !== "admin") return null;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = newPassword || makeTemporaryPassword();
    const result = await createEngineer({ email: newEmail, displayName: newName, password });
    if (!result) return;

    setNotice(`Engineer created. Temporary password: ${result.temporaryPassword ?? password}`);
    setNewEmail("");
    setNewName("");
    setNewPassword("");
  }

  async function handleSaveProfile() {
    if (!selectedEngineer) return;
    await updateEngineerProfile(selectedEngineer.id, { displayName });
    setNotice(`Updated ${selectedEngineer.email}.`);
  }

  async function handleResetPassword() {
    if (!selectedEngineer) return;
    const password = resetPassword || makeTemporaryPassword();
    const result = await resetEngineerPassword(selectedEngineer.id, password);
    if (!result) return;

    setNotice(`Password reset for ${selectedEngineer.email}. Temporary password: ${result.temporaryPassword ?? password}`);
    setResetPassword("");
  }

  async function handleTransferWork() {
    if (!selectedEngineer || !transferTargetId) return;
    await transferEngineerWork(selectedEngineer.id, transferTargetId);
    const target = engineers.find((engineer) => engineer.id === transferTargetId);
    setNotice(`Transferred owned work from ${selectedEngineer.email} to ${target?.email ?? "selected engineer"}.`);
  }

  async function handleClearStaffing() {
    if (!selectedEngineer) return;
    await clearEngineerStaffing(selectedEngineer.id);
    setNotice(`Removed staffing seats for ${selectedEngineer.email}.`);
  }

  async function handleActiveToggle() {
    if (!selectedEngineer) return;
    await setEngineerActive(selectedEngineer.id, !selectedEngineer.active);
    setNotice(`${selectedEngineer.email} ${selectedEngineer.active ? "deactivated" : "reactivated"}.`);
  }

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="technical-label text-accent">Admin Engineer Management</p>
          <h2 className="mt-2 text-xl font-semibold">Add and handle engineers</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Create Supabase Auth engineers, manage lifecycle, and keep work ownership or staffing clean.
          </p>
        </div>
        <UserCog className="h-5 w-5 text-accent" />
      </div>

      {notice ? (
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-cyan-50">
          <span className="break-all">{notice}</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-accent/40 px-2 py-1 text-xs text-cyan-100 transition hover:bg-accent/20 hover:text-white"
              onClick={() => void navigator.clipboard?.writeText(notice)}
              type="button"
            >
              Copy
            </button>
            <button className="text-cyan-100 hover:text-white" onClick={() => setNotice("")} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
        <form className="rounded-md border border-border/80 bg-black/20 p-4" onSubmit={handleCreate}>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-accent" />
            <h3 className="font-semibold">Create engineer</h3>
          </div>
          <div className="mt-4 space-y-3">
            <TextInput label="Email" onChange={setNewEmail} placeholder="engineer@example.com" type="email" value={newEmail} />
            <TextInput label="Display name" onChange={setNewName} placeholder="Engineer name" value={newName} />
            <TextInput label="Temporary password" onChange={setNewPassword} placeholder="Leave empty to generate" type="text" value={newPassword} />
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={!newEmail || !newName}
              type="submit"
            >
              <UserPlus className="h-4 w-4" />
              Add Engineer
            </button>
          </div>
        </form>

        <div className="rounded-md border border-border/80 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr]">
            <label className="block">
              <span className="technical-label text-muted">Select engineer</span>
              <select
                className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent disabled:opacity-60"
                disabled={engineers.length === 0}
                onChange={(event) => void setSelectedEngineerId(event.target.value)}
                value={selectedEngineer?.id ?? ""}
              >
                {engineers.length === 0 ? <option value="">No engineers yet</option> : null}
                {engineers.map((engineer) => (
                  <option key={engineer.id} value={engineer.id}>
                    {engineer.displayName} - {engineer.email}{engineer.active ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </label>

            {selectedEngineer ? (
              <div className="grid gap-2 sm:grid-cols-4">
                <Metric label="Status" value={selectedEngineer.active ? "Active" : "Inactive"} />
                <Metric label="Owned work" value={String(selectedOwnedWork.length)} />
                <Metric label="Staffing seats" value={String(selectedStaffing.length)} />
                <Metric label="Visible sections" value={`${visibleSections}/${dashboardSections.length}`} />
              </div>
            ) : (
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm leading-6 text-yellow-100">
                Create the first engineer to manage permissions, ownership, and staffing.
              </div>
            )}
          </div>

          {selectedEngineer ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="space-y-3 rounded-md border border-border/70 bg-white/[0.03] p-3">
                <TextInput label="Display name" onChange={setDisplayName} value={displayName} />
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white/[0.04] px-4 py-2 text-sm transition hover:border-accent hover:text-white"
                  onClick={handleSaveProfile}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" />
                  Save Profile
                </button>
                <button
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
                    selectedEngineer.active
                      ? "border-danger/50 bg-danger/10 text-red-100 hover:bg-danger/20"
                      : "border-accent/60 bg-accent/15 text-cyan-100 hover:bg-accent/25"
                  }`}
                  onClick={handleActiveToggle}
                  type="button"
                >
                  {selectedEngineer.active ? <ShieldOff className="h-4 w-4" /> : <ShieldPlus className="h-4 w-4" />}
                  {selectedEngineer.active ? "Deactivate Engineer" : "Reactivate Engineer"}
                </button>
              </div>

              <div className="space-y-3 rounded-md border border-border/70 bg-white/[0.03] p-3">
                <TextInput label="New temporary password" onChange={setResetPassword} placeholder="Leave empty to generate" value={resetPassword} />
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white/[0.04] px-4 py-2 text-sm transition hover:border-accent hover:text-white"
                  onClick={handleResetPassword}
                  type="button"
                >
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </button>
                <label className="block">
                  <span className="technical-label text-muted">Transfer owned work to</span>
                  <select
                    className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent disabled:opacity-60"
                    disabled={transferTargets.length === 0}
                    onChange={(event) => setTransferTargetId(event.target.value)}
                    value={transferTargetId}
                  >
                    {transferTargets.length === 0 ? <option value="">No active target engineer</option> : null}
                    {transferTargets.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.displayName} - {engineer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm transition hover:border-accent hover:text-white disabled:opacity-60"
                    disabled={!transferTargetId || selectedOwnedWork.length === 0}
                    onClick={handleTransferWork}
                    type="button"
                  >
                    <UsersRound className="h-4 w-4" />
                    Transfer Work
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm transition hover:border-danger hover:text-red-100 disabled:opacity-60"
                    disabled={selectedStaffing.length === 0}
                    onClick={handleClearStaffing}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                    Clear Staffing
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="technical-label text-muted">{label}</span>
      <input
        className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-black/20 p-2">
      <p className="technical-label text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
