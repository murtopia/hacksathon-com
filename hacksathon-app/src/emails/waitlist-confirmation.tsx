import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface WaitlistConfirmationEmailProps {
  recipientName: string;
  recipientEmail: string;
}

/**
 * Plain-text-friendly confirmation email sent after a waitlist signup.
 *
 * Deliberately quiet copy: no CTAs, no marketing chrome - just an
 * acknowledgement that the signup landed, so the user knows we have
 * their address and what happens next. Shares the visual system with
 * `[src/emails/participant-invite.tsx](hacksathon-app/src/emails/participant-invite.tsx)`
 * so brand recognition carries across both touchpoints.
 */
export function WaitlistConfirmationEmail({
  recipientName,
  recipientEmail,
}: WaitlistConfirmationEmailProps) {
  const firstName = recipientName.split(/\s+/)[0] || recipientName;

  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the Hacksathon.com waitlist.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>You&apos;re on the list, {firstName}.</Text>
            <Text style={paragraph}>
              Thanks for raising your hand - we&apos;ll be in touch when
              Hacksathon.com is ready for your team to run its first
              Hacks-a-Thon.
            </Text>
            <Text style={paragraph}>
              In the meantime: if you want a flavor of what this looks like in
              practice, the Seven2 case study lives at{" "}
              <Link href="https://hacksathon.com/case-study" style={link}>
                hacksathon.com/case-study
              </Link>
              .
            </Text>
            <Text style={paragraph}>
              Reply to this email if you have questions or want to chat about
              what you&apos;re hoping to run.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              You&apos;re receiving this because {recipientEmail} signed up at
              hacksathon.com/waitlist. If that wasn&apos;t you, you can ignore
              this email and we&apos;ll forget the address.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

WaitlistConfirmationEmail.PreviewProps = {
  recipientName: "Nick Reese",
  recipientEmail: "you@example.com",
} satisfies WaitlistConfirmationEmailProps;

export default WaitlistConfirmationEmail;

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
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.25,
  margin: "0 0 16px 0",
};

const paragraph: React.CSSProperties = {
  color: "#2a2a2a",
  fontSize: 16,
  lineHeight: 1.55,
  margin: "0 0 14px 0",
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
