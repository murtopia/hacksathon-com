import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { sendParticipantWelcomeEmail } from "@/lib/email/send-participant-welcome";
import { getEventSeatUsage, SEAT_LIMIT_REACHED_MESSAGE } from "@/lib/billing/seats";

export const maxDuration = 10;

/**
 * Approve a pending join request.
 *
 * Flips organization_members.status from 'pending' → 'active' and
 * stamps joined_at. Refuses anything other than 'pending' to avoid
 * accidentally bumping a removed user back onto the roster - the admin
 * has to re-invite them in that case.
 *
 * Reject path stays on the existing soft-DELETE (`DELETE /members/[id]`),
 * which sets status='removed'.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: eventId, memberId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, role, status, user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", memberId)
    .maybeSingle<{
      id: string;
      role: string;
      status: string;
      user_id: string;
    }>();

  if (!member) {
    return NextResponse.json(
      { error: "Request not found." },
      { status: 404 },
    );
  }

  if (member.status === "active") {
    return NextResponse.json({ ok: true, noop: true });
  }

  if (member.status !== "pending") {
    return NextResponse.json(
      {
        error:
          "This member isn't in the pending queue. Send a fresh invite instead.",
      },
      { status: 409 },
    );
  }

  // Hard cap: approving consumes a seat. Block when active participating
  // members already fill the purchased limit.
  const usage = await getEventSeatUsage(eventId);
  if (usage.limit !== null && usage.used >= usage.limit) {
    return NextResponse.json(
      { error: SEAT_LIMIT_REACHED_MESSAGE },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("organization_members")
    .update({ status: "active", joined_at: new Date().toISOString() })
    .eq("id", member.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Branded participant welcome - fail-soft, never blocks the response.
  const [{ data: profile }, { data: event }, { data: org }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("email, full_name")
        .eq("id", member.user_id)
        .maybeSingle<{ email: string | null; full_name: string | null }>(),
      admin
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle<{ title: string | null }>(),
      admin
        .from("organizations")
        .select("name")
        .eq("id", ctx.organizationId)
        .maybeSingle<{ name: string | null }>(),
    ]);

  if (profile?.email) {
    await sendParticipantWelcomeEmail({
      email: profile.email,
      participantName: profile.full_name?.trim() || null,
      orgName: org?.name?.trim() || "",
      eventTitle: event?.title?.trim() || "your Hacks-a-Thon",
      eventId,
    });
  }

  return NextResponse.json({ ok: true });
}
