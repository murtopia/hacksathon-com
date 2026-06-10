# Backlog — Future Items to Potentially Tackle

A running list of nice-to-have improvements deferred so we can focus on
finishing the core product and getting live. Nothing here is blocking launch.

## Analytics (PostHog)

PostHog is live (project `Hacks-a-Thon`, id 450422, US Cloud). Web analytics +
product events are flowing, and there's a pinned "Hacksathon Overview"
dashboard. Potential follow-ups:

- **Internal / test-account filtering.** Define PostHog's "internal & test
  accounts" filter (e.g. exclude `@murtopolis.com` emails / known test users)
  and flip `filterTestAccounts: true` on the overview insights so our own
  clicks don't skew real numbers.
- **Weekly digest.** Scheduled email/Slack summary of the Hacksathon Overview
  dashboard for a Monday-morning pulse without logging in.
- **Web Analytics tab.** PostHog's built-in Web Analytics (top pages,
  referrers, geography, devices) already populates from our `$pageview`s — just
  worth bookmarking / lightly curating once there's real traffic.
- **Session replay.** One-line enable in `instrumentation-client.ts` (with text
  masking on) to watch real user sessions when debugging UX.
- **Signup-conversion alert.** Alert when the Signup -> Checkout -> Purchase
  funnel conversion drops below a threshold.
- **Swap preview env vars.** The Vercel Preview environment is missing the
  `NEXT_PUBLIC_POSTHOG_*` vars (CLI wouldn't add them non-interactively); add
  via the dashboard if we want analytics on branch preview deploys.

## Build tools / integrations

- **Real affiliate URLs.** Replace the placeholder affiliate links (currently
  the tools' homepages) in `src/lib/build-tool/labels.ts` with real affiliate
  URLs once we have them.

## Awards ceremony (deferred from the ceremony spec)

The full-screen Hacky Awards ceremony, two-step reveal/publish, pre-ceremony
review, and shareable winner cards shipped. These pieces of the original
`awards-ceremony-spec.md` were intentionally left for later:

- **Demo-day / Shark-Tank presentation timer.** Part 2 of the spec: an Organizer
  timer panel in Block 3 + Block 7 with two-phase configurable countdowns,
  Start/Pause/Reset, auto phase transition with an audio chime + visual flash,
  sound-option selector, and a drag-to-reorder presenter list. Plus the
  Block 7 participant practice timer with the demo framework. Timer state in
  session storage (no DB for MVP).
- **Audience "watching" mode.** GROWTH item: participants see a live "watching"
  view on their own device during the ceremony (blurred until each reveal),
  synced in real-time — needs a realtime channel.
- **PDF recap export.** GROWTH item: export the ceremony as a formatted PDF
  recap (category + winner grid).
- **Voting window timer (auto-close + extend).** Part 3 of the spec: a duration
  picker when opening voting (5/10/15/custom), a live countdown on the ballot +
  in the Organizer panel, "X of Y voted" live count, and early-close / +5-min
  extend controls. (The optional date auto-schedule covers the basic
  auto-close; the in-ceremony countdown UX is the deferred part.)

## Public summary page redesign

The slug root (`src/app/[companyslug]/page.tsx`) currently renders a member's
editable dashboard first for anyone signed in as a member/admin, the
`RevealedShowcase` for published public events, and a teaser/soft-entry
otherwise. A dedicated, intentional "public summary" experience is wanted:

- **Layout pass.** Design the public summary/showcase layout deliberately
  (hero, winners, gallery, recap) rather than the current stacked default.
- **Dedicated route (proposed `/[slug]/final`).** Give the public summary its
  own URL so it's easy to navigate/share and doesn't collide with the member
  dashboard at `/[slug]`.
- **Logged-in vs anonymous variants.** A signed-in participant should see a
  version tailored to them (e.g. their own placement, their team) while an
  anonymous visitor sees the clean public recap.
- **Fix "Preview as a visitor".** Today the link in `event-public-showcase.tsx`
  points to `/[slug]`, but admins/members always get the editable dashboard
  there — so it never shows the true public view. The new route (or a
  visitor-preview param) should let an organizer preview exactly what a
  non-member sees.
- **Winner card placement.** Consider surfacing the shareable winner card
  (`/[slug]/awards/card/[awardId]`) inline on this page rather than only as a
  download link.

## Seven2 case study (`/seven2/final`)

The wrap-up page is live and looking good. Outstanding data touch-ups:

- **Updated project URLs + screenshots.** Nick reached out to **Monica, Jeremy,
  Christina, Kristin, and Kelsey (Kelsea)** for current demo URLs and refreshed
  screenshots where needed. Update their `ideas.live_url` /
  `ideas.final_screenshot_url` once they report back (re-host any new shots into
  the `idea-screenshots` bucket for permanence).
- **Marketing copy pass (TBD).** Nick may revise some of the on-page marketing
  text later — no specifics yet.

## Data hygiene

- **Test-data cleanup.** Remove seeded/test events, orgs, and users before or
  shortly after launch (destructive — needs explicit sign-off first).
