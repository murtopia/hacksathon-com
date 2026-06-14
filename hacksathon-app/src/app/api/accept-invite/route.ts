import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/invites/tokens";
import { sendParticipantWelcomeEmail } from "@/lib/email/send-participant-welcome";
import { getEventSeatUsage, SEAT_LIMIT_REACHED_MESSAGE } from "@/lib/billing/seats";

export const maxDuration = 30;

/**
 * Public accept-invite endpoint.
 *
 * Two call shapes:
 *
 *   1. New user (most common):
 *      { token, password, fullName }
 *      → look up the invite, create a Supabase auth user with email
 *        confirmed (the invite itself proves the email is reachable),
 *        upsert the profile, add to organization_members as 'member',
 *        mark the invitation accepted. Returns `{ ok: true, eventId,
 *        signedIn: false }` - the caller still needs to sign in.
 *
 *   2. Existing logged-in user (the inviter sent the link to themselves
 *      from another account, or the recipient already has an account):
 *      { token } - no password required; we use the caller's session
 *      to join the org. Returns `{ ok: true, eventId, signedIn: true }`.
 *
 * RLS bypass: we use the admin client because the recipient has no
 * org_members row yet, so the events / event_invitations RLS policies
 * would block the read.
 */

const PASSWORD_MIN = 8;

interface AcceptBody {
  token?: unknown;
  password?: unknown;
  fullName?: unknown;
}

export async function POST(req: Request) {
  let body: AcceptBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("event_invitations")
    .select(
      "id, event_id, email, status, expires_at, events(id, title, organization_id)",
    )
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "Invitation not found or already used." },
      { status: 404 },
    );
  }
  if (invite.status !== "pending") {
    return NextResponse.json(
      {
        error:
          invite.status === "accepted"
            ? "This invitation has already been accepted. Sign in instead."
            : "This invitation is no longer valid.",
      },
      { status: 410 },
    );
  }
  if (isExpired(invite.expires_at as string)) {
    await admin
      .from("event_invitations")
      .update({ status: "expired" })
      .eq("id", invite.id);
    return NextResponse.json(
      { error: "This invitation has expired. Ask for a new one." },
      { status: 410 },
    );
  }

  type InviteEvent = {
    id: string;
    title: string | null;
    organization_id: string;
  };
  const eventRel = invite.events as InviteEvent | InviteEvent[] | null;
  const eventRow = Array.isArray(eventRel) ? eventRel[0] : eventRel;
  if (!eventRow) {
    return NextResponse.json(
      { error: "Linked event missing." },
      { status: 500 },
    );
  }
  const organizationId = eventRow.organization_id;
  const eventId = eventRow.id;
  const eventTitle = eventRow.title?.trim() || "your Hacks-a-Thon";
  const inviteEmail = String(invite.email);
  let participantName: string | null = null;

  // Decide between path 1 (new user via password) and path 2
  // (already-signed-in caller).
  const serverClient = await createClient();
  const {
    data: { user: currentUser },
  } = await serverClient.auth.getUser();

  let userId: string;

  if (currentUser) {
    // Path 2 - join the org under the current session.
    //
    // SECURITY: bind the invite to the signed-in account's email. Without
    // this check, any logged-in user who obtains an invite token (a
    // forwarded email, a shared screen, a leaked link) could redeem it
    // under their own account, burning the invite and locking out the
    // intended recipient.
    const sessionEmail = currentUser.email?.trim().toLowerCase() ?? "";
    if (!sessionEmail || sessionEmail !== inviteEmail.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "This invitation was sent to a different email address. Sign in with the invited address to accept it.",
          code: "EMAIL_MISMATCH",
        },
        { status: 403 },
      );
    }

    userId = currentUser.id;
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle<{ full_name: string | null }>();
    participantName = profile?.full_name?.trim() || null;
  } else {
    // Path 1 - create the user.
    const password =
      typeof body.password === "string" ? body.password : "";
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        {
          error: `Password must be at least ${PASSWORD_MIN} characters.`,
        },
        { status: 400 },
      );
    }
    if (fullName.length < 1 || fullName.length > 120) {
      return NextResponse.json(
        { error: "Please tell us what to call you." },
        { status: 400 },
      );
    }

    // If an auth user already exists for this email, the create call
    // will fail. In that case, we fall back to a sign-in flow on the
    // client (the page surfaces "We found an existing account - sign
    // in to join").
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: inviteEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, invited_to_event: eventId },
      });

    if (createError || !created.user) {
      const msg = createError?.message ?? "Couldn't create your account.";
      // Detect duplicate-email so the client can route to sign-in.
      if (/already.*registered|exists/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              "An account already exists for this email. Sign in to accept.",
            code: "USER_EXISTS",
          },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    userId = created.user.id;
    participantName = fullName;

    // Upsert the profile (trigger likely creates a base row on auth
    // user creation, but we set full_name explicitly here).
    await admin.from("profiles").upsert(
      {
        id: userId,
        email: inviteEmail,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  }

  // Add to organization_members (idempotent). Existing 'removed' rows
  // are re-activated rather than duplicated.
  const { data: existingMember } = await admin
    .from("organization_members")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; status: string }>();

  // Hard cap: block acceptance that would create a new active seat once
  // the purchased limit is full. A seat was normally reserved for this
  // invite, so this only trips if the event is genuinely over-committed.
  const willBecomeActive = !existingMember || existingMember.status !== "active";
  if (willBecomeActive) {
    const usage = await getEventSeatUsage(eventId);
    if (usage.limit !== null && usage.used >= usage.limit) {
      return NextResponse.json(
        { error: SEAT_LIMIT_REACHED_MESSAGE },
        { status: 410 },
      );
    }
  }

  // Only welcome on a real transition into active (not a re-accept by an
  // already-active member).
  let becameActive = false;

  if (existingMember) {
    if (existingMember.status !== "active") {
      await admin
        .from("organization_members")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("id", existingMember.id);
      becameActive = true;
    }
  } else {
    const { error: memberError } = await admin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: "participant",
        status: "active",
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message },
        { status: 500 },
      );
    }
    becameActive = true;
  }

  // Mark the invitation accepted.
  await admin
    .from("event_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Branded participant welcome - fail-soft, only on transition to active.
  if (becameActive) {
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle<{ name: string | null }>();

    await sendParticipantWelcomeEmail({
      email: inviteEmail,
      participantName,
      orgName: org?.name?.trim() || "",
      eventTitle,
      eventId,
    });
  }

  return NextResponse.json({
    ok: true,
    eventId,
    signedIn: Boolean(currentUser),
  });
}
