# Hacksathon.com — Product Requirements Document
## Technical Specification for MVP Build
*Session 7 Handoff — Compiled from Sessions 1–6*
*Version 1.0 — April 2026*

---

## How to Use This Document

This PRD is the single source of truth for building Hacksathon.com. It synthesizes six sessions of product development into a complete specification ready for Cursor. Every decision documented here is locked — refer to the Session documents for rationale when needed.

**Locked decisions that shape every implementation choice:**
- Self-serve SaaS — no facilitation dependency. The platform is the facilitator.
- Per-event pricing only (no subscriptions). Seat count is the variable.
- Block 4 (Planning) is the only hard gate. All other blocks are self-paced.
- Tool-agnostic, Lovable as default.
- Path-based URLs: `/p/[event-slug]/` (no subdomains at MVP).
- The format IS the product — 10 blocks, fixed sequence, every feature serves participant movement.

---

## 1. PRODUCT OVERVIEW

### 1.1 Vision

Hacksathon.com is the structured hackathon platform that turns non-technical teams into builders — in six weeks, part-time. The platform encodes a proven format (first run: Seven2, 100% completion rate, zero prior coding experience) into a self-serve SaaS product that any organization can purchase, configure, and run without facilitation support.

### 1.2 The Core Promise

Any organization should be able to:
1. Sign up
2. Configure a full event in under 10 minutes
3. Invite their team
4. Run the complete 10-block program to Demo Day
5. …without sending a single support message to Hacksathon

That is the definition of "self-serve" and the bar every feature must clear.

### 1.3 Target User

**Primary ICP:** Creative and knowledge-work agencies, 20–200 people. Producers, designers, strategists, project managers. One or two technical people at most. Leadership that wants proof of AI capability before committing.

**Adjacent ICP (confirmed):** Professional services firms — law, accounting, consulting — where the passion project model applies universally.

**Buyer persona:** CMO, agency head, or L&D lead. Budget: $3k–$15k for an event. Not looking for a DIY tool — wants a done-with-you format.

### 1.4 Key Differentiators

| Hacksathon.com | Devpost | DIY Playbooks |
|---|---|---|
| Non-technical teams | Developer teams | Anyone willing to build it themselves |
| Format is the product | Submission infrastructure only | Format dies with the facilitator |
| Guided planning gate (Block 4) | No planning support | Skipped entirely |
| Post-event continuation path | One-time event | No continuation |
| Platform facilitates | Human facilitator required | Human facilitator required |

### 1.5 The Emotional Arc (North Star Metric)

Every feature is measured against this arc:

> **Intimidation → Permission → First output → Surprise → Pride → "I have more ideas"**

---

## 2. USER ROLES & PERMISSIONS

### 2.1 Role Overview

Three roles exist in the system. No user can hold more than one role at platform level, but an Organizer may also be a Participant in an event.

| Role | Who | Primary Surface |
|---|---|---|
| **Platform Admin** | Internal — Murtopolis operators | `/murtopolis/` |
| **Organizer** | Buyer/event owner per organization | `/admin/` |
| **Participant** | Hackathon participant | `/p/[event-slug]/` |

### 2.2 Platform Admin (Murtopolis)

**Can:**
- View and manage all organizations and events across the platform
- Create, edit, suspend, and deactivate organizations
- Manually provision plan tiers and billing (MVP — before self-serve)
- Edit all platform content (block defaults, coaching copy, nudge templates, tool tips) without a code deploy
- Create and manage discount/access codes (percentage-off and fully free)
- Impersonate any Organizer or Participant for support purposes
- Override event state, reset block completion, and take any recovery action
- View platform-level analytics (aggregate completion rates, tool usage, block drop-off)
- Manage affiliate link attribution for Lovable and other tools
- Control feature flags per organization (toggle Growth/Premium features)

**Cannot:**
- Be a Participant in any event (conflict of interest on data)
- Modify Stripe transaction records directly

### 2.3 Organizer

An Organizer is scoped to a single Organization. They see only their own org's data.

**Can:**
- Create and configure events (Event Creator Wizard)
- Invite participants (email or shareable link)
- Customize block titles, descriptions, dates, and time allocations
- Configure award categories (up to 6)
- View all participant progress in real time (Participant Status Dashboard)
- View all submitted ideas, project briefs, and live URLs
- Leave annotations on any participant's Project Brief (async coaching)
- Send announcements and nudge messages to any participant or cohort
- Control block open/close states manually (override the auto-schedule)
- Open and close the voting window for Block 8 (Awards)
- See the live vote tally (hidden from participants until reveal)
- Trigger the awards reveal (category by category)
- Access the post-event Reflection Report (auto-generated)
- Export participant data and reflection quotes as CSV

**Cannot:**
- See another organization's events or data
- Modify platform-level content (Facilitator Notes defaults, nudge templates)
- See individual participant vote choices (only aggregate tally)
- Purchase additional events for other organizations

### 2.4 Participant

A Participant is scoped to a single Event. They see only their own work and the shared gallery.

**Can:**
- Move through all 10 blocks (self-paced, except Block 4 gate)
- Submit one idea (IdeaLab — Block 2)
- Edit and update their idea until the Pitch Block closes
- Complete the Planning flow (Block 4) and generate a Project Brief
- Copy their Starter Prompt and link to the build tool
- Submit a live URL (Block 5)
- Vote in the Awards (one vote per category — cannot vote for own project)
- Submit their Reflection (Block 9)
- Browse the shared project gallery
- View their own complete block history and Project Brief

**Cannot:**
- See another participant's Project Brief (only idea title/description in gallery)
- See vote tallies before the Organizer triggers reveal
- Move to Block 5 before completing Block 4 (hard gate)
- Submit more than one active idea at a time
- Access the Organizer dashboard

---

## 3. FEATURE SPECIFICATIONS

### 3.1 Event Setup and Configuration

#### 3.1.1 Event Creator Wizard

**Description:** A 6-step guided flow for Organizers creating a new event. Must complete in under 10 minutes for a first-time user.

**Steps:**
1. **Event Basics** — Event name, company/team name, expected participant count, event logo upload, primary brand color
2. **Timeline Setup** — Start date, session cadence (weekly/bi-weekly/custom), session length (30/45/60 min). Auto-generates a dated block timeline on input.
3. **Build Tool Selection** — Lovable (default + recommended callout for non-technical teams), Cursor, Bolt, Replit. Selection populates tool-specific coaching tips throughout the event.
4. **Block Review & Customization** — Block-by-block timeline view. Organizer can edit title, description, date, duration per block. Sequence is fixed — display a note: "Block order is the format — it can't be reordered."
5. **Awards Configuration** — Pre-populated defaults: Best in Show, Best Execution, Most Creative Idea, Shut Up and Take My Money, Most [Company] Energy, Best Pitch. Organizer can rename, remove, or leave as-is. Maximum 6 categories.
6. **Launch** — Review summary. Invite method: email list paste or copy a shareable link. Send invites. Confirm → event goes live.

**Acceptance Criteria:**
- Wizard can be completed in under 10 minutes
- Block timeline auto-populates with correct dates given start date and cadence
- Incomplete wizard can be saved as draft and resumed
- Changing tool selection in Step 3 updates all downstream tip sets immediately
- Awards can be modified until voting opens (not after)
- Event cannot launch with fewer than 10 invited participants (enforce minimum)

