import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

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
 * Visual treatment mirrors `participant-invite.tsx` and
 * `join-link-confirmation.tsx` so all three transactional emails read
 * as a single design family in the recipient's inbox.
 */
export function PasswordChangedEmail({
  resetUrl,
  recipientEmail,
}: PasswordChangedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Hacksathon.com password was changed</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>Your password was changed.</Text>
            <Text style={paragraph}>
              The password on your Hacksathon.com account was updated just
              now. We&apos;ve also signed out any other devices where you
              were logged in.
            </Text>
            <Text style={paragraph}>
              If this wasn&apos;t you, reset your password immediately - your
              account may be at risk.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={resetUrl} style={button}>
              Reset your password
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={resetUrl} style={link}>
                {resetUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This notification was sent to {recipientEmail}. If you made
              this change, no further action is needed.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
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

// ============================================
// Inline styles - match the participant-invite + join-confirmation
// brand so all transactional emails feel related in the inbox.
// ============================================
const body: React.CSSProperties = {
  backgroundColor: "#f6f6f4",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  margin: "32px auto",
  maxWidth: 520,
  padding: "32px 28px",
};

const brandSection: React.CSSProperties = {
  paddingBottom: 16,
};

const brandText: React.CSSProperties = {
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: 0,
  textTransform: "uppercase",
};

const heading: React.CSSProperties = {
  color: "#0a0a0a",
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.2,
  margin: "0 0 12px 0",
};

const paragraph: React.CSSProperties = {
  color: "#2a2a2a",
  fontSize: 16,
  lineHeight: 1.55,
  margin: "0 0 12px 0",
};

const ctaSection: React.CSSProperties = {
  margin: "20px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 16,
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

const smallParagraph: React.CSSProperties = {
  color: "#666666",
  fontSize: 13,
  lineHeight: 1.5,
  margin: "0 0 12px 0",
  wordBreak: "break-all",
};

const link: React.CSSProperties = {
  color: "#0a0a0a",
  textDecoration: "underline",
};

const hr: React.CSSProperties = {
  borderColor: "#ececec",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#888888",
  fontSize: 12,
  lineHeight: 1.5,
  margin: "0 0 6px 0",
};
