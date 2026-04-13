# Session 4: Information Architecture
## Hacksathon.com — Complete Screen & Flow Map
*Prepared for Hacksathon.com product development*

---

## Standing Product Decisions (Confirmed Through Session 3)

The following decisions are locked and should be treated as constraints, not variables, in all architecture and design work:

1. **Self-serve SaaS — no facilitation dependency.** Any organization should be able to sign up, configure an event, and run it end-to-end without Murtopolis involvement. The platform is the facilitator. The architecture must encode Nick's instincts, not rely on them.

2. **Book integration deferred to post-launch.** "Vibe Coding for Creatives" is a future content layer. The platform stands completely on its own at launch. All learning content, tooltips, and contextual panels that previously referenced the book are now justified as standalone platform mechanics.

3. **Format is the product.** The 10-block event structure is the core value proposition. Every screen, flow, and feature exists to serve participant movement through the block sequence. No feature gets built if it doesn't advance the emotional arc: *Intimidation → Permission → First output → Surprise → Pride → "I have more ideas."*

4. **Tool-agnostic by design, Lovable as default.** The platform supports Lovable, Cursor, Bolt, and Replit. Organizers select during setup. Lovable is the recommended default for non-technical audiences and carries affiliate link attribution. No tool is evangelized — the format works with any vibe coding environment.

5. **Path-based URL structure.** Participant event experience lives at `/p/[event-slug]/`. No subdomain approach. Subdomains deferred to white-label (PREMIUM) and require no architectural change to implement later.

6. **Self-paced blocks — Block 4 is the only hard gate.** All blocks (including 1, 2, and 3) are open and self-paced. Motivated participants can work ahead freely. The platform highlights the "current" block as the recommended next action but does not prevent forward movement. Block 4 (Planning) is the single exception — it must be completed before Block 5 (Build) unlocks. This makes the gate feel intentional and significant rather than arbitrary.

7. **Awards reveal is a platform-generated click-through presentation.** Auto-populated from voting results when the Organizer closes voting. Presented by the Organizer via screen share during Demo Day (typically a Zoom/Teams call). Category-by-category reveals, Best in Show last. Deserves its own distinct design treatment — more ceremony, less dashboard. Reference: the Seven2 PowerPoint presentation (to be uploaded at Session 5 kickoff).

8. **Mobile-friendly surfaces at launch:**
   - Participant dashboard home
   - Project gallery
   - Voting ballot (Block 8)
   - Reflection form (Block 9)
   - Marketing homepage and case study page

   **Desktop-first (functional but not optimized for mobile):** All build and work-session blocks (4, 5, 6), Org Admin dashboard, Murtopolis, Awards ceremony presentation (presenter is on desktop; audience watches via Zoom).

9. **Help center: Notion public pages at launch.** Free, fast to set up, and maintainable without engineering. The `/help/` URL on hacksathon.com redirects to the Notion-hosted content, enabling a future tool swap without breaking any bookmarks. Upgrade path: Intercom when support volume justifies it (in-app chat, searchable docs, user messaging).

---

## Architecture Overview

Four distinct surfaces. Two are user-facing (Participant, Org Admin). One is internal (Platform Admin). One is public (Marketing Site). Each has its own navigation system, information hierarchy, and primary job to be done.

| Surface | Primary User | Job to Be Done |
|---|---|---|
| Participant Experience | Individual hackathon participant | Move through blocks, ship a product |
| Org Admin Dashboard | Event organizer (buyer) | Configure, monitor, and run an event |
| Platform Admin (Murtopolis) | Internal — Nick + team | Manage clients, billing, and platform ops |
| Public Marketing Site | Prospective buyers | Understand, trust, and purchase |

---

## SURFACE 1: Participant Experience

### Mental Model
The participant has one job: move through the blocks. All blocks are visible and accessible from day one — motivated participants can work ahead freely. The platform highlights the "current" block (where the cohort is in the timeline) as the recommended next action, but treats forward movement as a feature, not a violation. The single exception is Block 4 (Planning), which must be completed before Block 5 (Build) unlocks. Participants don't need (and shouldn't be distracted by) admin tools, billing, or platform-wide views.

### Sitemap

