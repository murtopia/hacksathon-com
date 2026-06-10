import { createAdminClient } from "@/lib/supabase/admin";

export type ReflectionStatus = "closed" | "open" | "complete";

/**
 * Lazy date-driven reflection status transitions.
 *
 * Mirrors `maybeAutoTransitionVoting`: when the organizer set an
 * optional reflection window, this flips `reflection_status` as the
 * clock crosses the boundaries. Called from the slug context on render.
 *
 *   closed → open       when reflections_open_at <= now < close
 *   open   → complete    when reflections_close_at <= now
 *
 * Deliberately a STATUS FLIP ONLY: auto-close does NOT generate the AI
 * recap (that would mean an LLM call on a page render). The organizer
 * generates the recap from the admin panel once the window closes - or
 * marks complete manually, which does generate it.
 *
 * Fire-and-forget. Errors are swallowed so a slow/failed write never
 * blocks the page render. No cron in v1 - the flip happens the next
 * time someone loads a page after the boundary.
 */
export async function maybeAutoTransitionReflections(event: {
  id: string;
  reflection_status: ReflectionStatus;
  reflections_open_at: string | null;
  reflections_close_at: string | null;
}): Promise<ReflectionStatus> {
  if (event.reflection_status === "complete") return "complete";

  const now = Date.now();
  const openAt = event.reflections_open_at
    ? new Date(event.reflections_open_at).getTime()
    : null;
  const closeAt = event.reflections_close_at
    ? new Date(event.reflections_close_at).getTime()
    : null;

  if (closeAt !== null && now >= closeAt) {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("events")
        .update({ reflection_status: "complete" })
        .eq("id", event.id);
      if (!error) return "complete";
    } catch {
      // Swallow - render isn't blocked by a failed transition.
    }
    return event.reflection_status;
  }

  if (
    event.reflection_status === "closed" &&
    openAt !== null &&
    now >= openAt
  ) {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("events")
        .update({ reflection_status: "open" })
        .eq("id", event.id);
      if (!error) return "open";
    } catch {
      // Swallow as above.
    }
  }

  return event.reflection_status;
}
