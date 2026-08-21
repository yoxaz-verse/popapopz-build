"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Shield, Wrench } from "lucide-react";
import { useAccessStore } from "@/store/access-store";
import type { UserRole } from "@/types/access";

const roleEmails: Record<UserRole, string> = {
  admin: "popapopzfoods@gmail.com",
  engineer: "taracv1411@gmail.com"
};

export function LoginPage({ role }: { role: UserRole }) {
  const router = useRouter();
  const session = useAccessStore((state) => state.session);
  const initialize = useAccessStore((state) => state.initialize);
  const login = useAccessStore((state) => state.login);
  const logout = useAccessStore((state) => state.logout);
  const loading = useAccessStore((state) => state.loading);
  const authChecked = useAccessStore((state) => state.authChecked);
  const storeError = useAccessStore((state) => state.error);
  const [email, setEmail] = useState(roleEmails[role]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!authChecked || loading || !session) return;

    if (session.role === role) {
      router.replace("/");
      return;
    }

    setError(`You are signed in as ${session.role}. Sign in with a ${role} account for this page.`);
    void logout();
  }, [authChecked, loading, logout, role, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const success = await login(role, email, password);

    if (!success) {
      setError("Supabase login failed for this role.");
      return;
    }

    router.replace("/");
  }

  const alternateRole = role === "admin" ? "engineer" : "admin";

  return (
    <main className="flex min-h-screen items-center justify-center p-4 text-foreground">
      <section className="panel w-full max-w-md rounded-lg p-6">
        <p className="technical-label text-accent">POPAPOPZ Access</p>
        <h1 className="mt-2 text-2xl font-semibold capitalize">{role} login</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in with the Supabase Auth account assigned to this dashboard role.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-slate-200 transition hover:border-accent hover:text-white"
            href="/login/admin"
          >
            <Shield className="h-4 w-4" />
            Admin Login
          </Link>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-slate-200 transition hover:border-accent hover:text-white"
            href="/login/engineer"
          >
            <Wrench className="h-4 w-4" />
            Engineer Login
          </Link>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="technical-label text-muted">Email</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="technical-label text-muted">Password</span>
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-border bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-accent"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error || storeError ? (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-100">{storeError || error}</p>
          ) : null}
          {storeError ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-5 text-yellow-100">
              If this is a new Supabase project, create the Auth users and run `supabase/migrations/20260821_access_progress.sql`.
            </p>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            disabled={loading}
            type="submit"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : `Login as ${role}`}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <span className="text-muted">Need {alternateRole} access?</span>
          <Link className="font-medium text-accent hover:text-cyan-200" href={`/login/${alternateRole}`}>
            Open {alternateRole} login
          </Link>
        </div>
      </section>
    </main>
  );
}
