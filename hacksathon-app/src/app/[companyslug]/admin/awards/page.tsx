import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  AwardCategoriesEditor,
  type AwardCategoryRow,
} from "@/components/admin/sections/award-categories-editor";
import { EventPublicShowcaseSection } from "@/components/admin/sections/event-public-showcase";
import { VotingControls } from "@/components/admin/voting-controls";
import { VotingWindowSection } from "@/components/admin/sections/voting-window";
import { PreCeremonyReview } from "@/components/admin/sections/pre-ceremony-review";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Hacky Awards",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Hacky Awards admin - public showcase toggle, voting state, and the
 * category editor. The showcase toggle lives here (relocated from the
 * old "Branding & access" tab) because it only matters once winners
 * are revealed - i.e. it's a decision that belongs alongside voting
 * and categories, not alongside vanity URL.
 */
export default async function SlugAdminAwardsPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const supabase = await createClient();
  const eventId = ctx.event.id;

  const [{ data: categoryRows }, { count: voteCount }, { count: ideaCount }] =
    await Promise.all([
      supabase
        .from("award_categories")
        .select("id, name, description, sort_order")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .returns<AwardCategoryRow[]>(),
      supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId),
      supabase
        .from("ideas")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId),
    ]);

  return (
    <div className="space-y-10">
      <EventPublicShowcaseSection
        number="01"
        eventId={eventId}
        initialPublicShowcase={ctx.event.public_showcase}
        vanitySlug={ctx.event.vanity_slug}
        votingStatus={ctx.event.voting_status}
        isLocked={ctx.event.is_locked}
      />

      <div className="space-y-3">
        <VotingControls
          number="02"
          eventId={eventId}
          slug={ctx.slug}
          votingStatus={ctx.event.voting_status}
          resultsPublished={Boolean(ctx.event.results_published_at)}
          voteCount={voteCount ?? 0}
          ideaCount={ideaCount ?? 0}
        />
        <VotingWindowSection
          eventId={eventId}
          votingStatus={ctx.event.voting_status}
          initialOpenAt={ctx.event.voting_open_at}
          initialCloseAt={ctx.event.voting_close_at}
          isLocked={ctx.event.is_locked}
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Preview (no real votes / nothing published)
          </span>
          <Link
            href={`/${ctx.slug}/admin/awards/ceremony?preview=1`}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] underline-offset-4 hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            <Play className="size-3" />
            Preview ceremony
          </Link>
          <Link
            href={`/${ctx.slug}/awards/card/preview?preview=1&label=${encodeURIComponent("Best in Show")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] underline-offset-4 hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            <Eye className="size-3" />
            Preview winner card
          </Link>
        </div>
      </div>

      {ctx.event.voting_status === "revealed" &&
        !ctx.event.results_published_at && (
          <PreCeremonyReview
            number="03"
            eventId={eventId}
            slug={ctx.slug}
          />
        )}

      <AwardCategoriesEditor
        number="04"
        eventId={eventId}
        categories={(categoryRows as AwardCategoryRow[]) ?? []}
        isLocked={ctx.event.is_locked}
      />
    </div>
  );
}
