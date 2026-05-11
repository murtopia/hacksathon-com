import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SharkTankScreenProps {
  eventId: string;
  ideaId: string | null;
}

/**
 * Shark Tank Prep — the brief on-screen reminder of pitch shape, plus
 * a deep link to edit the participant's IdeaLab entry after the
 * exercise (where they'll likely want to capture feedback).
 */
export function SharkTankScreen({ eventId, ideaId }: SharkTankScreenProps) {
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
            Take a beat. Capture what your team said while it&apos;s fresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ideaId ? (
            <Button asChild>
              <Link href={`/events/${eventId}/idealab/${ideaId}`}>
                Update your idea
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/events/${eventId}/idealab/new`}>
                Drop your idea first
              </Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Sharpen the pitch, swap a feature, or refine your one-liner — whatever
            the room landed on.
          </p>
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
