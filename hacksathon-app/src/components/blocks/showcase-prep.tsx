import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ShowcasePrepProps {
  eventId: string;
  ideaId: string | null;
  liveUrl: string | null;
  finalScreenshotUrl: string | null;
  status: string | null;
  /**
   * Vanity slug for the event. When provided, the "edit your idea"
   * deep link uses `/[slug]/idea(/new)` directly.
   */
  slug?: string;
}

/**
 * Showcase prep - the final check before going on stage. Shows three
 * binary readiness signals against the participant's IdeaLab entry,
 * each with a deep link to fix anything that's missing.
 */
export function ShowcasePrep({
  eventId,
  ideaId,
  liveUrl,
  finalScreenshotUrl,
  status,
  slug,
}: ShowcasePrepProps) {
  const editHref = slug
    ? ideaId
      ? `/${slug}/idea`
      : `/${slug}/idea/new`
    : ideaId
      ? `/events/${eventId}/idealab/${ideaId}`
      : `/events/${eventId}/idealab/new`;

  const items = [
    {
      label: "Live URL is set",
      ready: Boolean(liveUrl && liveUrl.length > 0),
      fix: "Add your live URL",
    },
    {
      label: "Final screenshot uploaded",
      ready: Boolean(finalScreenshotUrl),
      fix: "Upload your final screenshot",
    },
    {
      label: "Idea marked Completed",
      ready: status === "completed",
      fix: "Flip your status to Completed",
    },
  ];

  const allReady = items.every((i) => i.ready);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo format</CardTitle>
          <CardDescription>
            3-minute demo, then 2-minute Q&amp;A. Keep it sharp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span aria-hidden className="text-muted-foreground">
                •
              </span>
              Open with one line that frames why this matters.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-muted-foreground">
                •
              </span>
              Show it. Click through the real flow, not a deck.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-muted-foreground">
                •
              </span>
              End with what you learned and where you&apos;d take it next.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {allReady ? "You're ready." : "Tie up loose ends"}
          </CardTitle>
          <CardDescription>
            {allReady
              ? "All three pieces are in place. Go have fun out there."
              : "Knock these out before you take the stage."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  {item.ready ? (
                    <Check
                      className="size-4 text-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <X
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      item.ready
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </span>
                {!item.ready && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={editHref}>{item.fix}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {ideaId && (
            <div className="pt-2">
              <Button
                asChild
                variant={allReady ? "pill" : "outline"}
                size={allReady ? "pill" : "default"}
              >
                <Link href={editHref}>Open your idea</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
