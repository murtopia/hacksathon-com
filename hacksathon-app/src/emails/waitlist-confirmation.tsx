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

export interface WaitlistConfirmationEmailProps {
  recipientName: string;
  recipientEmail: string;
}

/**
 * Plain-text-friendly confirmation email sent after a waitlist signup.
 *
 * Deliberately quiet copy: no CTAs, no marketing chrome - just an
 * acknowledgement that the signup landed, so the user knows we have
 * their address and what happens next. Shares the visual system with
 * participant-invite.tsx so brand recognition carries across both touchpoints.
 */
export function WaitlistConfirmationEmail({
  recipientName,
  recipientEmail,
}: WaitlistConfirmationEmailProps) {
  const firstName = recipientName.split(/\s+/)[0] || recipientName;

  return (
    <Html>
      <EmailHead />
      <Preview>You&apos;re on the Hacksathon.com waitlist.</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Section style={s.brandSection}>
            <Text style={s.brandText}>Hacksathon.com</Text>
          </Section>

          <Section>
            <Text style={s.heading}>You&apos;re on the list, {firstName}.</Text>
            <Text style={s.paragraph}>
              Thanks for raising your hand - we&apos;ll be in touch when
              Hacksathon.com is ready for your team to run its first
              Hacks-a-Thon.
            </Text>
            <Text style={s.paragraph}>
              In the meantime: if you want a flavor of what this looks like in
              practice, the Seven2 case study lives at{" "}
              <Link href="https://hacksathon.com/case-study" style={s.link}>
                hacksathon.com/case-study
              </Link>
              .
            </Text>
            <Text style={s.paragraph}>
              Reply to this email if you have questions or want to chat about
              what you&apos;re hoping to run.
            </Text>
          </Section>

          <Hr style={s.hr} />

          <Section>
            <Text style={s.footer}>
              You&apos;re receiving this because {recipientEmail} signed up at
              hacksathon.com/waitlist. If that wasn&apos;t you, you can ignore
              this email and we&apos;ll forget the address.
            </Text>
            <Text style={s.footer}>Hacksathon.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

WaitlistConfirmationEmail.PreviewProps = {
  recipientName: "Nick Reese",
  recipientEmail: "you@example.com",
} satisfies WaitlistConfirmationEmailProps;

export default WaitlistConfirmationEmail;
