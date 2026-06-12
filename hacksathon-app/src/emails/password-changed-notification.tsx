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

export interface PasswordChangedEmailProps {
  resetUrl: string;
  recipientEmail: string;
}

/**
 * Security-notification email sent after a successful password change
 * from /settings. Not a confirmation flow - the password has already
 * been updated by the time this lands. The only action surfaced is
 * "Reset your password" for the "this wasn't me" case.
 *
 * Visual treatment mirrors participant-invite.tsx and
 * join-link-confirmation.tsx so all three transactional emails read
 * as a single design family in the recipient's inbox.
 */
export function PasswordChangedEmail({
  resetUrl,
  recipientEmail,
}: PasswordChangedEmailProps) {
  return (
    <Html>
      <EmailHead />
      <Preview>Your Hacksathon.com password was changed</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>Your password was changed.</Text>
            <Text style={s.paragraph}>
              The password on your Hacksathon.com account was updated just
              now. We&apos;ve also signed out any other devices where you
              were logged in.
            </Text>
            <Text style={s.paragraph}>
              If this wasn&apos;t you, reset your password immediately - your
              account may be at risk.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={resetUrl} style={s.button}>
              Reset your password
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={resetUrl} style={s.link}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This notification was sent to {recipientEmail}. If you made
              this change, no further action is needed.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

PasswordChangedEmail.PreviewProps = {
  resetUrl: "https://hacksathon.com/forgot-password",
  recipientEmail: "you@example.com",
} satisfies PasswordChangedEmailProps;

export default PasswordChangedEmail;
