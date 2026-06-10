import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { EventShowcase } from "@/components/showcase/event-showcase";
import { ShowcaseTeaser } from "@/components/showcase/showcase-teaser";
import { ShowcaseFooter } from "@/components/showcase/showcase-footer";
import { Compass } from "lucide-react";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
  type SlugContext,
} from "@/lib/routing/slug-context";
import {
  deriveWindowStatus,
  isMineDone,
  nextOpenBlock,
} from "@/lib/blocks/status";
import { loadHelperContext } from "@/lib/helper/loader";
import { isPhase1Complete } from "@/lib/helper/phase";
import {
  buildToolLabel,
  buildToolMeta,
  isRecognizedBuildTool,
  isByoBuildTool,
} from "@/lib/build-tool/labels";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

// ============================================
// generateMetadata
// ============================================
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) return { title: "Event" };

  const { event, org } = ctx;
  const title = org?.name ? `${event.title} · ${org.name}` : event.title;
  const description = event.public_showcase
    ? event.results_published_at
      ? `Winners, every idea, and the recap from ${event.title}.`
      : `${event.title} - coming soon to Hacksathon.com.`
    : `Sign in to ${event.title} on Hacksathon.com.`;

  // OG/Twitter images are provided by the colocated `opengraph-image.tsx`
  // / `twitter-image.tsx` (generated EB Garamond cards). Setting `images`
  // here would override those, so we deliberately leave them out.
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ============================================
// Page
// ============================================
/**
 * Slug root.
 *
 * Render priority:
 *   1. Signed-in member or admin → participant dashboard (idea-led).
 *   2. Public showcase, voting revealed (any viewer) → full showcase.
 *   3. Public showcase, not yet revealed (any viewer) → teaser.
 *   4. Signed-in non-member, private event → "private event" card.
 *   5. Anonymous, private event → sign-in / create-account.
 *
 * Members always see their dashboard first, even when the public
 * showcase is up. They have an explicit "view public showcase" link
 * on the dashboard.
 */
export default async function VanityCompanyPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  const { event, org } = ctx;
  const isMember = Boolean(viewer && (viewer.isMember || viewer.isAdmin));

  // 1. Public showcase (after reveal) - the canonical wrap-up for EVERY
  // viewer, members included. Members see it inside the slug layout's
  // chrome and reach their own work via the participant nav.
  if (event.public_showcase && event.results_published_at) {
    return (
      <EventShowcase
        ctx={ctx}
        viewerIsMember={isMember}
        viewerIsAdmin={Boolean(viewer?.isAdmin)}
      />
    );
  }

  // 2. Member dashboard (during the event, or any non-public event).
  if (isMember && viewer) {
    return (
      <ParticipantDashboard
        ctx={ctx}
        userId={viewer.user.id}
        isAdmin={viewer.isAdmin}
      />
    );
  }

  // 3. Public showcase teaser (public event, not yet revealed).
  if (event.public_showcase) {
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

  // 4. Soft-entry path (private events for non-members).
  return <SoftEntry ctx={ctx} hasUser={Boolean(viewer)} />;
}

// ============================================
// Participant dashboard (signed-in member view)
// ============================================
/**
 * Compact participant-facing date window derived from the event's block
 * schedule (min/max `scheduled_date`). Returns null when nothing is
 * scheduled yet. Uses hyphens, never em dashes, per project style.
 */
function formatDateWindow(
  blocks: Array<{ scheduled_date: string | null }>,
): string | null {
  const dates = blocks
    .map((b) => b.scheduled_date)
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  const start = dates[0];
  const end = dates[dates.length - 1];

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(start);
  }

  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${monthDay.format(start)} - ${end.getDate()}, ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${monthDay.format(start)} - ${monthDay.format(end)}, ${start.getFullYear()}`;
  }

  const withYear = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${withYear.format(start)} - ${withYear.format(end)}`;
}

