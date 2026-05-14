# Organizer Admin (M6) — As-Built Reference

> Last updated: M6 ship — covers the Organizer Wizard sectioned admin
> page, branded invitations via Resend, accept-invite flow, and
> admin-gated CRUD for every event-level surface.

## What ships in M6

A single self-service organizer console at `/events/[id]/admin`. A
non-technical buyer can now run an entire Hacks-a-Thon end-to-end
without engineering help:

1. **Set up the event** — title, description, welcome copy, optional
   welcome video, logo, vanity URL, public-showcase toggle, team chat
   link.
2. **Schedule the 10 blocks** — datetime + duration per block.
3. **Invite participants** — branded Resend emails with a one-click
   accept link; pending / accepted / revoked / expired status tracking
   + resend.
4. **Customize awards & reflections** — edit, add, or remove categories
   and reflection prompts before voting opens.
5. **Manage the roster** — remove participants (admins protected).
6. **Run the event** — open voting, reveal winners, generate the AI
   recap (these were the M4 surface; they now live under "Run event"
   inside the same page).

## Routes

### Admin UI

| Route | Purpose |
| --- | --- |
| `/events/[id]/admin` | Organizer console. Server-gated via `is_event_admin` RPC. |
| `/accept-invite/[token]` | Public set-password landing for new participants. Renders branded org context. |

### API

All admin-only routes use `requireEventAdmin(eventId)` from
`src/lib/server/event-admin-guard.ts`. The guard resolves the event's
organization id and calls `is_event_admin` (SECURITY DEFINER RPC).

| Method | Path | Purpose |
| --- | --- | --- |
| `PATCH` | `/api/events/[id]` | Update title / description / welcome / vanity slug / `public_showcase` / `settings`. Locks honored. |
| `POST` `DELETE` | `/api/events/[id]/logo` | Upload / clear event logo. Public-read storage bucket. |
| `PATCH` | `/api/blocks/[id]` | Update `scheduled_date` and `duration_minutes`. Lock honored. |
| `GET` `POST` | `/api/events/[id]/invites` | List / create invitations. POST sends email via Resend; idempotent per email. |
| `DELETE` | `/api/events/[id]/invites/[inviteId]` | Revoke a pending invitation. |
| `POST` | `/api/events/[id]/invites/[inviteId]/resend` | Fresh token + email. |
| `POST` | `/api/accept-invite` (public) | Create the user (or join with existing session) and mark the invite accepted. |
| `DELETE` | `/api/events/[id]/members/[memberId]` | Remove a participant. Admins shielded, self shielded. |
| `POST` | `/api/award-categories` | Create category. |
| `PATCH` `DELETE` | `/api/award-categories/[id]` | Edit / delete category. Lock honored. |
| `POST` | `/api/reflection-questions` | Create question. |
| `PATCH` `DELETE` | `/api/reflection-questions/[id]` | Edit / delete question. Editable post-lock. |

### Existing (M4) endpoints kept

`/api/events/[id]/admin/voting/{open,reveal}` and
`/api/events/[id]/admin/reflections/summary{,/approve}` are unchanged —
the M6 admin page just renders them under the "Run event" section.

## Schema additions (`00017_organizer_admin.sql`)

- `event_invitations(id, event_id, email, token, status, invited_by, invited_at, accepted_at, expires_at)` with:
  - Unique partial index on `(event_id, lower(email)) WHERE status = 'pending'` — one pending invite per address.
  - RLS: admin-only CRUD via `is_event_admin(event_id)`. Public accept-invite endpoint uses the admin Supabase client.
- `event-logos` storage bucket: public-read, admin-write keyed off `(storage.foldername(name))[1] = event_id`.

## Storage paths

| Bucket | Path | Public |
| --- | --- | --- |
| `event-logos` | `{eventId}/{uuid}.{ext}` | ✅ |
| `idea-screenshots` | `{eventId}/{userId}/{filename}` | ✅ (unchanged, M2) |

## Email integration

- `src/lib/email/resend.ts` — `sendEmail` wrapper around the Resend client.
  Gracefully degrades when `RESEND_API_KEY` is missing: logs to stdout
  and returns `{ ok: true, skipped: true }`. The invite/resend API
  routes use the `skipped` flag to nudge the admin to copy/paste the
  accept URL manually.
