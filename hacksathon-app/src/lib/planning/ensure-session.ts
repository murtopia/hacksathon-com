import type { PlanningSession } from "./types";

export interface CreatePlanningSessionInput {
  eventId?: string | null;
  ideaId?: string | null;
  buildTool?: string;
}

/**
 * Single source of truth for "I need a planning_sessions row" client
 * bootstrap. POSTs `/api/planning/session`, which seeds the new row
 * with a deterministic Step 1 opening so participants never see a
 * blank chat while a model warms up.
 *
 * Two call sites share this:
 *
 *   1. The standalone `/plan` page's `PlanningFlowWrapper` - creates
 *      a session, then pushes `?session=<id>` into the URL so a hard
 *      reload picks the same session back up.
 *
 *   2. The `BlueprintFlowDialog` inside the `Your Idea` timeline -
 *      creates a session without touching the URL (the slug page
 *      should stay at `/[slug]/idea` while the dialog is open).
 *
 * Both surfaces want identical creation semantics; only the URL-sync
 * step differs.
 */
export async function createPlanningSession(
  input: CreatePlanningSessionInput,
): Promise<PlanningSession> {
  const res = await fetch("/api/planning/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: input.eventId ?? null,
      ideaId: input.ideaId ?? null,
      buildTool: input.buildTool ?? "lovable",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to start planning session.");
  }

  const data = (await res.json()) as { session: PlanningSession };
  // The route already runs `rowToSession()` on the inserted row before
  // serializing the response, so we can use `data.session` directly.
  return data.session;
}
