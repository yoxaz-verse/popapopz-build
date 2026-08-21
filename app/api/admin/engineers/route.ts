import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";

const createEngineerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().trim().min(1).max(80),
  password: z.string().min(6).max(128)
});

export async function POST(request: Request) {
  try {
    const adminProfile = await requireAdminProfile(request);
    const input = createEngineerSchema.parse(await request.json());
    const supabaseAdmin = createSupabaseAdminClient();
    const email = input.email.trim().toLowerCase();

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.displayName
      }
    });

    if (createError) throw createError;
    if (!createdUser.user) throw new Error("Supabase did not return the created engineer user.");

    const { data: engineer, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: createdUser.user.id,
        email,
        role: "engineer",
        display_name: input.displayName,
        active: true,
        deactivated_at: null,
        deactivated_by: null
      })
      .select("id,email,display_name,active,deactivated_at")
      .single();

    if (profileError) throw profileError;

    const { error: permissionError } = await supabaseAdmin.rpc("ensure_default_engineer_permissions", {
      target_user_id: createdUser.user.id
    });

    if (permissionError) throw permissionError;

    return NextResponse.json({
      engineer: {
        id: engineer.id,
        email: engineer.email,
        displayName: engineer.display_name || engineer.email,
        active: engineer.active ?? true,
        deactivatedAt: engineer.deactivated_at
      },
      temporaryPassword: input.password,
      createdBy: adminProfile.email
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
