# Email Templates

All outbound email for Hacksathon.com is sent via Resend using React Email templates. This document is the canonical reference for all 10 templates: what they do, how they are triggered, what props they accept, where design is consistent, and where it drifts.

> **Two email systems.** This doc covers the **10 app-sent templates** in `src/emails/` (React Email components rendered by the Resend SDK at runtime; they share `src/lib/email/email-styles.ts` and `src/lib/email/email-head.tsx`, and ship automatically with each deploy). Separately, **4 Supabase Auth templates** (confirm signup, reset password, magic link, change email) are hand-maintained HTML in the Supabase dashboard and routed through Resend via SMTP. Those mirror the same design tokens but must be updated by hand — their canonical copies live in `hacksathon-infra-notes.md`.

---

## Quick Reference

### Customer-facing (8)

| Template file | Purpose | Audience | CTA | Props |
|---|---|---|---|---|
| `waitlist-confirmation.tsx` | Confirms waitlist signup | Prospective buyer | None (reply-to only) | `recipientName`, `recipientEmail` |
| `participant-invite.tsx` | Organizer invite to a Hacks-a-Thon | New participant | "Accept your invite" | `acceptUrl`, `eventTitle`, `orgName`, `inviterName`, `recipientEmail` |
| `join-link-confirmation.tsx` | Email confirm for join-link self-signups | Self-signup participant | "Confirm email" | `confirmUrl`, `eventTitle`, `orgName`, `recipientEmail` |
| `participant-welcome.tsx` | Welcome on becoming an active member | Newly approved participant | "Go to your event" | `participantName`, `orgName`, `eventTitle`, `eventUrl`, `recipientEmail` |
| `purchase-welcome.tsx` | Purchase confirmation + onboarding nudge | Buyer / event admin | "Open your hacky admin" | `adminName`, `orgName`, `eventTitle`, `seatLimit`, `amountLabel`, `adminUrl`, `recipientEmail` |
| `password-changed-notification.tsx` | Security notice after password change | Account holder | "Reset your password" | `resetUrl`, `recipientEmail` |
| `voting-open-notification.tsx` | Bulk nudge when voting opens | All active participants | "Cast your votes" | `orgName`, `eventTitle`, `votingUrl`, `recipientEmail` |
| `reflections-open-notification.tsx` | Bulk nudge when reflections open | All active participants | "Share your reflection" | `orgName`, `eventTitle`, `reflectionsUrl`, `recipientEmail` |

### Internal / operator-facing (2)

| Template file | Purpose | Recipient | Notes |
|---|---|---|---|
| `purchase-notification.tsx` | Operator heads-up on each new purchase | `INTERNAL_NOTIFY_EMAIL` (default: `nick@seven2.com`) | Reply-to is set to buyer; no customer-visible design polish required |
| `support-message.tsx` | Routes `/support` form submissions to the support inbox | `SUPPORT_INBOX` (hardcoded in the API route) | Plain metadata + verbatim message body; reply-to is set to sender |

---

## Sending Infrastructure

```
src/emails/*.tsx
  React Email components (templates)
  Rendered server-side by @react-email/render
       |
       v
src/lib/email/resend.ts
  sendEmail() - core helper
  Wraps Resend SDK; fail-soft when RESEND_API_KEY unset
       |
       +-- Direct calls (most routes)
       |
       +-- sendParticipantWelcomeEmail()   src/lib/email/send-participant-welcome.ts
       |     Resolves event URL, wraps sendEmail
       |
       +-- sendPurchaseWelcomeEmail()      src/lib/email/send-purchase-welcome.ts
       |     Resolves user email + name from Supabase, formats amount,
       |     sends purchase-welcome to buyer + purchase-notification to operator
       |
       +-- notifyMembersOpen()             src/lib/email/notify-members.ts
             Queries active org members, sends bulk with concurrency pool of 4
```

### Trigger sites

| Template | Trigger |
|---|---|
| `waitlist-confirmation` | `POST /api/waitlist` |
| `participant-invite` | `POST /api/events/[id]/invites` and `/invites/[inviteId]/resend` |
| `join-link-confirmation` | `POST /api/signup-via-join` |
| `participant-welcome` | `POST /api/accept-invite` and `/events/[id]/members/[memberId]/approve` |
| `purchase-welcome` + `purchase-notification` | `POST /api/stripe/webhook` (primary) and `checkout/success/page.tsx` (fallback) |
| `password-changed-notification` | `POST /api/settings/password` |
| `support-message` | `POST /api/support` |
| `voting-open-notification` + `reflections-open-notification` | `POST /api/events/[id]/admin/notify` via `NotifyTeamButton` |

### Fail-soft contract

