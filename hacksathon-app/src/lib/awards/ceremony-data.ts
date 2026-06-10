import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared loader for the awards ceremony surfaces - the pre-ceremony
 * review screen and the full-screen presenter both read the same
 * computed shape: per-category winner + runner-ups + vote count +
 * warning flags, plus the idea list (for the override editor) and a
 * little event/org meta (for the title + finale slides).
 *
 * The winner/runner-ups come from the snapshot stored on `awards` at
 * reveal time (so organizer overrides are honored). The tie flag is
 * recomputed from raw votes because it isn't part of the snapshot.
 */

export interface CeremonyIdeaOption {
  id: string;
  title: string;
  ownerName: string | null;
}

export interface CeremonyPerson {
  ideaId: string;
  title: string | null;
  ownerName: string | null;
  projectUrl: string | null;
}

export interface CeremonyCategory {
  awardId: string | null;
  categoryId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  winner: CeremonyPerson | null;
  voteCount: number;
  runnerUps: CeremonyPerson[];
  isOverridden: boolean;
  /** "Best in Show" - pulled to the end of the ceremony per the spec. */
  isBestInShow: boolean;
  flags: { zeroVotes: boolean; tie: boolean };
}

export interface CeremonyData {
  categories: CeremonyCategory[];
  ideas: CeremonyIdeaOption[];
  meta: { eventTitle: string; orgName: string | null; year: number };
}

function displayName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  if (email) return email.split("@")[0];
  return null;
}

export async function loadCeremonyData(eventId: string): Promise<CeremonyData> {
  const admin = createAdminClient();

  const [
    { data: eventRow },
    { data: categoryRows },
    { data: awardRows },
    { data: ideaRows },
    { data: voteRows },
  ] = await Promise.all([
    admin
      .from("events")
      .select("title, created_at, organizations(name)")
      .eq("id", eventId)
      .maybeSingle(),
    admin
      .from("award_categories")
      .select("id, name, description, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    admin
      .from("awards")
      .select(
        "id, category_id, winner_idea_id, winner_name, project_title, project_url, vote_count, runner_up_idea_ids, is_overridden",
      )
      .eq("event_id", eventId),
    admin
      .from("ideas")
      .select("id, title, live_url, user_id, profiles(full_name, email)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    admin
      .from("votes")
      .select("category_id, idea_id")
      .eq("event_id", eventId),
  ]);

  const orgRel = eventRow?.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const orgName = Array.isArray(orgRel)
    ? orgRel[0]?.name ?? null
    : orgRel?.name ?? null;

  const ideaMeta = new Map<
    string,
    { title: string | null; ownerName: string | null; projectUrl: string | null }
  >();
  const ideaOptions: CeremonyIdeaOption[] = [];
  for (const i of ideaRows ?? []) {
    const profileRel = i.profiles as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;
    const ownerName = displayName(profile?.full_name, profile?.email);
    ideaMeta.set(i.id as string, {
      title: (i.title as string | null) ?? null,
      ownerName,
      projectUrl: (i.live_url as string | null) ?? null,
    });
    ideaOptions.push({
      id: i.id as string,
      title: (i.title as string | null) ?? "Untitled",
      ownerName,
    });
  }

  // Per-category max-count tie detection from raw votes.
  const tieByCategory = new Map<string, boolean>();
  const tallyByCategory = new Map<string, Map<string, number>>();
  for (const v of voteRows ?? []) {
    const cid = v.category_id as string;
    if (!tallyByCategory.has(cid)) tallyByCategory.set(cid, new Map());
    const tally = tallyByCategory.get(cid)!;
    tally.set(v.idea_id as string, (tally.get(v.idea_id as string) ?? 0) + 1);
  }
  for (const [cid, tally] of tallyByCategory) {
    let max = 0;
    for (const count of tally.values()) if (count > max) max = count;
    const atMax = Array.from(tally.values()).filter((c) => c === max).length;
    tieByCategory.set(cid, max > 0 && atMax >= 2);
  }

  const awardByCategory = new Map<string, NonNullable<typeof awardRows>[number]>();
  for (const a of awardRows ?? []) {
    awardByCategory.set(a.category_id as string, a);
  }

  const categories: CeremonyCategory[] = (categoryRows ?? []).map((c) => {
    const categoryId = c.id as string;
    const name = c.name as string;
    const award = awardByCategory.get(categoryId);
    const winnerIdeaId = (award?.winner_idea_id as string | null) ?? null;

    const winner: CeremonyPerson | null = winnerIdeaId
      ? {
          ideaId: winnerIdeaId,
          title:
            (award?.project_title as string | null) ??
            ideaMeta.get(winnerIdeaId)?.title ??
            null,
          ownerName:
            (award?.winner_name as string | null) ??
            ideaMeta.get(winnerIdeaId)?.ownerName ??
            null,
          projectUrl:
            (award?.project_url as string | null) ??
            ideaMeta.get(winnerIdeaId)?.projectUrl ??
            null,
        }
      : null;

    const runnerUpIds = (award?.runner_up_idea_ids as string[] | null) ?? [];
    const runnerUps: CeremonyPerson[] = runnerUpIds
      .map((id) => {
        const meta = ideaMeta.get(id);
        if (!meta) return null;
        return {
          ideaId: id,
          title: meta.title,
          ownerName: meta.ownerName,
          projectUrl: meta.projectUrl,
        } satisfies CeremonyPerson;
      })
      .filter((r): r is CeremonyPerson => r !== null);

    const voteCount = (award?.vote_count as number | null) ?? 0;

    return {
      awardId: (award?.id as string | null) ?? null,
      categoryId,
      name,
      description: (c.description as string | null) ?? null,
      sortOrder: (c.sort_order as number) ?? 0,
      winner,
      voteCount,
      runnerUps,
      isOverridden: Boolean(award?.is_overridden),
      isBestInShow: /best in show/i.test(name),
      flags: {
        zeroVotes: winner === null || voteCount === 0,
        tie: tieByCategory.get(categoryId) ?? false,
      },
    } satisfies CeremonyCategory;
  });

  let year = new Date().getFullYear();
  if (eventRow?.created_at) {
    const d = new Date(eventRow.created_at as string);
    if (!Number.isNaN(d.getTime())) year = d.getFullYear();
  }

  return {
    categories,
    ideas: ideaOptions,
    meta: {
      eventTitle: (eventRow?.title as string | null) ?? "the Hacks-a-Thon",
      orgName,
      year,
    },
  };
}

/**
 * Order categories for the ceremony presentation: keep the organizer's
 * sort_order, but force "Best in Show" to the very end (Oscars-style),
 * regardless of where it sits in the list.
 */
export function orderForCeremony(
  categories: CeremonyCategory[],
): CeremonyCategory[] {
  const rest = categories.filter((c) => !c.isBestInShow);
  const bestInShow = categories.filter((c) => c.isBestInShow);
  return [...rest, ...bestInShow];
}
