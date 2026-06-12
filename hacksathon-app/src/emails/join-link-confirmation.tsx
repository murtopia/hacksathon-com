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

export interface JoinLinkConfirmationEmailProps {
  confirmUrl: string;
  eventTitle: string;
  orgName: string;
  recipientEmail: string;
}

/**
 * Branded email sent when a participant signs up via a shareable join
 * link. Replaces Supabase's default confirmation email (and its tight
 * rate limit) by routing through Resend.
 *
 * Visual treatment intentionally mirrors participant-invite.tsx so
 * accept-invite and join-link confirmations read as siblings in an
 * inbox - same Hacksathon.com brand bar, same single-CTA layout, same
 * footer language.
 */
export function JoinLinkConfirmationEmail({
  confirmUrl,
  eventTitle,
  orgName,
  recipientEmail,
}: JoinLinkConfirmationEmailProps) {
  const orgLabel = orgName?.trim() || eventTitle;
  return (
    <Html>
      <EmailHead />
      <Preview>{`Confirm your email to join the ${orgLabel} Hacks-a-Thon`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>Confirm your email to join.</Text>
            <Text style={s.paragraph}>
              You&apos;ve signed up to join the{" "}
              <strong>{orgLabel}</strong> Hacks-a-Thon.
            </Text>
            <Text style={s.paragraph}>
              Confirm your email below and an organizer will review your
              request. Once they approve, you&apos;ll land on the roster and
              the event home will open up.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={confirmUrl} style={s.button}>
              Confirm email
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={confirmUrl} style={s.link}>
                {confirmUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This confirmation was sent to {recipientEmail}. If you
              didn&apos;t request to join, you can ignore this email -
              nothing happens until you confirm.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

JoinLinkConfirmationEmail.PreviewProps = {
  confirmUrl: "https://hacksathon.com/callback?code=example&next=/join/example",
  eventTitle: "Spring Hacks-a-Thon",
  orgName: "Seven2",
  recipientEmail: "you@example.com",
} satisfies JoinLinkConfirmationEmailProps;

export default JoinLinkConfirmationEmail;
