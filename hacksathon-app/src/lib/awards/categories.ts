/**
 * Default award categories seeded on every new event.
 *
 * The `{company}` placeholder in any `name` is interpolated with the
 * organization's name at seed time so we don't have to recompute the
 * label every render. `interpolateCategoryName` is the single source of
 * truth for that substitution - used both in TypeScript (provisionPaidEvent)
 * and mirrored in the SQL backfill (migration 00016).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface AwardCategorySeed {
  key: string;
  name: string;
  description: string;
  sort_order: number;
}

export const DEFAULT_AWARD_CATEGORIES: ReadonlyArray<AwardCategorySeed> = [
  {
    key: "best-in-show",
    name: "Best in Show",
    description:
      "The runaway favorite - the one everyone is still talking about.",
    sort_order: 1,
  },
  {
    key: "shut-up-take-money",
    name: "Shut Up and Take My Money",
    description: "The build you'd hand a credit card to right now.",
    sort_order: 2,
  },
  {
    key: "best-execution",
    name: "Best Execution",
    description: "Polished, working, and obviously cared-for.",
    sort_order: 3,
  },
  {
    key: "most-creative",
    name: "Most Creative Idea",
    description: 'Made you tilt your head and go "huh."',
    sort_order: 4,
  },
  {
    key: "best-shark-tank",
    name: "Best Shark Tank Pitch",
    description: "Sold the room in sixty seconds.",
    sort_order: 5,
  },
  {
    key: "most-company-energy",
    name: "Most {company} Energy",
    description: "Captures the soul of the team.",
    sort_order: 6,
  },
];

/**
 * Replace the `{company}` placeholder in a category name with the org
 * name. Idempotent - a name without the placeholder passes through
 * unchanged, so it's safe to call on data that's already been
 * interpolated.
 */
export function interpolateCategoryName(
  template: string,
  orgName: string | null | undefined,
): string {
  const safe = orgName?.trim() || "Your team";
  return template.replace("{company}", safe);
}

/**
 * Seed the six default award categories for a freshly-created event.
 *
 * Idempotent: if any category exists for the event we treat it as
 * already-seeded and bail. Callers can ignore failures - the migration
 * 00016 backfill keeps existing events whole, so the worst case is one
 * event that has to be re-seeded by hand.
 */
export async function seedAwardCategories(
  client: SupabaseClient,
  params: { eventId: string; orgName: string | null },
): Promise<void> {
  const { data: existing } = await client
    .from("award_categories")
    .select("id")
    .eq("event_id", params.eventId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const rows = DEFAULT_AWARD_CATEGORIES.map((c) => ({
    event_id: params.eventId,
    key: c.key,
    name: interpolateCategoryName(c.name, params.orgName),
    description: c.description,
    sort_order: c.sort_order,
  }));

  await client.from("award_categories").insert(rows);
}
