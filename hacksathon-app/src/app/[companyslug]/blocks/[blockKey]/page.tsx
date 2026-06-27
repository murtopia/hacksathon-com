import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  ZeroScreen,
  type ZeroChecklistGroup,
} from "@/components/blocks/zero-screen";
import { SharkTankScreen } from "@/components/blocks/shark-tank-screen";
import {
  BuildSession,
  type BuildSessionKey,
} from "@/components/blocks/build-session";
import { ShowcasePrep } from "@/components/blocks/showcase-prep";
import {
  HackyAwardsScreen,
  type VotingStatus,
  type RevealedWinner,
} from "@/components/blocks/hacky-awards-screen";
import type {
  BallotCategory,
  BallotIdea,
  BallotInitialPick,
} from "@/components/blocks/award-ballot";
import {
  ReflectionsScreen,
  type ReflectionStatus,
} from "@/components/blocks/reflections-screen";
import type {
  ReflectionQuestion,
  ReflectionAnswer,
} from "@/components/blocks/reflection-form";
import {
  baseBlockKey,
  deriveWindowStatus,
  formatScheduledDate,
  isValidBlockKey,
  type WindowStatus,
} from "@/lib/blocks/status";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Block",
};

type BlockKey =
  | "ZERO"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "FINAL"
  | "+01"
  | "+02";

interface PageProps {
  params: Promise<{ companyslug: string; blockKey: string }>;
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
  checklists: unknown;
}

/**
 * Per-block screen dispatcher under `/[slug]/blocks/[blockKey]`.
 *
 * Routing rules:
 *   - Block `01` (IdeaLab) redirects to `/[slug]/idealab`.
 *   - Block `03` (Blueprint) redirects to `/plan?...&tool={event.build_tool}`.
 *   - Block `+01` redirects to `/[slug]/awards`.
 *   - Block `+02` redirects to `/[slug]/reflections`.
 *   - Everything else renders the per-block component inline.
 *
 * The `+01` / `+02` redirects mean the block-completion data model keeps
 * working unchanged - `block_completions.block_key` still uses the
 * canonical keys - while the participant-facing URL is pretty.
 */
