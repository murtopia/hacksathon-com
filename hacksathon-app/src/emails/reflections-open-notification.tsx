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

export interface ReflectionsOpenNotificationEmailProps {
  orgName: string | null;
  eventTitle: string;
  reflectionsUrl: string;
  recipientEmail: string;
}

/**
 * Sent when an organizer opens reflections and clicks "Notify team".
 * A nudge for participants to go share their takes inside Block +02.
 */
export function ReflectionsOpenNotificationEmail({
  orgName,
  eventTitle,
  reflectionsUrl,
  recipientEmail,
}: ReflectionsOpenNotificationEmailProps) {
  const orgLabel = orgName?.trim();
  return (
    <Html>
      <Head />
      <Preview>{`Reflections are open for ${eventTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>Reflections are open.</Text>
            <Text style={paragraph}>
              The team behind the{" "}
              <strong>{orgLabel ? `${orgLabel} ` : ""}Hacks-a-Thon</strong> has
              opened reflections for <strong>{eventTitle}</strong>. Take a few
              minutes to share what you built, what you learned, and what stood
              out.
            </Text>
            <Text style={paragraph}>
              Your answers help shape the event recap - and make great material
              for celebrating the work afterward.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={reflectionsUrl} style={button}>
              Share your reflection
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={reflectionsUrl} style={link}>
                {reflectionsUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This note was sent to {recipientEmail} because you&apos;re part of{" "}
              {eventTitle}.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ReflectionsOpenNotificationEmail.PreviewProps = {
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  reflectionsUrl: "https://hacksathon.com/seven2/reflections",
  recipientEmail: "you@example.com",
} satisfies ReflectionsOpenNotificationEmailProps;

export default ReflectionsOpenNotificationEmail;

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
