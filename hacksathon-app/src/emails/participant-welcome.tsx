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
      <EmailHead />
      <Preview>{`You're in - welcome to ${eventTitle}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>
              Welcome{greetingName ? `, ${greetingName}` : ""}.
            </Text>
            <Text style={s.paragraph}>
              You&apos;re officially in the{" "}
              <strong>
                {orgLabel ? `${orgLabel} ` : ""}Hacks-a-Thon
              </strong>
              . Everything you need lives on your event home: the schedule,
              the IdeaLab, awards, and your team.
            </Text>
            <Text style={s.paragraph}>
              Head over when you&apos;re ready and take a look around - your
              organizer will fill in the details as the event gets closer.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={eventUrl} style={s.button}>
              Go to your event
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={eventUrl} style={s.link}>
                {eventUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This welcome was sent to {recipientEmail} because you joined{" "}
              {eventTitle}.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
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
