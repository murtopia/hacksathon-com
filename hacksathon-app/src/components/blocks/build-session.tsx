import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StarterPrompt } from "@/components/planning/starter-prompt";

export type BuildSessionKey = "04" | "05" | "06";

interface BuildSessionProps {
  eventId: string;
  sessionKey: BuildSessionKey;
  ideaId: string | null;
  blueprintMarkdown: string | null;
  starterPromptText: string | null;
  slackUrl: string | null;
}

const ENCOURAGEMENT: Record<BuildSessionKey, { title: string; body: string }> = {
  "04": {
    title: "Let's go.",
    body: "Open your build tool, paste the Starter Prompt, attach your Blueprint, and ship the first version.",
  },
  "05": {
    title: "Keep cooking.",
    body: "Sharpen the rough edges. Add the next feature on your list. Test it as a real user would.",
  },
  "06": {
    title: "Bring it home.",
    body: "Lock the demo flow. Polish what you'll show on stage. Resist the urge to start something new.",
  },
};

/**
 * Build session screens for blocks 04 / 05 / 06.
 *
 * Block 04 is the kickoff session — full surface: encouragement,
 * collapsed Blueprint, and the Starter Prompt block (which carries the
 * 5-step paste-into-Lovable instructions). When there's no Blueprint
 * yet we suppress the Starter Prompt entirely; otherwise the user sees
 * a misleading "Preparing your Starter Prompt…" spinner.
 *
 * Blocks 05 and 06 are continuation sessions. The kickoff already
 * happened in 04, so we drop the Starter Prompt block here and show
 * a lighter shell: encouragement + collapsed Blueprint + an optional
 * team-chat reminder when a Slack URL is configured.
 */
export function BuildSession({
  eventId,
  sessionKey,
  ideaId,
  blueprintMarkdown,
  starterPromptText,
  slackUrl,
}: BuildSessionProps) {
  const tone = ENCOURAGEMENT[sessionKey];
  const planHref = buildPlanHref(eventId, ideaId);
  const isKickoff = sessionKey === "04";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{tone.title}</CardTitle>
          <CardDescription>{tone.body}</CardDescription>
        </CardHeader>
      </Card>

      {blueprintMarkdown ? (
        <BlueprintDetails markdown={blueprintMarkdown} planHref={planHref} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No Blueprint yet</CardTitle>
            <CardDescription>
              Head back to The Blueprint block to shape your idea before you
              build.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={planHref}>Open The Blueprint</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {isKickoff && blueprintMarkdown && (
        <StarterPrompt prompt={starterPromptText} />
      )}

      {!isKickoff && slackUrl && <TeamChatReminder slackUrl={slackUrl} />}
    </div>
  );
}

function BlueprintDetails({
  markdown,
  planHref,
}: {
  markdown: string;
  planHref: string;
}) {
  return (
    <details className="rounded-lg border bg-background">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-muted/40">
        <span className="inline-flex items-center gap-2">
          <span>Your Blueprint</span>
          <span className="text-xs font-normal text-muted-foreground">
            (click to expand)
          </span>
        </span>
      </summary>
      <div className="border-t px-4 py-4">
        <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-foreground">
          {markdown}
        </pre>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href={planHref}>Edit Blueprint</Link>
          </Button>
        </div>
      </div>
    </details>
  );
}

function TeamChatReminder({ slackUrl }: { slackUrl: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-foreground"
        >
          <MessageSquare className="size-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">Stuck? Ask the room.</CardTitle>
          <CardDescription>
            Drop a question in the team chat. Someone else has probably hit the
            same wall.
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
  );
}

function buildPlanHref(eventId: string, ideaId: string | null): string {
  const params = new URLSearchParams({ event: eventId, tool: "lovable" });
  if (ideaId) params.set("idea", ideaId);
  return `/plan?${params.toString()}`;
}
