import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

export interface PurchaseWelcomeEmailProps {
  adminName: string | null;
  orgName: string;
  eventTitle: string;
  seatLimit: number;
  /** Pre-formatted, e.g. "$995" or "Free (promo HACKS2026)". */
  amountLabel: string;
  adminUrl: string;
  recipientEmail: string;
}

/**
 * Sent to the buyer right after a successful Stripe Checkout (paid or
 * $0-promo). Doubles as a purchase confirmation (order summary) and the
 * "welcome / get started" onboarding nudge into the Hacky admin.
 *
 * Paid buyers also receive Stripe's own itemized receipt; this branded
 * email is the only confirmation free/promo buyers get.
 */
export function PurchaseWelcomeEmail({
  adminName,
  orgName,
  eventTitle,
  seatLimit,
  amountLabel,
  adminUrl,
  recipientEmail,
}: PurchaseWelcomeEmailProps) {
  const greetingName = adminName?.trim();
  return (
    <Html>
      <Head />
      <Preview>{`Your ${orgName} Hacks-a-Thon is ready to set up`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={heading}>You&apos;re all set{greetingName ? `, ${greetingName}` : ""}.</Text>
            <Text style={paragraph}>
              Thanks for your purchase. <strong>{eventTitle}</strong> is
              created and ready for you to set up. Your Hacky Helper will walk
              you through every step - identity, schedule, your team, awards,
              and reflections.
            </Text>
          </Section>

          <Section style={summarySection}>
            <Text style={summaryTitle}>Order summary</Text>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Company / team</Column>
              <Column style={summaryValue}>{orgName}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Event</Column>
              <Column style={summaryValue}>{eventTitle}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Participants</Column>
              <Column style={summaryValue}>Up to {seatLimit}</Column>
            </Row>
            <Row style={summaryRow}>
              <Column style={summaryLabel}>Total</Column>
              <Column style={summaryValue}>{amountLabel}</Column>
            </Row>
          </Section>

          <Section style={ctaSection}>
            <Button href={adminUrl} style={button}>
              Open your hacky admin
            </Button>
          </Section>

          <Section>
            <Text style={smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={adminUrl} style={link}>
                {adminUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              This confirmation was sent to {recipientEmail}. Need a hand?
              Just reply to this email.
            </Text>
            <Text style={footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

PurchaseWelcomeEmail.PreviewProps = {
  adminName: "Nick Reese",
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  seatLimit: 25,
  amountLabel: "$995",
  adminUrl: "https://hacksathon.com/seven2/admin",
  recipientEmail: "you@example.com",
} satisfies PurchaseWelcomeEmailProps;

export default PurchaseWelcomeEmail;

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

const summarySection: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: 8,
  margin: "8px 0 4px 0",
  padding: "16px 18px",
};

const summaryTitle: React.CSSProperties = {
  color: "#888888",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.06em",
  margin: "0 0 10px 0",
  textTransform: "uppercase",
};

const summaryRow: React.CSSProperties = {
  marginBottom: 6,
};

const summaryLabel: React.CSSProperties = {
  color: "#666666",
  fontSize: 14,
  lineHeight: 1.5,
  width: "40%",
  verticalAlign: "top",
};

const summaryValue: React.CSSProperties = {
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.5,
  textAlign: "right",
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
