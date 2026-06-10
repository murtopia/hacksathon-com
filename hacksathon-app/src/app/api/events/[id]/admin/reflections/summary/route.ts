import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";
import { generateAndSaveReflectionSummary } from "@/lib/reflections/summary";

export const maxDuration = 60;

/**
 * POST  → generate (or regenerate) the AI reflection summary.
 *         Reads every reflection for the event, calls Claude with a
 *         celebratory-recap prompt, and saves the markdown to
 *         events.reflection_summary. Stamps generated_at, clears
 *         approved_at so the new draft isn't accidentally "still
 *         approved" from a prior run.
 *
 * PATCH → save organizer edits to the draft. Pure storage; no AI call.
 *         Clears approved_at so any prior approval has to be re-issued
 *         after an edit.
 *
 * Approve lives in /approve/route.ts as a separate POST. The generation
 * itself lives in src/lib/reflections/summary.ts so the "Mark
 * reflections complete" transition can reuse it.
 */

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let summary: string;
  try {
    summary = await generateAndSaveReflectionSummary(eventId);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, summary });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { summary?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.summary !== "string") {
    return NextResponse.json(
      { error: "summary is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      reflection_summary: body.summary,
      reflection_summary_approved_at: null,
    })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
