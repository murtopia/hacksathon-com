import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LockMyIdeaButton } from "@/components/blocks/lock-my-idea-button";

interface SharkTankScreenProps {
  eventId: string;
  ideaId: string | null;
  alreadyLocked: boolean;
}

/**
 * Shark Tank Prep — the brief on-screen reminder of pitch shape, plus
 * the two affordances that close out this block:
 *
 *   1. "Update your idea" deep link so participants can capture
 *      feedback from the room while it's fresh.
 *   2. "Lock my idea" — explicit per-participant completion. Writes a
 *      block_completions row for block '02'.
 */
export function SharkTankScreen({
  eventId,
  ideaId,
  alreadyLocked,
}: SharkTankScreenProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your one-minute pitch</CardTitle>
          <CardDescription>
            Three beats. Keep it tight. Energy beats polish.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <PitchBeat
              label="Hook"
              text="Open with the moment, the pain, or the joke that makes this idea click."
            />
            <PitchBeat
              label="The build"
              text="Who it's for, what it does, and the one thing that makes it different."
            />
            <PitchBeat
              label="Why now"
              text="Why this is the version of the idea you're betting on today."
            />
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">After your pitch</CardTitle>
          <CardDescription>
            Take a beat. Capture what your team said, then lock it in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ideaId ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <LockMyIdeaButton
                  eventId={eventId}
                  alreadyLocked={alreadyLocked}
                />
                <Button asChild variant="outline">
                  <Link href={`/events/${eventId}/idealab/${ideaId}`}>
                    Update your idea
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {alreadyLocked
                  ? "Your idea is locked. You can still edit it from the IdeaLab."
                  : "Sharpen the pitch, swap a feature, or refine your one-liner — whatever the room landed on. Lock it in when you're ready to build."}
              </p>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href={`/events/${eventId}/idealab/new`}>
                  Drop your idea first
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Drop your idea in the IdeaLab so you have something to pitch.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PitchBeat({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-md border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}
