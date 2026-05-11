import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ZeroScreen, type ZeroChecklistGroup } from "@/components/blocks/zero-screen";
import { SharkTankScreen } from "@/components/blocks/shark-tank-screen";
import {
  BuildSession,
  type BuildSessionKey,
} from "@/components/blocks/build-session";
import { ShowcasePrep } from "@/components/blocks/showcase-prep";
import { AwardsPlaceholder } from "@/components/blocks/awards-placeholder";
import { ReflectionsPlaceholder } from "@/components/blocks/reflections-placeholder";
import {
  deriveWindowStatus,
  formatScheduledDate,
  type WindowStatus,
} from "@/lib/blocks/status";

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

const VALID_BLOCK_KEYS: ReadonlySet<BlockKey> = new Set<BlockKey>([
  "ZERO",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "FINAL",
  "+01",
  "+02",
]);

interface PageProps {
  params: Promise<{ id: string; blockKey: string }>;
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

interface EventSettingsRow {
  id: string;
  title: string;
  settings: Record<string, unknown> | null;
}

/**
 * Block-screen dispatcher. One dynamic route serves all ten blocks; the
 * shared shell (back link, header, status pill) wraps a per-block
 * component selected on the server.
 *
 * Blocks 01 (IdeaLab) and 03 (The Blueprint) are server-side redirects
 * because they already have dedicated routes — IdeaLab at
 * /events/[id]/idealab and The Blueprint at /plan. Everything else
 * renders inline.
 */
export default async function BlockPage({ params }: PageProps) {
  const { id: eventId, blockKey: rawBlockKey } = await params;
  const blockKey = decodeURIComponent(rawBlockKey);

  if (!VALID_BLOCK_KEYS.has(blockKey as BlockKey)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/events/${eventId}/blocks/${rawBlockKey}`);

  // Look up the user's idea up front — needed for redirects and several block
  // screens. The query is cheap and the result is reused.
  const { data: ideaRow } = await supabase
    .from("ideas")
    .select("id, live_url, final_screenshot_url, status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Redirect-only blocks.
  if (blockKey === "01") redirect(`/events/${eventId}/idealab`);
  if (blockKey === "03") {
    const params = new URLSearchParams({ event: eventId, tool: "lovable" });
    if (ideaRow?.id) params.set("idea", ideaRow.id);
    redirect(`/plan?${params.toString()}`);
  }

  // Load the event + the specific block row + Shark Tank completion in
  // parallel. The completion row only matters for blockKey '02' but the
  // query is cheap and the Promise.all keeps latency at one round-trip.
  const [
    { data: eventRow },
    { data: block },
    { data: completionRow },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, settings")
      .eq("id", eventId)
      .single<EventSettingsRow>(),
    supabase
      .from("blocks")
      .select(
        "id, block_key, title, subtitle, description, purpose, scheduled_date, duration_minutes, checklists",
      )
      .eq("event_id", eventId)
      .eq("block_key", blockKey)
      .maybeSingle<BlockRow>(),
    supabase
      .from("block_completions")
      .select("block_key")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("block_key", blockKey)
      .maybeSingle<{ block_key: string }>(),
  ]);

  if (!eventRow) notFound();
  if (!block) notFound();

  const windowStatus = deriveWindowStatus(
    block.scheduled_date,
    block.duration_minutes,
    new Date(),
  );
  const scheduledLabel = formatScheduledDate(block.scheduled_date);
  const completedByUser = Boolean(completionRow);

  const slackUrl =
    typeof eventRow.settings === "object" &&
    eventRow.settings !== null &&
    typeof (eventRow.settings as Record<string, unknown>).slack_url ===
      "string"
      ? ((eventRow.settings as Record<string, unknown>).slack_url as string)
      : null;

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {eventRow.title}
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-8 min-w-12 items-center justify-center rounded-md border border-foreground bg-foreground px-2 text-xs font-semibold text-background">
            {block.block_key}
          </span>
          <BlockStatusBadge status={windowStatus} />
          {scheduledLabel && (
            <span className="text-xs font-medium text-muted-foreground">
              {scheduledLabel}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{block.title}</h1>
        {block.subtitle && (
          <p className="text-base text-muted-foreground">{block.subtitle}</p>
        )}
      </header>

      <BlockBody
        blockKey={blockKey as BlockKey}
        block={block}
        eventId={eventId}
        userId={user.id}
        ideaId={ideaRow?.id ?? null}
        liveUrl={(ideaRow?.live_url as string | null) ?? null}
        finalScreenshotUrl={
          (ideaRow?.final_screenshot_url as string | null) ?? null
        }
        ideaStatus={(ideaRow?.status as string | null) ?? null}
        completedByUser={completedByUser}
        slackUrl={slackUrl}
      />
    </div>
  );
}

function BlockStatusBadge({ status }: { status: WindowStatus }) {
  if (status === "active") {
    return (
      <Badge variant="default" className="uppercase tracking-widest">
        Happening now
      </Badge>
    );
  }
  if (status === "completed") {
    return (
      <Badge variant="outline" className="uppercase tracking-widest">
        Window closed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="uppercase tracking-widest">
      Upcoming
    </Badge>
  );
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
      />
    );
  }

  if (blockKey === "+01") return <AwardsPlaceholder />;
  if (blockKey === "+02") return <ReflectionsPlaceholder />;

  return null;
}

/**
 * Loads the participant's most-recent planning session for this event
 * and synthesizes / re-uses the Starter Prompt the same way
 * /api/planning/starter-prompt does. Server-side so the build session
 * page is fully populated on first paint (no fetch dance).
 */
async function BuildSessionBody({
  eventId,
  userId,
  ideaId,
  sessionKey,
  slackUrl,
}: {
  eventId: string;
  userId: string;
  ideaId: string | null;
  sessionKey: BuildSessionKey;
  slackUrl: string | null;
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
    />
  );
}

/**
 * Mirror of buildStarterPrompt in /api/planning/starter-prompt.
 * Kept inline (and intentionally simple) so the build-session route
 * never blocks on a follow-up fetch.
 */
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
    .join(" — ");

  return `I'm building an app called ${args.projectName}.

Here's what it is: ${args.oneSentenceScope}

It's for: ${args.targetUser}

The one thing it needs to do: ${args.coreFeature}

${designLine ? `Design direction: ${designLine}\n\n` : ""}For this first build, only this needs to work: ${args.doneLooksLike}

Start there and nothing else. Don't add features I haven't asked for.

I'm attaching my Blueprint — please read it before you start building.`;
}

/**
 * `checklists` is JSONB and untrusted at the type level. Accept either an
 * array of strings or an array of objects with title + items, and bail
 * gracefully on anything else.
 */
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
