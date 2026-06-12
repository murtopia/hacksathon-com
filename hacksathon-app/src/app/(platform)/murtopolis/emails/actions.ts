"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { siteBaseUrl } from "@/lib/routing/site-url";
import { emailPreviews, getEmailPreview } from "@/emails/registry";
import {
  supabaseAuthSamples,
  fillSupabaseSample,
} from "@/emails/supabase-auth-samples";

export interface SendTestResult {
  ok: boolean;
  /** Address the test emails were sent to. */
  recipient?: string;
  /** Human labels of emails that were dispatched successfully. */
  sent: string[];
  /** Failures, with a label and a short message. */
  errors: { label: string; message: string }[];
  /** Top-level error (e.g. not an admin) when nothing could be attempted. */
  error?: string;
}

const SUBJECT_PREFIX = "[Test] ";

/** Small delay to stay comfortably under Resend / Supabase rate limits. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send test copies of our transactional email to the signed-in platform
 * admin's own address. Covers the 10 Resend "app" templates plus the four
 * Supabase Auth emails: Reset password + Magic link are triggered through the
 * real Supabase auth flow (so they exercise the dashboard templates + SMTP),
 * while Confirm signup + Change email are sent as rendered-HTML previews
 * (they can't be re-triggered for an existing, confirmed user).
 *
 * @param target "all" to send everything, or a single registry slug.
 */
export async function sendTestEmails(
  target: "all" | string = "all",
): Promise<SendTestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, sent: [], errors: [], error: "Not signed in." };
  }

  const { data: isAdmin, error: rpcError } =
    await supabase.rpc("is_platform_admin");
  if (rpcError || !isAdmin) {
    return {
      ok: false,
      sent: [],
      errors: [],
      error: "Platform admin access required.",
    };
  }

  const recipient = user.email;
  if (!recipient) {
    return {
      ok: false,
      sent: [],
      errors: [],
      error: "Your account has no email address.",
    };
  }

  const sent: string[] = [];
  const errors: { label: string; message: string }[] = [];

  // 1. App templates (React Email -> Resend).
  const appEntries =
    target === "all"
      ? emailPreviews
      : [getEmailPreview(target)].filter(
          (e): e is (typeof emailPreviews)[number] => Boolean(e),
        );

  for (const entry of appEntries) {
    try {
      const result = await sendEmail({
        to: recipient,
        subject: SUBJECT_PREFIX + entry.subject,
        react: entry.element,
      });
      if (result.ok) {
        sent.push(result.skipped ? `${entry.label} (skipped: no key)` : entry.label);
      } else {
        errors.push({ label: entry.label, message: result.error ?? "Unknown error" });
      }
    } catch (e) {
      errors.push({
        label: entry.label,
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
    await delay(400);
  }

  // The Supabase Auth emails are only included in an "all" run.
  if (target === "all") {
    // 2. Reset password + Magic link via the real Supabase auth flow.
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recipient, {
        redirectTo: `${siteBaseUrl()}/callback?next=/reset-password`,
      });
      if (error) {
        errors.push({ label: "Reset password (Supabase)", message: error.message });
      } else {
        sent.push("Reset password (Supabase, real trigger)");
      }
    } catch (e) {
      errors.push({
        label: "Reset password (Supabase)",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
    await delay(400);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: recipient,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${siteBaseUrl()}/callback`,
        },
      });
      if (error) {
        errors.push({ label: "Magic link (Supabase)", message: error.message });
      } else {
        sent.push("Magic link (Supabase, real trigger)");
      }
    } catch (e) {
      errors.push({
        label: "Magic link (Supabase)",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
    await delay(400);

    // 3. Confirm signup + Change email as rendered-HTML previews.
    for (const sample of supabaseAuthSamples) {
      try {
        const result = await sendEmail({
          to: recipient,
          subject: SUBJECT_PREFIX + sample.subject,
          html: fillSupabaseSample(sample, recipient),
        });
        if (result.ok) {
          sent.push(
            result.skipped ? `${sample.label} (skipped: no key)` : sample.label,
          );
        } else {
          errors.push({ label: sample.label, message: result.error ?? "Unknown error" });
        }
      } catch (e) {
        errors.push({
          label: sample.label,
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
      await delay(400);
    }
  }

  return { ok: errors.length === 0, recipient, sent, errors };
}