`sendEmail()` returns `{ ok: true, skipped: true }` when `RESEND_API_KEY` is not set. Callers must never let an email failure block the primary operation (DB write, API response, Stripe webhook 200). All higher-level senders (`sendParticipantWelcomeEmail`, `sendPurchaseWelcomeEmail`) wrap in try/catch and swallow errors after logging.

---

## Design System

All 10 templates share a common design language aligned to the website's design system (`hacksathon-design-system.md`). Do not declare style objects locally in templates - import them from `src/lib/email/email-styles.ts`.

### Shared modules

| File | Purpose |
|---|---|
| `src/lib/email/email-head.tsx` | `<EmailHead />` component - drop-in replacement for `<Head />`. Loads EB Garamond, Inter, and JetBrains Mono via `@font-face` using the `<Font>` component from `@react-email/components`. |
| `src/lib/email/email-styles.ts` | All canonical style objects as named exports. Import as `import * as s from "@/lib/email/email-styles"`. |

### Layout

```
body background:      #F5F5F5  (--gray-50)
container background: #FFFFFF
container border-radius: 12
container max-width: 520px
container padding: 32px 28px
container margin: 32px auto
```

### Typography

Fonts are loaded via `<EmailHead />`. Clients that don't support web fonts fall back to Georgia / Verdana / monospace.

```
brand bar:      JetBrains Mono / 13px / weight 600 / uppercase / letterSpacing 0.1em / color #1A1A1A
heading:        EB Garamond / 28px / weight 400 / lineHeight 1.1 / letterSpacing -0.02em / color #1A1A1A / margin 0 0 12px 0
paragraph:      Inter / 16px / weight 400 / lineHeight 1.55 / color #1A1A1A / margin 0 0 12px 0
smallParagraph: Inter / 13px / color #525252 / lineHeight 1.5 / wordBreak break-all
footer:         Inter / 12px / color #A3A3A3 / lineHeight 1.5

Internal templates only:
internalHeading: Inter / 22px / weight 600 / lineHeight 1.25 / color #1A1A1A
meta:            Inter / 15px / lineHeight 1.5 / color #1A1A1A / margin 0 0 6px 0
```

### Brand bar

The brand bar is the first element inside every container. Text is always `Hacksathon.com` (rendered uppercase by `textTransform: uppercase`) - except internal templates where a context suffix is appended after a spaced centered dot:

- Customer-facing: `Hacksathon.com`
- `purchase-notification.tsx`: `Hacksathon.com · New purchase`
- `support-message.tsx`: `Hacksathon.com · Support`

### Button

Solid fill is correct for email (no shared CSS in inboxes). Do not convert to outline/pill.

```
backgroundColor: #1A1A1A  (--black)
color: #FFFFFF
borderRadius: 8
fontSize: 16 / fontWeight: 600 / fontFamily: Inter
padding: 12px 22px
display: inline-block
textDecoration: none
```

### Divider + link

```
hr borderColor: #E8E8E8  (--border-color)
link color: #1A1A1A / textDecoration: underline
linkText (inline bold links): #1A1A1A / fontWeight 600 / textDecoration: underline
```

---

## Anatomy of a Customer-Facing Template

Every customer-facing template follows this section order:

1. Brand bar (`brandSection` + `brandText`)
2. Heading + body copy (`heading` + one or two `paragraph` blocks)
3. CTA button inside `ctaSection` (if applicable)
4. Plain-text link fallback (`smallParagraph` with `Link`) - for all templates with a button
5. `Hr`
6. Footer: context sentence (`footer`) + `Hacksathon.com` attribution (`footer`)

Templates with no CTA (`waitlist-confirmation`) skip items 3 and 4, and go straight from copy to `Hr`.

---

## Previously Flagged Inconsistencies (resolved)

All inconsistencies from the initial audit have been resolved by the shared module refactor. For reference:

- `waitlist-confirmation` heading was 24px (now 28px via shared module)
- `waitlist-confirmation` paragraph margin was 14px (now 12px via shared module)
- Internal templates used local `meta` style (now exported from `email-styles.ts` as `s.internalHeading` and `s.meta`)
- All templates duplicated style objects locally (now all import from `email-styles.ts`)
- Fonts were system sans-serif only (now EB Garamond / Inter / JetBrains Mono via `EmailHead`)

---

## Authoring Guidelines

Use these rules when writing a new template or editing an existing one.

### File structure

