"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Link2,
  Link2Off,
  Mail,
  Plus,
  RotateCw,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSection } from "@/components/admin/admin-section";
import {
  priceForSeatIncrease,
  formatUsd,
  MAX_SELF_SERVE_SEATS,
} from "@/lib/billing/pricing";
import { createAddSeatsCheckoutSession } from "@/app/checkout/actions";

export interface SeatUsageProp {
  limit: number | null;
  used: number;
  reserved: number;
  available: number | null;
}

// Mirrors the server-side regex in /api/events/[id]/invites/route.ts so the
// client and the API agree on what a "valid" address looks like.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 200;
const INVITE_CONCURRENCY = 4;

/**
 * Pull every plausible email out of free-form input.
 *
 * Splits on commas, semicolons, whitespace, and newlines - that covers the
 * shapes admins will actually paste (Outlook CSV, Slack `@me`-list copy,
 * one-per-line, etc.). Trim, lowercase, dedupe, drop empties.
 */
function tokenizeEmails(raw: string): string[] {
  const tokens = raw.split(/[\s,;]+/).map((t) => t.trim().toLowerCase());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

interface ParsedEmails {
  valid: string[];
  invalid: string[];
}

function parseInviteInput(raw: string): ParsedEmails {
  const tokens = tokenizeEmails(raw);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const t of tokens) {
    if (t.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(t)) {
      invalid.push(t);
    } else {
      valid.push(t);
    }
  }
  return { valid, invalid };
}

export interface RosterMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_self: boolean;
  /** Whether this member occupies a paid seat. Admins may opt out. */
  is_participating: boolean;
  /**
   * ISO timestamp of the user's last authenticated request,
   * touched by middleware (`touch_my_activity` RPC) at most once
   * per minute. Null if the user has never made an authenticated
   * request (and the launch-time backfill from
   * `auth.users.last_sign_in_at` also had no data for them).
   */
  last_active_at: string | null;
}

export interface InvitationRow {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  expires_at: string;
}

export interface PendingJoinRequest {
  user_id: string;
  email: string;
  full_name: string | null;
  requested_at: string;
}

