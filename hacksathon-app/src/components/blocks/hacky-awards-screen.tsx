import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AwardBallot,
  type BallotCategory,
  type BallotIdea,
  type BallotInitialPick,
} from "./award-ballot";

export type VotingStatus = "closed" | "open" | "revealed";

export interface RevealedWinner {
  categoryId: string;
  categoryName: string;
  ideaTitle: string | null;
  ownerName: string | null;
  projectUrl: string | null;
}

interface HackyAwardsScreenProps {
  eventId: string;
  votingStatus: VotingStatus;
  /**
   * Whether results have been published (events.results_published_at).
   * When voting is `revealed` but results aren't published, winners are
   * still private - the organizer is running the live ceremony - so we
   * show a waiting state instead of the winners.
   */
  resultsPublished: boolean;
  categories: BallotCategory[];
  ideas: BallotIdea[];
  myPicks: BallotInitialPick[];
  winners: RevealedWinner[];
  /**
   * Vanity slug for the event. When provided the "back to the
   * showcase" link uses `/[slug]/blocks/FINAL` directly.
   */
  slug?: string;
}

/**
 * Hacky Awards screen - modes:
 *
 *   closed              → "Voting opens after Showcase" note.
 *   open                → ballot (one section per category, ideas as tiles).
 *   revealed, unpublished → "Results are being revealed live" waiting
 *                           state (the ceremony is happening on the
 *                           organizer's shared screen).
 *   revealed, published → winners-only display per category.
 *
 * State copy lives in the page header's `.lead`; this surface stays flat
 * and editorial - no tinted status cards. Nothing here gates writes -
 * the API + RLS do.
 */
export function HackyAwardsScreen({
  eventId,
  votingStatus,
  resultsPublished,
  categories,
  ideas,
  myPicks,
  winners,
  slug,
}: HackyAwardsScreenProps) {
  const backToShowcaseHref = slug
    ? `/${slug}/blocks/FINAL`
    : `/events/${eventId}/blocks/FINAL`;

  if (votingStatus === "closed") {
    return (
      <div className="space-y-4">
        <p className="font-serif text-sm italic text-muted-foreground/80">
          When the demos wrap, your organizer will open voting here. Until
          then, nothing to do.
        </p>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={backToShowcaseHref}>
            Back to the Showcase
            <ArrowRight className="ml-1.5" />
          </Link>
        </Button>
      </div>
    );
  }

  if (votingStatus === "open") {
    return (
      <div className="space-y-6">
        <p className="font-serif text-sm italic text-muted-foreground/80">
          One pick per category. Tap to change your vote any time before the
          organizer reveals winners.
        </p>
        <AwardBallot
          eventId={eventId}
          categories={categories}
          ideas={ideas}
          initialPicks={myPicks}
        />
      </div>
    );
  }

  // revealed but not yet published - the live ceremony is in progress.
  if (!resultsPublished) {
    return (
      <div className="space-y-4">
        <p className="font-serif text-sm italic text-muted-foreground/80">
          Voting is closed and your organizer is announcing the winners right
          now. Keep an eye on the shared screen - results will appear here the
          moment the ceremony wraps.
        </p>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={backToShowcaseHref}>
            Back to the Showcase
            <ArrowRight className="ml-1.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {winners.length === 0
        ? categories.map((cat) => (
            <li key={cat.id}>
              <WinnerTile categoryName={cat.name} winner={null} />
            </li>
          ))
        : winners.map((w) => (
            <li key={w.categoryId}>
              <WinnerTile
                categoryName={w.categoryName}
                winner={w.ideaTitle ? w : null}
              />
            </li>
          ))}
    </ul>
  );
}

function WinnerTile({
  categoryName,
  winner,
}: {
  categoryName: string;
  winner: RevealedWinner | null;
}) {
  return (
    <div className="h-full space-y-1.5 border border-border bg-background p-6">
      <p className="mono-label">{categoryName}</p>
      {winner?.ideaTitle ? (
        <>
          <p className="font-serif text-2xl leading-snug text-foreground">
            {winner.projectUrl ? (
              <a
                href={winner.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {winner.ideaTitle}
              </a>
            ) : (
              winner.ideaTitle
            )}
          </p>
          {winner.ownerName && (
            <p className="text-sm text-muted-foreground">{winner.ownerName}</p>
          )}
        </>
      ) : (
        <>
          <p className="font-serif text-2xl leading-snug text-muted-foreground">
            No votes cast
          </p>
          <p className="text-sm text-muted-foreground">
            No one cast a vote in this category.
          </p>
        </>
      )}
    </div>
  );
}
