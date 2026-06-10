import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { SupportMessageEmail } from "@/emails/support-message";
import { getClientIp, rateLimit } from "@/lib/server/rate-limit";

export const maxDuration = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_INBOX = process.env.SUPPORT_INBOX_EMAIL ?? "support@hacksathon.com";

interface SupportBody {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
}

/**
 * Public support form endpoint.
 *
 * Validates the four fields server-side, then emails the support inbox
 * via Resend with `replyTo` set to the submitter so a reply from the
 * inbox goes straight back to them. There is no DB table - the email is
 * the delivery mechanism. If Resend isn't configured the send is a safe
 * no-op (returns `emailSkipped`).
 */
export async function POST(req: Request) {
  // Unauthenticated endpoint that sends email to our support inbox.
  // Throttle hard per IP to prevent inbox flooding and Resend quota burn.
  const limit = rateLimit({
    key: `support:${getClientIp(req)}`,
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      {
        error:
          "You've sent a few messages already. Please wait a few minutes before sending another.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: SupportBody;
  try {
    body = (await req.json()) as SupportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 1 || name.length > 120) {
    return NextResponse.json(
      { error: "Tell us what to call you." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 200) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const topic =
    typeof body.topic === "string" && body.topic.trim().length > 0
      ? body.topic.trim().slice(0, 120)
      : "General";

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 1 || message.length > 5000) {
    return NextResponse.json(
      { error: "Add a message so we know how to help." },
      { status: 400 },
    );
  }

  const emailResult = await sendEmail({
    to: SUPPORT_INBOX,
    subject: `Support · ${topic} · ${name}`,
    replyTo: email,
    react: SupportMessageEmail({
      senderName: name,
      senderEmail: email,
      topic,
      message,
    }),
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: "Couldn't send your message. Try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    emailSkipped: Boolean(emailResult.skipped),
  });
}
