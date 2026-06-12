import {
  Body,
  Button,
  Column,
  Container,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailHead } from "@/lib/email/email-head";
import * as s from "@/lib/email/email-styles";

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
      <EmailHead />
      <Preview>{`Your ${orgName} Hacks-a-Thon is ready to set up`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>You&apos;re all set{greetingName ? `, ${greetingName}` : ""}.</Text>
            <Text style={s.paragraph}>
              Thanks for your purchase. <strong>{eventTitle}</strong> is
              created and ready for you to set up. Your Hacky Helper will walk
              you through every step - identity, schedule, your team, awards,
              and reflections.
            </Text>
          </Section>

          <Section style={s.summarySection}>
            <Text style={s.summaryTitle}>Order summary</Text>
            <Row style={s.summaryRow}>
              <Column style={s.summaryLabel}>Company / team</Column>
              <Column style={s.summaryValue}>{orgName}</Column>
            </Row>
            <Row style={s.summaryRow}>
              <Column style={s.summaryLabel}>Event</Column>
              <Column style={s.summaryValue}>{eventTitle}</Column>
            </Row>
            <Row style={s.summaryRow}>
              <Column style={s.summaryLabel}>Participants</Column>
              <Column style={s.summaryValue}>Up to {seatLimit}</Column>
            </Row>
            <Row style={s.summaryRow}>
              <Column style={s.summaryLabel}>Total</Column>
              <Column style={s.summaryValue}>{amountLabel}</Column>
            </Row>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={adminUrl} style={s.button}>
              Open your hacky admin
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={adminUrl} style={s.link}>
                {adminUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This confirmation was sent to {recipientEmail}. Need a hand?
              Just reply to this email.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
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
