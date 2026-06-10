import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdeaProgressTimeline } from "@/components/idealab/idea-progress-timeline";
import { rowToIdea, type IdeaWithAuthor } from "@/lib/idealab/types";
import { rowToSession } from "@/lib/planning/context";
import type {
  PlanningSession,
  ProjectBrief,
} from "@/lib/planning/types";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Your Idea",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * "Your Idea" - the participant's stable home for everything tied to
 * their own idea in this event. The body is the three-row editorial
 * timeline (`IdeaProgressTimeline`): Your Idea Details, Your
 * Screenshot, Your Blueprint.
 *
 * Routing model:
 *   - No idea yet → redirect to `/[slug]/idea/new`.
 *   - Has an idea → load the idea + the current brief (if any) + the
 *     planning session attached to it (for Refine Blueprint) + the
 *     most recent in-progress orphan session (for Resume Blueprint
 *     conversation). Hand all three to the timeline.
 *
 * The Blueprint conversation lives in a modal (`BlueprintFlowDialog`)
 * launched from Section 03, so the URL stays at `/[slug]/idea` while
 * the participant works through the chat.
 */
export default async function SlugIdeaPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(slugPath(ctx.slug, "idea"))}`);
  }
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("ideas")
    .select(
      "*, profile:profiles!ideas_user_id_fkey(full_name, avatar_url)",
    )
    .eq("event_id", ctx.event.id)
    .eq("user_id", viewer.user.id)
    .maybeSingle();

  if (!row) {
    redirect(slugPath(ctx.slug, "idea/new"));
  }

  const profile = row.profile as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  const idea: IdeaWithAuthor = {
    ...rowToIdea(row),
    authorName: profile?.full_name ?? null,
    authorAvatarUrl: profile?.avatar_url ?? null,
  };

  // Current brief - at most one row per idea has `is_current = true`
  // by the project_briefs invariant.
  const { data: briefRow } = await supabase
    .from("project_briefs")
    .select("*")
    .eq("idea_id", idea.id)
    .eq("is_current", true)
    .maybeSingle();

  const initialBrief: ProjectBrief | null = briefRow
    ? normalizeBrief(briefRow)
    : null;

  // Resolve both timeline session inputs in a single query batch.
  //
  //   briefSession         - the session that produced `initialBrief`.
  //                          Drives Refine Blueprint (post-PRD mode).
  //   inProgressSession    - most recent session for this idea where
  //                          status != 'completed' AND brief_id is
  //                          null. Drives Resume Blueprint
  //                          conversation (mid-Blueprint pickup).
  const briefSessionPromise = initialBrief
    ? supabase
        .from("planning_sessions")
        .select("*")
        .eq("id", initialBrief.planningSessionId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const orphanSessionPromise = supabase
    .from("planning_sessions")
    .select("*")
    .eq("idea_id", idea.id)
    .neq("status", "complete")
    .is("brief_id", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: briefSessionRow }, { data: orphanSessionRow }] =
    await Promise.all([briefSessionPromise, orphanSessionPromise]);

  const briefSession: PlanningSession | null = briefSessionRow
    ? rowToSession(briefSessionRow as Record<string, unknown>)
    : null;
  const inProgressSession: PlanningSession | null = orphanSessionRow
    ? rowToSession(orphanSessionRow as Record<string, unknown>)
    : null;

  return (
    <div className="max-w-[var(--container-narrow)] space-y-8">
      <header className="space-y-3">
        <p className="mono-label">{ctx.event.title}</p>
        <h2>Your Idea</h2>
        <p className="lead">
          Three steps to a build-ready idea - work through them in any order,
          come back any time.
        </p>
      </header>

      <IdeaProgressTimeline
        initialIdea={idea}
        eventId={ctx.event.id}
        buildTool={ctx.event.build_tool}
        companyName={ctx.org?.name ?? ctx.event.title}
        initialBrief={initialBrief}
        briefSession={briefSession}
        inProgressSession={inProgressSession}
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBrief(raw: any): ProjectBrief {
  return {
    id: raw.id,
    eventId: raw.event_id ?? null,
    userId: raw.user_id,
    ideaId: raw.idea_id ?? null,
    planningSessionId: raw.planning_session_id,
    projectName: raw.project_name,
    oneSentenceScope: raw.one_sentence_scope,
    targetUser: raw.target_user,
    coreFeature: raw.core_feature,
    designVibe: raw.design_vibe ?? null,
    referenceUrl: raw.reference_url ?? null,
    colorToneNotes: raw.color_tone_notes ?? null,
    outOfScope: raw.out_of_scope,
    doneLooksLike: raw.done_looks_like,
    prdMarkdown: raw.prd_markdown ?? null,
    version: raw.version ?? 1,
    isCurrent: raw.is_current ?? true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
