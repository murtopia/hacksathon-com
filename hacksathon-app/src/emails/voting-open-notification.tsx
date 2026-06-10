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

export interface VotingOpenNotificationEmailProps {
  orgName: string | null;
  eventTitle: string;
  votingUrl: string;
  recipientEmail: string;
}

/**
 * Sent when an organizer opens Hacky Awards voting and clicks "Notify
 * team". A nudge for participants to go cast their votes in Block +01.
 */
export function VotingOpenNotificationEmail({
  orgName,
  eventTitle,
  votingUrl,
  recipientEmail,
}: VotingOpenNotificationEmailProps) {
  const orgLabel = orgName?.trim();
  return (
    <Html>
      <Head />
      <Preview>{`Voting is open for the ${eventTitle} Hacky Awards`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>Voting is open.</Text>
            <Text style={paragraph}>
              The <strong>Hacky Awards</strong> for{" "}
              <strong>
                {orgLabel ? `${orgLabel} ` : ""}
                {eventTitle}
              </strong>{" "}
              are live. Head over to review the projects and cast your votes
              before voting closes.
            </Text>
            <Text style={paragraph}>
              Every vote counts toward crowning the winners - don&apos;t miss
              your chance to weigh in.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href={votingUrl} style={button}>
              Cast your votes
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={votingUrl} style={link}>
                {votingUrl}
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

VotingOpenNotificationEmail.PreviewProps = {
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  votingUrl: "https://hacksathon.com/seven2/awards",
  recipientEmail: "you@example.com",
} satisfies VotingOpenNotificationEmailProps;

export default VotingOpenNotificationEmail;

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
