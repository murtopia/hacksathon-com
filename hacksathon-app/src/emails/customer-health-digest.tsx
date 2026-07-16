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

export interface CustomerHealthFlagItem {
  orgName: string;
  eventTitle: string;
  message: string;
  /** Absolute link to the customer's detail page in the owner console. */
  customerUrl: string;
}

export interface CustomerHealthDigestEmailProps {
  items: CustomerHealthFlagItem[];
}

/**
 * Internal morning digest sent to platform admins when the daily
 * customer-health sweep detects NEW red flags (warn severity only).
 * One row per flag, each linking to the customer's detail page. No new
 * flags means no email at all - the cron route skips sending.
 */
export function CustomerHealthDigestEmail({
  items,
}: CustomerHealthDigestEmailProps) {
  return (
    <Html>
      <EmailHead />
      <Preview>
        {`${items.length} customer ${items.length === 1 ? "flag needs" : "flags need"} attention`}
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.internalHeading}>
              {items.length === 1
                ? "A customer may need a hand."
                : `${items.length} customers may need a hand.`}
            </Text>
            <Text style={s.smallParagraph}>
              New roadblock flags from this morning&apos;s health sweep.
              Flags that were already reported are not repeated here.
            </Text>
          </Section>

          {items.map((item, i) => (
            <Section key={`${item.customerUrl}-${i}`} style={s.summarySection}>
              <Text style={s.summaryTitle}>
                {item.orgName} · {item.eventTitle}
              </Text>
              <Text style={s.meta}>{item.message}</Text>
              <Text style={s.smallParagraph}>
                <Link href={item.customerUrl} style={s.link}>
                  Open customer record
                </Link>
              </Text>
            </Section>
          ))}

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              Sent by the daily customer-health sweep. A flag re-alerts only
              if it clears and then comes back.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

CustomerHealthDigestEmail.PreviewProps = {
  items: [
    {
      orgName: "Interrupt Media",
      eventTitle: "Interrupt Media Hacks-a-Thon",
      message: "Only 2 of 8 invites accepted after 3+ days.",
      customerUrl: "https://hacksathon.com/murtopolis/customers/example-id",
    },
  ],
} satisfies CustomerHealthDigestEmailProps;

export default CustomerHealthDigestEmail;
