import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BlocksTimeline,
  parseBlockChecklists,
  type BlocksTimelineItem,
} from "@/components/event-home/blocks-timeline";
import {
  deriveWindowStatus,
  isMineDone,
} from "@/lib/blocks/status";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "The Blocks",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

interface BlockRow {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  purpose: string | null;
  scheduled_date: string | null;
  duration_minutes: number;
  sort_order: number;
  checklists: unknown;
}

/**
 * Blocks index - the full timeline for the event.
 *
 * Lives at `/[slug]/blocks` so the dashboard can stay idea-led without
 * losing visibility into the schedule. Each row links to
 * `/[slug]/blocks/[blockKey]` which dispatches to the per-block screen.
 */
export default async function SlugBlocksPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(`/login?next=${encodeURIComponent(slugPath(ctx.slug, "blocks"))}`);
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();

  const [
    { data: blockRows },
    { data: ideaRow },
    { data: briefRows },
    { data: completionRows },
    { data: voteRows },
    { data: reflectionRows },
  ] = await Promise.all([
    supabase
      .from("blocks")
      .select(
        "id, block_key, title, subtitle, description, purpose, scheduled_date, duration_minutes, sort_order, checklists",
      )
      .eq("event_id", ctx.event.id)
      .order("sort_order", { ascending: true })
      .returns<BlockRow[]>(),
    supabase
      .from("ideas")
      .select("id, status")
      .eq("event_id", ctx.event.id)
      .eq("user_id", viewer.user.id)
      .maybeSingle<{ id: string; status: string }>(),
    supabase
      .from("project_briefs")
      .select("id")
      .eq("event_id", ctx.event.id)
      .eq("user_id", viewer.user.id)
      .limit(1),
    supabase
      .from("block_completions")
      .select("block_key")
      .eq("event_id", ctx.event.id)
      .eq("user_id", viewer.user.id)
      .returns<{ block_key: string }[]>(),
    supabase
      .from("votes")
      .select("id")
      .eq("event_id", ctx.event.id)
      .eq("user_id", viewer.user.id)
      .limit(1),
    supabase
      .from("reflections")
      .select("id")
      .eq("event_id", ctx.event.id)
      .eq("user_id", viewer.user.id)
      .limit(1),
  ]);

  const now = new Date();
  const hasIdea = Boolean(ideaRow);
  const hasBrief = Array.isArray(briefRows) && briefRows.length > 0;
  const ideaCompleted = ideaRow?.status === "completed";
  const hasVote = Array.isArray(voteRows) && voteRows.length > 0;
  const hasReflection =
    Array.isArray(reflectionRows) && reflectionRows.length > 0;
  const votingRevealed = ctx.event.voting_status === "revealed";
  const completionsSet = new Set<string>(
    (completionRows ?? []).map((r) => r.block_key),
  );

  const blocks: BlocksTimelineItem[] = (blockRows ?? []).map((b) => {
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
      description: b.description,
      intent: b.purpose,
      subtitle: b.subtitle,
      windowStatus,
      mineDone,
      scheduledDate: b.scheduled_date,
      durationMinutes: b.duration_minutes,
      checklists: parseBlockChecklists(b.checklists),
    };
  });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="mono-label">{ctx.event.title}</p>
        <h2>The Blocks</h2>
        <p className="lead">
          Your full Hacks-a-Thon timeline. Tap into whichever block you&apos;re
          working on.
        </p>
      </header>

      <BlocksTimeline
        basePath={slugPath(ctx.slug, "blocks")}
        blocks={blocks}
      />
    </div>
  );
}
