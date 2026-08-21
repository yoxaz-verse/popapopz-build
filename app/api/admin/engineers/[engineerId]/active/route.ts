import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";

const activeSchema = z.object({
  active: z.boolean()
});

export async function PUT(request: Request, { params }: { params: { engineerId: string } }) {
  try {
    const adminProfile = await requireAdminProfile(request);
    const input = activeSchema.parse(await request.json());
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        active: input.active,
        deactivated_at: input.active ? null : new Date().toISOString(),
        deactivated_by: input.active ? null : adminProfile.id
      })
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
