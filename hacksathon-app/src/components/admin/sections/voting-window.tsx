"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField } from "@/components/admin/admin-section";
import { DateTime15Field } from "@/components/admin/fields/datetime-15-field";
import {
  isoToLocalInput,
  localInputToIso,
  relativeAt,
} from "@/lib/datetime/local-input";

interface VotingWindowSectionProps {
  eventId: string;
  votingStatus: "closed" | "open" | "revealed";
  initialOpenAt: string | null;
  initialCloseAt: string | null;
  isLocked: boolean;
}

/**
 * Optional voting auto-schedule - a collapsible disclosure beneath the
 * manual voting controls.
 *
 * The manual buttons in `VotingControls` are the primary path now.
 * These date pickers are a convenience layer: when set, the app flips
 * voting_status (closed → open at open_at, open → revealed at close_at)
 * as the clock crosses each boundary. Collapsed by default unless a
 * window is already saved. Read-only once the event is locked.
 */
export function VotingWindowSection({
  eventId,
  votingStatus,
  initialOpenAt,
  initialCloseAt,
  isLocked,
}: VotingWindowSectionProps) {
  const router = useRouter();
  const hasWindow = Boolean(initialOpenAt || initialCloseAt);
  const [expanded, setExpanded] = useState(hasWindow);

  const [openAtLocal, setOpenAtLocal] = useState(isoToLocalInput(initialOpenAt));
  const [closeAtLocal, setCloseAtLocal] = useState(
    isoToLocalInput(initialCloseAt),
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const initialOpenLocal = isoToLocalInput(initialOpenAt);
  const initialCloseLocal = isoToLocalInput(initialCloseAt);
  const dirty =
    openAtLocal !== initialOpenLocal || closeAtLocal !== initialCloseLocal;

  const status = useMemo(
    () => computeVotingStatusCopy({ votingStatus, openAtLocal, closeAtLocal }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [votingStatus, openAtLocal, closeAtLocal, savedAt],
  );

  function handleSave() {
    const openIso = openAtLocal ? localInputToIso(openAtLocal) : null;
    const closeIso = closeAtLocal ? localInputToIso(closeAtLocal) : null;
    if (openAtLocal && !openIso) {
      toast.error("Voting open date isn't valid.");
      return;
    }
    if (closeAtLocal && !closeIso) {
      toast.error("Voting close date isn't valid.");
      return;
    }
    if (openIso && closeIso && new Date(closeIso) <= new Date(openIso)) {
      toast.error("Voting must close after it opens.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voting_open_at: openIso,
          voting_close_at: closeIso,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save the auto-schedule.");
        return;
      }
      toast.success("Voting auto-schedule saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <div
      id="voting-window"
      className="rounded-md border"
      style={{ borderColor: "var(--border-color)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Lock className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Optional: auto-schedule voting
          </span>
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {expanded && (
        <div
          className="space-y-3 border-t px-3 py-3"
          style={{ borderColor: "var(--border-color)" }}
        >
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            Set dates and the system flips voting open/closed for you. You can
            still use the manual buttons above any time.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Opens" htmlFor="voting-open-at">
              <DateTime15Field
                id="voting-open-at"
                value={openAtLocal}
                disabled={isLocked || pending}
                onChange={setOpenAtLocal}
              />
            </AdminField>
            <AdminField label="Closes" htmlFor="voting-close-at">
              <DateTime15Field
                id="voting-close-at"
                value={closeAtLocal}
                disabled={isLocked || pending}
                onChange={setCloseAtLocal}
              />
            </AdminField>
          </div>
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            {status}
          </p>
          {!isLocked && (
            <div className="flex items-center gap-3">
              <Button variant="pill" size="pill" onClick={handleSave} disabled={!dirty || pending}>
                <Save />
                {pending ? "Saving…" : "Save auto-schedule"}
              </Button>
              {savedAt && !dirty && !pending && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3" />
                  Saved
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function computeVotingStatusCopy({
  votingStatus,
  openAtLocal,
  closeAtLocal,
}: {
  votingStatus: "closed" | "open" | "revealed";
  openAtLocal: string;
  closeAtLocal: string;
}): string {
  if (votingStatus === "revealed") {
    return "Voting is closed - winners are tallied and the event is locked.";
  }

  const openIso = openAtLocal ? localInputToIso(openAtLocal) : null;
  const closeIso = closeAtLocal ? localInputToIso(closeAtLocal) : null;
  const now = Date.now();

  if (!openIso && !closeIso) {
    return votingStatus === "open"
      ? "Voting is open now (no scheduled close - use the manual buttons above)."
      : "No auto-schedule set. Voting follows the manual buttons above.";
  }
  if (openIso && now < new Date(openIso).getTime()) {
    return `Voting auto-opens ${relativeAt(new Date(openIso))}.`;
  }
  if (closeIso && now < new Date(closeIso).getTime()) {
    return `Voting is open. Auto-closes ${relativeAt(new Date(closeIso))}.`;
  }
  if (closeIso && now >= new Date(closeIso).getTime()) {
    return "Auto-close time has passed - winners tally on next page load.";
  }
  if (openIso && !closeIso) {
    return "Voting auto-opens at the time above. No auto-close scheduled.";
  }
  return "Voting auto-schedule saved.";
}
