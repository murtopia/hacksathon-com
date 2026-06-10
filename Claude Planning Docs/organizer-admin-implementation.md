# Organizer Admin — As-Built Reference

> Last updated: May 2026. Supersedes the original M6 single-page console
> write-up. The admin is now a slug-based, multi-tab console fronted by
> the Hacky Helper guided walkthrough. Covers the tab structure, the
> Helper engine, team/membership (invites + join links + roles),
> self-service settings, activity tracking, and date-windowed voting +
> reflections.

## What ships today

A non-technical buyer runs an entire Hacks-a-Thon end-to-end from
`/[companyslug]/admin` — no engineering help. The Hacky Helper keeps the
next action in view from setup through wrap-up.

1. **Identity** — company name, event title, welcome message, logo, vanity URL.
2. **Integrations** — team chat link, build tool.
3. **Schedule** — start time + duration per block (15-minute increments).
4. **Team** — shareable join link (pending approval) or email invites; role management; roster.
5. **Hacky Awards** — public showcase decision, award categories, voting window, open voting, reveal winners.
6. **Reflections** — reflection questions, reflection window, generate + approve the AI recap.

## Routes

### Admin UI

The admin lives under the slug-based member tree. The legacy
`/events/[id]/admin` route still exists but is being phased out.

| Route | Purpose |
| --- | --- |
| `/[companyslug]/admin` | Overview — renders the Hacky Helper (the "00" tab). |
| `/[companyslug]/admin/identity` | 01 — company + event identity. |
| `/[companyslug]/admin/integrations` | 02 — team chat + build tool. |
| `/[companyslug]/admin/schedule` | 03 — block schedule. |
| `/[companyslug]/admin/team` | 04 — join link, invites, roster, roles. |
| `/[companyslug]/admin/awards` | 05 — showcase, categories, voting window + controls. |
| `/[companyslug]/admin/reflections` | 06 — questions, reflection window, AI recap. |
| `/[companyslug]/admin/org`, `/event` | Legacy redirect targets. |
| `/accept-invite/[token]` | Public set-password landing (email invite). |
| `/join/[token]` | Public join-link landing (request to join, pending approval). |

The sub-nav (`src/components/event-nav/admin-subnav.tsx`) renders the
seven tabs with mono numeric prefixes (`00`–`06`); a "N steps left" pill
sits on the `00 Hacky Helper` tab, driven by `pendingStepCount`.

### Authorization

`/[companyslug]/admin/layout.tsx` gates the whole tree: it resolves the
slug context + viewer and 404s non-admins (so the URL never leaks).
Every admin API route independently calls `requireEventAdmin(eventId)`
(`src/lib/server/event-admin-guard.ts`), which authenticates and checks
the `is_event_admin` SECURITY DEFINER RPC.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| `PATCH` | `/api/events/[id]` | Title / welcome / vanity slug / `public_showcase` / `settings` / voting + reflection date windows. Locks honored. |
| `POST` `DELETE` | `/api/events/[id]/logo` | Upload / clear event logo. |
| `POST` `DELETE` | `/api/events/[id]/join-link` | Generate / revoke the shareable join token. |
| `GET` `POST` | `/api/events/[id]/invites` | List / create email invitations (Resend; idempotent per email). |
| `DELETE` | `/api/events/[id]/invites/[inviteId]` | Revoke a pending invite. |
| `POST` | `/api/events/[id]/invites/[inviteId]/resend` | Fresh token + email. |
| `DELETE` | `/api/events/[id]/members/[memberId]` | Remove a member (admins + self shielded). |
| `POST` | `/api/events/[id]/members/[memberId]/approve` | Approve a pending join request. |
| `PATCH` | `/api/events/[id]/members/[memberId]/role` | Set role: `participant` / `admin`. |
| `PATCH` | `/api/blocks/[id]` | Update `scheduled_date` + `duration_minutes`. Lock honored. |
| `POST` `PATCH` `DELETE` | `/api/award-categories[/id]` | Award category CRUD (stamps `awards_reviewed_at`). |
| `POST` `PATCH` `DELETE` | `/api/reflection-questions[/id]` | Reflection question CRUD (stamps `reflections_reviewed_at`). |
| `POST` | `/api/events/[id]/admin/voting/open` | Open voting (stamps `voting_open_at`). |
| `POST` | `/api/events/[id]/admin/voting/reveal` | Reveal winners (stamps `voting_close_at`, locks event). |
| `POST` | `/api/events/[id]/admin/reflections/summary` | Generate the AI recap. |
| `POST` | `/api/events/[id]/admin/reflections/summary/approve` | Approve the recap. |
| `POST` (public) | `/api/accept-invite` | Accept an email invite. |
| `POST` (public) | `/api/join/[token]` | Request to join via the join link (pending). |
| `POST` (public) | `/api/signup-via-join` | Branded join-link signup (Resend confirmation). |

