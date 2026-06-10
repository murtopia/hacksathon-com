import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { stampSetting } from "@/lib/events/settings";

export const maxDuration = 10;

/**
 * Create a new reflection question for an event. Admin-only.
 *
 * Body: { eventId, questionText, isRequired?, sortOrder? }
 *
 * Reflection questions are editable even after lock - organizers might
 * add follow-up prompts as the conversation evolves after the event.
 */
export async function POST(req: Request) {
  let body: {
    eventId?: unknown;
    questionText?: unknown;
    isRequired?: unknown;
    sortOrder?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 },
    );
  }
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const questionText =
    typeof body.questionText === "string" ? body.questionText.trim() : "";
  if (questionText.length < 4 || questionText.length > 280) {
    return NextResponse.json(
      { error: "Question must be between 4 and 280 characters." },
      { status: 400 },
    );
  }

  const isRequired = body.isRequired === undefined ? true : Boolean(body.isRequired);

  const admin = createAdminClient();

  let sortOrder: number;
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    sortOrder = body.sortOrder;
  } else {
    const { data: last } = await admin
      .from("reflection_questions")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number | null }>();
    sortOrder = (last?.sort_order ?? 0) + 1;
  }

  const { data: inserted, error } = await admin
    .from("reflection_questions")
    .insert({
      event_id: eventId,
      question_text: questionText,
      is_required: isRequired,
      sort_order: sortOrder,
    })
    .select("id, question_text, is_required, sort_order")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Couldn't create question." },
      { status: 500 },
    );
  }

  // Stamp the "reflections reviewed" milestone so the Hacky Helper can
  // flip the corresponding step done.
  await stampSetting(eventId, "reflections_reviewed_at");

  return NextResponse.json({ ok: true, question: inserted });
}
