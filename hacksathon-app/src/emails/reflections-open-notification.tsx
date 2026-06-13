import {
  Body,
  Button,
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
      <EmailHead />
      <Preview>{`Reflections are open for ${eventTitle}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>Reflections are open.</Text>
            <Text style={s.paragraph}>
              The team behind the{" "}
              <strong>{orgLabel ? `${orgLabel} ` : ""}Hacks-a-Thon</strong> has
              opened reflections for <strong>{eventTitle}</strong>. Take a few
              minutes to look back on the experience - what surprised you, what
              you&apos;re proud of, what challenged you, and what you&apos;ll
              carry forward.
            </Text>
            <Text style={s.paragraph}>
              It&apos;s a short set of questions about how the event went, not a
              project write-up. Your answers help shape the event recap - and
              make great material for celebrating the work afterward.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={reflectionsUrl} style={s.button}>
              Share your reflection
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={reflectionsUrl} style={s.link}>
                {reflectionsUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This note was sent to {recipientEmail} because you&apos;re part of{" "}
              {eventTitle}.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
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
