import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VotingControls } from "@/components/admin/voting-controls";
import { ReflectionSummaryPanel } from "@/components/admin/reflection-summary-panel";

export const metadata: Metadata = {
  title: "Event admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface EventRow {
  id: string;
  title: string;
  voting_status: "closed" | "open" | "revealed";
  is_locked: boolean;
  reflection_summary: string | null;
  reflection_summary_generated_at: string | null;
  reflection_summary_approved_at: string | null;
}

/**
 * Event admin — M4 surface for organizers. Lives at /events/[id]/admin.
 *
 * Server-gated via the is_event_admin RPC (the same SECURITY DEFINER
 * helper used by every admin RLS policy). Non-admins fall through to
 * notFound() so the URL doesn't leak the existence of an admin route
 * (RLS already hides the event from non-members, but defense in depth
 * is cheap here).
 *
 * The page is intentionally focused: voting controls + AI reflection
 * summary. M6 will expand this into the full organizer wizard.
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
      "id, title, voting_status, is_locked, reflection_summary, reflection_summary_generated_at, reflection_summary_approved_at",
    )
    .eq("id", eventId)
    .single<EventRow>();
  if (!eventRow) notFound();

  const [
    { count: voteCount },
    { count: ideaCount },
    { count: reflectionCount },
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
  ]);

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
        <h1 className="text-3xl font-bold tracking-tight">Event admin</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Run the back-of-house for {eventRow.title}. Open voting after the
          showcase, reveal winners when you&apos;re ready, and generate the
          recap.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Voting</h2>
        <VotingControls
          eventId={eventId}
          votingStatus={eventRow.voting_status}
          voteCount={voteCount ?? 0}
          ideaCount={ideaCount ?? 0}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Reflections</h2>
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
          are read-only. Reflections remain open.
        </p>
      )}
    </div>
  );
}
