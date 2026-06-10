import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { captureServer } from "@/lib/analytics/server";
import { AnalyticsEvent } from "@/lib/analytics/events";

export const maxDuration = 15;

/**
 * Cast (or update) the current user's vote in one category.
 *
 * Idempotent: the `votes` table has UNIQUE (event_id, user_id, category_id),
 * so re-posting overwrites the participant's existing pick. Postgres RLS
 * gates the operation on `events.voting_status = 'open'` - if voting is
 * closed or revealed, the underlying upsert returns no rows and we
 * surface a 409.
 *
 * Self-vote policy: allowed. The UI shows a soft "That's your idea"
 * label next to the participant's own option but doesn't block.
 *
 * To delete a vote (clear a pick), POST with `ideaId: null`.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventId?: unknown; categoryId?: unknown; ideaId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const categoryId =
    typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  const rawIdea = body.ideaId;
  const ideaId =
    typeof rawIdea === "string" && rawIdea.trim().length > 0
      ? rawIdea.trim()
      : null;

  if (!eventId)
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  if (!categoryId)
    return NextResponse.json(
      { error: "categoryId is required" },
      { status: 400 },
    );

  // Confirm the category belongs to this event (defense in depth - RLS
  // already filters non-members at the event level).
  const { data: cat } = await supabase
    .from("award_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!cat) {
    return NextResponse.json(
      { error: "Category not found for this event" },
      { status: 404 },
    );
  }

  // ideaId === null is the "clear my pick" path.
  if (ideaId === null) {
    const { error: delError } = await supabase
      .from("votes")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("category_id", categoryId);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  // Confirm the idea belongs to this event so participants can't vote
  // for cross-event picks via a crafted body.
  const { data: idea } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", ideaId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!idea) {
    return NextResponse.json(
      { error: "Idea not found for this event" },
      { status: 404 },
    );
  }

  const { data: upserted, error: upsertError } = await supabase
    .from("votes")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        category_id: categoryId,
        idea_id: ideaId,
      },
      { onConflict: "event_id,user_id,category_id" },
    )
    .select("id")
    .maybeSingle();

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 },
    );
  }

  // RLS will have silently dropped the upsert if voting isn't open.
  if (!upserted) {
    return NextResponse.json(
      { error: "Voting isn't open for this event" },
      { status: 409 },
    );
  }

  await captureServer({
    distinctId: user.id,
    event: AnalyticsEvent.VoteCast,
    properties: { event_id: eventId, category_id: categoryId },
  });

  return NextResponse.json({ ok: true });
}
