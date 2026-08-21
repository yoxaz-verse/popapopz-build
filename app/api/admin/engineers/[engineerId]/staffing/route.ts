import { NextResponse } from "next/server";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: { engineerId: string } }) {
  try {
    await requireAdminProfile(request);
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("engineer_work_staffing")
      .delete()
      .eq("engineer_id", params.engineerId)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ removed: data?.length ?? 0 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
