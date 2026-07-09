import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site/site-header";
import { ShowcaseSubNav } from "@/components/showcase/showcase-sub-nav";
import {
  WinnersList,
  type WinnerListEntry,
} from "@/components/showcase/winners-list";
import {
  IdeaGallery,
  type IdeaGalleryEntry,
  type IdeaStatus,
} from "@/components/showcase/idea-gallery";
import {
  BlocksPlaybook,
  type PlaybookBlock,
} from "@/components/showcase/blocks-playbook";
import {
  ReflectionQuotes,
  type ReflectionQuote,
} from "@/components/showcase/reflection-quotes";
import { ShowcaseRecap } from "@/components/showcase/showcase-recap";
import { ShowcaseCtaBanner } from "@/components/showcase/showcase-cta-banner";
import {
  Seven2Opening,
  Seven2Setup,
  Seven2WhatHappenedAfter,
} from "@/components/showcase/seven2-narrative";
import { SiteFooter } from "@/components/site/site-footer";
import type { SlugContext } from "@/lib/routing/slug-context";

interface EventShowcaseProps {
  ctx: SlugContext;
  /**
   * When the viewer is a signed-in member/admin, the slug layout already
   * supplies the top bar, participant nav, page `<main>`, and footer - so
   * we render only the section stack and skip the public chrome. This
   * avoids a nested `<main>` and a doubled `SiteFooter`.
   */
  viewerIsMember: boolean;
  viewerIsAdmin?: boolean;
}

/**
 * The canonical public wrap-up for an event, rendered at the vanity URL
 * (`/[slug]`) once `public_showcase` + `results_published_at` are set.
 *
 * One scrollable surface driven entirely by event data:
 *   recap -> every project (with status) -> the playbook ->
 *   winners -> the team's own words.
 *
 * Reads via the admin client so anonymous visitors resolve fine and
 * seeded projects (no linked profile) render through their
 * `builder_name` snapshot.
 */