**Edge Cases:**
- Organizer leaves wizard mid-flow: save progress at each step, resume with same state
- Organizer uploads a non-image as logo: reject with clear error, accept PNG/JPG/SVG only
- Start date set in the past: allow with warning, do not block (some orgs run retroactive events)
- Participant count exceeds purchased package: surface upgrade prompt before launching

---

#### 3.1.2 Organizer Coaching Layer

**Description:** At every block in the Organizer event dashboard, a collapsed "Facilitator Notes" panel provides context: what this block is for, what to watch for, what to do if participants are stuck, and a pre-written async message template. Visible to Organizer only — participants never see it.

**Acceptance Criteria:**
- Coaching panel is collapsed by default and must be deliberately opened
- Each block has unique, non-generic coaching content (not "add your note here")
- Pre-written nudge messages are editable before sending
- Platform Admin can edit all Facilitator Notes defaults from Murtopolis without a code deploy

---

#### 3.1.3 Calendar Invite Generation

**Description:** When Organizer sets the session cadence and start date, the platform generates downloadable `.ics` calendar invites (or Google Calendar add links) for all session dates. Time-blocking was one of the top drivers of Seven2's completion rate — it must be structural.

**Acceptance Criteria:**
- `.ics` file generated on event launch containing all session dates
- Participants receive calendar link in their invite email
- Calendar entries include event name, session number, and link to their participant dashboard

---

### 3.2 Participant Onboarding and Management

#### 3.2.1 Invite System

**Description:** Organizer sends invites from within the platform. Two methods: (1) paste email list, (2) copy a shareable link. Participants click the link, create one account, and are enrolled in the event.

**Acceptance Criteria:**
- A single user account works across all events the participant is enrolled in
- Shareable invite link expires when the Organizer deactivates it or the event ends
- Duplicate email invites produce one account (not two)
- Organizer can add participants post-launch via the same mechanism

---

#### 3.2.2 Participant First-Login Flow

**Description:** Guided onboarding for a participant's first login. Linear, no-skip flow.

**Steps:**
1. Claim invite → Create account (name, role — from a preset list: Designer, Strategist, Producer, Project Manager, Leadership, Other, enter custom — and password)
2. **The Permission Frame (full screen):** "Build something you personally want to exist in the world." This is the first thing every participant sees — before tools, format, or instructions. Single CTA: "I'm ready — let's go."
3. Event timeline overview (all 10 blocks, brief descriptions, dates)
4. Build tool intro card (tool-specific, set by Organizer)
5. CTA: "Start Block 1"

**Acceptance Criteria:**
- Permission Frame cannot be skipped — it is a full-screen moment with a single forward action
- Role field is required but can be set to "Other" with custom text
- On re-login, participant goes directly to their dashboard (no repeat of onboarding)
- If participant's event hasn't started yet, they see a countdown to start date

---

#### 3.2.3 Participant Status Dashboard (Organizer View)

**Description:** Live view of every participant's block completion status. Color-coded: Complete (green), In Progress (yellow), Not Started (grey), At Risk (red — defined as not started on a block that is 2+ days past its scheduled date).

**Acceptance Criteria:**
- Updates in real time (or within 60 seconds via polling)
- One-click nudge from any participant row to pre-populated message template
- Filtering: All / Behind / Completed / At Risk
- Export to CSV includes name, role, email, and block completion status

---

### 3.3 Block 1: Kickoff

**Description:** Orientation block. No submission required. Self-reported completion ("I'm in — show me Block 2").

**Participant sees:**
- Welcome message (Organizer-customized or default)
- Permission Frame (repeated from onboarding — this is intentional)
- Event timeline overview
- Build tool intro card (Lovable/Cursor/Bolt/Replit — tool-specific)
- CTA: "I'm in — show me Block 2"

**Acceptance Criteria:**
- Organizer can customize the welcome message from the Blocks tab
- CTA advances block completion status to complete

---

### 3.4 Block 2: Ideation (IdeaLab)

#### 3.4.1 Idea Submission Form

**Fields:**
- Idea name (required, 60 char max)
- One-line description (required, 120 char max)
- Who is this for? (required, 80 char max)
- Inspiration type: Personal / Work / Wild Card (required — radio)
- Scope Declaration: "This app does ONE thing: ___" (required)

**Scope Validation:** If the Scope Declaration field contains the word "and," trigger inline coaching: *"This might be two ideas. Consider picking one. Simpler scope = higher chance of shipping."* This is a soft warning — it does not block submission. Log scope-flagged ideas for Organizer dashboard.

**Acceptance Criteria:**
- All required fields must be completed before submission
- Scope validation fires on blur, not on submit
- One active idea per participant. To change idea: participant must archive current idea and create new one (archiving is visible to Organizer; cannot be hidden)
- Submitted ideas appear immediately in the shared gallery

---

#### 3.4.2 Idea Gallery

**Description:** Read-only browse of all submitted ideas from the cohort. Social visibility creates peer accountability before the Pitch Block.

**Idea card contains:** Idea name, one-line description, submitter first name + role, inspiration type badge, status tag (Submitted / Pitched / In Build / Shipped / In Progress), emoji reactions.

**Filters:** All / Mine / Personal only / Work only

**Acceptance Criteria:**
- Gallery is visible as soon as the participant submits their own idea
- Organizer can update status tags from the Ideas tab
- Ideas flagged with "and" in scope show a subtle indicator in the Organizer's gallery view only
- Organizer can export all ideas as CSV

---

### 3.5 Block 3: Pitch

**Description:** Pitch preparation workspace. Block completion is self-reported (participant confirms pitch was delivered in the live session).

**Pitch Prep Workspace contains:**
- Participant's idea card (from Block 2, read-only reference)
- Pitch framework: Problem / Solution / Who it's for / Name (4 editable fields, auto-save)
- One-minute countdown timer (optional, inline, no tracking)
- Pitch notes (free-text, auto-save, visible to Organizer after pitch session)

**Peer Gallery:** Post-pitch, Organizer can toggle pitch notes to visible for all participants. This is a manual trigger — default is private until the Organizer opens it.

**Acceptance Criteria:**
- Pitch notes save automatically every 10 seconds
- Block 3 can be marked complete without filling pitch notes (self-reported — Organizer controlled)
- Timer is a UI convenience only — no data is recorded from it

---

### 3.6 Block 4: Planning (GATED)

This is the most important block in the platform. It is the only hard gate in the system. Participants cannot access Block 5 until Block 4 is marked complete.

#### 3.6.1 Gate Message

Full-screen interstitial before the planning flow begins:

> "You can't start building yet. This is the most important 30 minutes of the whole program. Participants who plan before they build ship better products. The next steps will generate your Project Brief — the document that becomes your first prompt."

Single CTA: "I'm ready to plan."

---

#### 3.6.2 Conversational Planning Flow

A 5-step guided conversation. Each step is a single question with an open text field. Progress is saved after each step. Steps cannot be skipped.

**Step 1 — Core Function**
Question: *"What does this do? Describe the core function in one sentence."*
Coaching tip (inline): "Focus on the verb. 'It lets people ___' is the format."

