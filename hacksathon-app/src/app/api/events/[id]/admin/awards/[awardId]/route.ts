import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Override a single award row during pre-ceremony review. Admin-only.
 *
 * Lets the organizer correct the auto-computed winner and runner-ups
 * before the ceremony goes live. Body:
 *   { winnerIdeaId: string | null, runnerUpIdeaIds?: string[] }
 *
 * The winner's display fields (winner_name, project_title, project_url)
 * are re-resolved server-side from the chosen idea so the ceremony and
 * showcase stay consistent. Marks the row is_overridden so the UI can
 * badge it and so a re-tally won't clobber it.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  const { id: eventId, awardId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { winnerIdeaId?: unknown; runnerUpIdeaIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const winnerIdeaId =
    typeof body.winnerIdeaId === "string" && body.winnerIdeaId.length > 0
      ? body.winnerIdeaId
      : null;
  const runnerUpIdeaIds = Array.isArray(body.runnerUpIdeaIds)
    ? body.runnerUpIdeaIds.filter((v): v is string => typeof v === "string")
    : undefined;

  const admin = createAdminClient();

  // Confirm the award belongs to this event.
  const { data: award } = await admin
    .from("awards")
    .select("id")
    .eq("id", awardId)
    .eq("event_id", eventId)
    .maybeSingle<{ id: string }>();
  if (!award) {
    return NextResponse.json(
      { error: "Award not found for this event." },
      { status: 404 },
    );
  }

  const updates: Record<string, unknown> = { is_overridden: true };

  if (winnerIdeaId === null) {
    updates.winner_idea_id = null;
    updates.winner_name = null;
    updates.project_title = null;
    updates.project_url = null;
  } else {
    const { data: idea } = await admin
      .from("ideas")
      .select("id, title, user_id, live_url")
      .eq("id", winnerIdeaId)
      .eq("event_id", eventId)
      .maybeSingle<{
        id: string;
        title: string | null;
        user_id: string;
        live_url: string | null;
      }>();
    if (!idea) {
      return NextResponse.json(
        { error: "That idea isn't part of this event." },
        { status: 400 },
      );
    }
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", idea.user_id)
      .maybeSingle<{ full_name: string | null; email: string | null }>();
    const winnerName =
      profile?.full_name?.trim() ||
      profile?.email?.split("@")[0] ||
      null;

    updates.winner_idea_id = idea.id;
    updates.winner_name = winnerName;
    updates.project_title = idea.title;
    updates.project_url = idea.live_url;
  }

  if (runnerUpIdeaIds !== undefined) {
    updates.runner_up_idea_ids = runnerUpIdeaIds;
  }

  const { error } = await admin
    .from("awards")
    .update(updates)
    .eq("id", awardId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
