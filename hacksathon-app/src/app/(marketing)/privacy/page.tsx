import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Terms",
  description:
    "How Hacksathon.com, operated by Murtopolis, LLC, handles your data, plus the terms that govern your use of the platform.",
  openGraph: {
    title: "Hacksathon.com - Privacy & Terms",
    description:
      "How Hacksathon.com, operated by Murtopolis, LLC, handles your data, plus the terms that govern your use of the platform.",
    type: "website",
  },
};

const CONTACT_EMAIL = "support@hacksathon.com";

// Plain, human-readable date for the "Last updated" line. Bump when the
// substance of this page changes.
const LAST_UPDATED = "June 6, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h1 className="text-balance text-4xl tracking-tight sm:text-5xl">
            Privacy &amp; Terms
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Hacksathon.com is operated by Murtopolis, LLC (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;the platform&rdquo;). This page explains
            what data we collect and how we handle it, and sets out the terms
            that govern your use of the service. This is written in plain
            English and is not a substitute for formal legal advice.
          </p>
        </div>
      </section>

      <section className="border-t py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] space-y-10 px-4">
          <div>
            <h2 className="text-2xl tracking-tight sm:text-3xl">
              Privacy Policy
            </h2>
            <p className="mt-3 text-muted-foreground">
              We collect only what we need to run your Hacks-a-Thon and improve
              the platform.
            </p>
          </div>

          <LegalBlock title="Information we collect">
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">Account details</span> - your
                name, email address, organization, and authentication
                credentials when you sign up or are invited to an event.
              </li>
              <li>
                <span className="text-foreground">Event content</span> - the
                ideas, project details, screenshots, reflections, votes, and
                awards that you and your team create inside the platform.
              </li>
              <li>
                <span className="text-foreground">Usage data</span> - basic
                analytics about how the product is used (pages visited, actions
                taken, device and browser information) so we can understand and
                improve the experience.
              </li>
              <li>
                <span className="text-foreground">Payment information</span> -
                when you purchase an event, billing is handled by our payment
                processor; we do not store your full card details.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="How we use your information">
            <p className="mt-2 text-muted-foreground">
              We use your information to operate and secure the platform,
              deliver the features you sign up for, send transactional and
              service emails (such as invitations and notifications), process
              payments, provide support, and improve the product. We do not sell
              your personal information.
            </p>
          </LegalBlock>

          <LegalBlock title="Service providers we rely on">
            <p className="mt-2 text-muted-foreground">
              We use a small set of trusted third-party providers to run the
              platform, and we share only the data necessary for each to do its
              job:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">Supabase</span> - database,
                authentication, and file storage.
              </li>
              <li>
                <span className="text-foreground">Vercel</span> - application
                hosting and delivery.
              </li>
              <li>
                <span className="text-foreground">Resend</span> - sending
                transactional and notification emails.
              </li>
              <li>
                <span className="text-foreground">Stripe</span> - payment
                processing.
              </li>
              <li>
                <span className="text-foreground">PostHog</span> - product
                analytics.
              </li>
              <li>
                <span className="text-foreground">AI build tools</span> - the
                tools your team chooses to build with (for example Lovable,
                Cursor, v0, Replit, or Google AI Studio) are independent
                third-party products governed by their own privacy policies and
                terms.
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Data retention">
            <p className="mt-2 text-muted-foreground">
              We retain your account and event data for as long as your account
              or event is active, and as needed to provide the service, comply
              with legal obligations, resolve disputes, and enforce our
              agreements. You can request deletion of your data by contacting us
              at the address below.
            </p>
          </LegalBlock>

          <LegalBlock title="Your choices and rights">
            <p className="mt-2 text-muted-foreground">
              Depending on where you live, you may have the right to access,
              correct, export, or delete your personal information, and to object
              to or restrict certain processing. To exercise any of these
              rights, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we&apos;ll respond as quickly as we can.
            </p>
          </LegalBlock>

          <LegalBlock title="Texas residents">
            <p className="mt-2 text-muted-foreground">
              Murtopolis, LLC is a Texas company. Under the Texas Data Privacy
              and Security Act (TDPSA), Texas residents have the right to confirm
              whether we process their personal data and to access it, to
              correct inaccuracies, to delete it, to obtain a portable copy, and
              to opt out of the sale of personal data, targeted advertising, and
              certain profiling.
            </p>
            <p className="mt-2 text-muted-foreground">
              We do not sell your personal data, and we do not use it for
              targeted advertising or for profiling that produces legal or
              similarly significant effects. To exercise your rights, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . If we decline your request, you may appeal by replying to our
              decision; if your appeal is denied, you may contact the Texas
              Attorney General at{" "}
              <a
                href="https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                texasattorneygeneral.gov
              </a>
              .
            </p>
          </LegalBlock>
        </div>
      </section>

      <section
        id="terms"
        className="scroll-mt-24 border-t bg-muted/30 py-12 sm:py-16"
      >
        <div className="mx-auto w-full max-w-[var(--container-narrow)] space-y-10 px-4">
          <div>
            <h2 className="text-2xl tracking-tight sm:text-3xl">
              Terms of Use
            </h2>
            <p className="mt-3 text-muted-foreground">
              By using Hacksathon.com you agree to these terms.
            </p>
          </div>

          <LegalBlock title="Acceptance of terms">
            <p className="mt-2 text-muted-foreground">
              By accessing or using the platform, you agree to be bound by these
              terms. If you are using the platform on behalf of an organization,
              you represent that you have authority to bind that organization to
              these terms.
            </p>
          </LegalBlock>

          <LegalBlock title="The service">
            <p className="mt-2 text-muted-foreground">
              Hacksathon.com is a platform for planning and running structured,
              AI-assisted Hacks-a-Thons - from ideation through showcase,
              awards, and reflections. We may update, improve, or change
              features over time.
            </p>
          </LegalBlock>

          <LegalBlock title="Accounts and eligibility">
            <p className="mt-2 text-muted-foreground">
              You are responsible for the activity that happens under your
              account and for keeping your login credentials secure. You must
              provide accurate information and be old enough to form a binding
              contract in your jurisdiction.
            </p>
          </LegalBlock>

          <LegalBlock title="Acceptable use">
            <p className="mt-2 text-muted-foreground">
              You agree not to misuse the platform - including by attempting to
              access it without authorization, disrupting its operation,
              uploading unlawful or infringing content, or using it to harm
              others. We may suspend or terminate accounts that violate these
              terms.
            </p>
          </LegalBlock>

          <LegalBlock title="Payment and billing">
            <p className="mt-2 text-muted-foreground">
              Events are purchased up front based on the number of participants
              you invite. Prices and what&apos;s included are described on our{" "}
              <a
                href="/pricing"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                pricing page
              </a>
              . Payments are processed by our payment provider and are subject to
              their terms.
            </p>
          </LegalBlock>

          <LegalBlock title="Your content">
            <p className="mt-2 text-muted-foreground">
              You and your team keep ownership of the ideas, projects, and other
              content you create using the platform. You grant us a limited
              license to host, store, and display that content solely to operate
              the service for you (for example, rendering your event pages and
              public showcase). We own the platform itself and all related
              software, design, and branding.
            </p>
          </LegalBlock>

          <LegalBlock title="Third-party tools">
            <p className="mt-2 text-muted-foreground">
              The AI build tools and other third-party services your team uses
              are provided by their respective owners under their own terms. We
              are not responsible for those products, and your use of them is at
              your own discretion and risk.
            </p>
          </LegalBlock>

          <LegalBlock title="Disclaimers">
            <p className="mt-2 text-muted-foreground">
              The platform is provided &ldquo;as is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind, whether express
              or implied, including fitness for a particular purpose. We do not
              guarantee that the service will be uninterrupted or error-free.
            </p>
          </LegalBlock>

          <LegalBlock title="Limitation of liability">
            <p className="mt-2 text-muted-foreground">
              To the fullest extent permitted by law, Murtopolis, LLC will not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, or for any loss of data, revenue, or profits
              arising from your use of the platform.
            </p>
          </LegalBlock>

          <LegalBlock title="Changes to these terms">
            <p className="mt-2 text-muted-foreground">
              We may update these terms from time to time. When we make material
              changes, we&apos;ll update the &ldquo;Last updated&rdquo; date at
              the top of this page. Your continued use of the platform after
              changes take effect means you accept the revised terms.
            </p>
          </LegalBlock>

          <LegalBlock title="Governing law">
            <p className="mt-2 text-muted-foreground">
              These terms are governed by the laws of the State of Texas and
              applicable United States federal law, without regard to
              conflict-of-law principles. You agree that any dispute arising out
              of or relating to these terms or the platform will be subject to
              the exclusive jurisdiction of the state and federal courts located
              in Texas.
            </p>
          </LegalBlock>

          <LegalBlock title="Contact us">
            <p className="mt-2 text-muted-foreground">
              Questions about your privacy or these terms? Email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </LegalBlock>
        </div>
      </section>
    </div>
  );
}

function LegalBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-lg">{title}</h3>
      {children}
    </div>
  );
}
