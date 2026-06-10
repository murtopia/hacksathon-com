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

export interface ParticipantWelcomeEmailProps {
  participantName: string | null;
  orgName: string;
  eventTitle: string;
  eventUrl: string;
  recipientEmail: string;
}

/**
 * Sent the moment a participant becomes an active member - either by
 * accepting an email invite or by being approved from the join-link
 * queue. Single CTA into the event home where the experience lives.
 */
export function ParticipantWelcomeEmail({
  participantName,
  orgName,
  eventTitle,
  eventUrl,
  recipientEmail,
}: ParticipantWelcomeEmailProps) {
  const greetingName = participantName?.trim();
  const orgLabel = orgName?.trim();
  return (
    <Html>
      <Head />
      <Preview>{`You're in - welcome to ${eventTitle}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>
              Welcome{greetingName ? `, ${greetingName}` : ""}.
            </Text>
            <Text style={paragraph}>
              You&apos;re officially in the{" "}
              <strong>
                {orgLabel ? `${orgLabel} ` : ""}Hacks-a-Thon
              </strong>
              . Everything you need lives on your event home: the schedule,
              the IdeaLab, awards, and your team.
            </Text>
            <Text style={paragraph}>
              Head over when you&apos;re ready and take a look around - your
              organizer will fill in the details as the event gets closer.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={eventUrl} style={button}>
              Go to your event
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={eventUrl} style={link}>
                {eventUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This welcome was sent to {recipientEmail} because you joined{" "}
              {eventTitle}.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ParticipantWelcomeEmail.PreviewProps = {
  participantName: "Jordan Lee",
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  eventUrl: "https://hacksathon.com/events/example-id",
  recipientEmail: "you@example.com",
} satisfies ParticipantWelcomeEmailProps;

export default ParticipantWelcomeEmail;

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