```
PARTICIPANT EXPERIENCE
│
├── /join/[invite-code]          AUTH ENTRY
│   └── Claim invite → Create account or log in
│
├── /p/[event-slug]/             PARTICIPANT HOME
│   ├── Event header (name, org logo, timeline)
│   ├── Current block — CTA card (primary action)
│   ├── Your progress — block completion status
│   └── Upcoming blocks — locked previews
│
├── /p/[event-slug]/blocks/      BLOCK WORKSPACE (per block)
│   │
│   ├── block-1/                 KICKOFF
│   │   ├── Welcome message (event-specific, from Organizer)
│   │   ├── The Permission Frame: "Build something you personally want to exist."
│   │   ├── Event timeline overview
│   │   ├── Build tool intro card (tool-specific, set by Organizer)
│   │   └── CTA: "I'm in — show me Block 2"
│   │
│   ├── block-2/                 IDEATION (IdeaLab)
│   │   ├── Idea submission form
│   │   │   ├── Idea name
│   │   │   ├── One-line description
│   │   │   ├── Scope validation field: "This app does ONE thing: ___"
│   │   │   │   └── Inline coaching: "If your sentence contains 'and' — it's too big."
│   │   │   ├── Inspiration type (personal / work / wild card)
│   │   │   └── Submit button
│   │   ├── Idea gallery (all submitted ideas, read-only browse)
│   │   │   ├── Filter: all / mine / submitted this block
│   │   │   └── Idea card: name + one-liner + submitter first name + role
│   │   └── Block complete state: idea confirmed, scope validated
│   │
│   ├── block-3/                 PITCH (Shark Tank)
│   │   ├── Pitch prep workspace
│   │   │   ├── Your idea card (from Block 2, read-only)
│   │   │   ├── Pitch framework: Problem / Solution / Who it's for / Name
│   │   │   ├── One-minute timer tool (optional, inline)
│   │   │   └── Save pitch notes
│   │   ├── Peer gallery (browse others' pitch notes — post-pitch reveal, Organizer-gated)
│   │   └── Block complete state: pitch delivered (self-reported confirm)
│   │
│   ├── block-4/                 PLANNING (ZERO.Prmptr — GATED)
│   │   ├── Gate message: "You can't start building yet. This is the most important 30 minutes."
│   │   ├── Planning conversation flow (conversational prompting)
│   │   │   ├── Step 1: What does this do? (core function, one sentence)
│   │   │   ├── Step 2: Who is it for? (one specific person)
│   │   │   ├── Step 3: What does it look like? (vibe, feel, reference sites)
│   │   │   ├── Step 4: What does it NOT do? (scope guard)
│   │   │   └── Step 5: What does success look like? (done = when?)
│   │   ├── Project Brief output (auto-generated document)
│   │   │   ├── Editable inline
│   │   │   └── Sections: overview, audience, core function, design direction, out of scope
│   │   ├── Starter Prompt generator
│   │   │   ├── Auto-generates first Lovable/Cursor/Bolt prompt from the Brief
│   │   │   ├── Copy button (one click)
│   │   │   └── Link to build tool (affiliate-attributed for Lovable)
│   │   └── Block complete state: Brief saved + Starter Prompt copied
│   │
│   ├── block-5/                 BUILD
│   │   ├── Your Project Brief (read-only reference, collapsible)
│   │   ├── Your Starter Prompt (display + re-copy)
│   │   ├── Build tool link (with tool name + affiliate link for Lovable)
│   │   ├── Build coaching tips (tool-specific, 3–5 cards)
│   │   │   ├── "How to give design direction"
│   │   │   ├── "When you're stuck"
│   │   │   ├── "Scope creep warning signs"
│   │   │   └── "What 'done' looks like for a demo"
│   │   ├── Live URL submission field
│   │   │   └── Validation: must be a publicly accessible URL
│   │   ├── Project status toggle: building / stuck / ready to demo
│   │   └── Block complete state: live URL submitted
│   │
│   ├── block-6/                 MID-CHECK
│   │   ├── 60-second screen share prompt (async self-report format in MVP)
│   │   ├── Progress check form
│   │   │   ├── "Where are you?" (on track / stuck / pivoted)
│   │   │   ├── "Biggest blocker right now?" (text, optional)
│   │   │   └── "What's your live URL so far?" (optional, for Organizer visibility)
│   │   └── Coaching response (if "stuck" selected): surface top 3 tips for their build tool
│   │
│   ├── block-7/                 DEMO DAY
│   │   ├── Demo prep workspace
│   │   │   ├── Demo framework: What it is / Why I built it / Show the thing / What's next
│   │   │   ├── 3-minute timer tool (inline)
│   │   │   └── Your live URL (from Block 5, editable if updated)
│   │   ├── Demo order (published by Organizer)
│   │   ├── Project gallery (all live URLs visible, Organizer-published)
│   │   └── Block complete state: demo delivered (self-reported)
│   │
│   ├── block-8/                 AWARDS (Voting)
│   │   ├── Voting ballot (Organizer-activated)
│   │   │   ├── Category cards (configured by Organizer, up to 6)
│   │   │   ├── One vote per category (can't vote for own project)
│   │   │   └── Submit all votes (single action)
│   │   ├── Waiting state (post-vote, pre-reveal): "Votes are in. Results pending."
│   │   ├── Winner reveal (Organizer-triggered)
│   │   │   ├── Category-by-category reveal (animated)
│   │   │   └── Winner cards: project name + builder name + vote count
│   │   └── Best in Show moment (final card, full-screen treatment)
│   │
│   ├── block-9/                 REFLECT
│   │   ├── Reflection form (7 questions, structured)
│   │   │   ├── "What surprised you most?"
│   │   │   ├── "What would you do differently?"
│   │   │   ├── "What advice would you give to the next participant?"
│   │   │   ├── "How has your relationship with AI changed?"
│   │   │   ├── "What ideas do you now want to build?"
│   │   │   ├── "What was the most useful thing the platform did for you?"
│   │   │   └── "One word to describe the experience?"
│   │   ├── Quote opt-in toggle: "Allow my reflection quotes to be used in the event report"
│   │   └── Block complete state: reflection submitted
│   │
│   └── block-10/                CONTINUE
│       ├── Your event summary card
│       │   ├── Project name + live URL
│       │   ├── Award won (if applicable)
│       │   └── Reflection summary
│       ├── IdeaLab — your full idea bank (all submitted ideas, persistent)
│       ├── New project prompt: "What do you want to build next?"
│       │   └── Links to Block 4 flow (Planning-only mode)
│       └── Platform placeholder: "More coming soon — you're now a builder."
│
├── /p/[event-slug]/gallery/     PROJECT GALLERY
│   ├── All submitted projects (post-Demo Day)
│   ├── Filter: all / award winners / by role
│   └── Project card: name + builder + one-liner + live URL + award badge
│
└── /p/[event-slug]/profile/     PARTICIPANT PROFILE
    ├── Display name + role
    ├── Event participation history
    └── My projects (all submitted live URLs)
```