export default async function SlugBlockPage({ params }: PageProps) {
  const { companyslug, blockKey: rawBlockKey } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const blockKey = decodeURIComponent(rawBlockKey);
  if (!isValidBlockKey(blockKey)) notFound();

  // Extra "continuation" sessions (e.g. 02-2, FINAL-2) inherit the base
  // key's screen + completion rule. Only 02/FINAL ever get instances, so
  // the redirect-only keys below stay exact-match.
  const baseKey = baseBlockKey(blockKey);

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(
        slugPath(ctx.slug, `blocks/${rawBlockKey}`),
      )}`,
    );
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();

  const { data: ideaRow } = await supabase
    .from("ideas")
    .select("id, live_url, final_screenshot_url, status")
    .eq("event_id", ctx.event.id)
    .eq("user_id", viewer.user.id)
    .maybeSingle();

  // Redirect-only blocks.
  if (blockKey === "01") redirect(slugPath(ctx.slug, "idealab"));
  if (blockKey === "03") {
    const qs = new URLSearchParams({
      event: ctx.event.id,
      tool: ctx.event.build_tool,
    });
    if (ideaRow?.id) qs.set("idea", ideaRow.id);
    redirect(`/plan?${qs.toString()}`);
  }
  if (blockKey === "+01") redirect(slugPath(ctx.slug, "awards"));
  if (blockKey === "+02") redirect(slugPath(ctx.slug, "reflections"));

  const { data: block } = await supabase
    .from("blocks")
    .select(
      "id, block_key, title, subtitle, description, purpose, scheduled_date, duration_minutes, checklists",
    )
    .eq("event_id", ctx.event.id)
    .eq("block_key", blockKey)
    .maybeSingle<BlockRow>();

  if (!block) notFound();

  const { data: completionRow } = await supabase
    .from("block_completions")
    .select("block_key")
    .eq("event_id", ctx.event.id)
    .eq("user_id", viewer.user.id)
    .eq("block_key", baseKey)
    .maybeSingle<{ block_key: string }>();

  const windowStatus = deriveWindowStatus(
    block.scheduled_date,
    block.duration_minutes,
    new Date(),
  );
  const scheduledLabel = formatScheduledDate(block.scheduled_date);
  const completedByUser = Boolean(completionRow);

  const slackUrl =
    typeof ctx.event.settings === "object" &&
    ctx.event.settings !== null &&
    typeof (ctx.event.settings as Record<string, unknown>).slack_url ===
      "string"
      ? ((ctx.event.settings as Record<string, unknown>).slack_url as string)
      : null;

  return (
    <div className="space-y-6">
      <Link
        href={slugPath(ctx.slug, "blocks")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All blocks
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">
            {block.block_key}
          </span>
          <BlockStatusBadge status={windowStatus} />
          {scheduledLabel && (
            <span className="mono-label">{scheduledLabel}</span>
          )}
        </div>
        <h2>{block.title}</h2>
        {block.subtitle && <p className="lead">{block.subtitle}</p>}
      </header>

      <BlockBody
        blockKey={baseKey as BlockKey}
        block={block}
        eventId={ctx.event.id}
        userId={viewer.user.id}
        ideaId={ideaRow?.id ?? null}
        liveUrl={(ideaRow?.live_url as string | null) ?? null}
        finalScreenshotUrl={
          (ideaRow?.final_screenshot_url as string | null) ?? null
        }
        ideaStatus={(ideaRow?.status as string | null) ?? null}
        completedByUser={completedByUser}
        slackUrl={slackUrl}
        votingStatus={ctx.event.voting_status}
        resultsPublished={Boolean(ctx.event.results_published_at)}
        reflectionStatus={ctx.event.reflection_status}
        buildTool={ctx.event.build_tool}
        slug={ctx.slug}
      />
    </div>
  );
}

function BlockStatusBadge({ status }: { status: WindowStatus }) {
  if (status === "active") {
    return <Badge variant="outline">Happening now</Badge>;
  }
  if (status === "completed") {
    return <Badge variant="secondary">Window closed</Badge>;
  }
  return <Badge variant="secondary">Upcoming</Badge>;
}

async function BlockBody({
  blockKey,
  block,
  eventId,
  userId,
  ideaId,
  liveUrl,
  finalScreenshotUrl,
  ideaStatus,
  completedByUser,
  slackUrl,
  votingStatus,
  resultsPublished,
  reflectionStatus,
  buildTool,
  slug,
}: {
  blockKey: BlockKey;
  block: BlockRow;
  eventId: string;
  userId: string;
  ideaId: string | null;
  liveUrl: string | null;
  finalScreenshotUrl: string | null;
  ideaStatus: string | null;
  completedByUser: boolean;
  slackUrl: string | null;
  votingStatus: VotingStatus;
  resultsPublished: boolean;
  reflectionStatus: ReflectionStatus;
  buildTool: string;
  slug: string;
}) {
  if (blockKey === "ZERO") {
    return (
      <ZeroScreen
        description={block.description}
        purpose={block.purpose}
        checklists={parseChecklists(block.checklists)}
      />
    );
  }

  if (blockKey === "02") {
    return (
      <SharkTankScreen
        eventId={eventId}
        ideaId={ideaId}
        alreadyLocked={completedByUser}
        slug={slug}
      />
    );
  }

  if (blockKey === "04" || blockKey === "05" || blockKey === "06") {
    return (
      <BuildSessionBody
        eventId={eventId}
        userId={userId}
        ideaId={ideaId}
        sessionKey={blockKey}
        slackUrl={slackUrl}
        buildTool={buildTool}
      />
    );
  }

  if (blockKey === "FINAL") {
    return (
      <ShowcasePrep
        eventId={eventId}
        ideaId={ideaId}
        liveUrl={liveUrl}
        finalScreenshotUrl={finalScreenshotUrl}
        status={ideaStatus}
        slug={slug}
      />
    );
  }

  // +01 and +02 are handled by redirects upstream; these guards keep the
  // dispatcher exhaustive in case the redirect list and the valid-keys
  // list ever drift.
  if (blockKey === "+01") {
    return (
      <HackyAwardsBody
        eventId={eventId}
        userId={userId}
        votingStatus={votingStatus}
        resultsPublished={resultsPublished}
        slug={slug}
      />
    );
  }
  if (blockKey === "+02") {
    return (
      <ReflectionsBody
        eventId={eventId}
        userId={userId}
        status={reflectionStatus}
      />
    );
  }

  return null;
}

async function HackyAwardsBody({
  eventId,
  userId,
  votingStatus,
  resultsPublished,
  slug,
}: {
  eventId: string;
  userId: string;
  votingStatus: VotingStatus;
  resultsPublished: boolean;
  slug: string;
}) {
  const supabase = await createClient();

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
    <HackyAwardsScreen
      eventId={eventId}
      votingStatus={votingStatus}
      resultsPublished={resultsPublished}
      categories={categories}
      ideas={ideas}
      myPicks={myPicks}
      winners={winners}
      slug={slug}
    />
  );
}

async function ReflectionsBody({
  eventId,
  userId,
  status,
}: {
  eventId: string;
  userId: string;
  status: ReflectionStatus;
}) {
  const supabase = await createClient();

  const [{ data: questionRows }, { data: reflectionRows }] = await Promise.all([
    supabase
      .from("reflection_questions")
      .select("id, question_text, sort_order, is_required")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("reflections")
      .select("question_id, answer")
      .eq("event_id", eventId)
      .eq("user_id", userId),
  ]);

  const questions: ReflectionQuestion[] = (questionRows ?? []).map((q) => ({
    id: q.id as string,
    question_text: q.question_text as string,
    sort_order: (q.sort_order as number) ?? 0,
    is_required: Boolean(q.is_required),
  }));

  const initialAnswers: ReflectionAnswer[] = (reflectionRows ?? []).map(
    (r) => ({
      questionId: r.question_id as string,
      answer: (r.answer as string) ?? "",
    }),
  );

  return (
    <ReflectionsScreen
      eventId={eventId}
      questions={questions}
      initialAnswers={initialAnswers}
      status={status}
    />
  );
}

async function BuildSessionBody({
  eventId,
  userId,
  ideaId,
  sessionKey,
  slackUrl,
  buildTool,
}: {
  eventId: string;
  userId: string;
  ideaId: string | null;
  sessionKey: BuildSessionKey;
  slackUrl: string | null;
  buildTool: string;
}) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("planning_sessions")
    .select("id, brief_id, starter_prompt_text")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .not("brief_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let blueprintMarkdown: string | null = null;
  let starterPromptText: string | null = session?.starter_prompt_text ?? null;

  if (session?.brief_id) {
    const { data: brief } = await supabase
      .from("project_briefs")
      .select(
        "prd_markdown, project_name, one_sentence_scope, target_user, core_feature, design_vibe, reference_url, done_looks_like",
      )
      .eq("id", session.brief_id)
      .single();

    if (brief) {
      blueprintMarkdown = brief.prd_markdown ?? null;

      if (!starterPromptText) {
        starterPromptText = synthesizeStarterPrompt({
          projectName: brief.project_name,
          oneSentenceScope: brief.one_sentence_scope,
          targetUser: brief.target_user,
          coreFeature: brief.core_feature,
          designVibe: brief.design_vibe,
          referenceUrl: brief.reference_url,
          doneLooksLike: brief.done_looks_like,
        });

        await supabase
          .from("planning_sessions")
          .update({
            starter_prompt_text: starterPromptText,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);
      }
    }
  }

  return (
    <BuildSession
      eventId={eventId}
      sessionKey={sessionKey}
      ideaId={ideaId}
      blueprintMarkdown={blueprintMarkdown}
      starterPromptText={starterPromptText}
      slackUrl={slackUrl}
      buildTool={buildTool}
    />
  );
}

function synthesizeStarterPrompt(args: {
  projectName: string;
  oneSentenceScope: string;
  targetUser: string;
  coreFeature: string;
  designVibe: string | null;
  referenceUrl: string | null;
  doneLooksLike: string;
}): string {
  const designLine = [args.designVibe, args.referenceUrl]
    .filter((v) => v && v.trim().length > 0)
    .join(" - ");

  return `I'm building an app called ${args.projectName}.

Here's what it is: ${args.oneSentenceScope}

It's for: ${args.targetUser}

The one thing it needs to do: ${args.coreFeature}

${designLine ? `Design direction: ${designLine}\n\n` : ""}For this first build, only this needs to work: ${args.doneLooksLike}

Start there and nothing else. Don't add features I haven't asked for.

I'm attaching my Blueprint - please read it before you start building.`;
}

function parseChecklists(raw: unknown): ZeroChecklistGroup[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): ZeroChecklistGroup | null => {
      if (typeof entry === "string") return { items: [entry] };
      if (entry && typeof entry === "object") {
        const obj = entry as { title?: unknown; items?: unknown };
        const items = Array.isArray(obj.items)
          ? obj.items.filter((i): i is string => typeof i === "string")
          : [];
        if (items.length === 0) return null;
        return {
          title: typeof obj.title === "string" ? obj.title : undefined,
          items,
        };
      }
      return null;
    })
    .filter((g): g is ZeroChecklistGroup => g !== null);
}
