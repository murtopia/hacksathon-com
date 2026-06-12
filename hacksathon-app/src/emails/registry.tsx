import type { ReactElement } from "react";
import { WaitlistConfirmationEmail } from "./waitlist-confirmation";
import { ParticipantInviteEmail } from "./participant-invite";
import { JoinLinkConfirmationEmail } from "./join-link-confirmation";
import { ParticipantWelcomeEmail } from "./participant-welcome";
import { PurchaseWelcomeEmail } from "./purchase-welcome";
import { PasswordChangedEmail } from "./password-changed-notification";
import { VotingOpenNotificationEmail } from "./voting-open-notification";
import { ReflectionsOpenNotificationEmail } from "./reflections-open-notification";
import { PurchaseNotificationEmail } from "./purchase-notification";
import { SupportMessageEmail } from "./support-message";

export type EmailGroup = "Customer-facing" | "Internal";

export interface EmailPreviewEntry {
  /** URL-safe identifier used in the ?template= query param. */
  slug: string;
  /** Human label shown in the preview list. */
  label: string;
  group: EmailGroup;
  /** Example subject line, mirroring what the send site uses with preview data. */
  subject: string;
  /** Rendered element, built from the template's own PreviewProps. */
  element: ReactElement;
}

/**
 * Single source of truth for the Murtopolis email preview section
 * (/murtopolis/emails). Each entry reuses the template's existing
 * `PreviewProps` so the preview always matches what the template renders.
 *
 * To add a new template: import it and append one entry here.
 */
export const emailPreviews: EmailPreviewEntry[] = [
  {
    slug: "waitlist-confirmation",
    label: "Waitlist confirmation",
    group: "Customer-facing",
    subject: "You're on the Hacksathon.com waitlist.",
    element: (
      <WaitlistConfirmationEmail {...WaitlistConfirmationEmail.PreviewProps} />
    ),
  },
  {
    slug: "participant-invite",
    label: "Participant invite",
    group: "Customer-facing",
    subject: "You're invited to Spring Hacks-a-Thon",
    element: <ParticipantInviteEmail {...ParticipantInviteEmail.PreviewProps} />,
  },
  {
    slug: "join-link-confirmation",
    label: "Join-link confirmation",
    group: "Customer-facing",
    subject: "Confirm your email to join the Seven2 Hacks-a-Thon",
    element: (
      <JoinLinkConfirmationEmail {...JoinLinkConfirmationEmail.PreviewProps} />
    ),
  },
  {
    slug: "participant-welcome",
    label: "Participant welcome",
    group: "Customer-facing",
    subject: "Welcome to Seven2 Hacks-a-Thon",
    element: (
      <ParticipantWelcomeEmail {...ParticipantWelcomeEmail.PreviewProps} />
    ),
  },
  {
    slug: "purchase-welcome",
    label: "Purchase welcome",
    group: "Customer-facing",
    subject: "Your Seven2 Hacks-a-Thon is ready",
    element: <PurchaseWelcomeEmail {...PurchaseWelcomeEmail.PreviewProps} />,
  },
  {
    slug: "password-changed",
    label: "Password changed",
    group: "Customer-facing",
    subject: "Your Hacksathon.com password was changed",
    element: <PasswordChangedEmail {...PasswordChangedEmail.PreviewProps} />,
  },
  {
    slug: "voting-open",
    label: "Voting open",
    group: "Customer-facing",
    subject: "Voting is open for the Seven2 Hacks-a-Thon Hacky Awards",
    element: (
      <VotingOpenNotificationEmail
        {...VotingOpenNotificationEmail.PreviewProps}
      />
    ),
  },
  {
    slug: "reflections-open",
    label: "Reflections open",
    group: "Customer-facing",
    subject: "Reflections are open for Seven2 Hacks-a-Thon",
    element: (
      <ReflectionsOpenNotificationEmail
        {...ReflectionsOpenNotificationEmail.PreviewProps}
      />
    ),
  },
  {
    slug: "purchase-notification",
    label: "Purchase notification (internal)",
    group: "Internal",
    subject: "New purchase - Acme Co ($995.00)",
    element: (
      <PurchaseNotificationEmail {...PurchaseNotificationEmail.PreviewProps} />
    ),
  },
  {
    slug: "support-message",
    label: "Support message (internal)",
    group: "Internal",
    subject: "Support · Running an event · Jane Doe",
    element: <SupportMessageEmail {...SupportMessageEmail.PreviewProps} />,
  },
];

/** Look up a single preview entry by slug. */
export function getEmailPreview(
  slug: string | undefined,
): EmailPreviewEntry | undefined {
  if (!slug) return undefined;
  return emailPreviews.find((e) => e.slug === slug);
}