export async function EventShowcase({
  ctx,
  viewerIsMember,
}: EventShowcaseProps) {
  const { event, org } = ctx;
  const admin = createAdminClient();

  const [
    { data: awardRows },
    { data: ideaRows },
    { data: blockRows },
    { data: reflectionRows },
  ] = await Promise.all([
    admin
      .from("awards")
      .select(
        `id, winner_idea_id, winner_name, project_url,
         award_categories!inner(name, sort_order),
         ideas(live_url, builder_name, profiles(full_name, email))`,
      )
      .eq("event_id", event.id)
      .order("sort_order", {
        referencedTable: "award_categories",
        ascending: true,
      }),
    admin
      .from("ideas")
      .select(
        "id, title, pitch, status, live_url, final_screenshot_url, hero_crop_x, builder_name, profiles(full_name, email)",
      )
      .eq("event_id", event.id)
      .order("created_at", { ascending: true }),
    admin
      .from("blocks")
      .select(
        "block_key, title, subtitle, duration_minutes, description, purpose, sort_order",
      )
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true }),
    admin
      .from("reflections")
      .select(
        "id, answer, respondent_name, created_at, reflection_questions(question_text), profiles(full_name, email)",
      )
      .eq("event_id", event.id)
      .eq("is_featured", true)
      .order("created_at", { ascending: true }),
  ]);

  // ---- Winners ----
  const winners: WinnerListEntry[] = ((awardRows as AwardJoin[] | null) ?? [])
    .map((a) => {
      const category = first(a.award_categories);
      if (!category) return null;
      const idea = first(a.ideas);
      const author = first(idea?.profiles);
      return {
        awardId: a.id,
        categoryName: category.name,
        winnerName:
          idea?.builder_name ??
          displayName(author?.full_name, author?.email) ??
          a.winner_name ??
          null,
        demoUrl: idea?.live_url ?? a.project_url ?? null,
      } satisfies WinnerListEntry;
    })
    .filter((w): w is WinnerListEntry => w !== null);

  const winnerIdeaIds = new Set(
    ((awardRows as AwardJoin[] | null) ?? [])
      .map((a) => a.winner_idea_id)
      .filter((id): id is string => Boolean(id)),
  );

  // ---- Every project ----
  const ideas: IdeaGalleryEntry[] = (
    (ideaRows as IdeaListRow[] | null) ?? []
  ).map((i) => {
    const author = first(i.profiles);
    return {
      ideaId: i.id,
      title: i.title,
      pitch: i.pitch,
      authorName:
        i.builder_name ?? displayName(author?.full_name, author?.email),
      liveUrl: i.live_url,
      screenshotUrl: i.final_screenshot_url,
      heroCropX: i.hero_crop_x ?? 50,
      isWinner: winnerIdeaIds.has(i.id),
      status: i.status as IdeaStatus,
    } satisfies IdeaGalleryEntry;
  });

  const builtCount = ideas.filter(
    (i) => i.status === "completed" || i.status === "in_progress",
  ).length;

  // ---- Playbook ----
  const blocks: PlaybookBlock[] = ((blockRows as BlockRow[] | null) ?? []).map(
    (b) => ({
      blockKey: b.block_key,
      title: b.title,
      subtitle: b.subtitle,
      durationMinutes: b.duration_minutes,
      description: b.description,
      purpose: b.purpose,
    }),
  );

  // ---- Voices ----
  const quotes: ReflectionQuote[] = (
    (reflectionRows as ReflectionRow[] | null) ?? []
  ).map((r) => {
    const author = first(r.profiles);
    const q = first(r.reflection_questions);
    return {
      id: r.id,
      answer: r.answer,
      respondentName:
        r.respondent_name ?? displayName(author?.full_name, author?.email),
      question: q?.question_text ?? null,
    } satisfies ReflectionQuote;
  });

  const approvedRecap =
    event.reflection_summary &&
    event.reflection_summary_approved_at &&
    event.reflection_summary.trim().length > 0
      ? event.reflection_summary
      : null;

  const contextLabel = event.title;
  const recapHeading = org?.name ? `The ${org.name} Case Study` : undefined;

  // The seeded Seven2 case study gets the locked narrative layer from
  // site-copy-final-for-cursor.md wrapped around the live showcase data,
  // in the doc's order: opening, setup, projects, run-of-show, awards,
  // quotes, recap (reframed), what happened after.
  const isSeven2CaseStudy = org?.slug === "seven2";

  // Only advertise anchors for sections that actually render.
  const navItems = (
    isSeven2CaseStudy
      ? [
          ideas.length > 0 ? { label: "Projects", href: "#ideas" } : null,
          blocks.length > 0 ? { label: "How It Ran", href: "#playbook" } : null,
          winners.length > 0 ? { label: "Awards", href: "#winners" } : null,
          quotes.length > 0 ? { label: "Quotes", href: "#voices" } : null,
          approvedRecap ? { label: "Recap", href: "#recap" } : null,
        ]
      : [
          approvedRecap ? { label: "Recap", href: "#recap" } : null,
          ideas.length > 0 ? { label: "Projects", href: "#ideas" } : null,
          blocks.length > 0
            ? { label: "How we ran it", href: "#playbook" }
            : null,
          winners.length > 0 ? { label: "Awards", href: "#winners" } : null,
          quotes.length > 0 ? { label: "Quotes", href: "#voices" } : null,
        ]
  ).filter((item): item is { label: string; href: string } => item !== null);

  const sections = isSeven2CaseStudy ? (
    <>
      <Seven2Opening />
      <Seven2Setup />
      <IdeaGallery
        ideas={ideas}
        eyebrow="Every project"
        heading="What the team built"
        blurb={`${ideas.length} projects, one per participant - ${builtCount} shipped a working build.`}
      />
      <BlocksPlaybook
        blocks={blocks}
        heading="How It Ran"
        blurb="The whole event fit inside about two and a half weeks without touching a client deadline. Below is the actual schedule Seven2 used, block by block. Steal it."
      />
      <WinnersList winners={winners} />
      <ReflectionQuotes quotes={quotes} />
      {approvedRecap && (
        <ShowcaseRecap
          summary={approvedRecap}
          eyebrow={contextLabel}
          heading="Reflections"
          subhead="This summary was generated by the platform from the team's own reflection answers."
        />
      )}
      <Seven2WhatHappenedAfter />
    </>
  ) : (
    <>
      {approvedRecap && (
        <ShowcaseRecap
          summary={approvedRecap}
          eyebrow={contextLabel}
          heading={recapHeading}
        />
      )}
      <IdeaGallery
        ideas={ideas}
        eyebrow="Every project"
        heading="What the team built"
        blurb={`${ideas.length} projects, one per participant - ${builtCount} shipped a working build.`}
      />
      <BlocksPlaybook blocks={blocks} />
      <WinnersList winners={winners} />
      <ReflectionQuotes quotes={quotes} />
    </>
  );

  // Members get the slug layout's own chrome (top bar + participant nav +
  // page main + footer); render just the sections to avoid nesting.
  if (viewerIsMember) {
    return <div className="[&_section]:scroll-mt-28">{sections}</div>;
  }

  return (
    <>
      <SiteHeader />
      <ShowcaseSubNav navItems={navItems} />
      <main className="min-h-screen [&_section]:scroll-mt-28">
        {sections}
        <ShowcaseCtaBanner />
        <SiteFooter />
      </main>
    </>
  );
}

// ============================================
// Join row types
// ============================================
type Profile = { full_name: string | null; email: string };
type AwardIdeaJoin = {
  live_url: string | null;
  builder_name: string | null;
  profiles: Profile | Profile[] | null;
};
type AwardJoin = {
  id: string;
  winner_idea_id: string | null;
  winner_name: string | null;
  project_url: string | null;
  award_categories:
    | { name: string; sort_order: number }
    | { name: string; sort_order: number }[]
    | null;
  ideas: AwardIdeaJoin | AwardIdeaJoin[] | null;
};
type IdeaListRow = {
  id: string;
  title: string;
  pitch: string | null;
  status: string;
  live_url: string | null;
  final_screenshot_url: string | null;
  hero_crop_x: number;
  builder_name: string | null;
  profiles: Profile | Profile[] | null;
};
type BlockRow = {
  block_key: string;
  title: string;
  subtitle: string | null;
  duration_minutes: number;
  description: string | null;
  purpose: string | null;
  sort_order: number;
};
type ReflectionRow = {
  id: string;
  answer: string;
  respondent_name: string | null;
  created_at: string;
  reflection_questions:
    | { question_text: string }
    | { question_text: string }[]
    | null;
  profiles: Profile | Profile[] | null;
};

// ============================================
// Helpers
// ============================================
function first<T>(rel: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(rel)) return rel[0];
  return rel ?? undefined;
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
