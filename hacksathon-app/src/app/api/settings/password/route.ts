import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { PasswordChangedEmail } from "@/emails/password-changed-notification";

export const maxDuration = 15;

const PASSWORD_MIN = 8;

interface PasswordBody {
  password?: unknown;
  currentPassword?: unknown;
}

/**
 * Self-service password change for the authenticated user.
 *
 * Why this is server-side (vs. calling `supabase.auth.updateUser` from
 * the client like /reset-password does):
 *
 *   1. We do step-up re-authentication - the user must type their
 *      current password, and we verify it server-side BEFORE touching
 *      the credentials. Without this gate, a stolen-cookie attacker
 *      (or a stale concurrent session) could lock the legitimate user
 *      out by overwriting a freshly-rotated password during the JWT
 *      lifetime window.
 *   2. After a successful update we sign out OTHER sessions for this
 *      user, leaving the current cookie intact. That has to run with
 *      the cookie-bound server client so Supabase can scope "others"
 *      against the actual JWT.
 *   3. We send a "your password was changed" alert via Resend, which
 *      needs the server-side API key.
 *
 * Side effects after the update (signOut others, Resend email) are
 * best-effort - if they fail after the password update succeeded, we
 * still report `ok` so the user isn't left thinking the change didn't
 * take.
 */
export async function POST(req: Request) {
  let body: PasswordBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      {
        error: "Enter your current password.",
        code: "MISSING_CURRENT_PASSWORD",
      },
      { status: 400 },
    );
  }

  if (password.length < PASSWORD_MIN) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN} characters.` },
      { status: 400 },
    );
  }

  if (password === currentPassword) {
    return NextResponse.json(
      { error: "Pick a password different from your current one." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step-up verification. We need a Supabase client that is NOT bound
  // to the request cookies - calling `signInWithPassword` on the
  // cookie-bound server client would rotate the user's session cookies
  // on every change, and would also mask the real auth error behind
  // cookie-rewrite noise. A throwaway client with persistence off does
  // the verify and then dies.
  //
  // We deliberately do NOT call `verifier.auth.signOut()` afterwards:
  // its default `scope` is `global`, which would revoke every refresh
  // token for the user - including the cookie-bound session we are
  // about to use to call `updateUser` - and produce "Auth session
  // missing!" on the very next operation. With `persistSession: false`
  // the verifier holds no local state to clean up; its server-side
  // refresh token will expire naturally and isn't exposed to anyone.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    // Intentionally generic copy to avoid leaking enumeration signals
    // (e.g. distinguishing "wrong password" from "rate limited"). The
    // form treats any failure as a current-password problem.
    return NextResponse.json(
      {
        error: "That password is incorrect.",
        code: "BAD_CURRENT_PASSWORD",
      },
      { status: 401 },
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 },
    );
  }

  // Fire side effects in parallel - neither blocks success.
  const resetUrl = `${resolveSiteUrl()}/forgot-password`;
  const email = user.email;

  const emailPromise = sendEmail({
    to: email,
    subject: "Your Hacksathon.com password was changed",
    react: PasswordChangedEmail({
      resetUrl,
      recipientEmail: email,
    }),
  });

  const [signOutResult, emailResult] = await Promise.allSettled([
    supabase.auth.signOut({ scope: "others" }),
    emailPromise,
  ]);

  const otherSessionsRevoked =
    signOutResult.status === "fulfilled" && !signOutResult.value.error;

  const emailDelivered =
    emailResult.status === "fulfilled" &&
    emailResult.value.ok === true &&
    emailResult.value.skipped !== true;

  if (signOutResult.status === "rejected") {
    console.error(
      "[settings/password] signOut(others) failed:",
      signOutResult.reason,
    );
  } else if (signOutResult.value.error) {
    console.error(
      "[settings/password] signOut(others) returned error:",
      signOutResult.value.error,
    );
  }

  if (emailResult.status === "rejected") {
    console.error(
      "[settings/password] notification email failed:",
      emailResult.reason,
    );
  } else if (!emailResult.value.ok) {
    console.warn(
      "[settings/password] notification email not delivered:",
      emailResult.value.error,
    );
  }

  return NextResponse.json({
    ok: true,
    otherSessionsRevoked,
    emailDelivered,
  });
}

function resolveSiteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://hacksathon.com";
  return base.startsWith("http") ? base : `https://${base}`;
}
