import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndSaveReflectionSummary } from "@/lib/reflections/summary";

/**
 * Reflection state transitions, mirroring the voting transitions.
 *
 * Reflections move through an explicit three-state machine:
 *
 *   closed → open       Open reflections (participants can submit).
 *   open   → complete   Mark complete (locks submissions, generates the
 *                       AI recap draft).
 *   complete → open     Reopen (back to collecting; recap kept as-is).
 *
 * All writes go through the admin client - the entry points (admin API
 * + auto-transition) are already gated, and flipping event-level state
 * needs to bypass row policies.
 *
 * The optional reflections_open_at / reflections_close_at window
 * remains as a best-effort auto-schedule layered on top of the manual
 * status (see auto-transition.ts).
 */

export type ReflectionStatus = "closed" | "open" | "complete";

export interface ReflectionTransitionResult {
  ok: boolean;
  status?: ReflectionStatus;
  /** True when "mark complete" succeeded but the recap draft failed. */
  recapFailed?: boolean;
  error?: string;
}

async function setReflectionStatus(
  eventId: string,
  status: ReflectionStatus,
  opts: { stampOpenDate?: boolean; stampCloseDate?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const update: Record<string, unknown> = { reflection_status: status };
  if (opts.stampOpenDate) update.reflections_open_at = new Date().toISOString();
  if (opts.stampCloseDate)
    update.reflections_close_at = new Date().toISOString();

  const { error } = await admin
    .from("events")
    .update(update)
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Open reflections. `stampDateColumn` keeps the optional auto-schedule
 * in lockstep when an organizer opens manually.
 */
export async function openReflections(
  eventId: string,
  opts: { stampDateColumn?: boolean } = {},
): Promise<ReflectionTransitionResult> {
  const res = await setReflectionStatus(eventId, "open", {
    stampOpenDate: opts.stampDateColumn,
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, status: "open" };
}

/**
 * Mark reflections complete. Flips the status (which blocks further
 * participant submissions via RLS) and then generates the AI recap
 * draft. The recap is best-effort: a failed generation still leaves
 * the event marked complete, with `recapFailed` set so the caller can
 * surface a softer error and let the admin retry from the recap panel.
 */
export async function markReflectionsComplete(
  eventId: string,
  opts: { stampDateColumn?: boolean } = {},
): Promise<ReflectionTransitionResult> {
  const res = await setReflectionStatus(eventId, "complete", {
    stampCloseDate: opts.stampDateColumn,
  });
  if (!res.ok) return { ok: false, error: res.error };

  try {
    await generateAndSaveReflectionSummary(eventId);
  } catch {
    return { ok: true, status: "complete", recapFailed: true };
  }
  return { ok: true, status: "complete" };
}

/**
 * Reopen reflections after they were marked complete. Keeps the
 * existing recap draft untouched - the admin can regenerate it once
 * new answers land.
 */
export async function reopenReflections(
  eventId: string,
): Promise<ReflectionTransitionResult> {
  const res = await setReflectionStatus(eventId, "open");
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, status: "open" };
}

/**
 * Close reflections (back to the pre-open state). Used rarely - mostly
 * to walk back an accidental open before anyone has submitted.
 */
export async function closeReflections(
  eventId: string,
): Promise<ReflectionTransitionResult> {
  const res = await setReflectionStatus(eventId, "closed");
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, status: "closed" };
}
