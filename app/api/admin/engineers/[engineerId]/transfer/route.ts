import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse, createSupabaseAdminClient, requireAdminProfile } from "@/lib/supabase/admin";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client";

const transferSchema = z.object({
  targetEngineerId: z.string().uuid()
});

export async function POST(request: Request, { params }: { params: { engineerId: string } }) {
  try {
    await requireAdminProfile(request);
    const input = transferSchema.parse(await request.json());
    const supabaseAdmin = createSupabaseAdminClient();
    const requestClient = createSupabaseRequestClient(request);

    if (params.engineerId === input.targetEngineerId) {
      throw new Error("Choose a different engineer to receive the transferred work.");
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id,role,active")
      .eq("id", input.targetEngineerId)
      .eq("role", "engineer")
      .single();

    if (targetError) throw targetError;
    if (!target?.active) throw new Error("Work can only be transferred to an active engineer.");

    const { data, error } = await requestClient
      .from("engineer_work_assignments")
      .update({ engineer_id: input.targetEngineerId })
      .eq("engineer_id", params.engineerId)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ transferred: data?.length ?? 0 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
