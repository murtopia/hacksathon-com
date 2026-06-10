import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { JoinLinkConfirmationEmail } from "@/emails/join-link-confirmation";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";

export const maxDuration = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const FULL_NAME_MAX = 120;

interface SignupBody {
  token?: unknown;
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
}

/**
 * Custom signup endpoint for join-link participants.
 *
 * Replaces `supabase.auth.signUp()` for the `/join/{token}` path so:
 *   1. The confirmation email comes from Hacksathon.com via Resend,
 *      not Supabase's branded default sender.
 *   2. We bypass Supabase's hostile email rate limit entirely (Supabase
 *      Auth's built-in sender caps at ~3-4 messages/hour on most plans).
 *
 * Pattern: use `auth.admin.generateLink({ type: 'signup' })` which
 * creates the auth user AND returns the confirmation action_link
 * without sending an email. We then send our own branded email.
 *
 * The email-confirmation gate stays intact - the user can't log in
 * until they click the link, same as the default Supabase flow.
 */
export async function POST(req: Request) {
  // This endpoint creates auth users and triggers email sends, so it's a
  // prime target for abuse. Throttle per client IP.
  const limit = rateLimit({
    key: `signup-via-join:${getClientIp(req)}`,
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!token) {
    return NextResponse.json(
      { error: "Missing join token." },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < PASSWORD_MIN) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN} characters.` },
      { status: 400 },
    );
  }
  if (fullName.length < 1 || fullName.length > FULL_NAME_MAX) {
    return NextResponse.json(
      { error: "Please tell us what to call you." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Resolve the event from the join token. Revoked / unknown tokens
  // return 404 - never expose whether the token format itself is
  // valid since it could leak event identifiers.
  const { data: eventRow } = await admin
    .from("events")
    .select("id, title, organizations(name)")
    .eq("join_token", token)
    .maybeSingle<{
      id: string;
      title: string;
      organizations:
        | { name: string }
        | { name: string }[]
        | null;
    }>();

  if (!eventRow) {
    return NextResponse.json(
      { error: "This invite link is no longer active." },
      { status: 404 },
    );
  }

  const orgRel = eventRow.organizations;
  const orgName = Array.isArray(orgRel)
    ? (orgRel[0]?.name ?? "")
    : (orgRel?.name ?? "");

  // Build the post-confirmation landing. After the user clicks the
  // link in the email, Supabase redirects to /callback?code=...&next=
  // - /callback exchanges the code for a session and forwards to the
  // join page, where the visitor sees the "Welcome" branch and can
  // click "Request to join" to drop a pending org_members row.
  const siteUrl = resolveSiteUrl();
  const redirectTo = `${siteUrl}/callback?next=${encodeURIComponent(
    `/join/${encodeURIComponent(token)}`,
  )}`;

  // generateLink creates the auth user (status: unconfirmed) and
  // hands us the action_link. It does NOT send an email, which is
  // exactly what we want - we send a Resend-branded version below.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: { full_name: fullName },
        redirectTo,
      },
    });

  if (linkError || !linkData) {
    const msg = linkError?.message ?? "Couldn't start the signup.";
    if (/already.*registered|exists|already been registered/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "An account already exists for this email. Log in to continue.",
          code: "USER_EXISTS",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const actionLink = linkData.properties?.action_link;
  const userId = linkData.user?.id;

  if (!actionLink || !userId) {
    return NextResponse.json(
      { error: "Couldn't generate the confirmation link." },
      { status: 500 },
    );
  }

  // The auth-user-created trigger in the schema typically inserts a
  // baseline profile row. We set full_name explicitly here so it's
  // populated when the user first lands in-app.
  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  const orgLabel = orgName || eventRow.title;
  const send = await sendEmail({
    to: email,
    subject: `Confirm your email to join the ${orgLabel} Hacks-a-Thon`,
    react: JoinLinkConfirmationEmail({
      confirmUrl: actionLink,
      eventTitle: eventRow.title,
      orgName,
      recipientEmail: email,
    }),
  });

  // SECURITY: never return the confirmation `action_link` to the client.
  // It confirms the account without inbox access, which would defeat the
  // email-verification gate for anyone who can call this public endpoint.
  // The only safe delivery channel for that link is the user's own inbox.
  if (send.skipped) {
    // Resend is not configured. In production that's a misconfiguration
    // and we must fail closed rather than silently create unverifiable
    // accounts. In local/preview we log the link server-side so a
    // developer can complete the flow without exposing it to the client.
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[signup-via-join] RESEND_API_KEY missing in production - cannot send confirmation email.",
      );
      return NextResponse.json(
        {
          error:
            "We couldn't send your confirmation email right now. Please try again in a little while.",
        },
        { status: 503 },
      );
    }
    console.warn(
      "[signup-via-join] Email skipped (no RESEND_API_KEY). Confirmation link for",
      email,
      ":",
      actionLink,
    );
    return NextResponse.json({ ok: true, emailSkipped: true });
  }

  if (!send.ok) {
    // The auth user exists but we couldn't email them. Fail soft with a
    // generic, retryable message - the user can request the link again.
    console.error(
      "[signup-via-join] Confirmation email failed to send:",
      send.error,
    );
    return NextResponse.json(
      {
        error:
          "We couldn't send your confirmation email right now. Please try again in a little while.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailDelivered: true,
  });
}

function resolveSiteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://hacksathon.com";
  return base.startsWith("http") ? base : `https://${base}`;
}
