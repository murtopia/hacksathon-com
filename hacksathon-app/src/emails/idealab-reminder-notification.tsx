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

export interface IdealabReminderNotificationEmailProps {
  orgName: string | null;
  eventTitle: string;
  idealabUrl: string;
  recipientEmail: string;
}

/**
 * Sent when an organizer clicks "Remind IdeaLab" before opening voting.
 * Targets participants whose idea isn't demo-ready yet, nudging them to
 * finish so the IdeaLab is complete when the Hacky Awards voting opens.
 */
export function IdealabReminderNotificationEmail({
  orgName,
  eventTitle,
  idealabUrl,
  recipientEmail,
}: IdealabReminderNotificationEmailProps) {
  const orgLabel = orgName?.trim();
  return (
    <Html>
      <EmailHead />
      <Preview>{`Finish your IdeaLab before voting for ${eventTitle}`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>Finish your IdeaLab.</Text>
            <Text style={s.paragraph}>
              The team behind the{" "}
              <strong>{orgLabel ? `${orgLabel} ` : ""}Hacks-a-Thon</strong> is
              about to open voting for <strong>{eventTitle}</strong>. Before it
              does, take a few minutes to get your IdeaLab demo-ready so people
              can vote on your work.
            </Text>
            <Text style={s.paragraph}>
              Demo-ready means a clear title and pitch, your live demo URL, a
              final screenshot, and your idea marked <strong>Completed</strong>.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={idealabUrl} style={s.button}>
              Finish your IdeaLab
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={idealabUrl} style={s.link}>
                {idealabUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              This nudge was sent to {recipientEmail} because your IdeaLab for{" "}
              {eventTitle} isn&apos;t marked complete yet.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

IdealabReminderNotificationEmail.PreviewProps = {
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  idealabUrl: "https://hacksathon.com/seven2/idealab",
  recipientEmail: "you@example.com",
} satisfies IdealabReminderNotificationEmailProps;

export default IdealabReminderNotificationEmail;
