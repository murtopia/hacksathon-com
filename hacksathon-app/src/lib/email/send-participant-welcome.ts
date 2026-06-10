import { sendEmail } from "@/lib/email/resend";
import { siteBaseUrl } from "@/lib/routing/site-url";
import { ParticipantWelcomeEmail } from "@/emails/participant-welcome";

export interface ParticipantWelcomeParams {
  email: string;
  participantName: string | null;
  orgName: string;
  eventTitle: string;
  /** In-app event home is /events/{eventId}. */
  eventId: string;
}

/**
 * Branded welcome email for a participant who just became an active
 * member (invite accepted or join request approved).
 *
 * Fully fail-soft: best-effort send, never throws. The membership row is
 * the source of truth; this email must not block the API response.
 */
export async function sendParticipantWelcomeEmail(
  params: ParticipantWelcomeParams,
): Promise<void> {
  try {
    if (!params.email) return;
    const eventUrl = `${siteBaseUrl()}/events/${params.eventId}`;

    await sendEmail({
      to: params.email,
      subject: `Welcome to ${params.eventTitle}`,
      react: ParticipantWelcomeEmail({
        participantName: params.participantName,
        orgName: params.orgName,
        eventTitle: params.eventTitle,
        eventUrl,
        recipientEmail: params.email,
      }),
    });
  } catch (e) {
    console.error("[email] participant-welcome send failed (non-fatal):", e);
  }
}
