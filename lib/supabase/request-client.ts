import { createClient } from "@supabase/supabase-js";

export function createSupabaseRequestClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: authorization ? { Authorization: authorization } : {}
    }
  });
}
