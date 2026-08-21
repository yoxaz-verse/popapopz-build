import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";

const updateEngineerSchema = z.object({
  displayName: z.string().trim().min(1).max(80)
});

export async function PATCH(request: Request, { params }: { params: { engineerId: string } }) {
  try {
    await requireAdminProfile(request);
    const input = updateEngineerSchema.parse(await request.json());
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ display_name: input.displayName })
      .eq("id", params.engineerId)
      .eq("role", "engineer")
      .select("id,email,display_name,active,deactivated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      engineer: {
        id: data.id,
        email: data.email,
        displayName: data.display_name || data.email,
        active: data.active ?? true,
        deactivatedAt: data.deactivated_at
      }
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