### Key Participant Flows

**Flow 1: First Login**
Invite link → Account creation (name, role, password) → Passion project framing screen → Block 1 Kickoff → Block 2 CTA

**Flow 2: Completing the Planning Gate (Block 4)**
Participant arrives at Block 4 → Gate message → Conversational planning flow (5 steps) → Project Brief generated → Starter Prompt auto-generated → Copy Starter Prompt → Affiliate link to Lovable → Block 4 marked complete → Block 5 unlocked

**Flow 3: Submitting a Live URL**
Block 5 → Build in Lovable (external) → Return to platform → Paste URL → Validation → Submit → Block 5 complete → Demo Day unlocked

**Flow 4: Voting and Reveal**
Organizer activates voting → Participant receives notification → Open ballot → One vote per category → Submit → Waiting state → Organizer triggers reveal → Participant watches live (async: refreshes to see results)

---

## SURFACE 2: Org Admin Dashboard

### Mental Model
The Organizer has two modes: **setup** (before the event starts) and **monitoring** (while the event runs). The dashboard toggles between these modes based on event state. At any time they have three jobs: configure, communicate, and watch.

### Sitemap

```
ORG ADMIN DASHBOARD
│
├── /admin/                      ORG HOME
│   ├── Active events (card list)
│   ├── Past events (card list)
│   ├── Quick action: Create new event
│   └── Org settings shortcut
│
├── /admin/events/new/           EVENT CREATION WIZARD
│   ├── Step 1: Event Basics
│   │   ├── Event name
│   │   ├── Company / team name
│   │   ├── Expected participant count
│   │   └── Event logo / color (basic branding)
│   ├── Step 2: Timeline Setup
│   │   ├── Start date
│   │   ├── Session cadence (weekly / bi-weekly / custom)
│   │   ├── Session length (30 / 45 / 60 min)
│   │   └── Auto-populated block timeline (preview)
│   ├── Step 3: Build Tool Selection
│   │   ├── Tool options: Lovable (recommended) / Cursor / Bolt / Replit
│   │   ├── Recommended callout: "Lovable is best for non-technical teams"
│   │   └── Selection populates tool-specific coaching tips throughout
│   ├── Step 4: Review & Customize Blocks
│   │   ├── Block-by-block timeline view
│   │   ├── Edit: title, description, date, duration per block
│   │   └── Fixed sequence note: "Block order is the format — it can't be reordered"
│   ├── Step 5: Awards Configuration
│   │   ├── Default categories (pre-loaded): Best in Show / Best Execution / Most Creative Idea / Shut Up and Take My Money / Most [Company] Energy / Best Pitch
│   │   └── Edit / rename / remove categories
│   └── Step 6: Launch
│       ├── Review summary
│       ├── Invite method: email list / shareable link
│       ├── Send invites (email composer, pre-populated template)
│       └── Confirm launch → Event goes live
│
├── /admin/events/[event-id]/    EVENT DASHBOARD (active event)
│   │
│   ├── overview/                EVENT OVERVIEW
│   │   ├── Event status badge: setup / active / demo day / complete
│   │   ├── Key stats: participants / ideas / builds / demos
│   │   ├── Current block highlight: which block is "open" now
│   │   ├── Timeline progress bar
│   │   └── Quick actions: send announcement / advance block / view participant status
│   │
│   ├── participants/            PARTICIPANT MANAGEMENT
│   │   ├── Participant table
│   │   │   ├── Name + role + email
│   │   │   ├── Block completion status (color-coded: done / in progress / not started)
│   │   │   ├── Current project (if submitted)
│   │   │   └── Last active date
│   │   ├── Filters: all / behind / completed / at-risk
│   │   ├── Bulk nudge: select participants → send message
│   │   ├── Individual participant view
│   │   │   ├── Their full block history
│   │   │   ├── Project Brief (view-only)
│   │   │   └── Send direct message
│   │   └── Add participant (post-launch invite)
│   │
│   ├── blocks/                  BLOCK MANAGEMENT
│   │   ├── Block list (all 10, with status and dates)
│   │   ├── Per-block detail view
│   │   │   ├── Block description (editable)
│   │   │   ├── Participant completion stats for this block
│   │   │   ├── Facilitator Notes panel (coaching context — Organizer only)
│   │   │   ├── Suggested async message (pre-written, editable, sendable)
│   │   │   └── Block controls: open / close / skip
│   │   └── Block 4 gate: see who has and hasn't completed Planning
│   │
│   ├── ideas/                   IDEA GALLERY (ORGANIZER VIEW)
│   │   ├── All submitted ideas
│   │   ├── Status tags: submitted / pitched / in build / shipped / in progress
│   │   ├── Scope flag: ideas where scope field contains "and" → review alert
│   │   └── Export as CSV
│   │
│   ├── projects/                PROJECTS & BUILDS
│   │   ├── All submitted live URLs
│   │   ├── Project card: name + builder + URL + submission date
│   │   ├── URL validation status (accessible / broken)
│   │   ├── Demo order editor (drag to reorder)
│   │   └── Publish gallery toggle: make gallery visible to all participants
│   │
│   ├── awards/                  AWARDS CONTROL CENTER
│   │   ├── Category list (from setup — editable until voting opens)
│   │   ├── Voting window controls
│   │   │   ├── Open voting (send notification to all participants)
│   │   │   ├── Close voting (lock ballot)
│   │   │   └── Voting status: X of Y participants have voted
│   │   ├── Results view (Organizer sees live tally — hidden from participants)
│   │   ├── Reveal controls
│   │   │   ├── Trigger reveal (category by category or all at once)
│   │   │   └── Best in Show: final reveal button
│   │   └── Winner export (names + categories for ceremony use)
│   │
│   ├── reflections/             REFLECTION MANAGEMENT
│   │   ├── Submission tracker: X of Y submitted
│   │   ├── Response table: participant → per-question responses
│   │   ├── Opted-in quotes list (participants who checked quote permission)
│   │   ├── Report view: all responses formatted for easy reading
│   │   └── Export: CSV of all responses
│   │
│   ├── communications/          COMMS CENTER
│   │   ├── Announcement composer
│   │   │   ├── Subject + body
│   │   │   ├── Audience: all / specific block status
│   │   │   └── Schedule or send now
│   │   ├── Sent message history
│   │   ├── Nudge templates (pre-written, per block)
│   │   │   ├── "Block X is now open" templates
│   │   │   ├── "You're falling behind" (gentle) templates
│   │   │   └── "Demo Day is coming" template
│   │   └── Notification settings: platform / email / both
│   │
│   └── analytics/               EVENT ANALYTICS
│       ├── Completion funnel: participants at each block stage
│       ├── Engagement metrics: avg time per block, last-active dates
│       ├── Project count: ideas → pitches → builds → shipped
│       ├── Voting participation rate
│       ├── Reflection submission rate
│       └── Event summary (exportable)
│
├── /admin/events/[event-id]/    EVENT WRAP-UP (post-Demo Day state)
│   ├── Final stats summary
│   ├── Winner cards (all categories)
│   ├── Reflection report (full, with opted-in quotes)
│   ├── Project gallery (all live URLs)
│   └── Showcase: publish event to public showcase (GROWTH feature — placeholder at launch)
│
└── /admin/settings/             ORG SETTINGS
    ├── Organization profile (name, logo, billing email)
    ├── Branding (logo + primary color — applied to all participant-facing views)
    ├── Plan + billing overview (link to billing portal — Stripe in v1.1)
    └── Team: add co-organizers (GROWTH)
```

