/**
 * Block status derivation.
 *
 * The participant's "Your timeline" view combines two signals:
 *
 *   1. windowStatus - pure function of the organizer's scheduled_date +
 *      duration_minutes. Drives the "Happening now" / "Upcoming" badge.
 *      The organizer never marks anything by hand; the clock decides.
 *
 *   2. mineDone - boolean per (user, block) computed at read time from:
 *        a. Time fallback: windowStatus === "completed" (the scheduled
 *           window ended for everyone).
 *        b. Auto-derived: idea row exists (01), Blueprint exists (03),
 *           idea is marked Completed (FINAL).
 *        c. Explicit: a row in block_completions for this user (today
 *           only the Shark Tank "Lock my idea" button writes here).
 *
 * Pure functions only - no DB calls. Callers load the bits and hand
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

/**
 * Base keys that admins can add extra "continuation" sessions for (a big
 * team needs more than one Shark Tank pitch slot or Showcase window).
 * Extra sessions get an instance key like `02-2` / `FINAL-3` that derives
 * its behavior from the base via {@link baseBlockKey}.
 */
export const EXTENDABLE_BASE_KEYS = ["02", "FINAL"] as const;
export type ExtendableBaseKey = (typeof EXTENDABLE_BASE_KEYS)[number];

/** Max extra sessions per extendable base (base + this many instances). */
export const MAX_EXTRA_PER_TYPE = 3;

const INSTANCE_KEY_RE = /^(02|FINAL)-(\d+)$/;

/**
 * Map a block key to the base key whose behavior it inherits. Instance
 * keys (`02-2`, `FINAL-3`) collapse to their base (`02`, `FINAL`); every
 * other key returns unchanged. This is what lets extra sessions render
 * the same participant screen and completion rule as the original.
 */
export function baseBlockKey(key: string): string {
  const match = key.match(INSTANCE_KEY_RE);
  return match ? match[1] : key;
}

/** True for an admin-added extra session (e.g. `02-2`, `FINAL-3`). */
export function isInstanceBlockKey(key: string): boolean {
  return INSTANCE_KEY_RE.test(key);
}

/** A canonical key or a valid `02`/`FINAL` instance key. */
export function isValidBlockKey(key: string): boolean {
  return (
    (ALL_BLOCK_KEYS as ReadonlyArray<string>).includes(key) ||
    isInstanceBlockKey(key)
  );
}

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
  hasVote: boolean;
  hasReflection: boolean;
  votingRevealed: boolean;
}

/**
 * Decide whether the current user has completed this block.
 *
 * The order matters: time fallback first (cheap, applies to all blocks),
 * then auto-derive rules, then explicit completion-table membership.
 *
 * M4 adds three additional auto-derive triggers:
 *   - `+01` (Hacky Awards) → user has cast at least one vote, OR voting
 *     has been revealed (post-reveal there's no action left to take).
 *   - `+02` (Reflections) → user has at least one reflection row.
 *   - `FINAL` retains its M3 trigger (idea Completed); voting reveal
 *     does NOT auto-mark FINAL as done because participants still need
 *     to actually show up to the showcase.
 */
export function isMineDone({
  blockKey,
  windowStatus,
  completionsSet,
  hasIdea,
  hasBrief,
  ideaCompleted,
  hasVote,
  hasReflection,
  votingRevealed,
}: MineDoneInputs): boolean {
  if (windowStatus === "completed") return true;
  if (completionsSet.has(blockKey)) return true;

  // Instance sessions (e.g. 02-2, FINAL-2) inherit their base's rule.
  switch (baseBlockKey(blockKey)) {
    case "01":
      return hasIdea;
    case "03":
      return hasBrief;
    case "FINAL":
      return ideaCompleted;
    case "+01":
      return hasVote || votingRevealed;
    case "+02":
      return hasReflection;
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