**Step 2 — Target User**
Question: *"Who is this for? Describe one specific person."*
Coaching tip: "Not 'busy professionals' — more like 'a dad who travels for work and misses bedtime.'"

**Step 3 — Visual Direction**
Question: *"What does it look like? Describe the vibe, feel, and any reference websites."*
Fields: Vibe/feel description (text), Reference site URL (optional, validated as URL), Color/tone notes (text, optional)
Coaching tip: "Think about apps you love the feel of — not the features, the feeling. Paste a URL if you have one."

**Step 4 — Scope Guard**
Question: *"What does it NOT do? List at least two things this app will never include."*
Coaching tip: "This is the hardest question. If you're tempted to add a feature — it probably goes here."

**Step 5 — Done State**
Question: *"What does success look like? Your build is done when ___."*
Coaching tip: "Think demo-worthy, not perfect. You'll know it's working when you can show it in 3 minutes."

---

#### 3.6.3 Project Brief (Auto-Generated Output)

After the 5-step flow, the platform auto-generates a structured one-page Project Brief. The participant can edit any section inline before finalizing.

**Project Brief sections:**
- **Project Name** (from idea submission)
- **One-Sentence Scope** (from Step 1)
- **Target User** (from Step 2)
- **Core Feature** (AI-synthesized from Steps 1 + 5 — editable)
- **Design Direction** (from Step 3 — vibe text + reference URL)
- **Out of Scope** (from Step 4)
- **Done Looks Like** (from Step 5)

**AI synthesis note:** The Project Brief uses Claude API to synthesize a "Core Feature" field from the participant's Step 1 and Step 5 answers. This is a brief, single-sentence synthesis. If API call fails, the field defaults to the raw Step 1 text.

**Acceptance Criteria:**
- Brief is saved as a named document attached to the participant's event record
- Organizer can view and annotate any participant's Project Brief
- Participant can edit any Brief field after generation (with all edits saved and versioned)
- Brief is visible as a collapsible reference panel throughout Block 5 and Block 6

---

#### 3.6.4 Starter Prompt Generator

After the Project Brief is finalized, a single prominent button appears:

**"Copy your first prompt →"**

This generates a correctly formatted, copy-ready prompt for the selected build tool. The prompt incorporates: core function (Step 1), target user (Step 2), visual direction (Step 3), out-of-scope constraints (Step 4), and done state (Step 5).

**Format differs by tool:**
- **Lovable:** Narrative paragraph prompt with visual direction embedded
- **Cursor:** Structured prompt with system prompt section
- **Bolt:** Condensed single-paragraph prompt
- **Replit:** Descriptive prompt with file structure hint

Immediately below the copy button:
- Link to the selected build tool (Lovable link = affiliate-attributed)
- Helper text: "Paste this as your first message in [tool name]. Come back here when you have a live URL."

**Block 4 is marked complete when:** Project Brief is saved AND Starter Prompt copy button has been clicked (registered as an event in the database).

**Acceptance Criteria:**
- Copy button uses clipboard API with a "Copied!" confirmation state
- Affiliate link for Lovable includes UTM params + tracking ID
- Block 5 shows an unlocked state only after Block 4 complete event is recorded
- If participant returns to Block 4 later, they can regenerate or copy the Starter Prompt

---

### 3.7 Block 5: Build

**Description:** The main build period. No AI features in the platform during this block — participants are working in their external build tool. The platform provides reference, coaching, and URL submission.

**Contents:**
- Project Brief (read-only, collapsible reference panel)
- Starter Prompt (display + re-copy button)
- Build tool link (with tool name — Lovable link is affiliate-attributed)
- Build coaching tip cards (tool-specific, 4 cards):
  - "How to give design direction" (reference site method)
  - "When you're stuck" (break the problem down, try a different prompt)
  - "Scope creep warning signs" (if your build takes longer to describe than build — simplify)
  - "What 'done' looks like for a demo" (3 minutes, one happy path)
- **Live URL submission field** — required to complete block
  - Validation: must be a publicly accessible URL (HTTP 200 response check)
  - Error state: "This URL isn't publicly accessible. Make sure your project is published."
- **Project status toggle:** Building / Stuck / Ready to demo (updates Organizer dashboard in real time)

**Acceptance Criteria:**
- URL validation fires on blur and again on submit
- Submitted URL is immediately visible in Organizer's Projects tab
- Participant can update their URL after submission (e.g., if they deploy to a different domain)
- "Stuck" status triggers a prompt: "Tell us what's blocking you?" (optional text — goes to Organizer dashboard)
- Coaching tip cards can be collapsed individually

---

### 3.8 Block 6: Mid-Check

**Description:** A structured async check-in midway through the Build period. Surfaces blockers early. Lightweight in MVP — a 3-question form.

**Questions:**
1. "Where are you?" — On track / Stuck / Pivoted (required, radio)
2. "Biggest blocker right now?" — Free text, optional
3. "What's your live URL so far?" — Optional (for Organizer visibility even before Block 5 submission)

**Coaching response:** If participant selects "Stuck," surface the top 3 Build coaching tips for their selected tool automatically.

**Organizer view:** Mid-check responses appear on the Participant detail view with a timestamp. "Stuck" and "Pivoted" responses are highlighted.

**Acceptance Criteria:**
- Mid-Check form is separate from Block 5 URL submission — it serves monitoring, not completion
- Optional URL in Mid-Check does not satisfy Block 5's URL submission requirement
- "Pivoted" response appears as an alert in Organizer dashboard (participant may need to update their idea)

---

### 3.9 Block 7: Demo Day

**Description:** Demo preparation workspace. Completion is self-reported (demo delivered in the live session).

**Contents:**
- **Demo framework** (4-field template, editable, auto-save):
  - "What it is" (1 sentence)
  - "Why I built it" (personal story, 2–3 sentences)
  - "Show the thing" (reminder — not a text field; prompt to practice the live flow)
  - "What's next" (1 sentence)
- **3-minute countdown timer** (optional, inline)
- **Demo order** (published by Organizer — visible once set)
- **Project gallery** (all live URLs, Organizer-published on block open)
- Live URL field — pre-populated from Block 5, editable if updated

**Acceptance Criteria:**
- Demo notes auto-save every 10 seconds
- Organizer can set and publish demo order from the Projects tab (drag-to-reorder)
- Project gallery is only visible when Organizer publishes it (default: hidden)
- Block marked complete by Organizer (not self-reported — this is the one exception to self-reporting)

---

### 3.10 Block 8: Awards

#### 3.10.1 Voting Ballot

**Trigger:** Organizer opens voting from the Awards Control Center. All participants receive an in-app notification + email.

**Ballot layout:**
- One card per award category (configured during event setup, up to 6)
- Each card shows all submitted project names
- Participant selects one project per category
- Own project is not selectable (greyed out with tooltip: "You can't vote for your own project")
- Single "Submit all votes" action — cannot vote category by category

**Acceptance Criteria:**
- Voting is anonymous — Organizer sees tallies only, not who voted for what
- Each participant can vote exactly once (re-voting not allowed after submission)
- Voting window closes when Organizer clicks "Close voting" — not on a timer
- Organizer sees live vote count: "X of Y participants have voted" (no tallies visible during open window to anyone)
- Post-close, Organizer sees full tally per category