### Key Organizer Flows

**Flow 1: First-Time Event Setup (under 10 minutes)**
Sign up → Org name + details → Event Creation Wizard (6 steps) → Send invites → Dashboard (setup mode)

**Flow 2: Running an Active Block**
Dashboard → See block is open → View Facilitator Notes → Send block announcement (from nudge template) → Monitor participant completion table → Nudge at-risk participants

**Flow 3: Demo Day Operations**
Publish project gallery → Set demo order → Open voting → Monitor vote count → Close voting → View results → Trigger reveal (category by category) → Best in Show moment → Close event

**Flow 4: Post-Event Debrief**
Event Wrap-Up → Reflection report → Export → (GROWTH: generate showcase page)

---

## SURFACE 3: Platform Admin — Murtopolis

### Mental Model
This is an internal operations tool. The primary job is visibility and control across all customer organizations and events. It is not customer-facing and does not need to be beautiful — it needs to be accurate, fast, and trustworthy.

### Sitemap

```
PLATFORM ADMIN (MURTOPOLIS)
│
├── /murtopolis/                 PLATFORM OVERVIEW
│   ├── Summary stats
│   │   ├── Total active organizations
│   │   ├── Total active events (right now)
│   │   ├── Total participants (all time)
│   │   ├── Total projects shipped (all time)
│   │   └── MRR / ARR overview (once Stripe billing is live)
│   └── Recent activity feed (new signups, new events created, events completed)
│
├── /murtopolis/organizations/   ORGANIZATION MANAGEMENT
│   ├── Org list table
│   │   ├── Name + contact + plan tier + created date
│   │   ├── Active events count
│   │   ├── Total events run (all time)
│   │   └── Last activity date
│   ├── Per-org detail view
│   │   ├── Org profile (name, contact, logo, billing email)
│   │   ├── Plan tier + billing status
│   │   ├── All events (list, with status)
│   │   ├── Usage summary (participants, projects, reflections)
│   │   └── Admin notes (internal, not visible to customer)
│   ├── Create org (manual provisioning — MVP; self-serve in v1.1)
│   ├── Edit org (plan tier, contact info)
│   └── Suspend / deactivate org
│
├── /murtopolis/events/          ALL-EVENTS VIEW
│   ├── Events table (all orgs)
│   │   ├── Event name + org name + status + participant count + start date
│   │   ├── Completion rate (shipped / enrolled)
│   │   └── Filter: status / org / date range
│   └── Per-event view (same as Org Admin event dashboard, read-only)
│
├── /murtopolis/billing/         BILLING OVERVIEW
│   ├── Revenue summary (MRR, ARR, plan distribution)
│   ├── Plan tier breakdown (how many orgs on each tier)
│   ├── Upcoming renewals
│   ├── Manual billing actions (MVP — before Stripe self-serve)
│   │   ├── Apply plan to org
│   │   ├── Extend trial
│   │   └── Issue credit / override
│   └── Stripe integration status (v1.1 — show integration health)
│
├── /murtopolis/content/         CONTENT MANAGEMENT
│   ├── Block library
│   │   ├── Default block titles, descriptions, time allocations
│   │   ├── Facilitator Notes (per block — the coaching layer)
│   │   └── Edit any block default (applies to all new events)
│   ├── Onboarding copy
│   │   ├── Participant onboarding screens (text-only edits)
│   │   ├── Passion project framing message
│   │   └── Permission frame copy
│   ├── Nudge template library
│   │   ├── All default announcement/nudge templates
│   │   └── Edit / add / remove templates (available to all Organizers)
│   ├── Build tool tip sets
│   │   ├── Per-tool onboarding tips (Lovable / Cursor / Bolt / Replit)
│   │   └── Edit build coaching cards
│   └── Awards default categories (global defaults, editable per event by Organizer)
│
├── /murtopolis/analytics/       PLATFORM ANALYTICS
│   ├── Aggregate completion rate (all events, all time)
│   ├── Block drop-off analysis: where do participants stall most?
│   ├── Tool usage breakdown: which build tools are selected
│   ├── Reflection themes: common words/phrases (manual review in MVP)
│   ├── Affiliate link attribution (Lovable clicks → conversion tracking)
│   └── Cohort analysis: first event vs. second event completion rates
│
├── /murtopolis/support/         SUPPORT TOOLS
│   ├── Impersonate org (view any org's dashboard as that Organizer)
│   ├── Impersonate participant (view any participant's block experience)
│   ├── Reset block completion (for testing / error recovery)
│   ├── Event state override (advance / revert event status)
│   └── Support notes (log actions taken per org)
│
└── /murtopolis/settings/        PLATFORM SETTINGS
    ├── Feature flags
    │   ├── Toggle GROWTH / PREMIUM features per org
    │   └── Global feature rollout controls
    ├── Admin accounts (who has Murtopolis access + role)
    ├── Affiliate link management (Lovable URL + tracking params)
    └── Platform notification settings
```

