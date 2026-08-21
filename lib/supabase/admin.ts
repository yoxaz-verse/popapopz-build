import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseKey, normalizeSupabaseUrl } from "@/lib/supabase/env";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client";

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = normalizeSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAdminConfigError =
  !supabaseUrl || !serviceRoleKey
    ? "Missing SUPABASE_SERVICE_ROLE_KEY. Add it as a server-only environment variable in local .env.local and Vercel."
    : null;

export function createSupabaseAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(supabaseAdminConfigError ?? "Supabase admin client is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function requireAdminProfile(request: Request) {
  const requestClient = createSupabaseRequestClient(request);
  const {
    data: { user },
    error: userError
  } = await requestClient.auth.getUser();

  if (userError || !user) {
    throw new Response(JSON.stringify({ error: "Admin authentication is required." }), { status: 401 });
  }

  const { data: profile, error: profileError } = await requestClient
    .from("profiles")
    .select("id,email,role,active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin" || profile.active === false) {
    throw new Response(JSON.stringify({ error: "Only active admin users can manage engineers." }), { status: 403 });
  }

  return profile as { id: string; email: string; role: "admin"; active: boolean | null };
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof Response) return error;

  const message = error instanceof Error ? error.message : "Admin engineer operation failed.";
  const status = /service_role|SUPABASE_SERVICE_ROLE_KEY|configured/i.test(message) ? 500 : 400;
  return new Response(JSON.stringify({ error: message }), { status });
}
