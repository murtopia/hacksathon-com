import {
  Body,
  Container,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailHead } from "@/lib/email/email-head";
import * as s from "@/lib/email/email-styles";

export interface PurchaseNotificationEmailProps {
  buyerName: string | null;
  buyerEmail: string;
  orgName: string;
  eventTitle: string;
  seatLimit: number;
  amountLabel: string;
  discountCode: string | null;
  slug: string;
  adminUrl: string;
}

/**
 * Internal heads-up email sent to the operator whenever a purchase
 * completes and a new event (and its owner/admin) is provisioned. Fired
 * once per event from `sendPurchaseWelcomeEmail`. Reply-to is set to the
 * buyer's address by the sender, so replying reaches the customer.
 */
export function PurchaseNotificationEmail({
  buyerName,
  buyerEmail,
  orgName,
  eventTitle,
  seatLimit,
  amountLabel,
  discountCode,
  slug,
  adminUrl,
}: PurchaseNotificationEmailProps) {
  const buyerLabel = buyerName ? `${buyerName} (${buyerEmail})` : buyerEmail;

  return (
    <Html>
      <EmailHead />
      <Preview>
        New purchase: {orgName} - {amountLabel}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com · New purchase</Text>
          </Section>

          <Section>
            <Text style={s.internalHeading}>New Hacks-a-Thon purchased</Text>
            <Text style={s.meta}>
              <strong>Buyer:</strong> {buyerLabel}
            </Text>
            <Text style={s.meta}>
              <strong>Company / team:</strong> {orgName}
            </Text>
            <Text style={s.meta}>
              <strong>Event title:</strong> {eventTitle}
            </Text>
            <Text style={s.meta}>
              <strong>Seats:</strong> up to {seatLimit}
            </Text>
            <Text style={s.meta}>
              <strong>Amount:</strong> {amountLabel}
            </Text>
            {discountCode ? (
              <Text style={s.meta}>
                <strong>Promo code:</strong> {discountCode}
              </Text>
            ) : null}
            <Text style={s.meta}>
              <strong>Slug:</strong> /{slug}
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.meta}>
              <Link href={adminUrl} style={s.linkText}>
                Open the event admin
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              Reply directly to this email to reach {buyerLabel} - the reply-to
              is set to their address.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

PurchaseNotificationEmail.PreviewProps = {
  buyerName: "Jane Doe",
  buyerEmail: "jane@example.com",
  orgName: "Acme Co",
  eventTitle: "Acme Co Hacks-a-Thon",
  seatLimit: 25,
  amountLabel: "$995.00",
  discountCode: null,
  slug: "acme-co",
  adminUrl: "https://hacksathon.com/acme-co/admin",
} satisfies PurchaseNotificationEmailProps;

export default PurchaseNotificationEmail;
