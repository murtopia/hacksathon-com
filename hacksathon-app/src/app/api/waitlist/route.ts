import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { WaitlistConfirmationEmail } from "@/emails/waitlist-confirmation";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";

export const maxDuration = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_SIZE_VALUES = ["1-10", "11-25", "26-50", "51+"] as const;
type TeamSize = (typeof TEAM_SIZE_VALUES)[number];

interface SignupBody {
  email?: unknown;
  name?: unknown;
  company?: unknown;
  teamSize?: unknown;
  source?: unknown;
}

/**
 * Public waitlist signup endpoint.
 *
 * Validates the four fields server-side, normalizes the email
 * (lowercased + trimmed), then upserts via the service-role admin
 * client. RLS on `waitlist_signups` denies all anon/authenticated
 * traffic, which is why we have to use the admin client here.
 *
 * Privacy posture:
 *   - We never reveal whether an email is already on the list. Both
 *     "fresh signup" and "already on the list" return 200 with the exact
 *     same body, so a scraper can't probe for membership by diffing
 *     status codes or response fields.
 *   - The confirmation email only sends on a *new* signup. Re-submits
 *     are silently idempotent (no spam to people who hit the form
 *     twice), and that difference is never surfaced to the caller.
 */
export async function POST(req: Request) {
  // Throttle per IP - this is a public, unauthenticated write endpoint.
  const limit = rateLimit({
    key: `waitlist:${getClientIp(req)}`,
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
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const email = rawEmail.toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 1 || name.length > 120) {
    return NextResponse.json(
      { error: "Tell us what to call you." },
      { status: 400 },
    );
  }

  const company = typeof body.company === "string" ? body.company.trim() : "";
  if (company.length < 1 || company.length > 120) {
    return NextResponse.json(
      { error: "Add your company name." },
      { status: 400 },
    );
  }

  const teamSizeInput =
    typeof body.teamSize === "string" ? body.teamSize.trim() : "";
  if (!TEAM_SIZE_VALUES.includes(teamSizeInput as TeamSize)) {
    return NextResponse.json(
      { error: "Pick a team size." },
      { status: 400 },
    );
  }
  const teamSize = teamSizeInput as TeamSize;

  const source =
    typeof body.source === "string" && body.source.trim().length > 0
      ? body.source.trim().slice(0, 60)
      : "waitlist-page";

  const admin = createAdminClient();

  // The identical response we return whether the email was just added or
  // was already present. Keeping these byte-for-byte the same is what
  // prevents membership enumeration.
  const genericSuccess = NextResponse.json({ ok: true });

  // Detect re-submit before inserting so we know whether to send the
  // confirmation email. The result of this check is never surfaced to
  // the caller - it only gates the (best-effort) email send.
  const { data: existing } = await admin
    .from("waitlist_signups")
    .select("id")
    .ilike("email", email)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return genericSuccess;
  }

  const { error: insertError } = await admin.from("waitlist_signups").insert({
    email,
    name,
    company,
    team_size: teamSize,
    source,
  });

  if (insertError) {
    // If the UNIQUE index fires (race condition with a sibling tab),
    // treat it exactly like an "already on list" success so the response
    // stays indistinguishable.
    if (insertError.code === "23505") {
      return genericSuccess;
    }
    console.error("[waitlist] insert failed:", insertError);
    return NextResponse.json(
      { error: "Couldn't save your signup. Try again in a moment." },
      { status: 500 },
    );
  }

  // Best-effort confirmation email on genuinely new signups only. We
  // deliberately ignore the result so the response shape can't reveal
  // whether this was a new insert.
  await sendEmail({
    to: email,
    subject: "You're on the Hacksathon.com waitlist.",
    react: WaitlistConfirmationEmail({
      recipientName: name,
      recipientEmail: email,
    }),
  });

  return genericSuccess;
}
