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
 * Visual treatment intentionally mirrors `participant-invite.tsx` so
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
      <Head />
      <Preview>{`Confirm your email to join the ${orgLabel} Hacks-a-Thon`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>Confirm your email to join.</Text>
            <Text style={paragraph}>
              You&apos;ve signed up to join the{" "}
              <strong>{orgLabel}</strong> Hacks-a-Thon.
            </Text>
            <Text style={paragraph}>
              Confirm your email below and an organizer will review your
              request. Once they approve, you&apos;ll land on the roster and
              the event home will open up.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={confirmUrl} style={button}>
              Confirm email
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={confirmUrl} style={link}>
                {confirmUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This confirmation was sent to {recipientEmail}. If you
              didn&apos;t request to join, you can ignore this email -
              nothing happens until you confirm.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
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

// ============================================
// Inline styles - match participant-invite.tsx so the two emails feel
// like a single design family in the recipient's inbox.
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
