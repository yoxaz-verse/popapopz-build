import { NextResponse } from "next/server";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client";

export async function GET(request: Request) {
  const supabase = createSupabaseRequestClient(request);
  const { data, error } = await supabase.from("section_progress_with_user").select("section_id,percent,status,note,updated_by_email,updated_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ progress: data });
}

export async function PUT(request: Request) {
  const supabase = createSupabaseRequestClient(request);
  const payload = await request.json();
  const { section_id, percent, status, note } = payload.progress;
  const { data, error } = await supabase
    .from("section_progress")
    .update({ percent, status, note })
    .eq("section_id", section_id)
    .select("section_id,percent,status,note,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ progress: data });
}