async function ParticipantDashboard({
  ctx,
  userId,
  isAdmin,
}: {
  ctx: SlugContext;
  userId: string;
  isAdmin: boolean;
}) {
  const { event, org } = ctx;
  const supabase = await createClient();

  // Admin-only nudge: if this viewer is an event admin and they haven't
  // finished Phase 1 of setup, surface a quiet banner at the top of
  // their participant home pointing back into /admin. The dashboard
  // redirect already covers first touch; this catches admins who
  // navigate here directly from a bookmark or the back-arrow.
  let setupBanner: { href: string; label: string } | null = null;
  if (isAdmin) {
    const helperCtx = await loadHelperContext(ctx);
    if (!isPhase1Complete(helperCtx)) {
      setupBanner = {
        href: slugPath(ctx.slug, "admin"),
        label:
          "Your Hacks-a-Thon needs a few details before you invite people.",
      };
    }
  }

  const [
    { data: blockRows },
    { data: ideaRow },
    { data: briefRows },
    { data: sessionRows },
    { data: completionRows },
    { data: voteRows },
    { data: reflectionRows },
  ] = await Promise.all([
    supabase
      .from("blocks")
      .select(
        "id, block_key, title, subtitle, scheduled_date, duration_minutes, sort_order",
      )
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("ideas")
      .select("id, title, pitch, status")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle<{
        id: string;
        title: string;
        pitch: string | null;
        status: string;
      }>(),
    supabase
      .from("project_briefs")
      .select("id, project_name, updated_at")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("planning_sessions")
      .select("id, status, updated_at")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("block_completions")
      .select("block_key")
      .eq("event_id", event.id)
      .eq("user_id", userId),
    supabase
      .from("votes")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .limit(1),
    supabase
      .from("reflections")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .limit(1),
  ]);

  const now = new Date();
  const hasIdea = Boolean(ideaRow);
  const hasBrief = Array.isArray(briefRows) && briefRows.length > 0;
  const ideaCompleted = ideaRow?.status === "completed";
  const hasVote = Array.isArray(voteRows) && voteRows.length > 0;
  const hasReflection =
    Array.isArray(reflectionRows) && reflectionRows.length > 0;
  const votingRevealed = event.voting_status === "revealed";
  const completionsSet = new Set<string>(
    ((completionRows ?? []) as { block_key: string }[]).map((r) => r.block_key),
  );

  const blocksForNext = ((blockRows ?? []) as Array<{
    id: string;
    block_key: string;
    title: string;
    subtitle: string | null;
    scheduled_date: string | null;
    duration_minutes: number;
    sort_order: number;
  }>).map((b, i) => {
    const windowStatus = deriveWindowStatus(
      b.scheduled_date,
      b.duration_minutes,
      now,
    );
    const mineDone = isMineDone({
      blockKey: b.block_key,
      windowStatus,
      completionsSet,
      hasIdea,
      hasBrief,
      ideaCompleted,
      hasVote,
      hasReflection,
      votingRevealed,
    });
    return {
      blockKey: b.block_key,
      windowStatus,
      mineDone,
      sortOrder: i,
      data: { id: b.id, title: b.title, subtitle: b.subtitle, blockKey: b.block_key },
    };
  });

  const next = nextOpenBlock(blocksForNext);
  const nextBlock = next?.data ?? null;
  const nextBlockWindow = next?.windowStatus ?? "upcoming";

  const logoUrl = event.logo_url ?? org?.logo_url ?? null;
  const orgName = org?.name ?? "";
  const welcomeMessage =
    event.welcome_message?.trim() ||
    "Welcome to your Hacks-a-Thon. Pick up wherever you left off.";

  const slackUrl =
    typeof event.settings === "object" &&
    event.settings !== null &&
    typeof (event.settings as Record<string, unknown>).slack_url === "string"
      ? ((event.settings as Record<string, unknown>).slack_url as string)
      : null;

  const planningDocCount =
    (Array.isArray(briefRows) ? briefRows.length : 0) +
    (Array.isArray(sessionRows) ? sessionRows.length : 0);

  const dateWindow = formatDateWindow(
    (blockRows ?? []) as Array<{ scheduled_date: string | null }>,
  );

  // Build tool, rendered only when it adds signal: a recognized tool
  // (with logo) or the explicit bring-your-own choice. A generic/unset
  // value reads awkwardly as a noun, so we skip it.
  const buildTool = event.build_tool;
  const buildToolDisplay = isRecognizedBuildTool(buildTool)
    ? { text: `Built with ${buildToolLabel(buildTool)}`, logo: buildToolMeta(buildTool).logo }
    : isByoBuildTool(buildTool)
      ? { text: "Bring your own tool", logo: null as string | null }
      : null;

  return (
    <div className="space-y-8">
      {setupBanner && (
        <Link
          href={setupBanner.href}
          className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:border-foreground/60"
          style={{
            borderColor: "var(--gray-400)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Compass
              className="size-4 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
            <span className="space-y-0.5 min-w-0">
              <span
                className="block font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Hacky Helper
              </span>
              <span className="block text-sm text-foreground truncate">
                {setupBanner.label}
              </span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
            Go to admin
            <ArrowRight className="size-3" />
          </span>
        </Link>
      )}

      {/* Event hero */}
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative h-12 w-auto min-w-[48px] max-w-[192px] overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName || event.title} logo`}
                className="h-full w-auto object-contain"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-base font-semibold text-muted-foreground"
            >
              {(orgName || event.title).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {orgName && <p className="mono-label">{orgName}</p>}
            <h2 className="truncate">{event.title}</h2>
          </div>
        </div>

        {(dateWindow || buildToolDisplay) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {dateWindow && <span>{dateWindow}</span>}
            {dateWindow && buildToolDisplay && (
              <span aria-hidden className="opacity-60">
                ·
              </span>
            )}
            {buildToolDisplay && (
              <span className="inline-flex items-center gap-1.5">
                {buildToolDisplay.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={buildToolDisplay.logo}
                    alt=""
                    className="size-3.5"
                  />
                )}
                {buildToolDisplay.text}
              </span>
            )}
          </div>
        )}

        <p className="lead">{welcomeMessage}</p>

        {event.welcome_video_url && (
          <EventVideo url={event.welcome_video_url} />
        )}
      </header>

      {/* Your idea - the dashboard's primary feature */}
      <YourIdeaCard
        slug={ctx.slug}
        idea={ideaRow}
        planningDocCount={planningDocCount}
      />

      {/* Next block CTA */}
      {nextBlock && (
        <Card>
          <CardHeader>
            <p className="mono-label">
              {nextBlock.blockKey === "+01" && event.voting_status === "open"
                ? "Voting is open"
                : nextBlockWindow === "active"
                  ? "Happening now"
                  : "Up next"}
            </p>
            <CardTitle className="flex items-baseline gap-4 font-serif text-2xl">
              <span className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">
                {nextBlock.blockKey}
              </span>
              {nextBlock.title}
            </CardTitle>
            {nextBlock.subtitle && (
              <CardDescription>{nextBlock.subtitle}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button asChild variant="pill" size="pill">
              <Link
                href={slugPath(
                  ctx.slug,
                  `blocks/${encodeURIComponent(nextBlock.blockKey)}`,
                )}
              >
                {nextBlock.blockKey === "+01" && event.voting_status === "open"
                  ? "Cast your votes"
                  : nextBlockWindow === "active"
                    ? "Jump in"
                    : "Open this block"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quiet links row for skimmers */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuietLink
          href={slugPath(ctx.slug, "blocks")}
          title="All blocks"
          subtitle="The full timeline"
        />
        <QuietLink
          href={slugPath(ctx.slug, "idealab")}
          title="IdeaLab"
          subtitle="Every idea this event"
        />
        <QuietLink
          href={slugPath(ctx.slug, "awards")}
          title="Hacky Awards"
          subtitle={
            event.voting_status === "open"
              ? "Voting is open"
              : event.voting_status === "revealed"
                ? event.results_published_at
                  ? "Winners"
                  : "Results soon"
                : "Vote later"
          }
        />
        <QuietLink
          href={slugPath(ctx.slug, "reflections")}
          title="Reflections"
          subtitle={hasReflection ? "Edit your answers" : "Share your take"}
        />
      </section>

      {slackUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team chat</CardTitle>
            <CardDescription>
              Hop into the team channel for help and energy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={slackUrl} target="_blank" rel="noopener noreferrer">
                Open team chat
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function YourIdeaCard({
  slug,
  idea,
  planningDocCount,
}: {
  slug: string;
  idea: { id: string; title: string; pitch: string | null; status: string } | null;
  planningDocCount: number;
}) {
  if (!idea) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-xl">Your big idea</CardTitle>
          <CardDescription>
            Every Hacks-a-Thon starts with a spark. Add the idea you want to
            build during this event - keep it short and a little bit wild.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="pill" size="pill">
            <Link href={slugPath(slug, "idea/new")}>
              Add your idea
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {idea.status === "completed" ? "Shipped" : idea.status}
          </Badge>
          {planningDocCount > 0 && (
            <Badge variant="secondary">
              {planningDocCount} planning doc{planningDocCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl">{idea.title}</CardTitle>
        {idea.pitch && <CardDescription>{idea.pitch}</CardDescription>}
      </CardHeader>
      <CardFooter className="gap-2">
        <Button asChild variant="pill" size="pill">
          <Link href={slugPath(slug, "idea")}>
            Open your idea
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={slugPath(slug, "idealab")}>See the IdeaLab</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function QuietLink({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[4px] border p-4 transition-colors hover:border-foreground/40"
    >
      <p className="font-serif text-base text-foreground">{title}</p>
      <p className="mt-1 mono-label">{subtitle}</p>
    </Link>
  );
}

// ============================================
// Soft-entry (anonymous + signed-in non-member on private events)
// ============================================
function SoftEntry({
  ctx,
  hasUser,
}: {
  ctx: SlugContext;
  hasUser: boolean;
}) {
  const { event, org } = ctx;

  if (hasUser) {
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

  const next = `/${ctx.slug}`;
  return (
    <SoftEntryShell
      logoUrl={event.logo_url ?? org?.logo_url ?? null}
      orgName={org?.name ?? null}
      title={event.title}
      tagline={
        event.welcome_message?.trim() ||
        "Sign in to jump back into your Hacks-a-Thon."
      }
    >
      <Card>
        <CardContent>
          <Suspense fallback={<div className="h-72" aria-hidden />}>
            <AuthForm mode="login" next={next} />
          </Suspense>
        </CardContent>
      </Card>
    </SoftEntryShell>
  );
}

function SoftEntryShell({
  logoUrl,
  orgName,
  title,
  tagline,
  children,
}: {
  logoUrl: string | null;
  orgName: string | null;
  title: string;
  tagline?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          {logoUrl ? (
            <div className="h-16 w-auto min-w-[64px] max-w-[256px] overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName ?? title} logo`}
                className="h-full w-auto object-contain"
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
        <div className="space-y-3">
          {orgName && <p className="mono-label">{orgName}</p>}
          <h1 className="font-serif text-2xl font-normal leading-tight tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {tagline && (
            <p className="mx-auto max-w-sm font-serif text-lg italic leading-snug text-[var(--text-secondary)]">
              {tagline}
            </p>
          )}
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
// Welcome video embed
// ============================================
function EventVideo({ url }: { url: string }) {
  const embed = toYoutubeEmbed(url);

  if (embed) {
    return (
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg border bg-muted">
        <iframe
          src={embed}
          title="Welcome video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
    >
      Watch welcome video
      <ArrowRight className="size-4" />
    </a>
  );
}

function toYoutubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "m.youtube.com"
    ) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

