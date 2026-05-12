import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BlockChecklist,
  type BlockChecklistItem,
} from "@/components/event-home/block-checklist";
import {
  deriveWindowStatus,
  isMineDone,
  nextOpenBlock,
} from "@/lib/blocks/status";

export const metadata: Metadata = {
  title: "Event",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  welcome_message: string | null;
  welcome_video_url: string | null;
  logo_url: string | null;
  vanity_slug: string | null;
  organization_id: string;
  settings: Record<string, unknown> | null;
  voting_status: "closed" | "open" | "revealed";
  is_locked: boolean;
}

interface OrgRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface BlockRow {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  scheduled_date: string | null;
  duration_minutes: number;
  sort_order: number;
}

interface IdeaRow {
  id: string;
  status: string;
}

/**
 * Participant event home — the landing page every member sees after
 * sign-in for an event they belong to.
 *
 * Surfaces:
 *   - Header with logo + event title + optional welcome copy / video.
 *   - "Next open block" CTA — first block where mineDone is false,
 *     preferring active.
 *   - Full block checklist routing to /events/[id]/blocks/[blockKey].
 *   - Slack invite card — only when settings.slack_url is set.
 *
 * Block state is derived at read time:
 *   windowStatus  — clock-based (organizer's scheduled_date + duration).
 *   mineDone      — time fallback OR auto-derived (idea row, Blueprint
 *                   row, idea Completed) OR explicit block_completions
 *                   row.
 *
 * RLS already filters non-members at the events SELECT layer, so a 404
 * here means either the event doesn't exist or the user isn't a member.
 */
export default async function EventHomePage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${eventId}`);

  const { data: eventRow } = await supabase
    .from("events")
    .select(
      "id, title, description, status, welcome_message, welcome_video_url, logo_url, vanity_slug, organization_id, settings, voting_status, is_locked",
    )
    .eq("id", eventId)
    .single<EventRow>();

  if (!eventRow) notFound();

  const [
    { data: orgRow },
    { data: blockRows },
    { data: ideaRow },
    { data: briefRows },
    { data: completionRows },
    { data: voteRows },
    { data: reflectionRows },
    { data: isAdminFlag },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, logo_url")
      .eq("id", eventRow.organization_id)
      .single<OrgRow>(),
    supabase
      .from("blocks")
      .select(
        "id, block_key, title, subtitle, scheduled_date, duration_minutes, sort_order",
      )
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .returns<BlockRow[]>(),
    supabase
      .from("ideas")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle<IdeaRow>(),
    supabase
      .from("project_briefs")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .limit(1),
    supabase
      .from("block_completions")
      .select("block_key")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .returns<{ block_key: string }[]>(),
    supabase
      .from("votes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .limit(1),
    supabase
      .from("reflections")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .limit(1),
    supabase.rpc("is_event_admin", { p_event_id: eventId }),
  ]);

  const isAdmin = Boolean(isAdminFlag);

  const now = new Date();
  const hasIdea = Boolean(ideaRow);
  const hasBrief = Array.isArray(briefRows) && briefRows.length > 0;
  const ideaCompleted = ideaRow?.status === "completed";
  const hasVote = Array.isArray(voteRows) && voteRows.length > 0;
  const hasReflection =
    Array.isArray(reflectionRows) && reflectionRows.length > 0;
  const votingRevealed = eventRow.voting_status === "revealed";
  const completionsSet = new Set<string>(
    (completionRows ?? []).map((r) => r.block_key),
  );

  const blocks: BlockChecklistItem[] = (blockRows ?? []).map((b) => {
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
      id: b.id,
      blockKey: b.block_key,
      title: b.title,
      subtitle: b.subtitle,
      windowStatus,
      mineDone,
      scheduledDate: b.scheduled_date,
      durationMinutes: b.duration_minutes,
    };
  });

  const next = nextOpenBlock(
    blocks.map((b, i) => ({
      blockKey: b.blockKey,
      windowStatus: b.windowStatus,
      mineDone: b.mineDone,
      sortOrder: i,
      data: b,
    })),
  );
  const nextBlock = next?.data ?? null;

  const logoUrl = eventRow.logo_url ?? orgRow?.logo_url ?? null;
  const orgName = orgRow?.name ?? "";
  const welcomeMessage =
    eventRow.welcome_message?.trim() ||
    "Welcome to your Hacks-a-Thon. Pick up wherever you left off.";

  const slackUrl =
    typeof eventRow.settings === "object" &&
    eventRow.settings !== null &&
    typeof (eventRow.settings as Record<string, unknown>).slack_url ===
      "string"
      ? ((eventRow.settings as Record<string, unknown>).slack_url as string)
      : null;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName || eventRow.title} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-base font-semibold text-muted-foreground"
            >
              {(orgName || eventRow.title).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {orgName && (
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {orgName}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight truncate">
              {eventRow.title}
            </h1>
          </div>
        </div>

        <p className="max-w-2xl text-base text-muted-foreground">
          {welcomeMessage}
        </p>

        {eventRow.welcome_video_url && (
          <EventVideo url={eventRow.welcome_video_url} />
        )}
      </header>

      {nextBlock && (
        <Card className="border-foreground/20 bg-foreground/[0.02]">
          <CardHeader>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {nextBlock.blockKey === "+01" && eventRow.voting_status === "open"
                ? "Voting is open"
                : nextBlock.windowStatus === "active"
                  ? "Happening now"
                  : "Up next"}
            </p>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="inline-flex h-8 min-w-12 items-center justify-center rounded-md border border-foreground bg-foreground px-2 text-xs font-semibold text-background">
                {nextBlock.blockKey}
              </span>
              {nextBlock.title}
            </CardTitle>
            {nextBlock.subtitle && (
              <CardDescription>{nextBlock.subtitle}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link
                href={`/events/${eventId}/blocks/${encodeURIComponent(nextBlock.blockKey)}`}
              >
                {nextBlock.blockKey === "+01" && eventRow.voting_status === "open"
                  ? "Cast your votes"
                  : nextBlock.windowStatus === "active"
                    ? "Jump in"
                    : "Open this block"}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Your timeline
          </h2>
          <div className="flex items-center gap-1">
            {ideaRow && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/events/${eventId}/idealab/${ideaRow.id}`}>
                  Edit your idea
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/events/${eventId}/admin`}>
                  Event admin
                </Link>
              </Button>
            )}
          </div>
        </div>
        <BlockChecklist eventId={eventId} blocks={blocks} />
      </section>

      {slackUrl && (
        <Card>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-foreground"
            >
              <MessageSquare className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Team chat</CardTitle>
              <CardDescription>
                Hop into the team channel for help and energy.
              </CardDescription>
            </div>
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

/**
 * Welcome video embed. Supports the two link shapes organizers are
 * most likely to paste (YouTube watch / youtu.be) plus a fallback that
 * just opens the link in a new tab for everything else.
 */
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