## The Hacky Helper

The Helper is the single "what's next" surface, mounted at the top of
`/[companyslug]/admin`. It is an always-on editorial walkthrough of the
six journey stops (01 Identity → 06 Reflections), each an expandable
accordion of steps. Nothing swaps out by phase — the same six sections
render throughout; the copy and the highlighted step adapt.

### Engine (`src/lib/helper/`)

- **`phase.ts`** — pure functions, no I/O:
  - `HelperStep` / `HelperStop` model; step `kind` is `required` |
    `recommended` | `event-day`.
    - `required` gates setup completion + the dashboard redirect.
    - `recommended` is optional polish.
    - `event-day` are the day-of actions (open voting, reveal winners,
      generate + approve recap) folded into stops 05 and 06; they never
      gate setup.
  - `computeHelperStops(ctx, slug)` builds the six stops with per-step
    done/pending state.
  - `nextStep(stops, ctx)` — the single "Do this next" target: first
    pending required step, then (once required work is done **and**
    `eventDayReached`) the first pending event-day step.
  - `computePhase`, `isPhase1Complete`, `pendingStepCount` — used by the
    dashboard redirect, the participant-home setup banner, and the
    sub-nav pill.
- **`loader.ts`** — `loadHelperContext(ctx)` assembles event + org +
  blocks + roster + invite counts + date-window fields.
- **`src/lib/events/settings.ts`** — `stampSetting(eventId, key)` writes
  idempotent milestone timestamps into `events.settings` (e.g.
  `vanity_confirmed_at`, `build_tool_confirmed_at`, `showcase_decision_at`,
  `awards_reviewed_at`, `reflections_reviewed_at`, `team_invited_at`).
  API routes stamp these as the admin completes each step.

### Rendering (`src/components/admin/sections/hacky-helper.tsx`)

- Six stops render as borderless, hairline-divided accordions (no gray
  box). Each header shows the number, title, and an "X of Y done" count;
  fully-done stops get a filled check.
- Sections are open by default and individually collapsible. A single
  **Collapse / Expand** toggle (top-right) flips all sections at once via
  the `?helper=collapsed` URL param — it no longer hides the whole panel.
- The stop holding the next step gets an inset left-accent bar; exactly
  one pending step gets the primary "Do this next" button, everything
  else a ghost "Go".
- Step markers: required = solid circle, recommended = dashed circle +
  "Optional" tag, event-day = solid circle + "Event day" tag.

This replaces the old first-visit "onboarding nudge" card.

## Team and membership

Two ways onto the roster, both landing in the same `organization_members`
table (`status` is TEXT: `active` / `pending`).

- **Email invites** — `POST /api/events/[id]/invites` (multi-email,
  comma/space separated), branded Resend email, one-click accept at
  `/accept-invite/[token]`. Pending / revoke / resend supported.
- **Shareable join link** — `POST /api/events/[id]/join-link` mints
  `events.join_token`. Anyone with the link lands on `/join/[token]`,
  signs up (branded confirmation via `/api/signup-via-join`), and joins
  with `status = 'pending'` until an admin approves
  (`members/[memberId]/approve`). The `JoinLinkBlock` in
  `participants-panel.tsx` exposes copy / regenerate / revoke.
