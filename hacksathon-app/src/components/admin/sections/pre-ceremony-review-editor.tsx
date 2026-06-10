"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Pencil, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  CeremonyCategory,
  CeremonyIdeaOption,
} from "@/lib/awards/ceremony-data";

interface PreCeremonyReviewEditorProps {
  eventId: string;
  categories: CeremonyCategory[];
  ideas: CeremonyIdeaOption[];
}

/**
 * Per-category review with inline overrides. The organizer confirms or
 * corrects the auto-computed winner + runner-ups before launching the
 * ceremony. Warnings surface zero-vote and tied categories.
 */
export function PreCeremonyReviewEditor({
  eventId,
  categories,
  ideas,
}: PreCeremonyReviewEditorProps) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <CategoryRow
          key={cat.categoryId}
          eventId={eventId}
          category={cat}
          ideas={ideas}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  eventId,
  category,
  ideas,
}: {
  eventId: string;
  category: CeremonyCategory;
  ideas: CeremonyIdeaOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const [winnerId, setWinnerId] = useState<string>(
    category.winner?.ideaId ?? "",
  );
  const [runnerUpIds, setRunnerUpIds] = useState<string[]>(
    category.runnerUps.map((r) => r.ideaId),
  );

  function toggleRunnerUp(id: string) {
    setRunnerUpIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function save() {
    if (!category.awardId) {
      toast.error("This category has no award row to edit.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/admin/awards/${category.awardId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winnerIdeaId: winnerId || null,
            runnerUpIdeaIds: runnerUpIds.filter((id) => id !== winnerId),
          }),
        },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save the override.");
        return;
      }
      toast.success("Winner updated.");
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setWinnerId(category.winner?.ideaId ?? "");
    setRunnerUpIds(category.runnerUps.map((r) => r.ideaId));
    setEditing(false);
  }

  return (
    <div
      className="rounded-md border p-4"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {category.name}
          </span>
          {category.isOverridden && <Badge tone="solid">Overridden</Badge>}
          {category.flags.zeroVotes && (
            <Badge tone="warn">
              <AlertTriangle className="size-3" />
              No votes
            </Badge>
          )}
          {category.flags.tie && (
            <Badge tone="warn">
              <AlertTriangle className="size-3" />
              Tie
            </Badge>
          )}
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={pending}
          >
            <Pencil className="mr-1.5 size-3.5" />
            Override
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <Trophy
              className="size-4 shrink-0"
              style={{ color: "var(--text-secondary)" }}
            />
            {category.winner ? (
              <p className="font-serif text-lg text-foreground">
                {category.winner.title ?? "Winner"}
                {category.winner.ownerName && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {category.winner.ownerName}
                  </span>
                )}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {category.voteCount}{" "}
                  {category.voteCount === 1 ? "vote" : "votes"}
                </span>
              </p>
            ) : (
              <p className="font-serif text-lg italic text-muted-foreground">
                No winner - this category will be skipped.
              </p>
            )}
          </div>
          {category.runnerUps.length > 0 && (
            <p className="pl-6 text-sm text-muted-foreground">
              Runner-up{category.runnerUps.length > 1 ? "s" : ""}:{" "}
              {category.runnerUps
                .map((r) => r.title ?? r.ownerName ?? "-")
                .join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Winner
            </span>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              disabled={pending}
              className="block w-full rounded-md border bg-background px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-color)" }}
            >
              <option value="">No winner</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title}
                  {idea.ownerName ? ` · ${idea.ownerName}` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Runner-ups
            </span>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {ideas
                .filter((idea) => idea.id !== winnerId)
                .map((idea) => (
                  <label
                    key={idea.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={runnerUpIds.includes(idea.id)}
                      onChange={() => toggleRunnerUp(idea.id)}
                      disabled={pending}
                    />
                    <span className="truncate">
                      {idea.title}
                      {idea.ownerName ? ` · ${idea.ownerName}` : ""}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="pill" size="pill" onClick={save} disabled={pending}>
              <Check />
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancel}
              disabled={pending}
            >
              <X className="mr-1.5 size-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "solid" | "warn";
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={
        tone === "solid"
          ? {
              backgroundColor: "var(--black)",
              color: "var(--white)",
              borderColor: "var(--black)",
            }
          : {
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              borderColor: "var(--gray-400)",
            }
      }
    >
      {children}
    </span>
  );
}
