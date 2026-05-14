import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";
import { ShowcaseHero } from "@/components/showcase/showcase-hero";
import {
  WinnersGrid,
  type WinnerEntry,
} from "@/components/showcase/winners-grid";
import { ShowcaseRecap } from "@/components/showcase/showcase-recap";
import {
  IdeaGallery,
  type IdeaGalleryEntry,
} from "@/components/showcase/idea-gallery";
import { ShowcaseTeaser } from "@/components/showcase/showcase-teaser";
import { ShowcaseFooter } from "@/components/showcase/showcase-footer";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

// ============================================
// Shared types
// ============================================
interface VanityEventRow {
  id: string;
  title: string;
  logo_url: string | null;
  welcome_message: string | null;
  organization_id: string;
  vanity_slug: string;
  public_showcase: boolean;
  voting_status: "closed" | "open" | "revealed";
  reflection_summary: string | null;
  reflection_summary_approved_at: string | null;
  created_at: string;
}

interface OrgRow {
  name: string;
  logo_url: string | null;
}

// ============================================
// generateMetadata
// ============================================
/**
 * SEO + OG metadata for the vanity URL. We resolve the event title and
 * logo via the admin client (anonymous visitors don't have RLS read
 * access, but we deliberately expose identity fields publicly here —
 * the same fields a logged-out visitor would see on the page itself).
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { companyslug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  if (isReservedSlug(slug)) {
    return { title: "Event" };
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, title, logo_url, organization_id, public_showcase, voting_status")
    .ilike("vanity_slug", slug)
    .maybeSingle<
      Pick<
        VanityEventRow,
        "id" | "title" | "logo_url" | "organization_id" | "public_showcase" | "voting_status"
      >
    >();

  if (!event) {
    return { title: "Event" };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("name, logo_url")
    .eq("id", event.organization_id)
    .maybeSingle<OrgRow>();

  const imageUrl = event.logo_url ?? org?.logo_url ?? null;
  const title = org?.name ? `${event.title} · ${org.name}` : event.title;
  const description = event.public_showcase
    ? event.voting_status === "revealed"
      ? `Winners, every idea, and the recap from ${event.title}.`
      : `${event.title} — coming soon to Hacksathon.com.`
    : `Sign in to ${event.title} on Hacksathon.com.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

// ============================================
// Page
// ============================================
/**
 * Vanity URL dispatcher.
 *
 * Three render paths, evaluated in order:
 *
 *   1. Reserved slug → notFound() (defense in depth; Next routing also
 *      prefers concrete routes).
 *   2. event.public_showcase = true:
 *      - voting_status = 'revealed' → full public showcase
 *        (anonymous visitors welcome, no auth required)
 *      - otherwise → branded teaser (no idea/winner data leaks)
 *   3. event.public_showcase = false → existing soft-entry behavior
 *      (member redirect, private-event card, or signed-in CTA).
 */
