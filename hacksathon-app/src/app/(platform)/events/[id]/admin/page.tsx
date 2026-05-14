import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured } from "@/lib/email/resend";
import { VotingControls } from "@/components/admin/voting-controls";
import { ReflectionSummaryPanel } from "@/components/admin/reflection-summary-panel";
import { EventBasicsSection } from "@/components/admin/sections/event-basics";
import { EventLogoSection } from "@/components/admin/sections/event-logo";
import { EventBrandingSection } from "@/components/admin/sections/event-branding";
import {
  EventScheduleSection,
  type ScheduleBlock,
} from "@/components/admin/sections/event-schedule";
import {
  AwardCategoriesEditor,
  type AwardCategoryRow,
} from "@/components/admin/sections/award-categories-editor";
import {
  ReflectionQuestionsEditor,
  type ReflectionQuestionRow,
} from "@/components/admin/sections/reflection-questions-editor";
import {
  ParticipantsPanel,
  type InvitationRow,
  type RosterMember,
} from "@/components/admin/sections/participants-panel";

export const metadata: Metadata = {
  title: "Event admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  welcome_message: string | null;
  welcome_video_url: string | null;
  logo_url: string | null;
  vanity_slug: string | null;
  public_showcase: boolean;
  settings: Record<string, unknown> | null;
  voting_status: "closed" | "open" | "revealed";
  is_locked: boolean;
  reflection_summary: string | null;
  reflection_summary_generated_at: string | null;
  reflection_summary_approved_at: string | null;
  organization_id: string;
}

/**
 * Event admin — Organizer Wizard (M6).
 *
 * Server-gated via the is_event_admin RPC (the same SECURITY DEFINER
 * helper used by every admin RLS policy). Non-admins fall through to
 * notFound() so the URL doesn't leak the existence of an admin route.
 *
 * Sectioned layout with an anchor-based sub-nav across the top: Setup
 * (basics, logo, branding, schedule, awards, reflections, participants)
 * and Run event (voting + AI recap from M4). The sub-nav scrolls to
 * anchor IDs rather than route-splitting so organizers can scroll
 * freely between sections during setup.
 *
 * Roster lookup uses the admin Supabase client to sidestep the
 * organization_members SELECT policy, which only returns the caller's
 * own row. (See 00008_fix_rls_recursion for the rationale.)
 */