---

#### 3.10.2 Awards Reveal Presentation

**Description:** A platform-generated click-through presentation mode. Organizer triggers it during Demo Day (typically Zoom/Teams screen share). This is a signature feature — it gets its own design treatment with ceremony energy, not dashboard UI.

**Reveal sequence:**
- Organizer enters Presentation Mode (full-screen, clean — no admin chrome)
- Category-by-category advance (Organizer clicks to advance)
- Each category: category name → "And the winner is..." → Project name + builder first name + vote count (as percentage or fraction)
- **Best in Show is always last.** It gets a distinct visual treatment.
- After all reveals: winner cards for each category (shareable images, auto-generated)

**Acceptance Criteria:**
- Presentation Mode works correctly when screen-shared (no hover states that require mouse precision)
- Participants watching asynchronously (not on Zoom) see a "Results are being revealed live" state until Organizer completes the reveal, then see all results
- Each winner card is a downloadable square image (1080x1080px) with: project name, category name, event name, company name. Suitable for Slack and LinkedIn.
- Best in Show winner card gets a distinct visual treatment from category winners

---

### 3.11 Block 9: Reflect

**Description:** A 7-question structured reflection form. Completion is required before the Continue block or any post-event content is accessible.

**Questions (all open text unless noted):**
1. "What surprised you most about this experience?"
2. "What would you do differently if you started over?"
3. "What advice would you give to the next participant?"
4. "How has your relationship with AI changed?"
5. "What ideas do you now want to build next?"
6. "What was the most useful part of the platform for you?"
7. "One word to describe the experience." (single word, validated)

**Quote opt-in toggle:** "Allow my reflection quotes to be used in the event report and future case studies." Defaults to opt-in. Participant can toggle off any time before event wrap-up.

**Acceptance Criteria:**
- All 7 questions are required
- Question 7 validates that input is a single word (no spaces)
- Opt-out state is respected — opted-out quotes never appear in reports or marketing
- Reflection data exports as part of Organizer Reflection Report

---

#### 3.11.1 Organizer Reflection Report (Auto-Generated)

**Description:** Auto-generated post-event summary. This is the ROI document the Organizer presents to their CEO. It must require zero manual synthesis.

**Sections:**
- Event summary stats: completion rate, reflection submission rate, vote participation, ideas submitted vs. shipped
- Participant breakdown by role
- Top reflection quotes (opted-in only, 5–8 auto-selected by most-quoted theme words — or manual selection in MVP)
- Most common one-word answers (word frequency table from Question 7)
- Block completion funnel (% who completed each block)

**Acceptance Criteria:**
- Report is auto-generated when all reflections are submitted OR when Organizer manually triggers it
- All opted-in quotes are attributed to first name + role only
- Report is exportable as PDF (using browser print / save as PDF in MVP)
- Organizer can manually flag favorite quotes with a star

---

### 3.12 Block 10: Continue

**Description:** Post-event wrap-up and next-steps surface. Placeholder in MVP with a designed holding state.

**Contents:**
- Event summary card: project name + live URL + award won (if applicable) + one-word reflection answer
- IdeaLab: participant's full idea bank (all submitted ideas, persistent — even after event closes)
- New project prompt: "What do you want to build next?" → CTA links to Block 4 planning flow in standalone mode (GROWTH feature — placeholder CTA in MVP)
- Platform message: "You're now a builder. More tools coming soon."

**Acceptance Criteria:**
- Continue block is accessible only after Reflection (Block 9) is submitted
- Award badge on summary card matches the Awards reveal result
- Idea bank remains accessible indefinitely (ideas are not deleted when event ends)

---

### 3.13 Communications

#### 3.13.1 Announcement Layer

**Description:** Organizer sends notifications from within the platform. Delivered in-app + email. Platform also sends automatic notifications for key events.

**Automatic notifications (platform-triggered, no Organizer action required):**
- Invite received (email with invite link)
- Event starts (when first block opens)
- Block 4 open (special emphasis — "Time to plan before you build")
- Block 5 URL submission reminder (3 days before Demo Day if URL not submitted)
- Voting opens (email + in-app)
- Voting closes (in-app)
- Reflection form open (post-Demo Day)

**Organizer-triggered:**
- Custom announcements (free text, subject line, send to all or filtered group)
- Nudge templates (pre-written, one-click send): At-risk/behind messages, block-specific encouragement

**Acceptance Criteria:**
- All emails use Resend (see Tech Stack section)
- In-app notifications appear in a notification bell in the participant nav
- Organizer can see send status (delivered/bounced) for email notifications
- Participant can unsubscribe from non-essential emails (not from event-critical ones)

---

### 3.14 Discount and Access Codes

**Description:** Platform Admin creates and manages codes from Murtopolis. Two types: percentage-off (e.g., 20% off) and fully free (100% off = free access code for beta partners).

**Code properties:**
- Type: percentage-off or free
- Value: percentage (1–100)
- Usage limit: integer (default: 1 for targeted codes, unlimited for campaigns)
- Expiration: date (optional)
- Label: internal name for tracking (e.g., "Beta Partner — Agency A", "LinkedIn May 2026")

**Organizer experience:** Code field on checkout page. Validation fires on entry. Success state shows applied discount. Error state: "This code isn't valid or has expired."

**Acceptance Criteria:**
- Used codes cannot be redeemed again past their usage limit
- Expired codes return an error, not a blank
- Platform Admin can see usage status per code: Created / Used (with date and org) / Expired
- Returning customer 20% discount is applied automatically at checkout — no code required

---

### 3.15 Murtopolis Platform Admin

**Impersonation:** Platform Admin can view any Org Admin dashboard or any Participant experience as that user. All impersonation sessions are logged with a timestamp and the Admin's user ID.

**Content Management (no-deploy edits):**
All of the following are editable from Murtopolis without a code deploy:
- Block default titles, descriptions, and time allocations
- Facilitator Notes per block (the Organizer coaching layer)
- Participant onboarding screens (text only)
- Permission Frame copy
- Nudge template library
- Build tool coaching tip cards (per tool)
- Awards default category names

**Acceptance Criteria:**
- Content edits in Murtopolis take effect on all new events created after the edit
- In-progress events use the content as-of their creation date (no retroactive changes)
- Content editing interface is a simple textarea with save — no rich text needed in MVP

---

## 4. DATA MODEL

### 4.1 Multi-Tenancy

Hacksathon is a multi-tenant SaaS platform. The `organizations` table is the tenant root. All event, participant, and content data is scoped to an organization. Row-Level Security (RLS) in Supabase enforces organization-level data isolation at the database level.

Platform Admins bypass RLS for support and operations purposes via a service-role Supabase key (server-side only — never exposed to the client).

---

### 4.2 Entity Relationship Overview

