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
} from "@/lib/invites/tokens";
import { sendEmail } from "@/lib/email/resend";
import { ParticipantInviteEmail } from "@/emails/participant-invite";
import { stampSetting } from "@/lib/events/settings";

export const maxDuration = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invitations API.
 *
 *   GET   → list all invitations for the event (pending + history),
 *           newest first. Admin-only.
 *   POST  → create a new invitation, send the Resend email. Idempotent
 *           per (event, email): if a pending invite exists we revoke it
 *           and issue a fresh one (new token, fresh expiry).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("event_invitations")
    .select(
      "id, email, status, invited_at, accepted_at, expires_at, invited_by",
    )
    .eq("event_id", eventId)
    .order("invited_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invitations: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Pull event + org context for the email body and to check whether
  // this email already belongs to an active member.
  const { data: eventRow } = await admin
    .from("events")
    .select("id, title, organization_id, organizations(name)")
    .eq("id", eventId)
    .single();

  if (!eventRow) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const orgRel = eventRow.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const orgName = Array.isArray(orgRel)
    ? (orgRel[0]?.name ?? "")
    : (orgRel?.name ?? "");

  // Is the email already an active member of this org?
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("status")
      .eq("organization_id", eventRow.organization_id)
      .eq("user_id", existingProfile.id)
      .maybeSingle();
    if (existingMember && existingMember.status === "active") {
      return NextResponse.json(
        { error: "That email is already a member of this event." },
        { status: 409 },
      );
    }
  }

  // Revoke prior pending invites for this email so the unique partial
  // index lets us insert a new pending row.
  await admin
    .from("event_invitations")
    .update({ status: "revoked" })
    .eq("event_id", eventId)
    .eq("status", "pending")
    .ilike("email", email);

  const token = generateInviteToken();

  const { data: invite, error: insertError } = await admin
    .from("event_invitations")
    .insert({
      event_id: eventId,
      email,
      token,
      status: "pending",
      invited_by: ctx.userId,
      expires_at: inviteExpiry(),
    })
    .select("id, email, status, invited_at, accepted_at, expires_at")
    .single();

  if (insertError || !invite) {
    return NextResponse.json(
      { error: insertError?.message ?? "Couldn't create invitation." },
      { status: 500 },
    );
  }

  // Look up the inviter's display name for the email body.
  const { data: inviterProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", ctx.userId)
    .maybeSingle();

  const inviterName =
    inviterProfile?.full_name?.trim() ||
    inviterProfile?.email?.split("@")[0] ||
    null;

  const acceptUrl = buildAcceptInviteUrl(token);

  const emailResult = await sendEmail({
    to: email,
    subject: `You're invited to ${eventRow.title}`,
    react: ParticipantInviteEmail({
      acceptUrl,
      eventTitle: eventRow.title,
      orgName,
      inviterName,
      recipientEmail: email,
    }),
  });

  // Stamp the "team invited" milestone so the Hacky Helper can flip
  // the Phase 1 step done. Idempotent - only the first invite writes.
  await stampSetting(eventId, "team_invited_at");

  return NextResponse.json({
    ok: true,
    invitation: invite,
    acceptUrl,
    emailDelivered: emailResult.ok && !emailResult.skipped,
    emailSkipped: Boolean(emailResult.skipped),
    emailError: emailResult.error ?? null,
  });
}