export default async function VanityCompanyPage({ params }: PageProps) {
  const { companyslug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  if (isReservedSlug(slug)) notFound();

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select(
      "id, title, logo_url, welcome_message, organization_id, vanity_slug, public_showcase, voting_status, reflection_summary, reflection_summary_approved_at, created_at",
    )
    .ilike("vanity_slug", slug)
    .maybeSingle<VanityEventRow>();

  if (!event) notFound();

  const { data: org } = await admin
    .from("organizations")
    .select("name, logo_url")
    .eq("id", event.organization_id)
    .maybeSingle<OrgRow>();

  // ============================================
  // Public showcase path
  // ============================================
  if (event.public_showcase) {
    if (event.voting_status === "revealed") {
      return (
        <RevealedShowcase
          event={event}
          orgName={org?.name ?? null}
          fallbackLogoUrl={org?.logo_url ?? null}
        />
      );
    }
    return (
      <main className="min-h-screen">
        <ShowcaseTeaser
          logoUrl={event.logo_url ?? org?.logo_url ?? null}
          orgName={org?.name ?? null}
          eventTitle={event.title}
          expectedRevealLabel={null}
        />
        <ShowcaseFooter />
      </main>
    );
  }

  // ============================================
  // Soft-entry path (private events)
  // ============================================
  return renderSoftEntry({
    event,
    org: org ?? null,
  });
}

// ============================================
// Revealed showcase data + render
// ============================================
async function RevealedShowcase({
  event,
  orgName,
  fallbackLogoUrl,
}: {
  event: VanityEventRow;
  orgName: string | null;
  fallbackLogoUrl: string | null;
}) {
  const admin = createAdminClient();

  // Two parallel queries:
  //   - awards joined with categories + winning idea + author profile
  //   - all ideas (with author profiles) for the gallery
  //   - first/last block scheduled_date for the date range label
  const [{ data: awardRows }, { data: ideaRows }, { data: blockRows }] =
    await Promise.all([
      admin
        .from("awards")
        .select(
          `id,
          winner_idea_id,
          winner_name,
          project_title,
          project_url,
          award_categories!inner(name, description, sort_order),
          ideas(
            id, title, pitch, description, live_url, final_screenshot_url, hero_crop_x,
            profiles!inner(full_name, email)
          )`,
        )
        .eq("event_id", event.id)
        .order("sort_order", {
          referencedTable: "award_categories",
          ascending: true,
        }),
      admin
        .from("ideas")
        .select(
          "id, title, pitch, live_url, final_screenshot_url, hero_crop_x, user_id, profiles!inner(full_name, email)",
        )
        .eq("event_id", event.id)
        .order("created_at", { ascending: true }),
      admin
        .from("blocks")
        .select("scheduled_date")
        .eq("event_id", event.id)
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true }),
    ]);

  type AwardJoin = {
    id: string;
    winner_idea_id: string | null;
    winner_name: string | null;
    project_title: string | null;
    project_url: string | null;
    award_categories:
      | { name: string; description: string | null; sort_order: number }
      | {
          name: string;
          description: string | null;
          sort_order: number;
        }[]
      | null;
    ideas:
      | IdeaJoin
      | IdeaJoin[]
      | null;
  };
  type IdeaJoin = {
    id: string;
    title: string;
    pitch: string | null;
    description: string | null;
    live_url: string | null;
    final_screenshot_url: string | null;
    hero_crop_x: number;
    profiles:
      | { full_name: string | null; email: string }
      | { full_name: string | null; email: string }[]
      | null;
  };
  type IdeaListRow = {
    id: string;
    title: string;
    pitch: string | null;
    live_url: string | null;
    final_screenshot_url: string | null;
    hero_crop_x: number;
    user_id: string;
    profiles:
      | { full_name: string | null; email: string }
      | { full_name: string | null; email: string }[]
      | null;
  };

  const winners: WinnerEntry[] = ((awardRows as AwardJoin[] | null) ?? [])
    .map((a) => {
      const category = Array.isArray(a.award_categories)
        ? a.award_categories[0]
        : a.award_categories;
      if (!category) return null;
      const idea = Array.isArray(a.ideas) ? a.ideas[0] : a.ideas;
      const authorRel = idea?.profiles;
      const author = Array.isArray(authorRel) ? authorRel[0] : authorRel;
      const authorName = displayName(author?.full_name, author?.email);
      // Fall back to the snapshot stored on the award row if the idea
      // was deleted post-reveal.
      const ideaTitle = idea?.title ?? a.project_title ?? "Winner";
      const ideaPitch = idea?.pitch ?? null;
      const ideaDescription = idea?.description ?? null;
      const liveUrl = idea?.live_url ?? null;
      const projectUrl = a.project_url ?? null;
      const screenshotUrl = idea?.final_screenshot_url ?? null;
      const heroCropX = idea?.hero_crop_x ?? 50;
      return {
        awardId: a.id,
        categoryName: category.name,
        categoryDescription: category.description,
        ideaTitle,
        ideaPitch,
        ideaDescription,
        authorName: authorName ?? a.winner_name ?? null,
        authorEmail: author?.email ?? null,
        liveUrl,
        projectUrl,
        screenshotUrl,
        heroCropX,
      } satisfies WinnerEntry;
    })
    .filter((w): w is WinnerEntry => w !== null);

  const winnerIdeaIds = new Set(
    ((awardRows as AwardJoin[] | null) ?? [])
      .map((a) => a.winner_idea_id)
      .filter((id): id is string => Boolean(id)),
  );

  const ideas: IdeaGalleryEntry[] = ((ideaRows as IdeaListRow[] | null) ?? []).map(
    (i) => {
      const author = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles;
      return {
        ideaId: i.id,
        title: i.title,
        pitch: i.pitch,
        authorName: displayName(author?.full_name, author?.email),
        liveUrl: i.live_url,
        screenshotUrl: i.final_screenshot_url,
        heroCropX: i.hero_crop_x ?? 50,
        isWinner: winnerIdeaIds.has(i.id),
      } satisfies IdeaGalleryEntry;
    },
  );

  const blockDates = ((blockRows as { scheduled_date: string }[] | null) ?? [])
    .map((b) => b.scheduled_date)
    .filter(Boolean);
  const dateRangeLabel = formatDateRange(blockDates, event.created_at);

  const approvedRecap =
    event.reflection_summary &&
    event.reflection_summary_approved_at &&
    event.reflection_summary.trim().length > 0
      ? event.reflection_summary
      : null;

  return (
    <main className="min-h-screen">
      <ShowcaseHero
        logoUrl={event.logo_url ?? fallbackLogoUrl}
        orgName={orgName}
        eventTitle={event.title}
        dateRangeLabel={dateRangeLabel}
        winnerCount={winners.length}
        ideaCount={ideas.length}
        hasRecap={Boolean(approvedRecap)}
      />
      <WinnersGrid winners={winners} />
      <IdeaGallery ideas={ideas} />
      {approvedRecap && <ShowcaseRecap summary={approvedRecap} />}
      <ShowcaseFooter />
    </main>
  );
}

