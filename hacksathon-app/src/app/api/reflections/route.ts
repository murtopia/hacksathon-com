import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 15;

/**
 * Save (or update) one reflection answer for the current user.
 *
 * Reflections are stored one row per (event, user, question) - the
 * original 00001 schema models them that way. The client posts each
 * answer individually so partial saves are cheap and the API stays
 * simple.
 *
 * Allowed even when the event is locked - the lock semantic only
 * applies to creative artifacts (ideas, briefs, sessions). Reflections
 * are explicitly post-event, so blocking them after reveal would
 * defeat the whole point.
 *
 * Body:
 *   { eventId, questionId, answer }
 * To clear an answer, send an empty string.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    eventId?: unknown;
    questionId?: unknown;
    answer?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const questionId =
    typeof body.questionId === "string" ? body.questionId.trim() : "";
  const rawAnswer = body.answer;
  const answer = typeof rawAnswer === "string" ? rawAnswer : "";

  if (!eventId)
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  if (!questionId)
    return NextResponse.json(
      { error: "questionId is required" },
      { status: 400 },
    );

  // Empty answer + existing row = clear the row. Otherwise upsert.
  if (answer.trim().length === 0) {
    const { error: delError } = await supabase
      .from("reflections")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("question_id", questionId);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  // Confirm the question belongs to this event (defense in depth).
  const { data: question } = await supabase
    .from("reflection_questions")
    .select("id")
    .eq("id", questionId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!question) {
    return NextResponse.json(
      { error: "Question not found for this event" },
      { status: 404 },
    );
  }

  // Status gate: reflections can only be submitted while the event's
  // reflection_status is 'open'. Event admins are exempt so they can
  // fix answers any time (mirrors the RLS policy). The optional
  // reflections_open_at / close_at window auto-flips the status
  // (see auto-transition.ts); this endpoint reads the resolved status.
  const { data: eventRow } = await supabase
    .from("events")
    .select("reflection_status")
    .eq("id", eventId)
    .maybeSingle<{ reflection_status: "closed" | "open" | "complete" }>();

  if (!eventRow || eventRow.reflection_status !== "open") {
    const { data: isAdmin } = await supabase.rpc("is_event_admin", {
      p_event_id: eventId,
    });
    if (!isAdmin) {
      const status = eventRow?.reflection_status ?? "closed";
      return NextResponse.json(
        {
          error:
            status === "complete"
              ? "Reflections are closed - this event has wrapped."
              : "Reflections aren't open yet.",
        },
        { status: 409 },
      );
    }
  }

  const { error: upsertError } = await supabase.from("reflections").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      question_id: questionId,
      answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id,question_id" },
  );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
