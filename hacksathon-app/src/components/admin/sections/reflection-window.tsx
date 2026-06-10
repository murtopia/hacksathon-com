"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  CircleCheck,
  Lock,
  MessageSquare,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { NotifyTeamButton } from "@/components/admin/notify-team-button";
import { DateTime15Field } from "@/components/admin/fields/datetime-15-field";
import {
  isoToLocalInput,
  localInputToIso,
  relativeAt,
} from "@/lib/datetime/local-input";

type ReflectionStatus = "closed" | "open" | "complete";

interface ReflectionWindowSectionProps {
  eventId: string;
  number?: string;
  reflectionStatus: ReflectionStatus;
  initialOpenAt: string | null;
  initialCloseAt: string | null;
}

/**
 * Reflection state control.
 *
 * Reflections move through an explicit three-state machine - Closed →
 * Open → Complete - driven by the buttons here. Marking complete locks
 * submissions and kicks off the AI recap draft.
 *
 * The old date pickers are demoted to an OPTIONAL auto-schedule tucked
 * under a collapsible disclosure: when set, the app flips the status
 * for you as the clock crosses each boundary (status flip only - the
 * recap still has to be generated/approved from the panel below).
 */
export function ReflectionWindowSection({
  eventId,
  number = "01",
  reflectionStatus,
  initialOpenAt,
  initialCloseAt,
}: ReflectionWindowSectionProps) {
  const router = useRouter();
  const [statusPending, startStatusTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useState<ReflectionStatus>(reflectionStatus);

  function setStatus(target: ReflectionStatus, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    startStatusTransition(async () => {
      const prior = optimisticStatus;
      setOptimisticStatus(target);
      const res = await fetch(
        `/api/events/${eventId}/admin/reflections/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: target }),
        },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setOptimisticStatus(prior);
        toast.error(body?.error ?? "Couldn't update reflections.");
        return;
      }
      if (target === "complete") {
        toast[body?.recapFailed ? "warning" : "success"](
          body?.recapFailed
            ? "Reflections marked complete - recap draft failed, generate it below."
            : "Reflections complete. AI recap draft generated below.",
        );
      } else if (target === "open") {
        toast.success("Reflections are open. Participants can submit now.");
      } else {
        toast.success("Reflections closed.");
      }
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="window"
      number={number}
      title="Reflections"
      intent="Set the state manually: Closed before the event, Open so participants can submit inside Block +02, then Complete to lock submissions and draft the AI recap."
    >
      <StatusControl
        status={optimisticStatus}
        pending={statusPending}
        onSelect={setStatus}
        eventId={eventId}
      />
      <p
        className="font-serif text-sm italic"
        style={{ color: "var(--text-secondary)" }}
      >
        {STATUS_COPY[optimisticStatus]}
      </p>
      <AutoSchedule
        eventId={eventId}
        initialOpenAt={initialOpenAt}
        initialCloseAt={initialCloseAt}
      />
    </AdminSection>
  );
}

const STATUS_COPY: Record<ReflectionStatus, string> = {
  closed:
    "Reflections are closed. Participants can't submit yet - open them once the event wraps.",
  open: "Reflections are open. Participants can submit inside Block +02.",
  complete:
    "Reflections are complete. Submissions are locked and the AI recap draft is ready below.",
};

/**
 * Clickable three-state segmented control. Closed and Open toggle
 * freely; Complete confirms (it locks submissions and drafts the AI
 * recap). Selecting Open while complete reopens collection.
 */
function StatusControl({
  status,
  pending,
  onSelect,
  eventId,
}: {
  status: ReflectionStatus;
  pending: boolean;
  onSelect: (target: ReflectionStatus, confirmMsg?: string) => void;
  eventId: string;
}) {
  const items: {
    key: ReflectionStatus;
    label: string;
    Icon: typeof MessageSquare;
    confirmFrom?: (current: ReflectionStatus) => string | undefined;
  }[] = [
    { key: "closed", label: "Closed", Icon: Lock },
    { key: "open", label: "Open", Icon: MessageSquare },
    {
      key: "complete",
      label: "Complete",
      Icon: CircleCheck,
      confirmFrom: () =>
        "Mark reflections complete? This blocks further submissions and generates the AI recap draft.",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ key, label, Icon, confirmFrom }) => {
        const active = key === status;
        return (
          <Fragment key={key}>
            <button
              type="button"
              disabled={pending || active}
              onClick={() => {
                if (active) return;
                // Reopening from complete gets its own confirm.
                const confirmMsg =
                  key === "open" && status === "complete"
                    ? "Reopen reflections? Participants will be able to submit again. Your recap draft stays as-is."
                    : confirmFrom?.(status);
                onSelect(key, confirmMsg);
              }}
              className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-default"
              style={{
                backgroundColor: active ? "var(--black)" : "var(--bg-tertiary)",
                color: active ? "var(--white)" : "var(--text-secondary)",
                borderColor: active ? "var(--black)" : "var(--border-color)",
                opacity: pending && !active ? 0.5 : 1,
              }}
            >
              {active ? (
                <Check className="size-3" />
              ) : (
                <Icon className="size-3" />
              )}
              {label}
            </button>
            {/* Notify team sits between Open and Complete. */}
            {key === "open" && (
              <NotifyTeamButton
                eventId={eventId}
                kind="reflections"
                disabled={status !== "open"}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * Collapsible optional auto-schedule - the demoted date pickers.
 */
function AutoSchedule({
  eventId,
  initialOpenAt,
  initialCloseAt,
}: {
  eventId: string;
  initialOpenAt: string | null;
  initialCloseAt: string | null;
}) {
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
    () => computeAutoScheduleCopy({ openAtLocal, closeAtLocal }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openAtLocal, closeAtLocal, savedAt],
  );

  function handleSave() {
    const openIso = openAtLocal ? localInputToIso(openAtLocal) : null;
    const closeIso = closeAtLocal ? localInputToIso(closeAtLocal) : null;
    if (openAtLocal && !openIso) {
      toast.error("Reflections open date isn't valid.");
      return;
    }
    if (closeAtLocal && !closeIso) {
      toast.error("Reflections close date isn't valid.");
      return;
    }
    if (openIso && closeIso && new Date(closeIso) <= new Date(openIso)) {
      toast.error("Reflections must close after they open.");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reflections_open_at: openIso,
          reflections_close_at: closeIso,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't save the auto-schedule.");
        return;
      }
      toast.success("Auto-schedule saved.");
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <div
      className="mt-2 rounded-md border"
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
            Optional: auto-schedule
          </span>
        </span>
        <ChevronDown
          className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t px-3 py-3" style={{ borderColor: "var(--border-color)" }}>
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            Set dates and the system flips the status for you - open at the
            start, complete at the close. You can still use the buttons above
            any time.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Opens" htmlFor="reflections-open-at">
              <DateTime15Field
                id="reflections-open-at"
                value={openAtLocal}
                disabled={pending}
                onChange={setOpenAtLocal}
              />
            </AdminField>
            <AdminField label="Closes" htmlFor="reflections-close-at">
              <DateTime15Field
                id="reflections-close-at"
                value={closeAtLocal}
                disabled={pending}
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
          <div className="flex items-center gap-3">
            <Button
              variant="pill"
              size="pill"
              onClick={handleSave}
              disabled={!dirty || pending}
            >
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
        </div>
      )}
    </div>
  );
}

function computeAutoScheduleCopy({
  openAtLocal,
  closeAtLocal,
}: {
  openAtLocal: string;
  closeAtLocal: string;
}): string {
  const openIso = openAtLocal ? localInputToIso(openAtLocal) : null;
  const closeIso = closeAtLocal ? localInputToIso(closeAtLocal) : null;
  const now = Date.now();

  if (!openIso && !closeIso) {
    return "No auto-schedule set. Reflections follow the manual buttons above.";
  }
  if (openIso && now < new Date(openIso).getTime()) {
    return `Reflections auto-open ${relativeAt(new Date(openIso))}.`;
  }
  if (closeIso && now < new Date(closeIso).getTime()) {
    return `Auto-complete ${relativeAt(new Date(closeIso))}.`;
  }
  if (closeIso && now >= new Date(closeIso).getTime()) {
    return "Auto-schedule close time has passed.";
  }
  if (openIso && !closeIso) {
    return "Auto-opens at the time above. No auto-complete scheduled.";
  }
  return "Auto-schedule saved.";
}
