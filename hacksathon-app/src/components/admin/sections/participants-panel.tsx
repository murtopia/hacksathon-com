"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail, RotateCw, Trash2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface RosterMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_self: boolean;
}

export interface InvitationRow {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  expires_at: string;
}

interface ParticipantsPanelProps {
  eventId: string;
  roster: RosterMember[];
  invitations: InvitationRow[];
  emailConfigured: boolean;
}

/**
 * Combined invite-flow + roster panel.
 *
 *   1. Top: invite input. Submits to POST /api/events/[id]/invites.
 *      If RESEND_API_KEY isn't configured, we still create the invite
 *      and surface the accept URL so the admin can copy-paste it
 *      manually.
 *   2. Middle: outstanding invitations (pending). Each row has Resend
 *      and Revoke buttons.
 *   3. Bottom: accepted members. Each row has a Remove button (with
 *      admins shielded and self always shielded).
 */
export function ParticipantsPanel({
  eventId,
  roster,
  invitations,
  emailConfigured,
}: ParticipantsPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const historicalInvites = invitations.filter((i) => i.status !== "pending");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't send invite.");
        return;
      }

      if (body?.emailSkipped) {
        toast.success(
          "Invite created. Email isn't configured yet — copy the link below.",
        );
        if (body.acceptUrl) {
          await navigator.clipboard
            .writeText(body.acceptUrl)
            .catch(() => undefined);
        }
      } else if (body?.emailDelivered) {
        toast.success(`Invite sent to ${trimmed}.`);
      } else {
        toast.warning(
          `Invite created, but the email didn't deliver: ${
            body?.emailError ?? "unknown error"
          }`,
        );
      }

      setEmail("");
      router.refresh();
    });
  }

  return (
    <Card id="participants">
      <CardHeader>
        <CardTitle className="text-base">Participants</CardTitle>
        <CardDescription>
          Invite people by email. They&apos;ll get a branded invite with a
          one-click accept link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!emailConfigured && (
          <p className="rounded-md border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
            Email isn&apos;t configured (no RESEND_API_KEY). Invites still get
            created — copy the accept link from the toast and send it to
            participants manually until DNS is verified.
          </p>
        )}

        <form onSubmit={handleInvite} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              type="email"
              value={email}
              disabled={pending}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" disabled={pending || email.trim() === ""}>
            <Mail className="mr-2 size-4" />
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Pending invitations ({pendingInvites.length})
            </h3>
            {pendingInvites.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                eventId={eventId}
                invite={invite}
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Roster ({roster.length})
          </h3>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You&apos;re the only one here so far. Send invites above.
            </p>
          ) : (
            roster.map((m) => (
              <RosterRow key={m.user_id} eventId={eventId} member={m} />
            ))
          )}
        </div>

        {historicalInvites.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">
              Invitation history ({historicalInvites.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {historicalInvites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{i.email}</span>
                  <span className="capitalize">{i.status}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function PendingInviteRow({
  eventId,
  invite,
}: {
  eventId: string;
  invite: InvitationRow;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/invites/${invite.id}/resend`,
        { method: "POST" },
      );
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't resend invite.");
        return;
      }
      if (body?.emailSkipped) {
        toast.success("Fresh link copied. Email isn't configured.");
        if (body.acceptUrl) {
          await navigator.clipboard
            .writeText(body.acceptUrl)
            .catch(() => undefined);
        }
      } else {
        toast.success(`Resent invite to ${invite.email}.`);
      }
      router.refresh();
    });
  }

  function handleRevoke() {
    if (!window.confirm(`Revoke the invitation for ${invite.email}?`)) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/invites/${invite.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't revoke invite.");
        return;
      }
      toast.success("Invitation revoked.");
      router.refresh();
    });
  }

  async function handleCopyLink() {
    // The token isn't surfaced in the GET payload, so trigger a resend
    // (which regenerates + returns the URL) instead of leaking tokens
    // through the list endpoint. This is the simplest UX.
    handleResend();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invite.email}</p>
        <p className="text-xs text-muted-foreground">
          Sent {formatRelative(invite.invited_at)} · expires{" "}
          {formatRelative(invite.expires_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyLink}
          disabled={pending}
          title="Copy a fresh accept link to your clipboard"
        >
          <Copy className="size-3.5" />
          <span className="sr-only">Copy link</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResend}
          disabled={pending}
          title="Send a fresh email"
        >
          <RotateCw className="size-3.5" />
          <span className="sr-only">Resend</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRevoke}
          disabled={pending}
          title="Revoke this invitation"
        >
          <X className="size-3.5" />
          <span className="sr-only">Revoke</span>
        </Button>
      </div>
    </div>
  );
}

function RosterRow({
  eventId,
  member,
}: {
  eventId: string;
  member: RosterMember;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const removable = !member.is_self && member.role !== "admin";

  function handleRemove() {
    if (
      !window.confirm(
        `Remove ${member.full_name ?? member.email} from this event?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/members/${member.user_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't remove participant.");
        return;
      }
      toast.success("Participant removed.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.full_name ?? member.email}
          {member.role === "admin" && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Admin
            </span>
          )}
          {member.is_self && (
            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
          )}
        </p>
        {member.full_name && (
          <p className="truncate text-xs text-muted-foreground">
            {member.email}
          </p>
        )}
      </div>
      {removable && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemove}
          disabled={pending}
        >
          <UserMinus className="mr-1.5 size-3.5" />
          Remove
        </Button>
      )}
      {!removable && !member.is_self && (
        <span
          className="inline-flex items-center text-xs text-muted-foreground"
          title="Admins can't be removed from here"
        >
          <Trash2 className="mr-1 size-3" />
          Protected
        </span>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const sign = ms < 0 ? "ago" : "from now";
  const abs = Math.abs(ms);
  const days = Math.round(abs / 86_400_000);
  if (days >= 1) return `${days}d ${sign}`;
  const hours = Math.round(abs / 3_600_000);
  if (hours >= 1) return `${hours}h ${sign}`;
  const mins = Math.max(1, Math.round(abs / 60_000));
  return `${mins}m ${sign}`;
}