- **Roles** — `PATCH /api/events/[id]/members/[memberId]/role` toggles a
  member between `participant` and `admin`. The roster row shows the
  current role + a dropdown; admins and self are shielded from removal.
- **Roster "Last seen"** — each row shows `profiles.last_active_at`,
  kept fresh by the throttled `touch_my_activity` RPC fired from
  middleware.

## Self-service settings

`/settings` (platform shell, not event-scoped):

- `profile-section.tsx` — full name + avatar (avatars bucket via
  `PATCH /api/profile`, origin-validated).
- `account-security-section.tsx` — password change via
  `POST /api/settings/password`. Changing the password signs out other
  devices (`signOut({ scope: 'others' })`) and sends a security-notice
  email; the acting session stays logged in. Includes step-up
  re-authentication.

## Date-windowed voting and reflections

Migration `00027` adds `voting_open_at` / `voting_close_at` and
`reflections_open_at` / `reflections_close_at` (with CHECK constraints
ensuring close > open).

- **Voting window** — `voting-window.tsx` (uses `DateTime15Field`) sets
  the schedule; `lib/voting/auto-transition.ts` lazily flips
  `voting_status` on render when the window opens/closes, calling the
  shared `lib/voting/transitions.ts` (`openVoting` / `revealAwards`).
  Manual "Open voting" / "Reveal winners" use the same shared functions.
- **Reflection window** — `reflection-window.tsx` sets the dates;
  `POST /api/reflections` returns `409` outside the window.

## Schedule input

`src/components/admin/fields/datetime-15-field.tsx` is the standard
date/time control across schedule, voting window, and reflection window:
a native date input plus a `<select>` constrained to 15-minute
increments (native `datetime-local` `step` only affects spinners, so it
was replaced).

## Schema additions (cumulative)

- `00017_organizer_admin` — `event_invitations` (unique partial index on
  `(event_id, lower(email)) WHERE status='pending'`); `event-logos` bucket.
- `00022_avatars_bucket` — avatar storage.
- `00025_join_link_and_pending_members` — `events.join_token`;
  `organization_members.status` ENUM → TEXT + partial index.
- `00026_profile_last_active` — `profiles.last_active_at` +
  `touch_my_activity()` RPC.
- `00027_voting_and_reflections_windows` — voting + reflection date
  windows.

## Invite tokens

- 32-byte base64url, `crypto.randomBytes` (`src/lib/invites/tokens.ts`).
- 30-day TTL; single-use (accept flips `status='accepted'`); resend
  issues a fresh token and invalidates the old link.
- Join-link tokens (`src/lib/join/tokens.ts`) are event-scoped and
  revocable/rotatable rather than single-use.

## Event lock behavior

When `events.is_locked = true` (after winners are revealed): identity,
schedule, awards categories, logo, and integrations go read-only;
reflection questions stay editable; participants stay manageable; voting
controls + reflection recap function for the post-event wrap-up. Locks
are enforced server-side in `requireEventAdmin` handlers via an event
re-read.

## Email integration

- `src/lib/email/resend.ts` — `sendEmail` wrapper; degrades to stdout +
  `{ ok: true, skipped: true }` when `RESEND_API_KEY` is unset so the
  admin can copy/paste accept URLs manually.
- React Email templates render server-side. Some auth emails route
  through Supabase SMTP configured with Resend.

Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
`NEXT_PUBLIC_SITE_URL` (falls back to `NEXT_PUBLIC_VERCEL_URL`, then
`https://hacksathon.com`).

## Known follow-ons

- Reordering UI for award categories / reflection questions (insertion
  order today).
- Ownership transfer / demote flow beyond the role toggle.
- Block-level realtime hints (participants pick up schedule changes on
  next navigation).
- Logo focal-point cropping (currently `object-contain`).