export default async function EventAdminPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${eventId}/admin`);

  const { data: isAdmin } = await supabase.rpc("is_event_admin", {
    p_event_id: eventId,
  });
  if (!isAdmin) notFound();

  const { data: eventRow } = await supabase
    .from("events")
    .select(
      "id, title, description, welcome_message, welcome_video_url, logo_url, vanity_slug, public_showcase, settings, voting_status, is_locked, reflection_summary, reflection_summary_generated_at, reflection_summary_approved_at, organization_id",
    )
    .eq("id", eventId)
    .single<EventRow>();
  if (!eventRow) notFound();

  const admin = createAdminClient();

  const [
    { count: voteCount },
    { count: ideaCount },
    { count: reflectionCount },
    { data: blockRows },
    { data: categoryRows },
    { data: questionRows },
    { data: memberRows },
    { data: invitationRows },
  ] = await Promise.all([
    supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase
      .from("blocks")
      .select(
        "id, block_key, title, subtitle, scheduled_date, duration_minutes, sort_order",
      )
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .returns<ScheduleBlock[]>(),
    supabase
      .from("award_categories")
      .select("id, name, description, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .returns<AwardCategoryRow[]>(),
    supabase
      .from("reflection_questions")
      .select("id, question_text, is_required, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .returns<ReflectionQuestionRow[]>(),
    admin
      .from("organization_members")
      .select(
        "user_id, role, status, profiles!inner(id, email, full_name)",
      )
      .eq("organization_id", eventRow.organization_id)
      .eq("status", "active"),
    supabase
      .from("event_invitations")
      .select("id, email, status, invited_at, accepted_at, expires_at")
      .eq("event_id", eventId)
      .order("invited_at", { ascending: false })
      .returns<InvitationRow[]>(),
  ]);

  type MemberJoinRow = {
    user_id: string;
    role: string;
    status: string;
    profiles:
      | { id: string; email: string; full_name: string | null }
      | { id: string; email: string; full_name: string | null }[]
      | null;
  };
  const roster: RosterMember[] = ((memberRows as MemberJoinRow[] | null) ?? []).map(
    (m) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        user_id: m.user_id,
        email: p?.email ?? "",
        full_name: p?.full_name ?? null,
        role: m.role,
        is_self: m.user_id === user.id,
      };
    },
  );

  const slackUrl =
    typeof eventRow.settings === "object" && eventRow.settings
      ? (eventRow.settings.slack_url as string | undefined) ?? null
      : null;

  // First-time setup heuristic: no participants invited, no logo, no
  // schedule on any block. The nudge surfaces the four things a new
  // organizer needs to set before sending invites.
  const noParticipants = roster.length <= 1 && invitationRows?.length === 0;
  const noSchedule = (blockRows ?? []).every(
    (b) => !b.scheduled_date,
  );
  const showOnboarding =
    noParticipants && noSchedule && !eventRow.logo_url && !eventRow.vanity_slug;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to {eventRow.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Event admin</h1>
          {eventRow.is_locked && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
              <Lock className="size-3" />
              Locked
            </span>
          )}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Run the back-of-house for {eventRow.title}. Set the event up, invite
          your team, then open voting and reveal winners when you&apos;re ready.
        </p>
      </div>

      <nav
        aria-label="Admin sections"
        className="sticky top-14 z-40 -mx-4 flex gap-1 overflow-x-auto border-b bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <SubnavLink href="#basics">Basics</SubnavLink>
        <SubnavLink href="#logo">Logo</SubnavLink>
        <SubnavLink href="#branding">Branding</SubnavLink>
        <SubnavLink href="#schedule">Schedule</SubnavLink>
        <SubnavLink href="#participants">Participants</SubnavLink>
        <SubnavLink href="#awards">Awards</SubnavLink>
        <SubnavLink href="#reflections">Reflections</SubnavLink>
        <SubnavLink href="#run">Run event</SubnavLink>
      </nav>

      {showOnboarding && (
        <section className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-5">
          <h2 className="text-base font-semibold tracking-tight">
            Welcome — let&apos;s get this event set up
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A complete setup takes about five minutes. Work through these in
            order:
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            <li>
              <Link href="#basics" className="text-primary hover:underline">
                Set the event title and welcome message
              </Link>
            </li>
            <li>
              <Link href="#logo" className="text-primary hover:underline">
                Upload your company logo
              </Link>
            </li>
            <li>
              <Link href="#branding" className="text-primary hover:underline">
                Claim your vanity URL
              </Link>
            </li>
            <li>
              <Link href="#schedule" className="text-primary hover:underline">
                Add start times for your 10 blocks
              </Link>
            </li>
            <li>
              <Link
                href="#participants"
                className="text-primary hover:underline"
              >
                Invite your team
              </Link>
            </li>
          </ol>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Setup</h2>
        <EventBasicsSection
          eventId={eventId}
          initialTitle={eventRow.title}
          initialDescription={eventRow.description ?? ""}
          initialWelcomeMessage={eventRow.welcome_message ?? ""}
          initialWelcomeVideoUrl={eventRow.welcome_video_url ?? ""}
          isLocked={eventRow.is_locked}
        />
        <EventLogoSection
          eventId={eventId}
          initialLogoUrl={eventRow.logo_url}
          isLocked={eventRow.is_locked}
        />
        <EventBrandingSection
          eventId={eventId}
          initialVanitySlug={eventRow.vanity_slug}
          initialPublicShowcase={eventRow.public_showcase}
          initialSlackUrl={slackUrl}
          isLocked={eventRow.is_locked}
        />
        <EventScheduleSection
          eventId={eventId}
          blocks={(blockRows as ScheduleBlock[]) ?? []}
          isLocked={eventRow.is_locked}
        />
        <ParticipantsPanel
          eventId={eventId}
          roster={roster}
          invitations={(invitationRows as InvitationRow[]) ?? []}
          emailConfigured={emailConfigured()}
        />
        <AwardCategoriesEditor
          eventId={eventId}
          categories={(categoryRows as AwardCategoryRow[]) ?? []}
          isLocked={eventRow.is_locked}
        />
        <ReflectionQuestionsEditor
          eventId={eventId}
          questions={(questionRows as ReflectionQuestionRow[]) ?? []}
        />
      </section>

      <section id="run" className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Run event</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          During and after your Hacks-a-Thon: open voting after the showcase,
          reveal winners when you&apos;re ready, then generate the AI recap.
        </p>
        <VotingControls
          eventId={eventId}
          votingStatus={eventRow.voting_status}
          voteCount={voteCount ?? 0}
          ideaCount={ideaCount ?? 0}
        />
        <ReflectionSummaryPanel
          eventId={eventId}
          summary={eventRow.reflection_summary}
          generatedAt={eventRow.reflection_summary_generated_at}
          approvedAt={eventRow.reflection_summary_approved_at}
          reflectionResponseCount={reflectionCount ?? 0}
        />
      </section>

      {eventRow.is_locked && (
        <p className="text-xs text-muted-foreground">
          This event is currently locked. Ideas, briefs, and planning sessions
          are read-only. Reflections remain open so participants can finish
          writing.
        </p>
      )}
    </div>
  );
}

function SubnavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