interface ParticipantsPanelProps {
  eventId: string;
  roster: RosterMember[];
  invitations: InvitationRow[];
  emailConfigured: boolean;
  joinUrl: string | null;
  pendingRequests: PendingJoinRequest[];
  seatUsage?: SeatUsageProp;
  number?: string;
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
  joinUrl,
  pendingRequests,
  seatUsage,
  number = "02",
}: ParticipantsPanelProps) {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [pending, startTransition] = useTransition();

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const historicalInvites = invitations.filter((i) => i.status !== "pending");

  const parsed = useMemo(() => parseInviteInput(emailInput), [emailInput]);
  const validCount = parsed.valid.length;
  const invalidCount = parsed.invalid.length;
  const isPlural = validCount !== 1;

  /**
   * Loop the existing single-email API with capped concurrency. Aggregates
   * every response into a single summary toast so a bulk paste doesn't
   * spawn N notifications. Errors from the API (already-member, already-
   * invited, validation, network) get bucketed and reported together.
   */
  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (validCount === 0) return;

    const emails = [...parsed.valid];

    startTransition(async () => {
      type InviteOutcome =
        | { kind: "sent"; email: string }
        | { kind: "skipped_no_email"; email: string; acceptUrl?: string }
        | { kind: "warn_delivery"; email: string; error?: string }
        | { kind: "already_member"; email: string }
        | { kind: "already_invited"; email: string }
        | { kind: "error"; email: string; message: string };

      async function sendOne(email: string): Promise<InviteOutcome> {
        try {
          const res = await fetch(`/api/events/${eventId}/invites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            const message: string =
              body?.error ?? `Couldn't send (${res.status}).`;
            // The API surfaces 409 with these specific copy strings - bucket
            // them so we can summarize cleanly rather than dumping the
            // server messages verbatim.
            if (/already (a |an )?member/i.test(message)) {
              return { kind: "already_member", email };
            }
            if (/already invited|pending invitation/i.test(message)) {
              return { kind: "already_invited", email };
            }
            return { kind: "error", email, message };
          }
          if (body?.emailSkipped) {
            return {
              kind: "skipped_no_email",
              email,
              acceptUrl: body?.acceptUrl,
            };
          }
          if (body?.emailDelivered) {
            return { kind: "sent", email };
          }
          return {
            kind: "warn_delivery",
            email,
            error: body?.emailError,
          };
        } catch (err) {
          return {
            kind: "error",
            email,
            message: err instanceof Error ? err.message : "Network error",
          };
        }
      }

      // Concurrency-capped worker pool so we don't slam Resend with a
      // paste of fifty emails all at once.
      const results: InviteOutcome[] = [];
      let cursor = 0;
      async function worker() {
        while (cursor < emails.length) {
          const i = cursor++;
          results[i] = await sendOne(emails[i]);
        }
      }
      const workers = Array.from(
        { length: Math.min(INVITE_CONCURRENCY, emails.length) },
        () => worker(),
      );
      await Promise.all(workers);

      const sent = results.filter((r) => r.kind === "sent").length;
      const noEmail = results.filter((r) => r.kind === "skipped_no_email");
      const warnDelivery = results.filter((r) => r.kind === "warn_delivery");
      const alreadyMember = results.filter((r) => r.kind === "already_member");
      const alreadyInvited = results.filter(
        (r) => r.kind === "already_invited",
      );
      const errors = results.filter((r) => r.kind === "error");

      // When Resend isn't configured, the API returns one acceptUrl per
      // call but copying N URLs in a row would clobber the clipboard. So
      // we only copy when the admin invited exactly one address.
      if (noEmail.length === 1 && noEmail[0].kind === "skipped_no_email") {
        const url = noEmail[0].acceptUrl;
        if (url) {
          await navigator.clipboard.writeText(url).catch(() => undefined);
        }
      }

      const skippedParts: string[] = [];
      if (alreadyMember.length > 0) {
        skippedParts.push(
          `${alreadyMember.length} already ${
            alreadyMember.length === 1 ? "a member" : "members"
          }`,
        );
      }
      if (alreadyInvited.length > 0) {
        skippedParts.push(
          `${alreadyInvited.length} already invited`,
        );
      }
      if (noEmail.length > 0 && emailConfigured === false) {
        skippedParts.push(
          `${noEmail.length} created without email (no RESEND_API_KEY)`,
        );
      }
      if (warnDelivery.length > 0) {
        skippedParts.push(
          `${warnDelivery.length} created but email didn't deliver`,
        );
      }

      const successCount = sent + noEmail.length;
      const summaryHead =
        successCount === 0
          ? "No invites sent."
          : `Sent ${successCount} ${successCount === 1 ? "invite" : "invites"}.`;

      const summary =
        skippedParts.length > 0
          ? `${summaryHead} Skipped ${skippedParts.join(", ")}.`
          : summaryHead;

      if (errors.length > 0) {
        toast.warning(
          `${summary} ${errors.length} ${
            errors.length === 1 ? "address" : "addresses"
          } failed.`,
        );
      } else if (successCount === 0) {
        toast.warning(summary);
      } else if (skippedParts.length > 0) {
        toast.success(summary);
      } else {
        toast.success(summary);
      }

      setEmailInput("");
      router.refresh();
    });
  }

  return (
    <AdminSection
      id="participants"
      number={number}
      title="Participants"
      intent="Share a join link anyone can use, or invite people by email. New requests land in the approval queue before they join the roster."
    >
      {seatUsage && seatUsage.limit !== null && (
        <SeatUsageBlock eventId={eventId} usage={seatUsage} />
      )}

      <JoinLinkBlock eventId={eventId} joinUrl={joinUrl} />

      {pendingRequests.length > 0 && (
        <JoinRequestsBlock
          eventId={eventId}
          requests={pendingRequests}
        />
      )}

      {!emailConfigured && (
        <div
          className="rounded-md border p-3"
          style={{
            borderColor: "var(--gray-400)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            Email isn&apos;t configured (no RESEND_API_KEY). Invites still get
            created - copy the accept link from the toast and send it to
            participants manually until DNS is verified.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
          Invite by email
        </p>
      <form onSubmit={handleInvite} className="space-y-2">
        <Textarea
          value={emailInput}
          disabled={pending}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="teammate@example.com, another@example.com - or paste one per line"
          autoComplete="off"
          rows={3}
          required
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-serif text-xs italic text-muted-foreground/80">
            {invalidCount > 0 ? (
              <span style={{ color: "var(--text-secondary)" }}>
                {invalidCount}{" "}
                {invalidCount === 1 ? "address doesn't" : "addresses don't"}{" "}
                look like an email. Fix or remove them to send.
              </span>
            ) : validCount > 0 ? (
              <>
                Ready to send to {validCount}{" "}
                {validCount === 1 ? "person" : "people"}.
              </>
            ) : (
              <>
                Add multiple at once - separate with commas, spaces, or new
                lines.
              </>
            )}
          </p>
          <Button
            type="submit"
            variant="pill"
            size="pill"
            disabled={pending || validCount === 0 || invalidCount > 0}
          >
            <Mail />
            {pending
              ? "Sending…"
              : isPlural
                ? `Send ${validCount || ""} invites`.trim()
                : "Send invite"}
          </Button>
        </div>
      </form>
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
            Pending invitations ({pendingInvites.length})
          </p>
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
        <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
          Roster ({roster.length})
        </p>
        {roster.length === 0 ? (
          <p className="font-serif text-sm italic text-muted-foreground">
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
          <summary className="cursor-pointer select-none font-mono uppercase tracking-[0.1em]">
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
    </AdminSection>
  );
}

/**
 * Seat meter + entry point to the self-serve "Add participants" flow.
 * Only rendered when the event actually has a purchased limit.
 */
function SeatUsageBlock({
  eventId,
  usage,
}: {
  eventId: string;
  usage: SeatUsageProp;
}) {
  const limit = usage.limit ?? 0;
  const used = usage.used;
  const reserved = usage.reserved;
  const available = usage.available ?? 0;
  const filled = Math.min(limit, used + reserved);
  const pct = limit > 0 ? Math.min(100, Math.round((filled / limit) * 100)) : 0;
  const full = available <= 0;

  return (
    <div className="space-y-2">
      <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
        Seats
      </p>
      <div
        className="space-y-3 rounded-md border p-3"
        style={{
          borderColor: "var(--gray-400)",
          backgroundColor: "var(--bg-tertiary)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <Users
              className="size-4 self-center"
              style={{ color: "var(--text-tertiary)" }}
            />
            <span className="font-serif text-2xl leading-none">{filled}</span>
            <span className="text-sm text-muted-foreground">
              of {limit} seats used
            </span>
          </div>
          <AddParticipantsDialog eventId={eventId} currentLimit={limit} />
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--gray-300)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: full ? "var(--destructive)" : "var(--black)",
            }}
          />
        </div>

        <p
          className="font-serif text-xs italic"
          style={{ color: "var(--text-secondary)" }}
        >
          {used} active
          {reserved > 0
            ? `, ${reserved} pending (invites + requests)`
            : ""}{" "}
          ·{" "}
          {full
            ? "No seats left - add participants to invite more."
            : `${available} ${available === 1 ? "seat" : "seats"} remaining.`}
        </p>
      </div>
    </div>
  );
}

/**
 * Add-seats dialog. Picks how many seats to add, shows the live delta
 * price (you only pay the difference), and hands off to Stripe. A new
 * total above the self-serve cap routes to support.
 */
function AddParticipantsDialog({
  eventId,
  currentLimit,
}: {
  eventId: string;
  currentLimit: number;
}) {
  const [open, setOpen] = useState(false);
  const [addCount, setAddCount] = useState("5");
  const [isPending, startTransition] = useTransition();

  const atMax = currentLimit >= MAX_SELF_SERVE_SEATS;
  const addNum = Math.floor(Number(addCount));
  const hasValidCount = Number.isFinite(addNum) && addNum >= 1;
  const newLimit = currentLimit + (hasValidCount ? addNum : 0);
  const overMax = newLimit > MAX_SELF_SERVE_SEATS;
  const canPay = hasValidCount && !overMax;

  const priceLabel = useMemo(() => {
    if (!canPay) return null;
    try {
      return formatUsd(priceForSeatIncrease(currentLimit, newLimit).amountCents);
    } catch {
      return null;
    }
  }, [canPay, currentLimit, newLimit]);

  function handleCheckout() {
    startTransition(async () => {
      const result = await createAddSeatsCheckoutSession({ eventId, newLimit });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="pill" size="pill">
          <Plus className="size-3.5" />
          Add participants
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add participants</DialogTitle>
          <DialogDescription>
            You&apos;re set up for {currentLimit}{" "}
            {currentLimit === 1 ? "seat" : "seats"}. Add more and you&apos;ll
            only pay the difference.
          </DialogDescription>
        </DialogHeader>

        {atMax ? (
          <p className="form-hint">
            You&apos;re already at the {MAX_SELF_SERVE_SEATS}-seat self-serve
            maximum. Running something bigger? Email{" "}
            <a
              href="mailto:support@hacksathon.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              support@hacksathon.com
            </a>{" "}
            for a custom quote.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addCount">How many more seats?</Label>
              <Input
                id="addCount"
                type="number"
                min={1}
                max={MAX_SELF_SERVE_SEATS - currentLimit}
                step={1}
                value={addCount}
                onChange={(e) => setAddCount(e.target.value)}
                disabled={isPending}
                className="max-w-[8rem]"
              />
              <p className="form-hint">
                $30 per additional participant, up to {MAX_SELF_SERVE_SEATS}{" "}
                total. For 51+ participants, please email{" "}
                <a
                  href="mailto:support@hacksathon.com"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  support@hacksathon.com
                </a>
                .
              </p>
            </div>

            <div className="rounded-md border p-3">
              {overMax ? (
                <p className="form-hint">
                  That would put you over {MAX_SELF_SERVE_SEATS} total. Email{" "}
                  <a
                    href="mailto:support@hacksathon.com"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    support@hacksathon.com
                  </a>{" "}
                  for a custom quote.
                </p>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    New total: {newLimit} seats
                  </span>
                  <span className="font-serif text-2xl">
                    {priceLabel ?? "-"}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="pill"
              size="pill"
              className="w-full"
              onClick={handleCheckout}
              disabled={!canPay || isPending}
            >
              {isPending ? "Starting checkout…" : "Continue to payment"}
            </Button>
            <p className="form-hint text-center">
              Secure checkout by Stripe. Seats unlock as soon as payment
              clears.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const [participating, setParticipating] = useState(member.is_participating);
  const [togglePending, startToggle] = useTransition();
  // Self can never change their own role - that's enforced server-side
  // too. The Remove button hides for self and for admin rows; once an
  // admin is demoted to participant they can be removed.
  const canChangeRole = !member.is_self;
  const removable = !member.is_self && member.role !== "admin";
  // Organizers choose whether they occupy a seat; participants always do.
  const canToggleParticipation = member.is_self && member.role === "admin";

  function handleParticipationChange(next: boolean) {
    const previous = participating;
    setParticipating(next);
    startToggle(async () => {
      const res = await fetch(
        `/api/events/${eventId}/members/${member.user_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isParticipating: next }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setParticipating(previous);
        toast.error(body?.error ?? "Couldn't update participation.");
        return;
      }
      toast.success(
        next
          ? "You're counted as a participant."
          : "You've opted out of a participant seat.",
      );
      router.refresh();
    });
  }

  function handleRoleChange(nextRole: string) {
    if (nextRole === member.role) return;
    const verb = nextRole === "admin" ? "Promote" : "Demote";
    const target = member.full_name ?? member.email;
    const confirmMsg =
      nextRole === "admin"
        ? `Promote ${target} to admin? They'll be able to manage the event, invites, and other members.`
        : `Demote ${target} to participant? They'll lose access to the admin area.`;
    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/members/${member.user_id}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: nextRole }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? `Couldn't ${verb.toLowerCase()} member.`);
        return;
      }
      toast.success(
        nextRole === "admin"
          ? `${target} is now an admin.`
          : `${target} is now a participant.`,
      );
      router.refresh();
    });
  }

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
    <div className="space-y-0 rounded-md border bg-card">
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.full_name ?? member.email}
          {member.is_self && (
            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
          )}
        </p>
        {member.full_name && (
          <p className="truncate text-xs text-muted-foreground">
            {member.email}
          </p>
        )}
        <p className="truncate text-xs text-muted-foreground">
          {formatLastSeen(member.last_active_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canChangeRole ? (
          <Select
            value={member.role === "admin" ? "admin" : "participant"}
            onValueChange={handleRoleChange}
            disabled={pending}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="participant">Participant</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          // Self row - the role is fixed from this UI. Render the
          // current role as a solid badge so the column still reads
          // straight across.
          <span
            className="inline-flex items-center rounded-[4px] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{
              backgroundColor: "var(--black)",
              color: "var(--white)",
            }}
          >
            {member.role === "admin" ? "Admin" : "Participant"}
          </span>
        )}
        {removable ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={pending}
            title="Remove from this event"
          >
            <UserMinus className="mr-1.5 size-3.5" />
            Remove
          </Button>
        ) : !member.is_self ? (
          <span
            className="inline-flex items-center text-xs text-muted-foreground"
            title="Demote to participant before removing"
          >
            <Trash2 className="mr-1 size-3" />
            Protected
          </span>
        ) : null}
      </div>
    </div>
      {canToggleParticipation && (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
          <div className="min-w-0">
            <Label
              htmlFor={`participating-${member.user_id}`}
              className="text-sm font-medium"
            >
              I&apos;m participating in this Hacks-a-Thon
            </Label>
            <p className="text-xs text-muted-foreground">
              {participating
                ? "You're counted as a participant and occupy one seat."
                : "You're organizing only - you don't take up a seat."}
            </p>
          </div>
          <Switch
            id={`participating-${member.user_id}`}
            checked={participating}
            onCheckedChange={handleParticipationChange}
            disabled={togglePending}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Shareable join-link editorial block.
 *
 * Two states:
 *   - No token  → italic body + single "Generate join link" button.
 *   - Active    → read-only URL Input + Copy / Regenerate / Revoke buttons.
 *
 * Regenerate hits POST (same endpoint) which rotates the token; the old
 * URL stops working. Revoke hits DELETE which nulls the token entirely.
 * Existing pending requests in the queue are intentionally untouched in
 * either case - see /api/events/[id]/join-link/route.ts for the rules.
 */
function JoinLinkBlock({
  eventId,
  joinUrl,
}: {
  eventId: string;
  joinUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleGenerate(isRegenerate: boolean) {
    if (
      isRegenerate &&
      !window.confirm(
        "Regenerating will invalidate the existing link. People who haven't joined yet will need the new URL.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/join-link`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Couldn't generate join link.");
        return;
      }
      if (typeof body?.url === "string" && body.url) {
        await navigator.clipboard.writeText(body.url).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
      toast.success(
        isRegenerate
          ? "Fresh join link copied to your clipboard."
          : "Join link generated and copied to your clipboard.",
      );
      router.refresh();
    });
  }

  function handleRevoke() {
    if (
      !window.confirm(
        "Revoke this join link? The URL will stop working immediately. Pending requests already in the queue stay put.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/join-link`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't revoke join link.");
        return;
      }
      toast.success("Join link revoked.");
      router.refresh();
    });
  }

  async function handleCopy() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      toast.success("Join link copied.");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  return (
    <div className="space-y-2">
      <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
        Shareable join link
      </p>
      {joinUrl ? (
        <div
          className="space-y-3 rounded-md border p-3"
          style={{
            borderColor: "var(--gray-400)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            Anyone with this link can request to join. Requests land below
            for you to approve before they appear on the roster.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={joinUrl}
              readOnly
              onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
              className="flex-1 min-w-[14rem] font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={pending}
            >
              {copied ? (
                <Check className="mr-1.5 size-3.5" />
              ) : (
                <Copy className="mr-1.5 size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleGenerate(true)}
              disabled={pending}
              title="Rotate the token. Old URL stops working."
            >
              <RotateCw className="mr-1.5 size-3.5" />
              Regenerate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              disabled={pending}
            >
              <Link2Off className="mr-1.5 size-3.5" />
              Revoke
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="space-y-3 rounded-md border p-3"
          style={{
            borderColor: "var(--gray-400)",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <p
            className="font-serif text-sm italic"
            style={{ color: "var(--text-secondary)" }}
          >
            Generate a link anyone can use to request to join. Each request
            lands in the queue below for you to approve before they appear on
            the roster.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(false)}
            disabled={pending}
          >
            <Link2 className="mr-1.5 size-3.5" />
            {pending ? "Generating…" : "Generate join link"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Pending join-requests queue. Each row → Approve (PATCH) or Reject
 * (DELETE - soft removes the row). Approve is the safe default;
 * Reject prompts to confirm.
 */
function JoinRequestsBlock({
  eventId,
  requests,
}: {
  eventId: string;
  requests: PendingJoinRequest[];
}) {
  return (
    <div className="space-y-2">
      <p className="mono-label" style={{ color: "var(--text-tertiary)" }}>
        Pending requests ({requests.length})
      </p>
      <div className="space-y-2">
        {requests.map((r) => (
          <JoinRequestRow key={r.user_id} eventId={eventId} request={r} />
        ))}
      </div>
    </div>
  );
}

function JoinRequestRow({
  eventId,
  request,
}: {
  eventId: string;
  request: PendingJoinRequest;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/members/${request.user_id}/approve`,
        { method: "PATCH" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't approve request.");
        return;
      }
      toast.success(`${request.full_name ?? request.email} is in.`);
      router.refresh();
    });
  }

  function handleReject() {
    if (
      !window.confirm(
        `Reject ${request.full_name ?? request.email}'s request to join?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/events/${eventId}/members/${request.user_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Couldn't reject request.");
        return;
      }
      toast.success("Request rejected.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {request.full_name ?? request.email}
        </p>
        <p className="text-xs text-muted-foreground">
          {request.full_name ? `${request.email} · ` : ""}
          Requested {formatRelative(request.requested_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleApprove}
          disabled={pending}
          title="Approve and add to roster"
        >
          <Check className="mr-1 size-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={pending}
          title="Reject this request"
        >
          <X className="mr-1 size-3.5" />
          Reject
        </Button>
      </div>
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

/**
 * Roster-friendly "last seen" copy.
 *
 * The value comes from `profiles.last_active_at`, which is touched
 * from middleware on every authenticated request (throttled to once
 * per minute per user). That makes this an actual activity signal
 * rather than a credential-event signal - a user who's "active every
 * day via refresh tokens" will show as seen recently here, where
 * `auth.users.last_sign_in_at` would only have updated on a fresh
 * password sign-in.
 */
function formatLastSeen(iso: string | null): string {
  if (!iso) return "Hasn't signed in yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Hasn't signed in yet";
  const abs = Math.max(0, Date.now() - then);

  if (abs < 60_000) return "Active just now";

  const mins = Math.floor(abs / 60_000);
  if (mins < 60) {
    return `Last seen ${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(abs / 3_600_000);
  if (hours < 24) {
    return `Last seen ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(abs / 86_400_000);
  if (days < 7) {
    return `Last seen ${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `Last seen ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Last seen ${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(days / 365);
  return `Last seen ${years} ${years === 1 ? "year" : "years"} ago`;
}