```
organizations
    └── users (via organization_members — role: organizer | participant)
    └── events
            └── event_participants (junction: user ↔ event, with role)
            └── blocks (event-specific block config)
                    └── block_completions (user ↔ block ↔ event)
            └── ideas (1 active per participant per event)
            └── project_briefs (1 per participant per event — generated at Block 4)
            └── starter_prompts (1 per project_brief)
            └── pitch_notes (1 per participant per event)
            └── projects (live_url submission — 1 per participant per event)
            └── award_categories (configured per event)
            └── votes (1 per participant per category per event)
            └── reflections (1 per participant per event)
            └── notifications (per event, per recipient)
            └── announcements (per event, from organizer)
    └── purchases (Stripe purchase per event)
    └── discount_codes (scoped to platform — not per org)
```

---

### 4.3 Core Table Schemas

#### organizations
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
name                text NOT NULL
slug                text UNIQUE NOT NULL
logo_url            text
primary_color       text DEFAULT '#000000'
billing_email       text
plan_tier           text DEFAULT 'none'  -- 'none' | 'active' | 'suspended'
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### users
```sql
id                  uuid PRIMARY KEY REFERENCES auth.users
email               text NOT NULL UNIQUE
display_name        text NOT NULL
is_platform_admin   boolean DEFAULT false
created_at          timestamptz DEFAULT now()
```

#### organization_members
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
org_id              uuid REFERENCES organizations NOT NULL
user_id             uuid REFERENCES users NOT NULL
role                text NOT NULL  -- 'organizer' | 'participant'
created_at          timestamptz DEFAULT now()
UNIQUE(org_id, user_id)
```

#### events
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
org_id              uuid REFERENCES organizations NOT NULL
slug                text UNIQUE NOT NULL  -- used in /p/[event-slug]/
name                text NOT NULL
start_date          date
session_cadence     text  -- 'weekly' | 'biweekly' | 'custom'
session_length_min  integer DEFAULT 45
build_tool          text DEFAULT 'lovable'  -- 'lovable' | 'cursor' | 'bolt' | 'replit'
status              text DEFAULT 'setup'  -- 'setup' | 'active' | 'demo_day' | 'complete' | 'archived'
invite_link_active  boolean DEFAULT true
branding_logo_url   text
branding_color      text
min_participants    integer DEFAULT 10
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### event_participants
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
role                text DEFAULT 'participant'  -- 'organizer' | 'participant'
self_reported_role  text  -- designer | strategist | producer | pm | leadership | other
custom_role         text  -- if self_reported_role = 'other'
onboarding_complete boolean DEFAULT false
invited_at          timestamptz DEFAULT now()
joined_at           timestamptz
UNIQUE(event_id, user_id)
```

#### blocks
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
block_number        integer NOT NULL  -- 1–10
title               text NOT NULL
description         text
scheduled_date      date
duration_minutes    integer DEFAULT 45
status              text DEFAULT 'upcoming'  -- 'upcoming' | 'open' | 'closed'
is_gated            boolean DEFAULT false  -- true only for block 4
gate_source_block   integer  -- block 4 gate requires block_number = 3 complete
facilitator_notes   text  -- organizer-only coaching content
nudge_template      text  -- pre-written message template
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
UNIQUE(event_id, block_number)
```

#### block_completions
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
block_number        integer NOT NULL
completed_at        timestamptz DEFAULT now()
completion_method   text  -- 'self_reported' | 'url_submitted' | 'organizer_marked' | 'form_submitted'
UNIQUE(event_id, user_id, block_number)
```

#### ideas
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
name                text NOT NULL
one_liner           text NOT NULL
who_is_it_for       text NOT NULL
inspiration_type    text NOT NULL  -- 'personal' | 'work' | 'wild_card'
scope_declaration   text NOT NULL  -- "This app does ONE thing: ___"
scope_flagged       boolean DEFAULT false  -- true if scope_declaration contains 'and'
status              text DEFAULT 'submitted'  -- 'submitted' | 'pitched' | 'in_build' | 'shipped' | 'in_progress'
is_active           boolean DEFAULT true  -- false = archived
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### project_briefs
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
idea_id             uuid REFERENCES ideas
project_name        text NOT NULL
one_sentence_scope  text NOT NULL
target_user         text NOT NULL
core_feature        text  -- AI-synthesized from steps 1+5, editable
design_vibe         text  -- from step 3
reference_url       text
color_tone_notes    text
out_of_scope        text NOT NULL
done_looks_like     text NOT NULL
starter_prompt_copied_at  timestamptz  -- set when copy button clicked = block 4 complete trigger
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
UNIQUE(event_id, user_id)
```

#### projects
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
idea_id             uuid REFERENCES ideas
live_url            text NOT NULL
url_validated_at    timestamptz
url_is_accessible   boolean
build_status        text DEFAULT 'building'  -- 'building' | 'stuck' | 'ready_to_demo'
stuck_description   text
gallery_visible     boolean DEFAULT false  -- toggled by organizer
submitted_at        timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
UNIQUE(event_id, user_id)
```

#### award_categories
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
name                text NOT NULL
display_order       integer NOT NULL
is_best_in_show     boolean DEFAULT false  -- exactly one per event
voting_open         boolean DEFAULT false
voting_closed       boolean DEFAULT false
reveal_triggered    boolean DEFAULT false
created_at          timestamptz DEFAULT now()
```

#### votes
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
category_id         uuid REFERENCES award_categories NOT NULL
voter_user_id       uuid REFERENCES users NOT NULL
project_id          uuid REFERENCES projects NOT NULL
created_at          timestamptz DEFAULT now()
UNIQUE(event_id, category_id, voter_user_id)  -- one vote per category per participant
```

#### reflections
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events NOT NULL
user_id             uuid REFERENCES users NOT NULL
q1_surprised        text NOT NULL
q2_differently      text NOT NULL
q3_advice           text NOT NULL
q4_ai_relationship  text NOT NULL
q5_next_ideas       text NOT NULL
q6_most_useful      text NOT NULL
q7_one_word         text NOT NULL
quote_opt_in        boolean DEFAULT true
organizer_starred   boolean DEFAULT false
created_at          timestamptz DEFAULT now()
UNIQUE(event_id, user_id)
```

#### purchases
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
org_id              uuid REFERENCES organizations NOT NULL
event_id            uuid REFERENCES events
stripe_payment_intent_id  text UNIQUE
stripe_session_id   text UNIQUE
amount_cents        integer NOT NULL
currency            text DEFAULT 'usd'
participant_count   integer NOT NULL
package_tier        text NOT NULL  -- 'boutique' | 'agency' | 'studio' | 'large'
discount_code_id    uuid REFERENCES discount_codes
discount_applied_pct integer DEFAULT 0
status              text DEFAULT 'pending'  -- 'pending' | 'complete' | 'refunded'
created_at          timestamptz DEFAULT now()
```

#### discount_codes
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
code                text UNIQUE NOT NULL
type                text NOT NULL  -- 'percentage' | 'free'
discount_pct        integer NOT NULL  -- 1-100 (100 = free)
usage_limit         integer  -- null = unlimited
uses_count          integer DEFAULT 0
expires_at          timestamptz
label               text  -- internal label for tracking
created_by_admin_id uuid REFERENCES users
created_at          timestamptz DEFAULT now()
```

#### notifications
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events
recipient_user_id   uuid REFERENCES users NOT NULL
type                text NOT NULL  -- 'invite' | 'block_open' | 'voting_open' | 'nudge' | 'announcement' | etc.
subject             text
body                text NOT NULL
channel             text NOT NULL  -- 'email' | 'in_app' | 'both'
sent_at             timestamptz
read_at             timestamptz
email_status        text  -- 'delivered' | 'bounced' | 'pending'
created_at          timestamptz DEFAULT now()
```

