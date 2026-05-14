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
      <Head />
      <Preview>{`${inviter} invited you to ${eventTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>You&apos;re in.</Text>
            <Text style={paragraph}>
              {inviter} invited you to take part in{" "}
              <strong>{eventTitle}</strong>
              {orgName ? <> at {orgName}</> : null}.
            </Text>
            <Text style={paragraph}>
              Click the button below to set your password and get started.
              You&apos;ll land on your event home with everything queued up.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={acceptUrl} style={button}>
              Accept your invite
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={acceptUrl} style={link}>
                {acceptUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This invite was sent to {recipientEmail}. If you weren&apos;t
              expecting it, you can ignore this email — nothing happens until
              you accept.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
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

// ============================================
// Inline styles (React Email best practice)
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
