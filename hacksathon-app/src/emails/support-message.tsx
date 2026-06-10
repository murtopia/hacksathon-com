import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface SupportMessageEmailProps {
  senderName: string;
  senderEmail: string;
  topic: string;
  message: string;
}

/**
 * Internal notification email sent to the support inbox when someone
 * submits the /support form. Reply-to is set to the sender's address by
 * the API route, so replying from the inbox goes straight back to them.
 */
export function SupportMessageEmail({
  senderName,
  senderEmail,
  topic,
  message,
}: SupportMessageEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New support message from {senderName} ({topic})
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com · Support</Text>
          </Section>

          <Section>
            <Text style={heading}>New support message</Text>
            <Text style={meta}>
              <strong>From:</strong> {senderName} ({senderEmail})
            </Text>
            <Text style={meta}>
              <strong>Topic:</strong> {topic}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Reply directly to this email to respond to {senderName} - the
              reply-to is set to their address ({senderEmail}).
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

SupportMessageEmail.PreviewProps = {
  senderName: "Jane Doe",
  senderEmail: "jane@example.com",
  topic: "Running an event",
  message:
    "Hi! We're a 30-person marketing team and want to run a Hacks-a-Thon next quarter. How do we get started?",
} satisfies SupportMessageEmailProps;

export default SupportMessageEmail;

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
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1.25,
  margin: "0 0 16px 0",
};

const meta: React.CSSProperties = {
  color: "#2a2a2a",
  fontSize: 15,
  lineHeight: 1.5,
  margin: "0 0 6px 0",
};

const messageText: React.CSSProperties = {
  color: "#2a2a2a",
  fontSize: 16,
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-wrap",
};

const hr: React.CSSProperties = {
  borderColor: "#ececec",
  margin: "20px 0",
};

const footer: React.CSSProperties = {
  color: "#888888",
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
};