```tsx
// 1. Named imports from @react-email/components
import { Body, Button, Container, ... } from "@react-email/components";

// 2. Shared email infrastructure
import { EmailHead } from "@/lib/email/email-head";
import * as s from "@/lib/email/email-styles";

// 3. Props interface (exported)
export interface MyEmailProps { ... }

// 4. JSDoc comment: one paragraph, why this email exists
/**
 * Sent when X happens. Single CTA into Y.
 */

// 5. Named function export (not default-only)
export function MyEmail({ ... }: MyEmailProps) {
  return (
    <Html>
      <EmailHead />   {/* replaces <Head /> */}
      <Preview>...</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          ...
        </Container>
      </Body>
    </Html>
  );
}

// 6. PreviewProps for react-email dev preview
MyEmail.PreviewProps = { ... } satisfies MyEmailProps;

// 7. Default export
export default MyEmail;

// No local style objects - use s.* from email-styles.ts
```

### Rules

- Always use `<EmailHead />` instead of `<Head />`. Never add `<Font>` declarations directly to a template.
- Always import styles as `import * as s from "@/lib/email/email-styles"` and reference them as `s.heading`, `s.paragraph`, etc. Do not declare local style objects.
- If a new style is needed that isn't in `email-styles.ts`, add it to that file and document it here - do not add it locally to the template.
- Always include `PreviewProps` - it powers the react-email dev preview and serves as living documentation of what the template looks like with real data.
- Every customer-facing template must include a plain-text link fallback (`smallParagraph` + `Link`) immediately after the CTA button. Some email clients strip buttons; the fallback keeps the email functional.
- Export both a named export and a default export. Sending utilities import the named export; react-email preview tooling uses the default.
- Keep copies below 80 words where possible. These are transactional emails, not newsletters.
- Brand name is always `Hacksathon.com` in prose, `HACKSATHON.COM` in the brand bar. The product is always `Hacks-a-Thon` (with hyphens, capital H, a, T).
- No em dashes anywhere. Rewrite the sentence, use a comma, colon, parentheses, or a spaced hyphen ( - ) instead.
- Footer copy pattern for customer emails: one sentence explaining why they received this + `Hacksathon.com` on the next line.
- Footer copy pattern for internal emails: reply instruction + no `Hacksathon.com` attribution needed.

### Template checklist

Before shipping a new template:

- [ ] Props interface is exported and all props have types
- [ ] `PreviewProps` covers a realistic example (use Seven2 / Nick Reese as stand-ins)
- [ ] Uses `<EmailHead />` (not `<Head />`)
- [ ] Styles imported as `* as s from "@/lib/email/email-styles"` - no local style objects
- [ ] Heading uses `s.heading` (customer) or `s.internalHeading` (internal)
- [ ] Button CTA is followed by a plain-text link fallback
- [ ] Footer sentence is present and explains why this email was sent
- [ ] No em dashes in copy
- [ ] `Hacks-a-Thon` is hyphenated correctly wherever it appears
- [ ] Template is registered in the Quick Reference table above
- [ ] Template is registered in `src/emails/registry.tsx` so it shows in the `/murtopolis/emails` preview

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `RESEND_API_KEY` | (none) | Resend API key. If unset, emails are logged and silently skipped. |
| `RESEND_FROM_EMAIL` | `Hacksathon.com <invites@hacksathon.com>` | From address for all outbound email. |
| `RESEND_REPLY_TO` | (none) | Default reply-to. Some senders override this per-send (e.g. purchase-notification uses buyer email). |
| `INTERNAL_NOTIFY_EMAIL` | `nick@seven2.com` | Recipient for internal purchase notifications. |
| `NEXT_PUBLIC_SITE_URL` | (none) | Used by `siteBaseUrl()` to build absolute URLs in email CTAs. Must be set in production. |

The `invites@hacksathon.com` from address is configured as a verified sender in the Resend dashboard. Supabase Auth confirmation/recovery emails are routed through Resend via SMTP (separate config in the Supabase dashboard; see `hacksathon-infra-notes.md`).

---

## Previewing Templates

The in-app preview lives in the Murtopolis admin at **`/murtopolis/emails`** (platform-admin only - the Murtopolis layout 404s everyone else). It lists every template grouped by audience, renders the selected one in an iframe with a desktop/mobile width toggle, and uses each template's `PreviewProps` for sample data.

- Page: `src/app/(platform)/murtopolis/emails/page.tsx`
- Registry: `src/emails/registry.tsx` - the single list the preview iterates. **Every new template must be added here** (one entry with `slug`, `label`, `group`, `subject`, and an `element` built from its `PreviewProps`).

Because the preview only uses `PreviewProps` (no database), it works in local `npm run dev` and on Vercel preview deploys. Web fonts load from Google's CDN via `EmailHead`; offline they fall back to Georgia/Verdana/monospace exactly as a real inbox would.

## Local Development

`RESEND_API_KEY` is intentionally absent from local `.env` files. Emails will log the subject and recipient to stdout but will not send. This is the intended behavior - do not add a test key to `.env.local` unless you are actively testing a specific email template, and remove it before committing.
