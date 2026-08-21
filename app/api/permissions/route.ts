import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client";

export async function GET(request: Request) {
  const supabase = createSupabaseRequestClient(request);
  const { data, error } = await supabase.from("engineer_section_permissions").select("user_id,section_id,can_view,can_edit_progress,updated_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permissions: data });
}

export async function PUT(request: Request) {
  const supabase = createSupabaseRequestClient(request);
  const payload = await request.json();
  const { data, error } = await supabase
    .from("engineer_section_permissions")
    .upsert(payload.permission)
    .select("user_id,section_id,can_view,can_edit_progress,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permission: data });
}