---

### 4.4 Supabase RLS Policies (Key Rules)

```sql
-- Participants can only read their own org's events
-- Organizers can read/write events within their org
-- All policies reference auth.uid() and organization_members

-- Example: events table
CREATE POLICY "org_members_can_read_their_events" ON events
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Votes: participants can only insert (never read individual votes)
CREATE POLICY "participants_can_insert_votes" ON votes
  FOR INSERT WITH CHECK (
    voter_user_id = auth.uid()
    AND project_id NOT IN (
      SELECT id FROM projects WHERE user_id = auth.uid()  -- can't vote for own project
    )
  );

CREATE POLICY "only_organizers_can_read_vote_tallies" ON votes
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_participants
      WHERE user_id = auth.uid() AND role = 'organizer'
    )
  );
```

---

## 5. INTEGRATION ARCHITECTURE

### 5.1 How the Tools Become Modules

The five existing standalone tools (IdeaLab, Hacky Awards, ZERO.Prmptr, EDIT.Prmptr, Hacksathon playbook) become integrated modules within the block-based platform. No standalone logins. No separate URLs. Single identity.

| Standalone Tool | Becomes |
|---|---|
| IdeaLab | Block 2: Ideation module |
| ZERO.Prmptr | Block 4: Planning module (conversational brief flow) |
| EDIT.Prmptr | Document editing layer inside any block that produces output |
| Hacky Awards | Block 8: Awards module + Reveal presentation mode |
| Hacksathon playbook (PDF) | Encoded into Organizer coaching layer + block descriptions |

### 5.2 Shared vs. Module-Specific Tables

**Shared across all modules (platform core):**
- `organizations`, `users`, `organization_members`
- `events`, `event_participants`, `blocks`, `block_completions`
- `notifications`, `purchases`, `discount_codes`

**Module-specific:**
- IdeaLab module: `ideas`
- Planning module: `project_briefs` (ZERO.Prmptr data lives here)
- Document editing: Uses `project_briefs`, `pitch_notes`, `reflections` — EDIT.Prmptr is a UI component, not a separate data store
- Build module: `projects`
- Awards module: `award_categories`, `votes`
- Reflections module: `reflections`

### 5.3 AI Integration

**Claude API (Anthropic) is used in two places at MVP:**

1. **Block 4 — Project Brief synthesis** (server-side)
   - Trigger: Participant completes Step 5 of planning flow
   - Input: Steps 1–5 answers
   - Prompt: Synthesize a single-sentence "Core Feature" from the core function and done-state answers
   - Output: One sentence, written in plain language, max 25 words
   - Model: `claude-sonnet-4-20250514`
   - Max tokens: 100
   - Error handling: On API failure, default to Step 1 raw text

2. **Block 4 — Starter Prompt generation** (server-side)
   - Trigger: Participant clicks "Copy your first prompt"
   - Input: Complete Project Brief fields + selected build tool
   - Prompt: Format this brief as a correctly structured first prompt for [tool]
   - Output: Copy-ready prompt string, no markdown
   - Model: `claude-sonnet-4-20250514`
   - Max tokens: 500

**All Claude API calls are server-side only.** The API key is never exposed to the client. Use Next.js API routes (or Supabase Edge Functions) as the server-side proxy.

### 5.4 Stripe Integration

**Per-event, one-time payments. No subscriptions.**

**Checkout flow:**
1. Organizer completes Event Creator Wizard
2. Redirected to checkout: shows event name, participant count, applicable package tier, total
3. Discount code field (optional) — validate on entry via API
4. Returning customer 20% auto-applied (check for prior completed `purchases` record on account)
5. Stripe Checkout session created server-side
6. On success: `purchases` record updated, event status set to `active`, Organizer receives confirmation email

**Webhook events to handle:**
- `checkout.session.completed` → Activate event, send confirmation
- `payment_intent.payment_failed` → Notify Organizer, do not activate event

**Package tier determination (server-side, not client-side):**
```
10–25 seats  → boutique  → $85/seat
26–50 seats  → agency    → $80/seat
51–100 seats → studio    → $70/seat
101–200 seats → large    → $65/seat
200+         → contact_us (no self-serve checkout)
```

### 5.5 Email (Resend)

All transactional email is sent via Resend. Templates are plain-text-first with minimal HTML styling (consistent with the "earned confidence, not hype" brand personality).

**Required email templates at MVP:**
- `invite` — Participant invite with join link + calendar invite attachment
- `event_confirmation` — Organizer purchase confirmation
- `block_open` — Block N is now open (automated)
- `block4_reminder` — Special Block 4 emphasis email ("Most important 30 minutes...")
- `voting_open` — Voting is live
- `reflection_reminder` — Demo Day is complete — time to reflect
- `nudge_[type]` — Organizer-triggered nudge templates (rendered server-side with dynamic content)

### 5.6 API Route Overview

```
POST /api/auth/signup              Create user + org member record
POST /api/events/create            Event wizard completion → create event
POST /api/events/[id]/invite       Send invite emails or generate invite link
GET  /api/events/[slug]/blocks     Participant block list with completion status
POST /api/blocks/complete          Mark block complete (with completion_method)
POST /api/ideas/submit             Submit or update idea
POST /api/brief/generate           Claude API: synthesize Core Feature
POST /api/brief/starter-prompt     Claude API: generate Starter Prompt
POST /api/projects/submit          Submit live URL (triggers async URL validation)
POST /api/votes/submit             Submit all votes (atomic — all categories at once)
POST /api/reflections/submit       Submit reflection form
POST /api/awards/open-voting       Organizer opens voting window
POST /api/awards/close-voting      Organizer closes voting window
POST /api/awards/reveal            Organizer triggers reveal per category
POST /api/checkout/create          Create Stripe Checkout session
POST /api/checkout/webhook         Stripe webhook handler
POST /api/codes/validate           Validate discount code at checkout
GET  /api/admin/event/[id]         Organizer event dashboard data
GET  /api/murtopolis/events        Platform admin: all events
POST /api/murtopolis/orgs/create   Manually provision an organization
PATCH /api/murtopolis/content      Edit platform content (blocks, templates, copy)
```

---

## 6. TECH STACK RECOMMENDATION

### 6.1 Stack Summary

| Layer | Choice | Justification |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Industry standard, Vercel-native, server components reduce client bundle, strong ecosystem |
| Database | Supabase (PostgreSQL) | You're already familiar with it, RLS handles multi-tenancy elegantly, real-time subscriptions for live updates, includes Auth and Storage |
| Auth | Supabase Auth | Magic link + email/password. Simple, already in Supabase, no separate service needed at MVP |
| Payments | Stripe | Per-event checkout, no subscription complexity, excellent Next.js integration, handles 1099 compliance for affiliates later |
| AI | Anthropic Claude API | Two specific use cases (Brief synthesis + Starter Prompt). `claude-sonnet-4-20250514`. Server-side only. |
| Email | Resend | Clean developer experience, React Email templates, Vercel-native, excellent deliverability |
| Hosting | Vercel | You're already using it, zero-config Next.js deploy, edge functions, preview deployments for review |
| Storage | Supabase Storage | Logo uploads, winner card image generation assets — already included with Supabase |
| Analytics | PostHog | Self-hosted option available, product analytics (not just pageviews), session recording, feature flags |
| Help Center | Notion (public pages) | Free, fast to set up, editable without engineering. `/help/` redirects to Notion URL. |
| Affiliate | Manual at launch → PartnerStack at scale | Manual tracking via UTM params and discount codes at MVP. PartnerStack when affiliate program is active. |

