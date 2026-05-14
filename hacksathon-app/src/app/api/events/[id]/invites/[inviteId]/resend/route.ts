import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import {
  generateInviteToken,
  inviteExpiry,
  buildAcceptInviteUrl,
  isExpired,
} from "@/lib/invites/tokens";
import { sendEmail } from "@/lib/email/resend";
import { ParticipantInviteEmail } from "@/emails/participant-invite";

export const maxDuration = 30;

/**
 * Resend a pending invitation. Issues a fresh token + expiry so the
 * old link stops working — important if the original recipient lost or
 * leaked it.
 *
 * Refuses to resend accepted, revoked, or expired invites. To re-invite
 * someone whose previous invite expired or was revoked, the admin
 * should POST a new invite via the parent route.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const { id: eventId, inviteId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("event_invitations")
    .select("id, email, status, expires_at")
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .maybeSingle<{
      id: string;
      email: string;
      status: string;
      expires_at: string;
    }>();

  if (!invite) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }
  if (invite.status !== "pending") {
    return NextResponse.json(
      {
        error: `Can't resend a ${invite.status} invitation. Send a new one instead.`,
      },
      { status: 409 },
    );
  }
  if (isExpired(invite.expires_at)) {
    // Auto-mark the row expired so list views reflect reality.
    await admin
      .from("event_invitations")
      .update({ status: "expired" })
      .eq("id", inviteId);
    return NextResponse.json(
      { error: "This invitation has expired. Send a new one." },
      { status: 410 },
    );
  }

  const token = generateInviteToken();

  const { error: updateError } = await admin
    .from("event_invitations")
    .update({
      token,
      expires_at: inviteExpiry(),
      invited_at: new Date().toISOString(),
    })
    .eq("id", inviteId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 },
    );
  }

  // Re-fetch context for the email body (event title, org, inviter).
  const [{ data: eventRow }, { data: inviter }] = await Promise.all([
    admin
      .from("events")
      .select("title, organizations(name)")
      .eq("id", eventId)
      .single(),
    admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", ctx.userId)
      .maybeSingle(),
  ]);

  const orgRel = eventRow?.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const orgName = Array.isArray(orgRel)
    ? (orgRel[0]?.name ?? "")
    : (orgRel?.name ?? "");
  const inviterName =
    inviter?.full_name?.trim() ||
    inviter?.email?.split("@")[0] ||
    null;
  const acceptUrl = buildAcceptInviteUrl(token);

  const emailResult = await sendEmail({
    to: invite.email,
    subject: `Reminder: you're invited to ${eventRow?.title ?? "a Hacks-a-Thon"}`,
    react: ParticipantInviteEmail({
      acceptUrl,
      eventTitle: eventRow?.title ?? "your Hacks-a-Thon",
      orgName,
      inviterName,
      recipientEmail: invite.email,
    }),
  });

  return NextResponse.json({
    ok: true,
    acceptUrl,
    emailDelivered: emailResult.ok && !emailResult.skipped,
    emailSkipped: Boolean(emailResult.skipped),
    emailError: emailResult.error ?? null,
  });
}
