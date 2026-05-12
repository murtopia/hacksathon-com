"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, Megaphone, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VotingControlsProps {
  eventId: string;
  votingStatus: "closed" | "open" | "revealed";
  voteCount: number;
  ideaCount: number;
}

/**
 * Admin voting controls. Three states map to the underlying voting_status:
 *
 *   closed   → "Open voting" CTA. Warns if there are zero ideas (because
 *              opening a ballot with nothing on it is a footgun).
 *   open     → live status card + "Reveal winners" CTA. The reveal is
 *              irreversible (it locks the event), so we double-confirm
 *              via window.confirm.
 *   revealed → done state. No CTA — there's nothing to revert to.
 */
export function VotingControls({
  eventId,
  votingStatus,
  voteCount,
  ideaCount,
}: VotingControlsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(votingStatus);

  function openVoting() {
    if (ideaCount === 0) {
      if (
        !window.confirm(
          "There are no ideas submitted yet. Open voting anyway?",
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus("open");
      const res = await fetch(
        `/api/events/${eventId}/admin/voting/open`,
        { method: "POST" },
      );
      if (!res.ok) {
        setOptimisticStatus(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't open voting.");
        return;
      }
      toast.success("Voting is open. Participants can vote now.");
      router.refresh();
    });
  }

  function revealWinners() {
    if (
      !window.confirm(
        "Reveal winners? This locks the event — ideas, briefs, and sessions become read-only, and voting permanently closes.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus("revealed");
      const res = await fetch(
        `/api/events/${eventId}/admin/voting/reveal`,
        { method: "POST" },
      );
      if (!res.ok) {
        setOptimisticStatus(prior);
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't reveal winners.");
        return;
      }
      toast.success("Winners revealed. Event is now locked.");
      router.refresh();
    });
  }

  if (optimisticStatus === "closed") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted"
          >
            <Megaphone className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Voting is closed</CardTitle>
            <CardDescription>
              Open voting after the showcase wraps. Participants will see the
              ballot inside Block +01 Hacky Awards.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {ideaCount > 0
              ? `${ideaCount} ${ideaCount === 1 ? "idea" : "ideas"} ready to vote on.`
              : "No ideas have been submitted yet."}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={openVoting} disabled={pending}>
            <Megaphone className="mr-2 size-4" />
            {pending ? "Opening…" : "Open voting"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (optimisticStatus === "open") {
    return (
      <Card className="border-foreground/30">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-foreground/[0.04]"
          >
            <Trophy className="size-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Voting is open</CardTitle>
            <CardDescription>
              {voteCount} {voteCount === 1 ? "vote" : "votes"} cast across the
              ballot so far.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            When you&apos;re ready, reveal the winners. This step is
            irreversible — it locks the event so creative artifacts can&apos;t
            be edited after the fact.
          </p>
          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 p-3 text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs">
              Revealing locks ideas, briefs, and planning sessions. Reflections
              stay open so people can still submit theirs.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={revealWinners} disabled={pending}>
            <Lock className="mr-2 size-4" />
            {pending ? "Revealing…" : "Reveal winners and lock event"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          aria-hidden
          className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted"
        >
          <Trophy className="size-5" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">Winners revealed</CardTitle>
          <CardDescription>
            Voting closed and the event is locked. Participants can see winners
            inside Block +01.
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