- `src/emails/participant-invite.tsx` — React Email template. Branded
  with logo placeholder, single CTA, preview text. Rendered server-side
  by Resend on send.

Env vars (set in Vercel and `.env.local`):

| Var | Purpose | Required? |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend API key. | No (skips email if unset) |
| `RESEND_FROM_EMAIL` | `"Hacksathon.com <invites@hacksathon.com>"` default. | No |
| `RESEND_REPLY_TO` | Reply-to address. | No |
| `NEXT_PUBLIC_SITE_URL` | Base URL for accept-invite links. Falls back to `NEXT_PUBLIC_VERCEL_URL`, then `https://hacksathon.com`. | Recommended |

## Invite tokens

- 32-byte (256-bit) base64url, generated with `crypto.randomBytes`.
- TTL 30 days. `expires_at` defaulted at row insert.
- Single-use: accept endpoint flips `status='accepted'` inside the same
  request after creating the user / joining the org.
- Resend issues a fresh token and bumps `expires_at` — old link stops
  working.

## Event lock behavior

When `events.is_locked = true`:

- Basics, branding (slug + showcase), schedule, awards categories: read-only.
- Logo: read-only.
- `settings.slack_url`: read-only (could be relaxed later).
- Reflection questions: still editable (organizers add prompts during recap).
- Participants: still manageable.
- Voting controls + reflection summary: function as designed for the
  post-event recap.

All locks enforced server-side via the `requireEventAdmin` guard plus an
event row re-read inside each PATCH/POST handler.

## Onboarding nudge

The admin page renders a "Welcome — let's get this event set up" card
on first visit. Heuristic: no participants invited, no schedule, no
logo, no vanity slug. Disappears once any one of those exists. Links
jump to each section via `#anchor`.

## Where things live

```
src/
├─ app/
│  ├─ (platform)/events/[id]/admin/page.tsx   # Sectioned organizer console
│  ├─ accept-invite/[token]/page.tsx          # Public landing
│  ├─ api/
│  │  ├─ accept-invite/route.ts
│  │  ├─ award-categories/{route.ts,[id]/route.ts}
│  │  ├─ blocks/[id]/route.ts                 # PATCH only (M6)
│  │  ├─ events/[id]/
│  │  │  ├─ route.ts                          # PATCH event
│  │  │  ├─ logo/route.ts
│  │  │  ├─ invites/{route.ts,[inviteId]/{route.ts,resend/route.ts}}
│  │  │  └─ members/[memberId]/route.ts
│  │  └─ reflection-questions/{route.ts,[id]/route.ts}
├─ components/
│  ├─ admin/
│  │  ├─ reflection-summary-panel.tsx         # M4 (zero-state fix in M6)
│  │  ├─ voting-controls.tsx                  # M4
│  │  └─ sections/
│  │     ├─ event-basics.tsx
│  │     ├─ event-logo.tsx
│  │     ├─ event-branding.tsx
│  │     ├─ event-schedule.tsx
│  │     ├─ award-categories-editor.tsx
│  │     ├─ reflection-questions-editor.tsx
│  │     └─ participants-panel.tsx
│  └─ auth/accept-invite-form.tsx
├─ emails/participant-invite.tsx              # React Email template
├─ lib/
│  ├─ email/resend.ts                         # Resend singleton + sendEmail
│  ├─ invites/tokens.ts                       # Token gen + expiry helpers
│  ├─ server/event-admin-guard.ts             # requireEventAdmin
│  └─ routing/reserved-slugs.ts               # Added `accept-invite` to reservations
└─ supabase/migrations/00017_organizer_admin.sql
```

## Known follow-ons (deferred polish)

- **Block-level realtime hints** — when an organizer bumps a block's
  schedule, the participant home should refresh automatically. Today
  participants pick it up on next navigation.
- **Logo focal-point cropping** — currently `object-contain`, no focal
  override.
- **Email preview route** — `/api/emails/preview` for sending test
  invites to oneself.
- **Reordering UI** — award categories and reflection questions sort
  in insertion order; drag-to-reorder is deferred.
- **Demote / transfer ownership** — DELETE `/members/[memberId]` refuses
  to remove admins. Demoting + transferring is a separate flow.
- **Settings-level slack_url editable post-lock** — currently the lock
  guard also blocks slack_url edits. The PATCH route is wired to allow
  it specifically if we want to relax this later.