### Key Admin Flows

**Flow 1: Onboard a New Customer (MVP — manual)**
Create org → Set plan tier → Add contact info → Org admin receives invite → Confirm setup complete

**Flow 2: Monitor an Active Event**
Events list → Select event → View participant completion table (read-only) → Check completion rate → No action needed unless support request

**Flow 3: Edit Platform Content Without a Code Deploy**
Content Management → Select block or template → Edit text → Save → Live immediately on all new events

**Flow 4: Affiliate Attribution Check**
Analytics → Lovable click data → Compare click-to-build rate → Inform affiliate reporting

---

## SURFACE 4: Public Marketing Site

### Mental Model
The marketing site has one job: turn curiosity into a conversation or purchase. The buyer is a CMO, agency head, or L&D lead who is skeptical, busy, and has already survived one too many AI workshops. The site earns trust through specificity — real numbers, real quotes, real projects — not buzzwords.

### Sitemap

```
PUBLIC MARKETING SITE
│
├── /                            HOMEPAGE
│   ├── Hero section
│   │   ├── Headline: "The structured hackathon that turns non-technical teams into builders."
│   │   ├── Sub-headline: "Six weeks. Part-time. Your whole team ships a real product."
│   │   ├── Primary CTA: "See how it works" (anchors to format section)
│   │   └── Secondary CTA: "Talk to us" (contact / demo request)
│   ├── Social proof bar
│   │   ├── "22 participants. 14 live apps. 6 weeks. Zero coding experience." — Seven2 case study stats
│   │   └── Pull quote: "I have definitely found myself thinking, 'oh I could make a solution for that.'" — Sena Lauer, Seven2
│   ├── The Format section
│   │   ├── "The format is the product." — framing statement
│   │   ├── 10-block visual (simplified timeline — not a feature list)
│   │   └── "Time-blocked. Facilitated by the platform. Runs in 30–45 min sessions."
│   ├── Who it's for section
│   │   ├── Creative agencies / Marketing teams / Strategy & consulting / Design studios
│   │   └── "If your team has never shipped a product — this is where you start."
│   ├── The emotional arc (illustrated)
│   │   └── Intimidation → Permission → First output → Surprise → Pride → "I have more ideas"
│   ├── Featured projects section
│   │   ├── 3 showcase cards: Drift / Cut-up Lyric Generator / Even Grounds
│   │   └── Project name + builder role + one-liner + "View project" link (GROWTH — once showcase is live)
│   ├── How it's different section
│   │   ├── vs. a workshop: "You ship something real."
│   │   ├── vs. a developer hackathon: "Your team doesn't need to code."
│   │   └── vs. a DIY playbook: "The format lives in the platform — not in one person's head."
│   ├── FAQ (collapsed)
│   │   ├── "Do participants need coding experience?" → No.
│   │   ├── "What tools do you use?" → Tool-agnostic, Lovable recommended.
│   │   ├── "How long does it take?" → 6 weeks, 30–45 min per session.
│   │   ├── "Can we run it again?" → Yes — and it gets better each time.
│   │   └── "Is there a facilitator?" → The platform facilitates. You run it.
│   └── Final CTA section
│       ├── "Ready to see what your team can build?"
│       └── CTA: "Get started" / "Request a demo"
│
├── /how-it-works/               HOW IT WORKS
│   ├── Full block-by-block walkthrough
│   │   ├── Each block: name + what happens + why it matters + time allocation
│   │   └── Visual timeline (block 1 → 10)
│   ├── Role breakdown: Organizer vs. Participant experience
│   ├── Tool section: "Bring your own tools — or use our recommendations"
│   │   └── Lovable featured (default) — other tools listed
│   └── CTA: "Set up your event" / "See pricing"
│
├── /pricing/                    PRICING
│   ├── Plan comparison table
│   │   ├── Starter — [price] — up to X participants / 1 event
│   │   ├── Team — [price] — up to X participants / unlimited events
│   │   └── Enterprise — custom — white-label, multi-event, SSO
│   ├── FAQ
│   │   ├── "What's included in each plan?"
│   │   ├── "Can I run a trial event?"
│   │   └── "Is facilitation included?" → No — the platform facilitates.
│   └── CTA: "Start your event" (Starter / Team) / "Talk to us" (Enterprise)
│
├── /case-study/seven2/          CASE STUDY (Seven2)
│   ├── Hero: headline stat — "64% completion rate. Zero coding experience."
│   ├── The Challenge (brief)
│   ├── The Format (how they ran it)
│   ├── The Results (metrics table)
│   ├── The Unexpected Win (passion projects > work projects)
│   ├── Participant quotes (5–6 high-impact quotes)
│   ├── Featured projects (Drift, Cut-up Lyric Generator, Even Grounds)
│   ├── The Lasting Impact (69% wanted to keep building)
│   └── CTA: "Run this at your company"
│
├── /showcase/                   SHOWCASE (GROWTH — placeholder at launch)
│   ├── "Coming soon — a gallery of everything teams have built with Hacksathon."
│   └── CTA: "Be part of the first showcase — run an event."
│
├── /help/                       HELP CENTER
│   ├── Getting started (for Organizers)
│   │   ├── How to set up your first event
│   │   ├── How to invite participants
│   │   ├── How to configure blocks
│   │   └── How to run Demo Day
│   ├── Participant guides
│   │   ├── Your first time on Hacksathon
│   │   ├── How to complete the Planning Block
│   │   ├── Design direction tips (the reference site method)
│   │   └── What to do if you're stuck in your build
│   ├── Tool guides
│   │   ├── Getting started with Lovable (default — affiliate link)
│   │   ├── Getting started with Cursor
│   │   ├── Getting started with Bolt
│   │   └── Getting started with Replit
│   └── FAQ (expanded version of homepage FAQ)
│
├── /about/                      ABOUT
│   ├── Origin story (Seven2 case study → platform)
│   ├── The philosophy: format first, tools second
│   └── Contact
│
└── /contact/                    CONTACT / DEMO REQUEST
    ├── "Talk to us about running Hacksathon at your company"
    ├── Form: name, company, team size, "what's your situation?"
    └── Response promise: "We'll get back to you within one business day."
```