### 6.2 Key Implementation Notes

**Supabase Real-Time for Participant Status Dashboard:**
Use Supabase's real-time subscriptions on `block_completions` table to push live updates to the Organizer dashboard. No polling needed.

```typescript
const channel = supabase
  .channel('block-completions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'block_completions',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Update participant status in UI
  })
  .subscribe()
```

**Awards Reveal Real-Time:**
Voting reveal state changes (`reveal_triggered` on `award_categories`) should also use Supabase real-time so participants watching asynchronously see reveals update without refreshing.

**URL Validation (Block 5):**
Perform URL accessibility check server-side via an API route that makes a HEAD request to the submitted URL. Set a 5-second timeout. This prevents checking local/private URLs.

**Starter Prompt Generation:**
Generate on button click (not on Brief save) to avoid unnecessary API calls. Cache the result per `project_brief.id` in the `project_briefs` table so re-copies don't re-generate.

**Winner Card Image Generation:**
Use Vercel's `@vercel/og` library to generate 1080x1080px PNG winner card images server-side. No external image generation service needed.

### 6.3 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         # Server-side only — never expose to client
ANTHROPIC_API_KEY                 # Server-side only — never expose to client
STRIPE_SECRET_KEY                 # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL               # https://hacksathon.com in prod
LOVABLE_AFFILIATE_BASE_URL        # Base URL for Lovable affiliate tracking
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Core Platform (Auth, Orgs, Event Setup)
**Goal:** An Organizer can sign up, create an event, and invite participants.

- Supabase project setup (auth, database schema, RLS policies)
- Next.js project scaffold with App Router, Tailwind, Supabase client
- Auth: signup, login, magic link, session management
- Organization creation (post-signup wizard: org name, logo, color)
- Event Creator Wizard (all 6 steps) — no payment yet (use free access code flow)
- Participant invite system (email list + shareable link)
- Participant first-login flow (Permission Frame, role selection, onboarding)
- Basic block display (participant dashboard showing all 10 blocks, upcoming states)
- Block 1: Kickoff (simple content block, self-reported completion)
- Organizer event dashboard: Overview tab + Participant tab (status tracker)
- Murtopolis: basic org management, event overview, content management (no deploy edits)
- Resend email: invite + event_confirmation templates

**Definition of done:** An Organizer signs up, creates an event, invites 3 participants (including themselves), and all 3 can log in and complete Block 1.

---

### Phase 2: Ideation Module (IdeaLab → Block 2)
**Goal:** Participants can submit ideas; the shared gallery creates social accountability.

- Idea submission form with scope validation ("and" detection + inline coaching)
- One-active-idea-per-participant enforcement + archive flow
- Shared idea gallery (all participants)
- Idea status tracking (Organizer can update tags)
- Block 2 completion logic (idea submitted = block 2 complete)
- Block 3: Pitch prep workspace (framework fields, timer, self-reported completion)
- Organizer: Ideas tab (gallery + scope flag alerts + CSV export)

**Definition of done:** A participant submits an idea, sees their cohort's gallery, and Organizer sees all ideas in the admin view.

---

### Phase 3: Documentation Module (Block 4 — Planning Gate)
**Goal:** The most critical block. Block 5 does not exist until Block 4 is complete.