// ============================================
// Soft-entry path (kept from original implementation)
// ============================================
async function renderSoftEntry({
  event,
  org,
}: {
  event: VanityEventRow;
  org: OrgRow | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  if (user) {
    const { data: membership } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      redirect(`/events/${event.id}`);
    }

    return (
      <SoftEntryShell
        logoUrl={event.logo_url ?? org?.logo_url ?? null}
        orgName={org?.name ?? null}
        title={event.title}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This is a private event</CardTitle>
            <CardDescription>
              You&apos;re signed in, but you&apos;re not a member of this event
              yet. Ask your organizer for an invite link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </SoftEntryShell>
    );
  }

  const next = `/events/${event.id}`;
  return (
    <SoftEntryShell
      logoUrl={event.logo_url ?? org?.logo_url ?? null}
      orgName={org?.name ?? null}
      title={event.title}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Welcome.</CardTitle>
          <CardDescription>
            {event.welcome_message?.trim() ||
              "Sign in to jump back into your Hacks-a-Thon."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>
              Create account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </SoftEntryShell>
  );
}

function SoftEntryShell({
  logoUrl,
  orgName,
  title,
  children,
}: {
  logoUrl: string | null;
  orgName: string | null;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          {logoUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName ?? title} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xl font-semibold text-muted-foreground"
            >
              {(orgName ?? title).slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-1">
          {orgName && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {orgName}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="text-left">{children}</div>
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline-offset-4 hover:underline">
            Hacksathon.com
          </Link>
        </p>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function displayName(
  fullName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;
  if (email) return email.split("@")[0];
  return null;
}

/**
 * "Mar 8–9, 2026" style label derived from block scheduled_dates. Falls
 * back to the event's created_at month when no blocks have schedules
 * (early-state events).
 */
function formatDateRange(
  scheduledDates: string[],
  fallbackIso: string,
): string | null {
  if (scheduledDates.length === 0) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(new Date(fallbackIso));
    } catch {
      return null;
    }
  }

  const first = new Date(scheduledDates[0]);
  const last = new Date(scheduledDates[scheduledDates.length - 1]);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
    return null;
  }

  const sameDay =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth() &&
    first.getDate() === last.getDate();
  const sameMonth =
    first.getFullYear() === last.getFullYear() &&
    first.getMonth() === last.getMonth();

  try {
    if (sameDay) {
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(first);
    }
    if (sameMonth) {
      return `${new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
      }).format(first)}–${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
    }).format(first)} – ${new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(last)}`;
  } catch {
    return null;
  }
}
