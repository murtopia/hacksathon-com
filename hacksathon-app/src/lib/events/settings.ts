import { createAdminClient } from "@/lib/supabase/admin";

/**
 * `events.settings` JSONB keys the Hacky Helper reads to track admin
 * progress through "soft" milestones - decisions that don't have a
 * dedicated column on `events` but that we still want to mark as done
 * once the admin has reviewed/confirmed them.
 *
 * Each key stores an ISO timestamp of the first time the corresponding
 * UI was saved. Re-saving doesn't bump the value - once stamped, the
 * milestone stays done.
 */
export type EventSettingKey =
  | "team_invited_at"
  | "vanity_confirmed_at"
  | "build_tool_confirmed_at"
  | "showcase_decision_at"
  | "awards_reviewed_at"
  | "reflections_reviewed_at";

/**
 * Idempotently stamp a setting key with the current timestamp.
 *
 * Reads `events.settings`, merges in `{ [key]: <iso now> }` only if the
 * key isn't already set, and writes the result back. Cheap to call on
 * every save handler - the no-op early return keeps repeated saves from
 * round-tripping the DB after the first one (we still incur a SELECT,
 * but no UPDATE on the hot path).
 *
 * Uses the admin client because the caller has already cleared the
 * `requireEventAdmin` guard and we want to write through whatever RLS
 * scoping the calling context has - the milestone is event-scoped, not
 * user-scoped.
 */
export async function stampSetting(
  eventId: string,
  key: EventSettingKey,
): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("settings")
    .eq("id", eventId)
    .maybeSingle<{ settings: Record<string, unknown> | null }>();

  const current = data?.settings ?? {};
  if (current[key]) return;

  const next = { ...current, [key]: new Date().toISOString() };
  await admin.from("events").update({ settings: next }).eq("id", eventId);
}
