"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface NotifyTeamButtonProps {
  eventId: string;
  kind: "voting" | "reflections";
  /**
   * When true the relevant state isn't open yet - the pill stays
   * visible but lightly grayed and unclickable, matching the inactive
   * segmented-control buttons it sits beside.
   */
  disabled?: boolean;
}

/**
 * Manual "Notify team" pill. Emails every active participant that
 * voting / reflections just opened. Lives inline in the status
 * segmented control; grayed out until the relevant state is open (the
 * API double-checks and refuses otherwise).
 */
export function NotifyTeamButton({
  eventId,
  kind,
  disabled = false,
}: NotifyTeamButtonProps) {
  const [pending, startTransition] = useTransition();

  const label = kind === "voting" ? "voting is open" : "reflections are open";

  function notify() {
    if (disabled || pending) return;
    if (
      !window.confirm(
        `Email all active participants that ${label}? This sends a notification to everyone on the roster.`,
      )
    ) {
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
        toast.info("No active participants to notify yet.");
        return;
      }
      const sent = body?.sent ?? 0;
      const failed = body?.failed ?? 0;
      toast.success(
        `Notified ${sent} ${sent === 1 ? "participant" : "participants"}.${
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
      title={
        disabled
          ? `Open ${kind === "voting" ? "voting" : "reflections"} first to notify the team.`
          : undefined
      }
      className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:cursor-default"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        color: "var(--text-secondary)",
        borderColor: "var(--border-color)",
        opacity: disabled ? 0.45 : pending ? 0.6 : 1,
      }}
    >
      <Mail className="size-3" />
      {pending ? "Notifying…" : "Notify team"}
    </button>
  );
}
