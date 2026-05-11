/**
 * IdeaLab — types, constants, and small helpers.
 *
 * The Idea type mirrors the `ideas` table after the 00006 migration.
 * Status is the Postgres enum (`idea_status`); user-facing labels are
 * derived through STATUS_LABELS to keep the UI consistent.
 */

export type IdeaStatus = "idea_stage" | "in_progress" | "completed";

export type IdeaCategory =
  | "for_fun"
  | "solve_problem"
  | "work_tool"
  | "something_weird";

export interface Idea {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  pitch: string;
  description: string | null;
  targetAudience: string | null;
  problem: string | null;
  category: IdeaCategory | null;
  status: IdeaStatus;
  projectUrl: string | null;
  liveUrl: string | null;
  finalScreenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Author profile attached to an Idea for rendering owner name on cards
 * and detail views. Populated by the gallery / detail loaders, not
 * stored on the Idea itself.
 */
export interface IdeaWithAuthor extends Idea {
  authorName: string | null;
}

/**
 * Single source of truth for the category list. Order is the order they
 * render in the submission form. `key` is what's persisted; `label` is
 * what the participant sees.
 */
export const CATEGORIES: { key: IdeaCategory; label: string }[] = [
  { key: "for_fun", label: "For fun" },
  { key: "solve_problem", label: "Solve a real problem" },
  { key: "work_tool", label: "Work tool" },
  { key: "something_weird", label: "Something weird" },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label])
) as Record<IdeaCategory, string>;

export function categoryLabel(category: IdeaCategory | null): string | null {
  return category ? CATEGORY_LABEL_MAP[category] : null;
}

/**
 * User-facing status labels. The legacy `idea_stage` value rolls up to
 * "In Progress" so any pre-migration rows render consistently with new
 * ones. Going forward, new submissions default to `in_progress`.
 */
export const STATUS_LABELS: Record<IdeaStatus, string> = {
  idea_stage: "In Progress",
  in_progress: "In Progress",
  completed: "Completed",
};

export function statusLabel(status: IdeaStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Normalize a snake_case row from Supabase into the camelCase Idea
 * shape used everywhere in the app. Accepts unknown shapes so callers
 * can pass `.select("*")` results without casting first.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToIdea(row: any): Idea {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    title: row.title,
    pitch: row.pitch,
    description: row.description ?? null,
    targetAudience: row.target_audience ?? null,
    problem: row.problem ?? null,
    category: row.category ?? null,
    status: row.status,
    projectUrl: row.project_url ?? null,
    liveUrl: row.live_url ?? null,
    finalScreenshotUrl: row.final_screenshot_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
