import {
  Body,
  Button,
  Container,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailHead } from "@/lib/email/email-head";
import * as s from "@/lib/email/email-styles";

export interface ParticipantInviteEmailProps {
  acceptUrl: string;
  eventTitle: string;
  orgName: string;
  inviterName: string | null;
  recipientEmail: string;
}

/**
 * Branded email sent when an organizer invites a participant to their
 * Hacks-a-Thon. Single CTA, minimal copy, designed to read well in
 * Gmail / Outlook web / Apple Mail without a preview pane.
 *
 * The HTML output is rendered server-side by React Email and handed to
 * Resend; this same component is also what gets previewed in
 * /api/emails/preview (deferred polish, not part of M6).
 */
export function ParticipantInviteEmail({
  acceptUrl,
  eventTitle,
  orgName,
  inviterName,
  recipientEmail,
}: ParticipantInviteEmailProps) {
  const inviter = inviterName?.trim() || "Your organizer";
  return (
    <Html>
      <EmailHead />
      <Preview>{`${inviter} invited you to ${eventTitle}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>You&apos;re in.</Text>
            <Text style={s.paragraph}>
              {inviter} invited you to take part in{" "}
              <strong>{eventTitle}</strong>
              {orgName ? <> at {orgName}</> : null}.
            </Text>
            <Text style={s.paragraph}>
              Click the button below to set your password and get started.
              You&apos;ll land on your event home with everything queued up.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={acceptUrl} style={s.button}>
              Accept your invite
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={acceptUrl} style={s.link}>
                {acceptUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This invite was sent to {recipientEmail}. If you weren&apos;t
              expecting it, you can ignore this email - nothing happens until
              you accept.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ParticipantInviteEmail.PreviewProps = {
  acceptUrl: "https://hacksathon.com/accept-invite/example-token",
  eventTitle: "Spring Hacks-a-Thon",
  orgName: "Seven2",
  inviterName: "Nick Reese",
  recipientEmail: "you@example.com",
} satisfies ParticipantInviteEmailProps;

export default ParticipantInviteEmail;
