import { Resend } from "resend";
import type { ReactElement } from "react";

/**
 * Resend singleton + safe sendEmail helper.
 *
 * Behavior:
 *   - If `RESEND_API_KEY` is set, we send for real.
 *   - If it isn't, we log the request to stdout and return `{ ok: true,
 *     skipped: true }`. This keeps local development from 500-ing the
 *     invite flow when the operator hasn't configured Resend yet, and
 *     it keeps preview deploys for branches where envs haven't been
 *     wired up alive.
 *
 * Callers should never depend on the email actually being delivered for
 * data integrity. The invitation row in the database is the source of
 * truth; the email is just the delivery mechanism. If `sendEmail`
 * returns `{ ok: false }`, the caller should surface a recoverable
 * "we couldn't email them just now - copy this link instead" UX.
 */

const apiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? "Hacksathon.com <invites@hacksathon.com>";
const replyTo = process.env.RESEND_REPLY_TO ?? undefined;

let _client: Resend | null = null;

function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!_client) _client = new Resend(apiKey);
  return _client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
  /** Optional plain-text fallback. If omitted, the rendered React body is used. */
  text?: string;
  /** Override the default from address per-send. */
  from?: string;
  /** Override the default reply-to per-send. */
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  const client = getClient();

  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY is not set - email not actually sent. Subject:",
      params.subject,
      "To:",
      params.to,
    );
    return { ok: true, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: params.from ?? fromEmail,
      to: params.to,
      subject: params.subject,
      react: params.react,
      text: params.text,
      replyTo: params.replyTo ?? replyTo,
    });

    if (error) {
      console.error("[email] Resend send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] Resend exception:", e);
    return { ok: false, error: message };
  }
}

export function emailConfigured(): boolean {
  return Boolean(apiKey);
}
