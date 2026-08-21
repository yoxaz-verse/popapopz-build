import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";

const resetPasswordSchema = z.object({
  password: z.string().min(6).max(128)
});

export async function POST(request: Request, { params }: { params: { engineerId: string } }) {
  try {
    await requireAdminProfile(request);
    const input = resetPasswordSchema.parse(await request.json());
    const supabaseAdmin = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,role")
      .eq("id", params.engineerId)
      .eq("role", "engineer")
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error("Engineer profile was not found.");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(params.engineerId, {
      password: input.password
    });

    if (error) throw error;

    return NextResponse.json({ temporaryPassword: input.password });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
