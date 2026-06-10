import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared voting state transitions, callable from both the explicit
 * admin endpoints and the lazy auto-transition helper.
 *
 * Both operate via the admin client - RLS already gates the entry
 * points (admin endpoints + middleware) and these are write-side
 * primitives that need to bypass row policies to flip event state.
 */

export interface OpenVotingResult {
  ok: boolean;
  alreadyOpen?: boolean;
  refused?: "revealed";
  error?: string;
}

/**
 * Open voting for an event. Idempotent. Refuses to downgrade a
 * revealed event back to open.
 *
 * `stampDateColumn`: when true (manual "Open voting now"), also writes
 * voting_open_at = now() so manual and date-driven flows stay in
 * lockstep. When false (auto-transition firing because the existing
 * voting_open_at has passed), leaves the column alone.
 */
export async function openVoting(
  eventId: string,
  opts: { stampDateColumn?: boolean } = {},
): Promise<OpenVotingResult> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("events")
    .select("voting_status")
    .eq("id", eventId)
    .maybeSingle<{ voting_status: string }>();

  if (!current) return { ok: false, error: "Event not found" };
  if (current.voting_status === "revealed") {
    return { ok: false, refused: "revealed" };
  }
  if (current.voting_status === "open") {
    return { ok: true, alreadyOpen: true };
  }

  const update: Record<string, unknown> = { voting_status: "open" };
  if (opts.stampDateColumn) {
    update.voting_open_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("events")
    .update(update)
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface CloseVotingResult {
  ok: boolean;
  alreadyClosed?: boolean;
  refused?: "revealed";
  error?: string;
}

/**
 * Pause voting - the reverse of `openVoting`. Flips `open` back to
 * `closed` so the organizer can hold voting before they're ready to
 * tally. Idempotent. Refuses to touch a `revealed` event: once awards
 * are tallied + locked, the only path forward is publish (you can't
 * reopen voting). Use `revealAwards` for the forward, one-way close.
 */
export async function closeVoting(
  eventId: string,
): Promise<CloseVotingResult> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("events")
    .select("voting_status")
    .eq("id", eventId)
    .maybeSingle<{ voting_status: string }>();

  if (!current) return { ok: false, error: "Event not found" };
  if (current.voting_status === "revealed") {
    return { ok: false, refused: "revealed" };
  }
  if (current.voting_status === "closed") {
    return { ok: true, alreadyClosed: true };
  }

  const { error } = await admin
    .from("events")
    .update({ voting_status: "closed" })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface RevealAwardsResult {
  ok: boolean;
  alreadyRevealed?: boolean;
  winners?: Array<{
    category_id: string;
    winner_idea_id: string | null;
    winner_name: string | null;
    project_title: string | null;
    project_url: string | null;
    vote_count: number;
    runner_up_idea_ids: string[];
  }>;
  error?: string;
}

/**
 * Reveal awards - the PRIVATE tally step.
 *
 * Tallies votes, snapshots winners + runner-ups + vote counts per
 * category, flips voting_status to `revealed`, and locks the event.
 * It deliberately does NOT set results_published_at: winners stay
 * private (organizer-only) until the ceremony is run and
 * `publishResults` is called. The two-step "reveal then publish" is
 * what powers the surprise live ceremony.
 *
 * Idempotent: when already revealed, returns the cached winners
 * without recomputing (so re-running never clobbers organizer
 * overrides made during pre-ceremony review).
 *
 * `stampDateColumn` mirrors `openVoting`: manual "Close voting now"
 * passes true to keep voting_close_at = now() in step.
 */
export async function revealAwards(
  eventId: string,
  opts: { stampDateColumn?: boolean } = {},
): Promise<RevealAwardsResult> {
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("voting_status")
    .eq("id", eventId)
    .maybeSingle<{ voting_status: string }>();

  if (!eventRow) return { ok: false, error: "Event not found" };

  if (eventRow.voting_status === "revealed") {
    const { data: existing } = await admin
      .from("awards")
      .select(
        "category_id, winner_idea_id, winner_name, project_title, project_url, vote_count, runner_up_idea_ids",
      )
      .eq("event_id", eventId);
    return {
      ok: true,
      alreadyRevealed: true,
      winners:
        (existing as RevealAwardsResult["winners"]) ?? [],
    };
  }

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

  const ownerIds = Array.from(
    new Set(ideaRows.map((i) => i.user_id as string)),
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      (p.full_name as string | null)?.trim() ||
        (p.email as string | null)?.split("@")[0] ||
        "Unknown",
    ]),
  );

  const winners: NonNullable<RevealAwardsResult["winners"]> = [];

  for (const cat of cats) {
    const tally = new Map<string, number>();
    for (const v of allVotes) {
      if (v.category_id !== cat.id) continue;
      tally.set(v.idea_id as string, (tally.get(v.idea_id as string) ?? 0) + 1);
    }

    if (tally.size === 0) {
      winners.push({
        category_id: cat.id as string,
        winner_idea_id: null,
        winner_name: null,
        project_title: null,
        project_url: null,
        vote_count: 0,
        runner_up_idea_ids: [],
      });
      continue;
    }

    // Rank ideas by vote count desc, breaking ties by earliest
    // submission so the ordering is deterministic.
    const ranked = Array.from(tally.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const ca = (ideaById.get(a[0])?.created_at as string | null) ?? "";
      const cb = (ideaById.get(b[0])?.created_at as string | null) ?? "";
      return ca < cb ? -1 : ca > cb ? 1 : 0;
    });

    const [bestIdea, bestCount] = ranked[0];

    // Runner-ups = ideas at the highest vote count strictly below the
    // winner's. Captures a tied runner-up group; empty when the winner
    // is the only idea with votes (or everyone tied with the winner).
    const runnerUpCount = ranked.find((r) => r[1] < bestCount)?.[1] ?? null;
    const runnerUpIdeaIds =
      runnerUpCount === null
        ? []
        : ranked.filter((r) => r[1] === runnerUpCount).map((r) => r[0]);

    const idea = ideaById.get(bestIdea);
    winners.push({
      category_id: cat.id as string,
      winner_idea_id: bestIdea,
      winner_name: idea
        ? profileById.get(idea.user_id as string) ?? null
        : null,
      project_title: (idea?.title as string | null) ?? null,
      project_url: (idea?.live_url as string | null) ?? null,
      vote_count: bestCount,
      runner_up_idea_ids: runnerUpIdeaIds,
    });
  }

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
        vote_count: w.vote_count,
        runner_up_idea_ids: w.runner_up_idea_ids,
        announced_at: new Date().toISOString(),
      })),
    );
  }

  const eventUpdate: Record<string, unknown> = {
    voting_status: "revealed",
    is_locked: true,
  };
  if (opts.stampDateColumn) {
    eventUpdate.voting_close_at = new Date().toISOString();
  }

  const { error: updateError } = await admin
    .from("events")
    .update(eventUpdate)
    .eq("id", eventId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true, winners };
}

export interface PublishResultsResult {
  ok: boolean;
  alreadyPublished?: boolean;
  error?: string;
}

/**
 * Publish results - the public step after the ceremony.
 *
 * Stamps events.results_published_at, which is what flips winners into
 * view for participants (their "results coming soon" waiting state
 * clears) and the public showcase. Requires the event to already be
 * `revealed` (tallied + locked). Idempotent.
 */
export async function publishResults(
  eventId: string,
): Promise<PublishResultsResult> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("events")
    .select("voting_status, results_published_at")
    .eq("id", eventId)
    .maybeSingle<{
      voting_status: string;
      results_published_at: string | null;
    }>();

  if (!current) return { ok: false, error: "Event not found" };
  if (current.voting_status !== "revealed") {
    return {
      ok: false,
      error: "Close voting and review the winners before publishing.",
    };
  }
  if (current.results_published_at) {
    return { ok: true, alreadyPublished: true };
  }

  const { error } = await admin
    .from("events")
    .update({ results_published_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
