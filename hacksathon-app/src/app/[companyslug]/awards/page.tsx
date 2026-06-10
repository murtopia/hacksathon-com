import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  HackyAwardsScreen,
  type RevealedWinner,
} from "@/components/blocks/hacky-awards-screen";
import type {
  BallotCategory,
  BallotIdea,
  BallotInitialPick,
} from "@/components/blocks/award-ballot";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Hacky Awards",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Hacky Awards - the +01 screen at a stable URL.
 *
 * Mirrors the body of `/[slug]/blocks/+01` (which redirects here) so
 * voting / reveal state lives on one path. Block-completion data is
 * still keyed on `+01` in `block_completions`.
 */
export default async function SlugAwardsPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(`/login?next=${encodeURIComponent(slugPath(ctx.slug, "awards"))}`);
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();
  const userId = viewer.user.id;
  const eventId = ctx.event.id;
  const votingStatus = ctx.event.voting_status;
  const resultsPublished = Boolean(ctx.event.results_published_at);

  const [
    { data: categoryRows },
    { data: ideaRows },
    { data: voteRows },
    { data: awardRows },
  ] = await Promise.all([
    supabase
      .from("award_categories")
      .select("id, name, description, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ideas")
      .select("id, title, user_id, profiles(full_name, email)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("votes")
      .select("category_id, idea_id")
      .eq("event_id", eventId)
      .eq("user_id", userId),
    // Only load winners once results are published - keep them private
    // while the ceremony runs.
    votingStatus === "revealed" && resultsPublished
      ? supabase
          .from("awards")
          .select(
            "category_id, winner_idea_id, winner_name, project_title, project_url",
          )
          .eq("event_id", eventId)
      : Promise.resolve({ data: [] as const }),
  ]);

  const categories: BallotCategory[] = (categoryRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    description: (c.description as string | null) ?? null,
    sort_order: (c.sort_order as number) ?? 0,
  }));

  const ideas: BallotIdea[] = (ideaRows ?? []).map((i) => {
    const profileRel = i.profiles as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;
    const ownerName =
      profile?.full_name?.trim() || profile?.email?.split("@")[0] || null;
    return {
      id: i.id as string,
      title: i.title as string,
      ownerName,
      isMine: (i.user_id as string) === userId,
    };
  });

  const myPicks: BallotInitialPick[] = (voteRows ?? []).map((v) => ({
    categoryId: v.category_id as string,
    ideaId: v.idea_id as string,
  }));

  const winners: RevealedWinner[] = (awardRows ?? []).map((a) => {
    const cat = categories.find((c) => c.id === (a.category_id as string));
    return {
      categoryId: a.category_id as string,
      categoryName: cat?.name ?? "Award",
      ideaTitle:
        (a.project_title as string | null) ??
        (a.winner_idea_id
          ? ideas.find((i) => i.id === a.winner_idea_id)?.title ?? null
          : null),
      ownerName: (a.winner_name as string | null) ?? null,
      projectUrl: (a.project_url as string | null) ?? null,
    };
  });

  return (
    <div className="max-w-[var(--container-narrow)] space-y-8">
      <header className="space-y-3">
        <p className="mono-label">{ctx.event.title}</p>
        <h2>Hacky Awards</h2>
        <p className="lead">
          {votingStatus === "open"
            ? "Voting is open. Pick the favorite in each category."
            : votingStatus === "revealed"
              ? resultsPublished
                ? "And the winners are…"
                : "Voting is closed - the winners are being revealed live."
              : "The ballot will open once your organizer flips the switch."}
        </p>
      </header>

      <HackyAwardsScreen
        eventId={eventId}
        votingStatus={votingStatus}
        resultsPublished={resultsPublished}
        categories={categories}
        ideas={ideas}
        myPicks={myPicks}
        winners={winners}
        slug={ctx.slug}
      />
    </div>
  );
}
