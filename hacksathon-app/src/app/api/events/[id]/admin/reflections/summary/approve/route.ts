import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Stamp the reflection summary as approved.
 *
 * For M4 the approval is internal-only — it doesn't gate any public
 * surface yet. M5 (Public Results) will use approved_at to decide
 * whether to render the recap on the vanity URL.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: row } = await admin
    .from("events")
    .select("reflection_summary")
    .eq("id", eventId)
    .maybeSingle<{ reflection_summary: string | null }>();

  if (!row?.reflection_summary?.trim()) {
    return NextResponse.json(
      { error: "Generate a summary before approving it." },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("events")
    .update({ reflection_summary_approved_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
