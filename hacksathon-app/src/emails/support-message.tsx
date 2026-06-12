import {
  Body,
  Container,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailHead } from "@/lib/email/email-head";
import * as s from "@/lib/email/email-styles";

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
      <EmailHead />
      <Preview>
        New support message from {senderName} ({topic})
      </Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com · Support</Text>
          </Section>

          <Section>
            <Text style={s.internalHeading}>New support message</Text>
            <Text style={s.meta}>
              <strong>From:</strong> {senderName} ({senderEmail})
            </Text>
            <Text style={s.meta}>
              <strong>Topic:</strong> {topic}
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.messageText}>{message}</Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
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
