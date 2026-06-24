import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured } from "@/lib/email/resend";
import {
  ParticipantsPanel,
  type InvitationRow,
  type PendingJoinRequest,
  type RosterMember,
} from "@/components/admin/sections/participants-panel";
import {
  resolveSlugContext,
  resolveSlugViewer,
} from "@/lib/routing/slug-context";
import { AdminStepNav } from "@/components/admin/admin-step-nav";
import { buildJoinUrl } from "@/lib/join/tokens";
import { getEventSeatUsage } from "@/lib/billing/seats";
import { applyAddedSeats } from "@/lib/billing/provision";
import { getStripe } from "@/lib/stripe/client";

export const metadata: Metadata = {
  title: "Team",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
  searchParams: Promise<{ seats_session?: string }>;
}

/**
 * Idempotent success fallback for the "Add participants" flow, mirroring
 * the checkout success page: if the buyer lands back here before the
 * Stripe webhook fired, apply the seat top-up directly. Keyed on the
 * session id via the event_seat_purchases ledger, so it can race the
 * webhook safely. Fail-soft - never block rendering the Team page.
 */
async function applySeatsFallback(
  sessionId: string,
  eventId: string,
): Promise<void> {
  try {
    const stripe = getStripe();
    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.retrieve(sessionId);

    const settled =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    const metadata = session.metadata ?? {};

    if (
      !settled ||
      metadata.kind !== "add_seats" ||
      metadata.eventId !== eventId
    ) {
      return;
    }

    const newLimit = Number(metadata.newLimit || "0");
    const addedSeats = Number(metadata.addedSeats || "0");
    if (!Number.isFinite(newLimit) || newLimit < 1) return;

    await applyAddedSeats({
      eventId,
      newLimit,
      addedSeats: Number.isFinite(addedSeats) ? addedSeats : 0,
      amountCents: session.amount_total ?? 0,
      checkoutSessionId: session.id,
      createdBy: metadata.userId || session.client_reference_id || null,
    });
  } catch {
    // Webhook remains the primary path; swallow and render.
  }
}

interface MemberJoinRow {
  user_id: string;
  role: string;
  status: string;
  is_participating: boolean;
  profiles:
    | {
        id: string;
        email: string;
        full_name: string | null;
        last_active_at: string | null;
      }
    | {
        id: string;
        email: string;
        full_name: string | null;
        last_active_at: string | null;
      }[]
    | null;
}

interface PendingMemberRow {
  user_id: string;
  invited_at: string;
  profiles:
    | { id: string; email: string; full_name: string | null }
    | { id: string; email: string; full_name: string | null }[]
    | null;
}

/**
 * Team admin - invitations, join link, pending approvals, and the
 * active roster. Replaces the old "Company settings" tab; company name
 * moved to the Identity tab where it belongs alongside the rest of the
 * event identity.
 *
 * Roster lookup uses the admin client to sidestep the
 * organization_members SELECT policy, which only returns the caller's
 * own row (see migration 00008_fix_rls_recursion for context).
 */
export default async function SlugAdminTeamPage({
  params,
  searchParams,
}: PageProps) {
  const { companyslug } = await params;
  const { seats_session: seatsSession } = await searchParams;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();
  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer) notFound();

  const supabase = await createClient();
  const admin = createAdminClient();

  // Apply any just-completed seat top-up before reading usage so the page
  // reflects the new limit immediately.
  if (seatsSession) {
    await applySeatsFallback(seatsSession, ctx.event.id);
  }

  const [
    { data: memberRows },
    { data: invitationRows },
    { data: pendingRows },
    { data: eventRow },
    seatUsage,
  ] = await Promise.all([
    admin
      .from("organization_members")
      .select(
        "user_id, role, status, is_participating, profiles!inner(id, email, full_name, last_active_at)",
      )
      .eq("organization_id", ctx.event.organization_id)
      .eq("status", "active"),
    supabase
      .from("event_invitations")
      .select("id, email, status, invited_at, accepted_at, expires_at")
      .eq("event_id", ctx.event.id)
      .order("invited_at", { ascending: false })
      .returns<InvitationRow[]>(),
    admin
      .from("organization_members")
      .select("user_id, invited_at, profiles!inner(id, email, full_name)")
      .eq("organization_id", ctx.event.organization_id)
      .eq("status", "pending")
      .order("invited_at", { ascending: true }),
    admin
      .from("events")
      .select("join_token")
      .eq("id", ctx.event.id)
      .maybeSingle<{ join_token: string | null }>(),
    getEventSeatUsage(ctx.event.id),
  ]);

  const roster: RosterMember[] = (
    (memberRows as MemberJoinRow[] | null) ?? []
  ).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      email: p?.email ?? "",
      full_name: p?.full_name ?? null,
      role: m.role,
      is_self: m.user_id === viewer.user.id,
      is_participating: m.is_participating,
      last_active_at: p?.last_active_at ?? null,
    };
  });

  const pendingRequests: PendingJoinRequest[] = (
    (pendingRows as PendingMemberRow[] | null) ?? []
  ).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      email: p?.email ?? "",
      full_name: p?.full_name ?? null,
      requested_at: m.invited_at,
    };
  });

  const joinUrl = eventRow?.join_token
    ? buildJoinUrl(eventRow.join_token)
    : null;

  return (
    <div className="space-y-10">
      <ParticipantsPanel
        number="01"
        eventId={ctx.event.id}
        roster={roster}
        invitations={(invitationRows as InvitationRow[]) ?? []}
        emailConfigured={emailConfigured()}
        joinUrl={joinUrl}
        pendingRequests={pendingRequests}
        seatUsage={seatUsage}
      />

      <AdminStepNav slug={ctx.slug} current="04" />
    </div>
  );
}