### Key Marketing Flows

**Flow 1: Organic Discovery → Purchase**
Google → Homepage → How It Works → Pricing → Sign Up (self-serve)

**Flow 2: Word of Mouth → Case Study → Purchase**
Referral → Case Study (Seven2) → Pricing → Sign Up

**Flow 3: Enterprise Buyer → Demo**
Any page → "Talk to us" → Contact form → Conversation (offline)

**Flow 4: Participant → Curiosity → Advocate**
Past participant recommends to their next employer → Homepage → Case Study (they recognize it) → Buyer conversion

---

## Cross-Surface Connections

These are the critical handoffs between surfaces — moments where the architecture must stay coherent across user types.

| From | To | Trigger | What must be consistent |
|---|---|---|---|
| Marketing site | Participant onboarding | Invite link (received via email) | Event name, company name, passion project framing |
| Org Admin wizard | Participant first login | Invite sent | Tool selection, block descriptions, branding |
| Block 4 (Participant) | External tool (Lovable etc.) | Starter Prompt copied, affiliate link clicked | Prompt content generated from their Brief |
| Block 5 URL submission | Organizer project view | Live URL submitted | URL visible immediately in Organizer's projects tab |
| Awards voting | Organizer reveal | Voting closed | Tally is accurate, reveal is Organizer-controlled |
| Reflection submission | Organizer report | Form submitted | Opted-in quotes flagged, report auto-updates |
| Event completion | Murtopolis analytics | Event marked complete | Completion rate, project count, reflection count all log |

