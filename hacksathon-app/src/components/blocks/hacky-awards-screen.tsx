import Link from "next/link";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  categories: BallotCategory[];
  ideas: BallotIdea[];
  myPicks: BallotInitialPick[];
  winners: RevealedWinner[];
}

/**
 * Hacky Awards screen — three modes:
 *
 *   closed   → "Voting opens after Showcase" card + helpful next step.
 *   open     → ballot (one card per category, ideas as tiles).
 *   revealed → winners-only display per category (no vote counts per the
 *              session-2 spec). When a category had zero votes we show
 *              a small "No votes cast" tile so the layout stays even.
 *
 * Nothing here gates writes — the API + RLS do. This component is just
 * the right visual surface for whatever state the event is in.
 */
export function HackyAwardsScreen({
  eventId,
  votingStatus,
  categories,
  ideas,
  myPicks,
  winners,
}: HackyAwardsScreenProps) {
  if (votingStatus === "closed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Voting opens after Showcase
          </CardTitle>
          <CardDescription>
            When the demos wrap, your organizer will open voting here. Until
            then, nothing to do.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/events/${eventId}/blocks/FINAL`}>
              Back to the showcase
              <ArrowRight className="ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (votingStatus === "open") {
    return (
      <div className="space-y-4">
        <Card className="border-foreground/20 bg-foreground/[0.02]">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground"
            >
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Voting is open</CardTitle>
              <CardDescription>
                One pick per category. Tap to change your vote any time before
                the organizer reveals winners.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <AwardBallot
          eventId={eventId}
          categories={categories}
          ideas={ideas}
          initialPicks={myPicks}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-foreground/20 bg-foreground/[0.02]">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground"
          >
            <Trophy className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Winners</CardTitle>
            <CardDescription>
              That&apos;s a wrap. Here&apos;s what the team picked.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

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
    </div>
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
    <Card className="h-full">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {categoryName}
        </p>
        {winner?.ideaTitle ? (
          <>
            <CardTitle className="text-lg">
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
            </CardTitle>
            {winner.ownerName && (
              <CardDescription>{winner.ownerName}</CardDescription>
            )}
          </>
        ) : (
          <>
            <CardTitle className="text-lg text-muted-foreground">
              No votes cast
            </CardTitle>
            <CardDescription>
              No one cast a vote in this category.
            </CardDescription>
          </>
        )}
      </CardHeader>
    </Card>
  );
}
