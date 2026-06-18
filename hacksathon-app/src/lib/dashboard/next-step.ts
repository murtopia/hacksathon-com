/**
 * Participant Event Home "your next step" derivation.
 *
 * Progress-driven (not schedule-driven): the home funnels a participant
 * along idea -> Blueprint/first prompt -> build -> showcase based on what
 * they've actually done, with a plain-language action and an optional
 * contextual tip aimed at lowering the "how do I even start" barrier.
 *
 * Pure functions only - the page loads the booleans and hands them in.
 */

export type NextStepId =
  | "add_idea"
  | "build_blueprint"
  | "keep_building"
  | "vote"
  | "showcase";

export interface NextStepInputs {
  hasIdea: boolean;
  hasBrief: boolean;
  ideaCompleted: boolean;
  votingStatus: string | null;
  hasVote: boolean;
  /**
   * Recognized build tool label (e.g. "Lovable") used to personalize the
   * build-step tip. Null for bring-your-own / unset, which falls back to
   * "your AI".
   */
  toolName?: string | null;
}

export interface NextStep {
  id: NextStepId;
  /** Mono-label eyebrow above the action. */
  eyebrow: string;
  /** The action heading. */
  title: string;
  /** Button label. */
  cta: string;
  /** Path suffix for `slugPath(slug, to)`. */
  to: string;
  /** Optional contextual tip, rendered as a quiet line under the action. */
  tip: string | null;
}

export function deriveNextStep({
  hasIdea,
  hasBrief,
  ideaCompleted,
  votingStatus,
  hasVote,
  toolName,
}: NextStepInputs): NextStep {
  if (!hasIdea) {
    return {
      id: "add_idea",
      eyebrow: "Your next step",
      title: "Add your idea",
      cta: "Add your idea",
      to: "idea/new",
      tip: "Stuck? Pick something that annoys you in daily work. Smaller is better.",
    };
  }

  if (!hasBrief) {
    return {
      id: "build_blueprint",
      eyebrow: "Your next step",
      title: "Build your Blueprint and get your first prompt",
      cta: "Build your Blueprint",
      to: "idea",
      tip: "Nervous about the first prompt? You won't write it from scratch - the Blueprint hands you one to paste.",
    };
  }

  if (!ideaCompleted) {
    return {
      id: "keep_building",
      eyebrow: "Your next step",
      title: "Open your project idea",
      cta: "Your Idea",
      to: "idea",
      tip: `Work in small steps. Ask ${toolName ?? "your AI"} for one change at a time, then check it before asking for the next.`,
    };
  }

  if (votingStatus === "open" && !hasVote) {
    return {
      id: "vote",
      eyebrow: "Your next step",
      title: "Cast your votes in the Hacky Awards",
      cta: "Cast your votes",
      to: "awards",
      tip: null,
    };
  }

  return {
    id: "showcase",
    eyebrow: "You're ready",
    title: "Get ready for the showcase",
    cta: "See the IdeaLab",
    to: "idealab",
    tip: "Pitch tip: open with the problem in one sentence, then show the thing working.",
  };
}

/**
 * Friendly, future-leaning relative time for an upcoming scheduled block.
 *
 * Examples (relative to `now`):
 *   today      -> "today at 2:30 PM"
 *   tomorrow   -> "tomorrow at 9:00 AM"
 *   2-6 days   -> "in 3 days"
 *   further    -> "May 11"
 *
 * Returns null when there is no usable date.
 */
export function formatRelativeBlockTime(
  scheduledDate: string | Date | null,
  now: Date = new Date(),
): string | null {
  if (!scheduledDate) return null;
  const d =
    scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
  if (Number.isNaN(d.getTime())) return null;

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dayDiff = Math.round(
    (startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);

  if (dayDiff === 0) return `today at ${time}`;
  if (dayDiff === 1) return `tomorrow at ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `in ${dayDiff} days`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}
