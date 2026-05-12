import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";

export const maxDuration = 15;

/**
 * Reveal awards. Admin-only.
 *
 * Three things happen in one go (admin client used so the writes don't
 * fight RLS):
 *
 *   1. Tally votes per category → winner per category. Tiebreak rule:
 *      whichever idea has the most votes; on a numeric tie, the idea
 *      with the earlier created_at wins (stable, deterministic, and
 *      kind to whoever showed up to IdeaLab first).
 *   2. Upsert one row in `awards` per category with the winner's
 *      idea / display name / project URL snapshot and announced_at.
 *      Snapshot fields ensure the winners survive even if an idea is
 *      later edited (the event lock makes that hard, but the column
 *      is still freeform pre-lock).
 *   3. Flip events.voting_status='revealed' and events.is_locked=true.
 *      The lock immediately makes ideas / project_briefs / planning
 *      sessions / block_completions read-only via the RLS guards added
 *      in migration 00016.
 *
 * Idempotent: re-posting after a reveal returns the cached winners
 * without re-tallying.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("voting_status")
    .eq("id", eventId)
    .single<{ voting_status: string }>();

  if (!eventRow) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Already revealed → just return what's there.
  if (eventRow.voting_status === "revealed") {
    const { data: existing } = await admin
      .from("awards")
      .select("category_id, winner_idea_id, winner_name, project_title")
      .eq("event_id", eventId);
    return NextResponse.json({ ok: true, alreadyRevealed: true, winners: existing ?? [] });
  }

  // 1. Load votes + categories + ideas in parallel.
  const [
    { data: categories },
    { data: votes },
    { data: ideas },
  ] = await Promise.all([
    admin
      .from("award_categories")
      .select("id, key, name")
      .eq("event_id", eventId),
    admin
      .from("votes")
      .select("category_id, idea_id")
      .eq("event_id", eventId),
    admin
      .from("ideas")
      .select("id, title, user_id, live_url, created_at")
      .eq("event_id", eventId),
  ]);

  const cats = categories ?? [];
  const allVotes = votes ?? [];
  const ideaRows = ideas ?? [];
  const ideaById = new Map(ideaRows.map((i) => [i.id as string, i]));

  // Pre-fetch owner display names once.
  const ownerIds = Array.from(
    new Set(ideaRows.map((i) => i.user_id as string)),
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      (p.full_name as string | null)?.trim() ||
        (p.email as string | null)?.split("@")[0] ||
        "Unknown",
    ]),
  );

  // 2. Tally winners per category.
  const winners: Array<{
    category_id: string;
    winner_idea_id: string | null;
    winner_name: string | null;
    project_title: string | null;
    project_url: string | null;
  }> = [];

  for (const cat of cats) {
    const tally = new Map<string, number>();
    for (const v of allVotes) {
      if (v.category_id !== cat.id) continue;
      tally.set(v.idea_id as string, (tally.get(v.idea_id as string) ?? 0) + 1);
    }

    if (tally.size === 0) {
      // No votes cast in this category — record a winner-less row so
      // the reveal page can render "No votes" cleanly.
      winners.push({
        category_id: cat.id as string,
        winner_idea_id: null,
        winner_name: null,
        project_title: null,
        project_url: null,
      });
      continue;
    }

    // Pick the highest count; tiebreak by earliest idea.created_at.
    let bestIdea: string | null = null;
    let bestCount = -1;
    let bestCreatedAt = "";
    for (const [ideaId, count] of tally) {
      const idea = ideaById.get(ideaId);
      const createdAt = (idea?.created_at as string | null) ?? "";
      if (
        count > bestCount ||
        (count === bestCount && createdAt < bestCreatedAt)
      ) {
        bestIdea = ideaId;
        bestCount = count;
        bestCreatedAt = createdAt;
      }
    }

    const idea = bestIdea ? ideaById.get(bestIdea) : null;
    winners.push({
      category_id: cat.id as string,
      winner_idea_id: bestIdea,
      winner_name: idea
        ? profileById.get(idea.user_id as string) ?? null
        : null,
      project_title: (idea?.title as string | null) ?? null,
      project_url: (idea?.live_url as string | null) ?? null,
    });
  }

  // 3. Upsert awards rows. The `awards` table has no UNIQUE constraint
  // on (event_id, category_id) by default — delete prior + insert keeps
  // the write deterministic.
  await admin.from("awards").delete().eq("event_id", eventId);

  if (winners.length > 0) {
    await admin.from("awards").insert(
      winners.map((w) => ({
        event_id: eventId,
        category_id: w.category_id,
        winner_idea_id: w.winner_idea_id,
        winner_name: w.winner_name,
        project_title: w.project_title,
        project_url: w.project_url,
        announced_at: new Date().toISOString(),
      })),
    );
  }

  // 4. Flip the event state. Lock immediately gates further edits.
  const { error: updateError } = await admin
    .from("events")
    .update({ voting_status: "revealed", is_locked: true })
    .eq("id", eventId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, winners });
}
