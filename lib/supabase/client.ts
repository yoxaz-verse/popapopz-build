"use client";

import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseKey, normalizeSupabaseUrl } from "@/lib/supabase/env";

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabasePublishableKey = normalizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    : null;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;