---

## Navigation System — Summary by Surface

| Surface | Primary Nav | Secondary Nav | No Nav (linear flows) |
|---|---|---|---|
| Participant | Block-by-block progress (left rail or top bar) | Gallery, Profile | Onboarding, Voting ballot, Reflection form |
| Org Admin | Events list → Event tabs (Overview, Participants, Blocks, Awards, Reflections, Comms, Analytics) | Org Settings | Event Creation Wizard |
| Platform Admin | Top nav: Overview, Organizations, Events, Billing, Content, Analytics, Support, Settings | — | — |
| Marketing Site | Top nav: How It Works, Pricing, Case Study, Help, Sign Up | Footer: About, Contact, Help | — |

---

## Deferred Architecture (GROWTH / PREMIUM / FUTURE)

Not in scope for MVP, but named here so they have a defined home when ready:

| Feature | Belongs in |
|---|---|
| Event Showcase Page (public gallery) | /showcase/[event-slug] under Marketing Site + Org Admin event wrap-up |
| Project Profile Page | /showcase/[event-slug]/[project-id] |
| Book integration (learning panels, tooltips) | Surfaced within Block workspace panels (Block 4, 5, 6 most likely) |
| Multi-event Org Dashboard | New tab in Org Admin: /admin/overview/ |
| Self-serve Stripe billing | /admin/settings/billing/ — already stubbed in Org Settings |
| Facilitator Network | New section in Murtopolis: /murtopolis/facilitators/ |
| Design Direction Resource | In-block panel (Block 4 + Block 5) — collapsible |
| Slack / Teams integration | Comms Center in Org Admin — additional channel options |
| White-label domain | Platform Settings in Murtopolis, event branding in Org Admin |
| SSO | Org Settings → Authentication tab |
| Co-organizer roles | Org Settings → Team tab |

---

## Session 4 Decisions — All Locked

All five architecture questions raised in this session were resolved in the Session 4 working conversation. They are incorporated into the Standing Product Decisions section above (decisions 5–9) and should be treated as constraints going forward.

| Question | Decision |
|---|---|
| URL structure | Path-based: `/p/[event-slug]/` — no subdomains at launch |
| Block gating | Fully self-paced; Block 4 is the only hard gate |
| Awards reveal | Platform-generated click-through presentation, screen-shared by Organizer on Demo Day |
| Mobile priority | Participant home, gallery, voting, reflection form, marketing homepage + case study |
| Help center | Notion public pages at launch; Intercom as named upgrade path |

---

## Notes for Session 5 Kickoff

- **Upload the Seven2 Awards PowerPoint** at the start of Session 5. It is the primary reference for the Awards ceremony presentation design treatment.
- The Awards presentation is identified as a signature feature requiring its own distinct visual language — more ceremony, less dashboard. This should be an early design priority in Session 5.
- Session 5 topic: **Design System & Visual Language**

---

*End of Session 4: Information Architecture*
*Next: Session 5 — Design System & Visual Language*
