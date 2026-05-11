import Link from "next/link";
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
 * Build session screens for blocks 04 / 05 / 06. They share a layout
 * so participants always know where to find their Blueprint and Starter
 * Prompt, even three sessions deep.
 *
 * Structure:
 *   1. Block-specific encouragement copy.
 *   2. Collapsed Blueprint card (<details>) so it doesn't dominate the
 *      page but is one click away. Falls back to a deep link to /plan
 *      when no Blueprint exists yet.
 *   3. Starter Prompt block — same component as /plan.
 *   4. Reminder of the kickoff steps.
 */
export function BuildSession({
  eventId,
  sessionKey,
  ideaId,
  blueprintMarkdown,
  starterPromptText,
}: BuildSessionProps) {
  const tone = ENCOURAGEMENT[sessionKey];
  const planHref = buildPlanHref(eventId, ideaId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{tone.title}</CardTitle>
          <CardDescription>{tone.body}</CardDescription>
        </CardHeader>
      </Card>

      {blueprintMarkdown ? (
        <details className="rounded-lg border bg-background">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-muted/40">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>📋</span>
              <span>Your Blueprint</span>
              <span className="text-xs font-normal text-muted-foreground">
                (click to expand)
              </span>
            </span>
          </summary>
          <div className="border-t px-4 py-4">
            <pre className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-foreground">
              {blueprintMarkdown}
            </pre>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href={planHref}>Edit Blueprint</Link>
              </Button>
            </div>
          </div>
        </details>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No Blueprint yet</CardTitle>
            <CardDescription>
              Head back to The Blueprint block to shape your idea before you build.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={planHref}>Open The Blueprint</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <StarterPrompt prompt={starterPromptText} />
    </div>
  );
}

function buildPlanHref(eventId: string, ideaId: string | null): string {
  const params = new URLSearchParams({ event: eventId, tool: "lovable" });
  if (ideaId) params.set("idea", ideaId);
  return `/plan?${params.toString()}`;
}