- Block 4 gate message (full-screen interstitial)
- 5-step conversational planning flow (fields, coaching tips, progress save)
- Claude API integration: Core Feature synthesis + Starter Prompt generation (server-side)
- Project Brief auto-generation and inline editing
- Starter Prompt copy button + Lovable affiliate link
- Block 4 completion logic: Brief saved + Starter Prompt copied
- Block 5: Build workspace (Brief reference, coaching cards, URL submission, URL validation)
- Block 5 completion: URL submitted = block 5 complete
- Organizer: Block 4 gate visibility (who has/hasn't completed Planning)
- Organizer: Projects tab (all live URLs, URL validation status, demo order editor)

**Definition of done:** A participant completes all 5 planning steps, generates a Project Brief, copies their Starter Prompt, and Block 5 unlocks. Organizer sees the submitted URL in real time.

---

### Phase 4: Awards and Reflections (Blocks 6, 7, 8, 9, 10)
**Goal:** The complete event lifecycle through Demo Day and post-event.

- Block 6: Mid-check form (3 questions, "stuck" coaching response)
- Block 7: Demo prep workspace (framework, timer, gallery publish)
- Block 8: Awards voting ballot (anonymous, one-per-category, no self-votes)
- Awards Control Center (Organizer): open/close voting, live tally, category-by-category reveal
- Awards Presentation Mode (full-screen, click-through reveal, Best in Show last)
- Winner card image generation (`@vercel/og`) — downloadable PNG
- Block 9: Reflection form (7 questions, quote opt-in toggle)
- Organizer Reflection Report (auto-generated: stats, quotes, funnel, word table)
- Block 10: Continue placeholder (summary card, idea bank, "more coming soon")
- Resend email: voting_open, reflection_reminder templates

**Definition of done:** A complete test event runs from Block 1 → Block 10. Organizer can run the Awards reveal live. Reflection report auto-generates.

---

### Phase 5: Analytics and Showcase
**Goal:** Post-event ROI visibility and organic marketing surface.

- Event Summary Dashboard (Organizer): completion rate, reflection rate, vote participation
- Organizer Progress Tracker (real-time Supabase subscription on block_completions)
- Murtopolis Analytics: aggregate completion rates, tool usage, block drop-off analysis
- Notification system: all automatic platform notifications (Resend)
- Organizer announcement layer + nudge templates
- Block open/close notifications (automatic, triggered on block status change)

---

### Phase 6: Payments, Marketing Site, and Beta Launch
**Goal:** Self-serve purchasing live. Marketing site live. Beta partner access codes issued.

- Stripe Checkout integration (per-event, one-time payment)
- Package tier determination (seat count → band → price)
- Discount/access code system (Murtopolis code management + checkout validation)
- Returning customer 20% auto-discount (check prior purchases on checkout)
- Stripe webhooks (checkout.session.completed → activate event)
- Marketing site (Next.js pages): Homepage, How It Works, Pricing, Seven2 Case Study, FAQ, About, Contact
- `/help/` redirect to Notion
- Beta access codes issued to 3–5 partner companies

**Definition of done:** An Organizer who has never contacted us can find the site, purchase an event, configure it, invite their team, and run it to Demo Day without any intervention from Murtopolis.

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### 8.1 Performance

- **Participant dashboard initial load:** < 2 seconds (LCP) on a standard broadband connection
- **Block transitions (self-reporting completion, advancing):** < 500ms perceived response
- **Claude API calls (Brief synthesis, Starter Prompt):** Acceptable to show a loading state for up to 5 seconds. Surface a spinner with copy: "Generating your brief..." — do not block UI.
- **URL validation (Block 5):** Async — show "Checking your URL..." for up to 5 seconds, then show result. Do not block submission while validating.
- **Awards reveal:** Must be smooth during live screen share. No loading states during the reveal sequence — all vote data must be pre-loaded before Organizer enters Presentation Mode.
- **Real-time Supabase subscriptions:** Organizer dashboard updates within 3 seconds of a participant action.

### 8.2 Security

- **API keys are server-side only.** Anthropic API key and Stripe secret key must never appear in client-side code or be accessible from the browser. Use Next.js API routes as server-side proxies.
- **Supabase RLS is the primary access control layer.** Every table has RLS policies. The service-role key is used server-side only for platform admin operations.
- **Stripe webhook validation.** All Stripe webhooks must be verified using `stripe.webhooks.constructEvent()` with the webhook secret before processing.
- **Vote integrity.** The `UNIQUE(event_id, category_id, voter_user_id)` constraint is enforced at the database level (not just application level) to prevent duplicate votes.
- **Impersonation logging.** All Platform Admin impersonation sessions are logged with admin user ID, target user ID, and timestamp. This log is append-only (no deletes).
- **No sensitive data in client-side state.** Vote tallies, Stripe payment details, and other participant data are never cached in client-side storage (localStorage, sessionStorage, cookies).
- **HTTPS everywhere.** Enforced by Vercel — no HTTP endpoints.

### 8.3 Accessibility

- **WCAG 2.1 AA compliance target** for all participant-facing surfaces (the product's ICP includes non-technical creatives who may have accessibility needs)
- All form fields have visible labels (not placeholder-only)
- Color contrast: minimum 4.5:1 for all body text
- All interactive elements are keyboard-navigable
- Focus states are visible
- The Awards voting ballot is fully keyboard-operable (critical for participants with motor impairments)
- Screen reader testing: participant dashboard and Block 4 planning flow are priority surfaces

### 8.4 Mobile Responsiveness

The following surfaces must be **fully functional and well-designed on mobile** at launch:
- Participant dashboard home (`/p/[event-slug]/`)
- Project gallery (`/p/[event-slug]/gallery/`)
- Voting ballot (Block 8) — participants often vote on their phone during Demo Day
- Reflection form (Block 9)
- Marketing homepage and Seven2 case study page

The following surfaces are **desktop-first** (functional but not mobile-optimized at MVP):
- Block 4 and Block 5 build workspaces
- Org Admin dashboard
- Murtopolis
- Awards Presentation Mode (Organizer is always on desktop for screen share)

### 8.5 Data and Privacy

- **GDPR compliance:** Users can request data export and account deletion. Deletion anonymizes personal data (name → "Deleted User", email → hashed) while preserving aggregate event metrics.
- **Reflection quote opt-out:** Participants who opt out of quote sharing have their reflections completely excluded from any exported report or public surface. This is enforced at query level, not just display level.
- **Vote anonymity:** Individual vote records must not be queryable by Organizers. Only aggregate tallies are exposed. RLS enforces this.
- **Data retention:** Event data is retained indefinitely (for the "second event comparison" GROWTH feature). Participants can delete their account, which anonymizes their data but does not delete event-level aggregate metrics.
- **Affiliate link disclosure:** Any affiliate link (Lovable, etc.) is disclosed with a note: "This is an affiliate link — Hacksathon earns a small commission if you sign up."

### 8.6 Reliability and Error Handling

- **Claude API failure (Block 4):** If the API call fails, the Brief auto-populates Core Feature with the Step 1 raw answer. User is not shown an error — they see a complete Brief with a note: "Edit this if it doesn't capture your intent." The Starter Prompt still generates using the raw field values.
- **URL validation failure (Block 5):** If the validation check times out or returns an error, the URL is accepted provisionally with a note: "We couldn't verify this URL is live — it may take a few minutes to propagate." The Organizer dashboard shows "Unverified" status.
- **Stripe webhook retry:** Stripe retries webhooks on failure. The `purchases` update handler must be idempotent (check for existing `stripe_payment_intent_id` before updating).
- **Email delivery failure:** Resend webhooks inform the platform of bounced emails. Update `notifications.email_status = 'bounced'` and surface a warning in the Organizer dashboard: "Some invites may not have been delivered."

### 8.7 Compliance

- **Stripe for all payment processing** — PCI compliance is handled by Stripe. No card data touches Hacksathon servers.
- **PartnerStack (post-MVP) for 1099 compliance** on affiliate payouts. Manual affiliate tracking at launch uses UTM params and discount codes only — no cash payouts until PartnerStack is integrated.
- **Terms of Service and Privacy Policy** pages are required at launch (before first paying customer). Not in technical scope of this PRD, but required for Stripe approval and for GDPR compliance.

---

## Appendix A: MVP Launch Bar

**The test:** An Organizer who has never heard of Hacksathon.com:
1. Finds the site via Google or LinkedIn
2. Reads the case study
3. Purchases the Boutique package (self-serve, no sales call)
4. Creates an event in under 10 minutes
5. Invites 15 participants
6. Runs the complete 10-block program over 6 weeks
7. Runs the Awards ceremony live on Demo Day
8. Receives a Reflection Report automatically
9. Does all of this without sending a single message to Murtopolis

If any step in that sequence requires Murtopolis intervention — that is a product gap, not a process gap.

---

## Appendix B: Feature Tier Reference

| Feature | Phase | Tier |
|---|---|---|
| Complete 10-block event flow | 1–4 | MVP |
| Organizer Coaching Layer (Facilitator Notes) | 1 | MVP |
| Real-time Participant Status Tracker | 5 | MVP |
| Block 4 Gate (Planning hard gate) | 3 | MVP |
| Starter Prompt Generator (Claude API) | 3 | MVP |
| Awards Presentation Mode + Winner Cards | 4 | MVP |
| Reflection Report (auto-generated) | 4 | MVP |
| Stripe per-event payments | 6 | MVP |
| Discount/access code system | 6 | MVP |
| Murtopolis (Platform Admin) | 1+ | MVP |
| Event Duplication | — | v1.1 Growth |
| PRD Generator (IdeaLab) | — | v1.1 Growth |
| Reference Site Scraper (Block 4) | — | v1.1 Growth |
| Slack/Teams Integration | — | v1.1 Growth |
| Event Showcase Page | — | v1.1 Growth |
| Self-serve Stripe billing (Organizer checkout without code) | 6 | MVP (manual provisioning fallback in beta) |
| Mid-Event Pulse Check | — | v1.1 Growth |
| White-Label Event Site | — | Premium |
| SSO/SAML | — | Premium |
| Anonymous Appreciation Messages | — | Premium |
| Cross-Event Benchmarking | — | Premium |
| Persistent IdeaLab (post-event) | — | Future |
| Native Build Preview (iframe) | — | Future |
| Book Integration (learning panels) | — | Future (when book is ready) |

---

*End of PRD — Hacksathon.com MVP*
*Prepared for development handoff — Session 7*
*All decisions locked through Session 6. Refer to Session documents for rationale.*
