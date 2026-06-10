# Hacksathon.com - Security Posture

> Living reference for how Hacksathon.com protects user data and the
> controls that back that up. Last reviewed June 2026. The code repo is
> the source of truth; when a control below drifts from the code, fix the
> code first, then update this doc.

Hacksathon.com collects personal information (names, work emails, company
names, event participation, reflections, and free-text input). This
document records the security model, the controls in place, the audit
history, and the known follow-ups so the next person can reason about the
blast radius of any change.

## Data we collect

| Category | Examples | Where it lives |
| --- | --- | --- |
| Account identity | Name, email, password hash, avatar | Supabase Auth + `profiles` |
| Organization data | Org name, membership, roles | `organizations`, `organization_members` |
| Event content | Ideas, screenshots, reflections, votes | Event-scoped tables (RLS) |
| Marketing | Waitlist name/email/company/team size | `waitlist_signups` |
| Support | Name, email, free-text message | Transit only (emailed, no DB row) |
| Billing | Stripe customer + checkout metadata | Stripe + provisioning records |

## Authentication

- Supabase Auth handles password, Google OAuth, and email confirmation.
- Passwords are never stored or handled by the app; Supabase manages
  hashing and verification.
- The password-change flow (`api/settings/password/route.ts`) does a
  step-up re-authentication with the current password, then calls
  `signOut({ scope: 'others' })` so a changed password invalidates other
  sessions.
- Email confirmation is required before a user can sign in. The
  confirmation link is only ever delivered to the user's own inbox. It is
  never returned in an API response (see audit finding 1 below).

## Authorization

Authorization is layered and never relies on the client.

- Event admin actions go through `requireEventAdmin(eventId)` in
  `hacksathon-app/src/lib/server/event-admin-guard.ts`, which calls the
  `is_event_admin` SECURITY DEFINER RPC.
- Org admin actions use the `is_org_admin` check.
- The platform-owner console (`/murtopolis/*`) is gated by
  `is_platform_admin()` / the `platform_admins` table; non-admins get a
  404, not a redirect.
- Row-Level Security on Postgres is the backstop: org-scoped tables are
  keyed off `organization_members` so a user only ever reads or writes
  rows for orgs they actively belong to. See ARCHITECTURE.md for the RLS
  pattern and the SECURITY DEFINER helpers that avoid policy recursion.
- Admin authorization is intentionally not done in middleware. It lives
  in the admin layout (non-admins 404) and is re-checked in every admin
  API route.

## Secrets and service-role access

- The Supabase service-role client (`lib/supabase/admin.ts`) bypasses
  RLS and is only ever imported in server-side route handlers, never in
  client components. Any new use of it must be paired with an explicit
  ownership or membership check, because RLS is not protecting that path.
- Secrets (`RESEND_API_KEY`, Supabase keys, Stripe keys) live in Vercel
  env vars and `.env.local` for development. They are never returned to
  the client or logged in full.
- Stripe webhooks verify the signature before acting; provisioning is
  idempotent and checks payment status.

## Rate limiting

Public, unauthenticated write endpoints are throttled per client IP via
`hacksathon-app/src/lib/server/rate-limit.ts`:

| Endpoint | Limit |
| --- | --- |
| `api/support` | 3 requests / 10 min |
| `api/waitlist` | 5 requests / 10 min |
| `api/signup-via-join` | 5 requests / 10 min |

The limiter is an in-process fixed-window counter. On Vercel Fluid
Compute, instances are reused across requests, so it meaningfully reduces
single-source abuse (form flooding, email-quota burn, enumeration
sweeps). It is not globally consistent across regions or concurrent
instances. For hard guarantees (for example, login brute-force
protection), back it with a shared store such as Upstash Redis by
swapping the `hit` implementation; the helper is structured for that
swap. See "Known follow-ups" below.

## Privacy controls

- The waitlist endpoint returns a byte-identical response whether an
  email is new or already on the list, so membership cannot be enumerated
  by diffing status codes or response bodies. The confirmation email
  sends only on genuinely new signups and that difference is never
  surfaced to the caller.
- The `next` redirect parameter on auth flows is sanitized
  (`safeNextPath`) so it can only ever point to a relative path on this
  site, preventing open-redirect abuse.
- Public storage buckets (event logos, idea screenshots, avatars) are
  public-read by design; write paths are scoped (avatars by the
  `auth.uid()` prefix).
- Privacy and data-request contact: `privacy@hacksathon.com`.

## Audit history

### June 2026 - pre-launch security review

A full security review was run ahead of handling real user data. Four
findings were identified and remediated.

1. **HIGH - Email-verification bypass in join signup.** The
   `api/signup-via-join` endpoint returned the Supabase confirmation
   `action_link` to the client when email send was skipped or failed,
   which would let a caller confirm an account without inbox access.
   **Fix:** the link is never returned to the client. The endpoint fails
   closed with a 503 in production when email cannot be sent, and only
   logs the link server-side in non-production for local development.

2. **HIGH - Invite redeemable by the wrong user.** The `api/accept-invite`
   "already signed in" path accepted any session without checking that
   the session email matched the invite email, so a logged-in user with a
   token could join under their own account and burn the invite.
   **Fix:** Path 2 now requires `session.email === invite.email` (case
   insensitive) and returns 403 `EMAIL_MISMATCH` otherwise.

3. **MEDIUM - Waitlist membership enumeration.** The endpoint returned
   `alreadyOnList: true` for known emails. **Fix:** responses are now
   identical for new and existing emails (see Privacy controls).

4. **MEDIUM - Unthrottled support form.** The public support endpoint had
   no rate limiting, exposing the support inbox and Resend quota to abuse.
   **Fix:** per-IP rate limiting added (and extended to the waitlist and
   join-signup endpoints).

Areas reviewed and found sound: event/org/platform admin authorization,
Stripe webhook signature verification, password step-up re-auth, avatar
URL scoping, join token entropy (256-bit), and `next` redirect
sanitization.

## Known follow-ups (not blocking launch)

- **Shared-store rate limiting.** Move the in-memory limiter to Upstash
  Redis (or equivalent) for globally consistent limits, especially before
  adding login brute-force protection.
- **Callback redirect hardening.** `api/.../callback` does not validate
  `next` itself; it is currently safe because callers pass
  `safeNextPath`-filtered values. Validating at the callback would be
  defense in depth.
- **Login / auth endpoint throttling.** Supabase enforces its own auth
  rate limits; revisit if we add custom auth surfaces.

## Reporting a vulnerability

Email `privacy@hacksathon.com` (alias monitored by the Murtopolis team).
Please include reproduction steps and avoid accessing or modifying data
that is not your own.
