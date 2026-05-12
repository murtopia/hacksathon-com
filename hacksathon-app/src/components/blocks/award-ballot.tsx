"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface BallotCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface BallotIdea {
  id: string;
  title: string;
  ownerName: string | null;
  isMine: boolean;
}

export interface BallotInitialPick {
  categoryId: string;
  ideaId: string;
}

interface AwardBallotProps {
  eventId: string;
  categories: BallotCategory[];
  ideas: BallotIdea[];
  initialPicks: BallotInitialPick[];
}

/**
 * Voting ballot. One card per category, ideas listed as selectable
 * tiles. Self-vote is allowed (it's the participant's call) but their
 * own idea gets a soft "Your idea" pill so they know what they're
 * doing.
 *
 * Optimistic UI: we update local state immediately on click so the
 * selection feels instant, then POST. On failure we roll back the local
 * state and toast the error. RLS gates the write on voting_status='open',
 * so a stale tab where voting has been revealed simply 409s and we
 * tell the user.
 */
export function AwardBallot({
  eventId,
  categories,
  ideas,
  initialPicks,
}: AwardBallotProps) {
  const router = useRouter();
  const [picks, setPicks] = useState<Map<string, string>>(
    () => new Map(initialPicks.map((p) => [p.categoryId, p.ideaId])),
  );
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );
  const [, startTransition] = useTransition();

  function castVote(categoryId: string, ideaId: string) {
    const prior = picks.get(categoryId) ?? null;
    if (prior === ideaId) return;

    const next = new Map(picks);
    next.set(categoryId, ideaId);
    setPicks(next);
    setPendingCategoryId(categoryId);

    startTransition(async () => {
      try {
        const res = await fetch("/api/awards/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, categoryId, ideaId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Couldn't save your vote.");
        }
        router.refresh();
      } catch (e) {
        const rolledBack = new Map(picks);
        if (prior) rolledBack.set(categoryId, prior);
        else rolledBack.delete(categoryId);
        setPicks(rolledBack);
        const message = e instanceof Error ? e.message : "Couldn't save your vote.";
        toast.error(message);
      } finally {
        setPendingCategoryId(null);
      }
    });
  }

  if (ideas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No projects to vote on yet</CardTitle>
          <CardDescription>
            Once people drop their projects into the showcase, they&apos;ll
            appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const selected = picks.get(cat.id) ?? null;
        const isPending = pendingCategoryId === cat.id;
        return (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="text-lg">{cat.name}</CardTitle>
              {cat.description && (
                <CardDescription>{cat.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {ideas.map((idea) => {
                  const isSelected = selected === idea.id;
                  return (
                    <li key={idea.id}>
                      <button
                        type="button"
                        onClick={() => castVote(cat.id, idea.id)}
                        disabled={isPending}
                        aria-pressed={isSelected}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-md border p-3 text-left transition",
                          "hover:border-foreground/40",
                          isSelected
                            ? "border-foreground bg-foreground/5"
                            : "border-border",
                          isPending && "opacity-60",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {idea.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {idea.ownerName && <span>{idea.ownerName}</span>}
                            {idea.isMine && (
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Your idea
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
