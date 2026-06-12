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
      <EmailHead />
      <Preview>{`Voting is open for the ${eventTitle} Hacky Awards`}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>Voting is open.</Text>
            <Text style={s.paragraph}>
              The <strong>Hacky Awards</strong> for{" "}
              <strong>
                {orgLabel ? `${orgLabel} ` : ""}
                {eventTitle}
              </strong>{" "}
              are live. Head over to review the projects and cast your votes
              before voting closes.
            </Text>
            <Text style={s.paragraph}>
              Every vote counts toward crowning the winners - don&apos;t miss
              your chance to weigh in.
            </Text>
          </Section>

          <Section style={s.ctaSection}>
            <Button href={votingUrl} style={s.button}>
              Cast your votes
            </Button>
          </Section>

          <Section>
            <Text style={s.smallParagraph}>
              Or paste this link into your browser:
              <br />
              <Link href={votingUrl} style={s.link}>
                {votingUrl}
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

VotingOpenNotificationEmail.PreviewProps = {
  orgName: "Seven2",
  eventTitle: "Seven2 Hacks-a-Thon",
  votingUrl: "https://hacksathon.com/seven2/awards",
  recipientEmail: "you@example.com",
} satisfies VotingOpenNotificationEmailProps;

export default VotingOpenNotificationEmail;
