/**
 * Block status derivation.
 *
 * The participant's "Your timeline" view combines two signals:
 *
 *   1. windowStatus — pure function of the organizer's scheduled_date +
 *      duration_minutes. Drives the "Happening now" / "Upcoming" badge.
 *      The organizer never marks anything by hand; the clock decides.
 *
 *   2. mineDone — boolean per (user, block) computed at read time from:
 *        a. Time fallback: windowStatus === "completed" (the scheduled
 *           window ended for everyone).
 *        b. Auto-derived: idea row exists (01), Blueprint exists (03),
 *           idea is marked Completed (FINAL).
 *        c. Explicit: a row in block_completions for this user (today
 *           only the Shark Tank "Lock my idea" button writes here).
 *
 * Pure functions only — no DB calls. Callers load the bits and hand
 * them in.
 */

export type BlockKey =
  | "ZERO"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "FINAL"
  | "+01"
  | "+02";

export const ALL_BLOCK_KEYS: ReadonlyArray<BlockKey> = [
  "ZERO",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "FINAL",
  "+01",
  "+02",
];

export type WindowStatus = "upcoming" | "active" | "completed";

/**
 * Compute the organizer-scheduled window status for a block.
 *
 * - No scheduled_date → "upcoming" (organizer hasn't put it on the
 *   calendar yet). This means today's reality, with no dates set on any
 *   block, renders the full timeline as upcoming until per-participant
 *   triggers fire.
 * - Otherwise, the [scheduled_date, scheduled_date + duration_minutes]
 *   half-open window is the "active" period; before it is upcoming;
 *   after it is completed.
 */
export function deriveWindowStatus(
  scheduledDate: string | Date | null,
  durationMinutes: number | null,
  now: Date,
): WindowStatus {
  if (!scheduledDate) return "upcoming";

  const start =
    scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
  if (Number.isNaN(start.getTime())) return "upcoming";

  const duration = Math.max(0, durationMinutes ?? 0);
  const end = new Date(start.getTime() + duration * 60_000);

  if (now < start) return "upcoming";
  if (now < end) return "active";
  return "completed";
}

export interface MineDoneInputs {
  blockKey: BlockKey | string;
  windowStatus: WindowStatus;
  completionsSet: ReadonlySet<string>;
  hasIdea: boolean;
  hasBrief: boolean;
  ideaCompleted: boolean;
}

/**
 * Decide whether the current user has completed this block.
 *
 * The order matters: time fallback first (cheap, applies to all blocks),
 * then auto-derive rules, then explicit completion-table membership.
 */
export function isMineDone({
  blockKey,
  windowStatus,
  completionsSet,
  hasIdea,
  hasBrief,
  ideaCompleted,
}: MineDoneInputs): boolean {
  if (windowStatus === "completed") return true;
  if (completionsSet.has(blockKey)) return true;

  switch (blockKey) {
    case "01":
      return hasIdea;
    case "03":
      return hasBrief;
    case "FINAL":
      return ideaCompleted;
    default:
      return false;
  }
}

export interface NextOpenBlockInput<T> {
  blockKey: BlockKey | string;
  windowStatus: WindowStatus;
  mineDone: boolean;
  sortOrder: number;
  data: T;
}

/**
 * Pick the block to surface in the "Up next" hero on the event home.
 *
 * Preference order: active + not mine-done → upcoming + not mine-done by
 * sort_order. Returns null when every block is already mineDone (the
 * hero hides in that case).
 */
export function nextOpenBlock<T>(
  blocks: ReadonlyArray<NextOpenBlockInput<T>>,
): NextOpenBlockInput<T> | null {
  const candidates = [...blocks]
    .filter((b) => !b.mineDone)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const active = candidates.find((b) => b.windowStatus === "active");
  if (active) return active;

  return candidates[0] ?? null;
}

/**
 * Format the scheduled date for a checklist row. Returns null when no
 * date is set so the caller can hide the pill entirely.
 *
 * Output shape: "Sun, May 11 · 2:30 PM" (Intl date + Intl time joined
 * with a middle dot). Uses the server's locale; future improvement is
 * to switch to the participant's locale when we know it.
 */
export function formatScheduledDate(
  scheduledDate: string | Date | null,
): string | null {
  if (!scheduledDate) return null;
  const d =
    scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
  if (Number.isNaN(d.getTime())) return null;

  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

  return `${datePart} · ${timePart}`;
}
