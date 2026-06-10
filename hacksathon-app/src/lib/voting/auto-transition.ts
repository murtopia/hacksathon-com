import { openVoting, revealAwards } from "@/lib/voting/transitions";

/**
 * Lazy date-driven voting state transitions.
 *
 * Called from server components that read voting_status (the slug
 * context layout + the admin layout). Compares `now` against the
 * event's voting_open_at / voting_close_at and writes the matching
 * transition if needed:
 *
 *   closed → open      when voting_open_at <= now < voting_close_at
 *   open / closed → revealed   when voting_close_at <= now
 *
 * The function is intentionally tolerant of partial windows: setting
 * only voting_open_at opens voting at that time and leaves it open
 * (no auto-reveal). Setting only voting_close_at auto-reveals at that
 * time even from a still-closed state (rare but well-defined).
 *
 * Fire-and-forget. Errors are swallowed so a slow or failed write
 * never blocks the page render. v1 has no cron - if an event is
 * dormant for hours, the transition runs the next time anyone loads
 * a page. This is acceptable for invitation-only Hacks-a-Thons.
 *
 * Returns the *post-transition* voting_status so callers that just
 * read the row can update their local copy without a re-fetch. Pure
 * convenience - pages that ignore the return still behave correctly
 * because the DB write has already happened by the time the function
 * resolves.
 */
export async function maybeAutoTransitionVoting(event: {
  id: string;
  voting_status: "closed" | "open" | "revealed";
  voting_open_at: string | null;
  voting_close_at: string | null;
}): Promise<"closed" | "open" | "revealed"> {
  if (event.voting_status === "revealed") return "revealed";

  const now = Date.now();
  const openAt = event.voting_open_at
    ? new Date(event.voting_open_at).getTime()
    : null;
  const closeAt = event.voting_close_at
    ? new Date(event.voting_close_at).getTime()
    : null;

  if (closeAt !== null && now >= closeAt) {
    try {
      const res = await revealAwards(event.id);
      if (res.ok) return "revealed";
    } catch {
      // Swallow - page render isn't blocked by a failed transition.
    }
    return event.voting_status;
  }

  if (
    event.voting_status === "closed" &&
    openAt !== null &&
    now >= openAt
  ) {
    try {
      const res = await openVoting(event.id);
      if (res.ok) return "open";
    } catch {
      // Swallow as above.
    }
  }

  return event.voting_status;
}
