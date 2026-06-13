"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

type NotifyKind = "voting" | "reflections" | "idealab";

interface NotifyTeamButtonProps {
  eventId: string;
  kind: NotifyKind;
  /**
   * When true the relevant state isn't open yet - the pill stays
   * visible but lightly grayed and unclickable, matching the inactive
   * segmented-control buttons it sits beside.
   */
  disabled?: boolean;
}

/** Per-kind copy. Keeps the IdeaLab nudge distinct from the open-state pings. */
const COPY: Record<
  NotifyKind,
  {
    idle: string;
    busy: string;
    confirm: string;
    disabledTitle: string;
    /** Toast when the roster came back empty (no one to email). */
    empty: string;
    /** verb used in the success toast: "Notified N…" / "Reminded N…". */
    successVerb: string;
  }
> = {
  voting: {
    idle: "Notify team",
    busy: "Notifying…",
    confirm:
      "Email all active participants that voting is open? This sends a notification to everyone on the roster.",
    disabledTitle: "Open voting first to notify the team.",
    empty: "No active participants to notify yet.",
    successVerb: "Notified",
  },
  reflections: {
    idle: "Notify team",
    busy: "Notifying…",
    confirm:
      "Email all active participants that reflections are open? This sends a notification to everyone on the roster.",
    disabledTitle: "Open reflections first to notify the team.",
    empty: "No active participants to notify yet.",
    successVerb: "Notified",
  },
  idealab: {
    idle: "Remind IdeaLab",
    busy: "Reminding…",
    confirm:
      "Email participants whose IdeaLab isn't demo-ready yet? This nudges only the people who haven't finished.",
    disabledTitle: "Send before you open voting.",
    empty: "No incomplete IdeaLabs to remind.",
    successVerb: "Reminded",
  },
};

/**
 * Manual notify pill. Emails active participants that voting / reflections
 * just opened, or - for `idealab` - reminds only the participants whose
 * IdeaLab isn't demo-ready before voting opens. Lives inline in the status
 * segmented control; grayed out until its moment is right (the API
 * double-checks and refuses otherwise).
 */
export function NotifyTeamButton({
  eventId,
  kind,
  disabled = false,
}: NotifyTeamButtonProps) {
  const [pending, startTransition] = useTransition();

  const copy = COPY[kind];

  function notify() {
    if (disabled || pending) return;
    if (!window.confirm(copy.confirm)) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/admin/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't notify the team.");
        return;
      }
      if (body?.skipped) {
        toast.warning(
          "Email isn't configured yet, so nothing was delivered. Set up Resend to send notifications.",
        );
        return;
      }
      if ((body?.recipients ?? 0) === 0) {
        toast.info(copy.empty);
        return;
      }
      const sent = body?.sent ?? 0;
      const failed = body?.failed ?? 0;
      toast.success(
        `${copy.successVerb} ${sent} ${sent === 1 ? "participant" : "participants"}.${
          failed > 0 ? ` ${failed} couldn't be reached.` : ""
        }`,
      );
    });
  }

  const isDisabled = disabled || pending;

  return (
    <button
      type="button"
      onClick={notify}
      disabled={isDisabled}
      title={disabled ? copy.disabledTitle : undefined}
      className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-default"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        color: "var(--text-secondary)",
        borderColor: "var(--border-color)",
        opacity: disabled ? 0.45 : pending ? 0.6 : 1,
      }}
    >
      <Mail className="size-3" />
      {pending ? copy.busy : copy.idle}
    </button>
  );
}
