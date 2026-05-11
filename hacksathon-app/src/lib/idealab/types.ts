/**
 * IdeaLab — types, constants, and small helpers.
 *
 * The Idea type mirrors the `ideas` table after the 00006 + 00009
 * migrations. Status is the Postgres enum (`idea_status`); user-facing
 * labels are derived through STATUS_LABELS to keep the UI consistent.
 */

export type IdeaStatus = "idea_stage" | "in_progress" | "completed";

export interface Idea {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  pitch: string;
  description: string | null;
  targetAudience: string | null;
  problem: string | null;
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
 * Character limits enforced at the input layer and surfaced by the
 * CharCounter UI. Single source of truth so the API, form, and detail
 * view all stay aligned.
 */
export const IDEA_FIELD_LIMITS = {
  title: 80,
  pitch: 140,
  description: 500,
} as const;

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
    status: row.status,
    projectUrl: row.project_url ?? null,
    liveUrl: row.live_url ?? null,
    finalScreenshotUrl: row.final_screenshot_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
