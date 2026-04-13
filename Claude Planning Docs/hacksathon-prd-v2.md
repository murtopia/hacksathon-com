# Hacksathon.com — Product Requirements Document
## Technical Specification for MVP Build
*Version 2.0 — April 2026*
*Compiled from Sessions 1–8. Supersedes Version 1.0.*

---

## How to Use This Document

This PRD is the single source of truth for building Hacksathon.com. It synthesizes all product development sessions into a complete specification ready for Cursor. Every decision documented here is locked.

**This version adds:** The ZERO.Prmptr conversation engine enhancements (Section 3.6), expanded data model for planning sessions (Section 4.3), and updated AI integration architecture (Section 5.3). These changes apply to both Hacksathon.com's Block 4 and the standalone ZERO.Prmptr product — the planning engine is a shared module.

**Locked decisions that shape every implementation choice:**
- Self-serve SaaS — no facilitation dependency. The platform is the facilitator.
- Per-event pricing only (no subscriptions). Seat count is the variable.
- Block 4 (Planning) is the only hard gate. All other blocks are self-paced.
- Tool-agnostic, Lovable as default.
- Path-based URLs: `/p/[event-slug]/` (no subdomains at MVP).
- The format IS the product — 10 blocks, fixed sequence, every feature serves participant movement.
- The planning conversation engine is shared between Hacksathon.com Block 4 and ZERO.Prmptr standalone. Improvements to one apply to both.

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

This is the most important block in the platform and the most sophisticated AI feature. It is the only hard gate in the system — participants cannot access Block 5 until Block 4 is marked complete.

The planning conversation engine described in this section is a **shared module** used by both Hacksathon.com's Block 4 and the standalone ZERO.Prmptr product. Any improvements to the engine apply to both contexts. The module should be built with this dual-target in mind from the first file structure decision.

---

#### 3.6.1 Gate Message

Full-screen interstitial before the planning flow begins:

> "You can't start building yet. This is the most important 30 minutes of the whole program. Participants who plan before they build ship better products. The next steps will generate your Project Brief — the document that becomes your first prompt."

Single CTA: "I'm ready to plan."

---

#### 3.6.2 The Planning Conversation Engine

**Overview**

The planning flow is a 5-step AI-driven conversation, not a form. The core architectural requirement is that every step is context-aware — the AI knows everything that was said in all prior steps. Each step builds on the last. The Project Brief at the end is a synthesized document, not a concatenation of five field values.

The AI's role is that of a thinking partner: genuinely curious, direct, and helpful to someone who may never have built a product before. It is not a chatbot and not a coach. It notices things, makes connections, and offers ideas — but the participant always controls when to move forward.

---

#### 3.6.3 The planningSession State Object

A `planningSession` context object accumulates through all five steps and is passed to every API call. It is persisted to the database so a participant can leave and return without losing their place.

```typescript
interface PlanningSession {
  id: string                    // uuid, references planning_sessions table
  projectName: string           // from idea submission (Block 2)
  ideaId: string                // references ideas table
  buildTool: string             // from event config: 'lovable' | 'cursor' | 'bolt' | 'replit'
  eventId: string | null        // null when used in ZERO.Prmptr standalone
  userId: string
  mode: 'create' | 'revise'
  existingBriefId: string | null // populated in revise mode
  currentStep: number           // 1–5
  stepAnswers: {
    step1: string | null        // core function
    step2: string | null        // target user
    step3: {                    // visual direction
      vibe: string | null
      referenceUrl: string | null
      colorNotes: string | null
    }
    step4: string | null        // scope guard
    step5: string | null        // done state
  }
  conversationHistory: Message[] // full thread passed to every API call
  briefId: string | null        // set when Project Brief is generated
  buildNotesId: string | null   // set when Build Notes are generated
  starterPromptCopiedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Message {
  role: 'system' | 'assistant' | 'user'
  content: string
  stepNumber?: number           // which step this message belongs to
  messageType?: 'question' | 'reflection' | 'followup' | 'advance' | 'user_response'
}
```

---

#### 3.6.4 The System Prompt

The system prompt establishes context for the entire planning session and is included in every API call. It is generated server-side and incorporates event and participant context.

**What the system prompt must establish:**
- The AI's role: a product thinking partner helping someone plan their first build
- The audience: non-technical creatives who may never have built anything before
- The tone: curious, direct, genuinely helpful — not a chatbot, not a coach, never sycophantic
- The rules: max 2 follow-up questions or observations per step, never block advancement, always acknowledge prior context before asking the next question
- Known context: participant's name, their role, the build tool being used, their idea name and one-liner (from Block 2 / IdeaLab), the event name (if in Hacksathon context)
- What "done" looks like: a specific, buildable plan for a non-technical person working in a vibe coding tool

**What the AI must never do:**
- Ask more than 2 follow-up questions or observations at once
- Repeat the participant's answer back to them without adding value
- Use filler affirmations ("Great idea!", "That's awesome!", "Perfect!")
- Block advancement to the next step
- Be generic — every response should acknowledge what this specific participant said

---

#### 3.6.5 The Five Steps — Conversation Design

Each step follows the same pattern:

1. **AI opens the step** with a question that demonstrates awareness of prior context (Steps 2–5 reference earlier answers naturally)
2. **Participant responds**
3. **AI reflects and offers depth** — acknowledges what it heard, then optionally offers 1–2 follow-up observations, questions, or ideas
4. **Participant can engage or advance** — a visible "I'm ready to move on →" action is always available

The AI's follow-up content in step 3 should be substantively useful. Examples of what good follow-ups do:
- Flag scope risk: "This sounds like it might be two things — which is the core one?"
- Make connections across steps: "You said your user is a dad who travels — does that affect the design direction you described?"
- Surface unconsidered angles: "Have you thought about what happens when a user wants to revisit a past entry?"
- Offer a concrete variation: "Another angle: what if instead of X, you framed it as Y?"
- Gently flag risk without alarming: "This is an ambitious scope for a first build — do you want to define a version 1 that's smaller?"

---

**Step 1 — Core Function**

Opening question: *"What does this do? Describe the core function in one sentence."*

Static coaching tip displayed below the input: *"Focus on the verb. 'It lets people ___' is the format."*

After the participant responds, the AI:
- Reflects what it heard (briefly, specifically — not "Got it!")
- Optionally offers 1–2 follow-ups: Is the function specific enough? Does "and" appear in the description (possible scope issue)? Is there a clearer way to frame the verb?
- Presents "Ready for Step 2 →"

---

**Step 2 — Target User**

Opening question references Step 1: the AI opens with something like *"So [project name] lets people [what they said in step 1]. Who specifically is that for? Describe one real person."*

Static coaching tip: *"Not 'busy professionals' — more like 'a dad who travels for work and misses bedtime.'"*

After the participant responds, the AI:
- Reflects the specificity of the user description
- Optionally: Is this person specific enough? Is there a tension between the Step 1 function and the Step 2 user? Could knowing more about this person change the core function?
- Presents "Ready for Step 3 →"

---

**Step 3 — Visual Direction**

Opening question references both prior steps: the AI acknowledges the project and user, then asks about the visual feel.

*"Now let's talk about what this looks like. What's the vibe or feeling? Think about apps or websites that have a feel you'd want to match — not the features, the feeling."*

**Three sub-fields** (not a single text box):
- Vibe/feel description (text, required)
- Reference site URL (optional, validated as URL)
- Color/tone notes (text, optional)

Static coaching tip: *"If you can paste a URL, do it — it's the fastest way to communicate visual direction to an AI builder."*

After the participant responds, the AI:
- Reflects the vibe (can it describe back what kind of visual experience this creates?)
- Optionally: Is the vibe description specific enough to guide a builder? Is there a tension between the vibe and the user from Step 2? Does the reference URL (if provided) actually match the vibe they described?
- Presents "Ready for Step 4 →"

---

**Step 4 — Scope Guard**

Opening question: *"What does [project name] NOT do? Give me at least two things that are out of scope."*

Static coaching tip: *"This is the hardest question. Everything you're tempted to add as a feature probably belongs here."*

After the participant responds, the AI:
- Reflects the out-of-scope list — does it actually constrain the project?
- Optionally: Are any of the out-of-scope items actually core to the product? Does the scope feel achievable for a first build? Are there obvious features that aren't listed (and should be explicitly excluded)?
- Presents "Ready for Step 5 →"

---

**Step 5 — Done State**

Opening question references everything: *"Last one. You've described what [project name] does, who it's for, what it looks like, and what it doesn't do. Now: what does done look like? Your build is complete when ___."*

Static coaching tip: *"Think demo-worthy, not perfect. You should be able to show it in 3 minutes."*

After the participant responds, the AI:
- Reflects the done state — is it specific and achievable?
- Optionally: Does the done state match the scope from Step 4? Is it something that can realistically be built in a first session with a vibe coding tool? Is it actually demo-able in 3 minutes?
- Presents "Generate my Project Brief →" (replaces "Ready to move on" — this is the final step)

---

#### 3.6.6 Project Brief (Auto-Generated Output)

The Project Brief is generated by a final API call that receives the full `conversationHistory` as input. It is not assembled from the `stepAnswers` fields directly — those are the data layer. The AI synthesizes a coherent, readable document from the full conversation.

**Project Brief sections:**
- **Project Name** (from idea submission)
- **One-Sentence Scope** (synthesized from Step 1 and conversation)
- **Target User** (from Step 2, refined by any follow-up conversation)
- **Core Feature** (AI-synthesized — the single most important thing this build does)
- **Design Direction** (from Step 3 — vibe text + reference URL)
- **Out of Scope** (from Step 4, as a clean bulleted list)
- **Done Looks Like** (from Step 5)

Every section is editable inline after generation. The participant can revise any field before finalizing. All edits are saved and the `conversationHistory` is updated with a note that a field was manually revised.

**Acceptance Criteria:**
- Brief is generated by a single API call using the full conversation history — not field concatenation
- If API call fails, fall back to assembling fields from `stepAnswers` with a note: "Edit this if it doesn't capture your intent"
- Brief is saved as a document attached to the participant's record
- Organizer can view and leave annotations on any participant's Project Brief
- Brief is visible as a collapsible reference panel throughout Blocks 5 and 6

---

#### 3.6.7 Build Notes (Supplemental Analysis Document)

After the Project Brief is generated, the AI produces a second lightweight document: **Build Notes**.

This is a second API call using the full `conversationHistory` as input. It runs automatically after the Brief is generated but does not block the participant from advancing — it renders alongside the Brief as a collapsible panel.

**Build Notes contain:**

1. **Tensions and open questions** (1–3 items) — things the AI noticed that might create friction during the build. Examples: "Your target user is very specific but your done state sounds designed for anyone — worth resolving before you start." Or: "Steps 1 and 4 are in tension — the out-of-scope list removes something that sounds core."

2. **Things worth thinking about before you build** (3–5 items) — not blockers, but genuine considerations. These are framed as observations, not warnings. Each one is 1–2 sentences.

3. **Key assumptions in this plan** (2–3 items) — the biggest bets embedded in the project. Examples: "This assumes users will input data manually." "This assumes the design direction is achievable in Lovable without custom CSS."

4. **Suggested v1 scope** (optional — only surfaced if the plan signals ambition beyond a first build) — a concrete suggestion for what belongs in the first build vs. what to save for later.

**Format:** Plain prose and short bulleted lists. This is a readable addendum — not a formal document, not a form. The heading is simply "Before You Build."

**Acceptance Criteria:**
- Build Notes are generated automatically after the Project Brief without participant action
- Build Notes render as a collapsible panel alongside the Project Brief — collapsed by default
- If the API call for Build Notes fails, the panel is hidden entirely — no error shown to participant
- Organizer can see Build Notes for any participant
- Build Notes are stored in the database and persist through the build phase

---

#### 3.6.8 Starter Prompt Generator

After the Project Brief is finalized, a single prominent button appears:

**"Copy your first prompt →"**

This generates a correctly formatted, copy-ready prompt for the selected build tool. The prompt is synthesized from the full Project Brief — not templated from individual fields.

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
- If participant returns to Block 4 later, they can regenerate or re-copy the Starter Prompt

---

#### 3.6.9 Revise Mode

When a participant returns to Block 4 after completing it — to update their plan mid-build — the platform opens Revise Mode rather than restarting the 5-step flow.

**Revise Mode entry:** A "Revisit your plan" link is available throughout Block 5. Clicking it opens the planning session in Revise Mode.

**Revise Mode behavior:**

The AI loads the existing Project Brief and conversation history, then opens a targeted dialogue:

> "You've got a solid plan for [Project Name]. What do you want to revisit?"

The participant describes what changed — a new direction, a scope adjustment, a different target user, anything.

The AI then:
1. Asks any clarifying questions about the change (max 2)
2. Identifies which sections of the Project Brief are affected
3. Proposes specific updates to those sections with explicit before/after comparisons
4. Confirms: "Here's what I'd update — does this look right?"
5. On confirmation: applies updates to the Project Brief, leaves unaffected sections intact
6. Regenerates the Starter Prompt if the changes warrant it (prompts the participant to confirm before regenerating)

**The participant never re-answers questions that haven't changed.** If only the visual direction is being updated, only the Design Direction section is revised.

**Acceptance Criteria:**
- Revise Mode is a distinct entry point into the same conversation engine — not a separate component
- The full prior conversation history is loaded into context before the revision dialogue begins
- Section updates are shown as explicit diffs before being applied (old text → new text)
- Participant can accept or reject each proposed change individually
- Revise Mode creates a new `planningSession` record with `mode: 'revise'` and `existingBriefId` populated
- If the participant changes their mind during revision, they can exit without saving

---

### 3.7 Block 5: Build

**Description:** The main build period. No AI features in the platform during this block — participants are working in their external build tool. The platform provides reference, coaching, and URL submission.

**Contents:**
- Project Brief (read-only, collapsible reference panel)
- Build Notes (read-only, collapsible — generated in Block 4)
- Starter Prompt (display + re-copy button)
- "Revisit your plan" link → opens Block 4 in Revise Mode
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
- Participants watching asynchronously see a "Results are being revealed live" state until Organizer completes the reveal, then see all results
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

All transactional and operational notifications are described in Section 5.5 (Email). In-app notifications mirror all email events.

**Organizer-triggered:**
- Custom announcements (free text, subject line, send to all or filtered group)
- Nudge templates (pre-written, one-click send): At-risk/behind messages, block-specific encouragement

**Acceptance Criteria:**
- All emails use Resend (see Section 5.5)
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
            └── planning_sessions (1+ per participant — create + revise sessions)
                    └── project_briefs (generated from planning session)
                    └── build_notes (generated from planning session)
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
completion_method   text  -- 'self_reported' | 'url_submitted' | 'organizer_marked' | 'form_submitted' | 'starter_prompt_copied'
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

#### planning_sessions
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events  -- null in ZERO.Prmptr standalone context
user_id             uuid REFERENCES users NOT NULL
idea_id             uuid REFERENCES ideas
build_tool          text NOT NULL DEFAULT 'lovable'
mode                text NOT NULL DEFAULT 'create'  -- 'create' | 'revise'
existing_brief_id   uuid  -- populated in revise mode, references project_briefs
current_step        integer DEFAULT 1  -- 1–5
step_answers        jsonb DEFAULT '{}'  -- structured store of confirmed step answers
conversation_history jsonb DEFAULT '[]'  -- full message thread as JSON array
status              text DEFAULT 'in_progress'  -- 'in_progress' | 'complete' | 'abandoned'
brief_id            uuid  -- set when Project Brief is generated, references project_briefs
build_notes_id      uuid  -- set when Build Notes are generated, references build_notes
starter_prompt_copied_at  timestamptz
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### project_briefs
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid REFERENCES events  -- null in standalone context
user_id             uuid REFERENCES users NOT NULL
idea_id             uuid REFERENCES ideas
planning_session_id uuid REFERENCES planning_sessions NOT NULL
project_name        text NOT NULL
one_sentence_scope  text NOT NULL
target_user         text NOT NULL
core_feature        text NOT NULL  -- AI-synthesized from full conversation
design_vibe         text
reference_url       text
color_tone_notes    text
out_of_scope        text NOT NULL
done_looks_like     text NOT NULL
version             integer DEFAULT 1  -- increments on each revision
is_current          boolean DEFAULT true  -- only one current brief per user per event
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```

#### build_notes
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
planning_session_id uuid REFERENCES planning_sessions NOT NULL
project_brief_id    uuid REFERENCES project_briefs NOT NULL
user_id             uuid REFERENCES users NOT NULL
tensions            jsonb  -- array of tension strings
considerations      jsonb  -- array of consideration strings
assumptions         jsonb  -- array of assumption strings
v1_scope_suggestion text   -- optional, only if scope risk was detected
created_at          timestamptz DEFAULT now()
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
CREATE POLICY "org_members_can_read_their_events" ON events
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Planning sessions: users can only read/write their own
CREATE POLICY "users_own_planning_sessions" ON planning_sessions
  FOR ALL USING (user_id = auth.uid());

-- Project briefs: participants own theirs; organizers can read all in their event
CREATE POLICY "participants_own_briefs" ON project_briefs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "organizers_can_read_briefs" ON project_briefs
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_participants
      WHERE user_id = auth.uid() AND role = 'organizer'
    )
  );

-- Votes: participants can only insert (never read individual votes)
CREATE POLICY "participants_can_insert_votes" ON votes
  FOR INSERT WITH CHECK (
    voter_user_id = auth.uid()
    AND project_id NOT IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
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
| ZERO.Prmptr | Block 4: Planning module — conversation engine is a shared module |
| EDIT.Prmptr | Document editing layer inside any block that produces output |
| Hacky Awards | Block 8: Awards module + Reveal presentation mode |
| Hacksathon playbook (PDF) | Encoded into Organizer coaching layer + block descriptions |

**On the shared module architecture:** The planning conversation engine (ZERO.Prmptr) is built as a standalone module that both Hacksathon.com's Block 4 and the ZERO.Prmptr standalone product import. The `event_id` field on `planning_sessions` is nullable — when null, the session is running in the standalone ZERO.Prmptr context. The conversation engine itself is identical in both cases; only the initialization context differs.

### 5.2 Shared vs. Module-Specific Tables

**Shared across all modules (platform core):**
- `organizations`, `users`, `organization_members`
- `events`, `event_participants`, `blocks`, `block_completions`
- `notifications`, `purchases`, `discount_codes`

**Module-specific:**
- IdeaLab module: `ideas`
- Planning module: `planning_sessions`, `project_briefs`, `build_notes`
- Document editing: Uses `project_briefs`, `pitch_notes`, `reflections` — EDIT.Prmptr is a UI component, not a separate data store
- Build module: `projects`
- Awards module: `award_categories`, `votes`
- Reflections module: `reflections`

### 5.3 AI Integration

**Claude API (Anthropic) is used throughout Block 4 / ZERO.Prmptr.**

All Claude API calls are **server-side only**. The API key is never exposed to the client. Use Next.js API routes as the server-side proxy for all planning conversation calls.

#### Planning Conversation — Per-Step Responses

- **Trigger:** Participant submits a response to any planning step
- **Input:** Full `conversationHistory` array from `planningSession` + new user message + system prompt (with participant and event context)
- **Output:** AI response containing: a brief acknowledgment, optional follow-up observations/questions (max 2), and a forward action
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 600 per step response
- **Temperature:** Default (the AI should be thoughtful, not random)
- **Error handling:** On API failure, surface a neutral message: "Something went wrong — your answer was saved. Try refreshing." Do not lose the user's answer.

#### Planning Conversation — Project Brief Generation

- **Trigger:** Participant clicks "Generate my Project Brief →" after Step 5
- **Input:** Full `conversationHistory` + synthesize-brief system instruction
- **Output:** Structured JSON matching `project_briefs` schema fields — parsed server-side
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 1000
- **Error handling:** On failure, assemble brief from raw `stepAnswers` fields with a note: "Edit this if it doesn't fully capture your intent."

#### Planning Conversation — Build Notes Generation

- **Trigger:** Fires automatically after Project Brief is generated (non-blocking background call)
- **Input:** Full `conversationHistory` + build-notes system instruction
- **Output:** Structured JSON matching `build_notes` schema fields — parsed server-side
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 800
- **Error handling:** On failure, the Build Notes panel is hidden entirely. No error shown to participant.

#### Starter Prompt Generation

- **Trigger:** Participant clicks "Copy your first prompt →"
- **Input:** Current `project_briefs` record + selected build tool + starter-prompt formatting instruction
- **Output:** Plain text prompt string, no markdown, formatted for the selected tool
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 500
- **Caching:** Cache result in `planning_sessions.starter_prompt_text` (add this field) — re-copies do not re-generate unless the brief has changed since last generation

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

**Package tier determination (server-side):**
```
10–25 seats  → boutique  → $85/seat
26–50 seats  → agency    → $80/seat
51–100 seats → studio    → $70/seat
101–200 seats → large    → $65/seat
200+         → contact_us (no self-serve checkout)
```

### 5.5 Email (Resend)

All transactional email is sent via Resend. Templates are plain-text-first with minimal HTML styling.

**Required email templates at MVP:**
- `invite` — Participant invite with join link + calendar invite attachment
- `event_confirmation` — Organizer purchase confirmation
- `block_open` — Block N is now open (automated)
- `block4_reminder` — Special Block 4 emphasis email ("Most important 30 minutes...")
- `voting_open` — Voting is live
- `reflection_reminder` — Demo Day is complete — time to reflect
- `nudge_[type]` — Organizer-triggered nudge templates

### 5.6 API Route Overview

```
POST /api/auth/signup                    Create user + org member record
POST /api/events/create                  Event wizard completion → create event
POST /api/events/[id]/invite             Send invite emails or generate invite link
GET  /api/events/[slug]/blocks           Participant block list with completion status
POST /api/blocks/complete                Mark block complete (with completion_method)
POST /api/ideas/submit                   Submit or update idea

-- Planning Conversation Engine (shared: Hacksathon Block 4 + ZERO.Prmptr) --
POST /api/planning/session/create        Initialize a new planning session (create or revise mode)
GET  /api/planning/session/[id]          Load existing session (resume or revise)
POST /api/planning/session/[id]/respond  Submit step answer → get AI response (streams)
POST /api/planning/session/[id]/advance  Confirm step complete, move to next
POST /api/planning/brief/generate        Generate Project Brief from full conversation
POST /api/planning/build-notes/generate  Generate Build Notes (called after brief — non-blocking)
POST /api/planning/starter-prompt        Generate Starter Prompt for selected build tool
POST /api/planning/session/[id]/revise   Open existing brief in Revise Mode

POST /api/projects/submit                Submit live URL (triggers async URL validation)
POST /api/votes/submit                   Submit all votes (atomic)
POST /api/reflections/submit             Submit reflection form
POST /api/awards/open-voting             Organizer opens voting window
POST /api/awards/close-voting            Organizer closes voting window
POST /api/awards/reveal                  Organizer triggers reveal per category
POST /api/checkout/create                Create Stripe Checkout session
POST /api/checkout/webhook               Stripe webhook handler
POST /api/codes/validate                 Validate discount code at checkout
GET  /api/admin/event/[id]               Organizer event dashboard data
GET  /api/murtopolis/events              Platform admin: all events
POST /api/murtopolis/orgs/create         Manually provision an organization
PATCH /api/murtopolis/content            Edit platform content without deploy
```

---

## 6. TECH STACK RECOMMENDATION

### 6.1 Stack Summary

| Layer | Choice | Justification |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Industry standard, Vercel-native, server components reduce client bundle, strong ecosystem |
| Database | Supabase (PostgreSQL) | Already familiar, RLS handles multi-tenancy elegantly, real-time subscriptions for live updates, includes Auth and Storage |
| Auth | Supabase Auth | Magic link + email/password. Simple, already in Supabase, no separate service needed at MVP |
| Payments | Stripe | Per-event checkout, no subscription complexity, excellent Next.js integration |
| AI | Anthropic Claude API | Planning conversation engine + brief/notes generation. `claude-sonnet-4-20250514`. Server-side only. |
| Email | Resend | Clean developer experience, React Email templates, Vercel-native, excellent deliverability |
| Hosting | Vercel | Already in use, zero-config Next.js deploy, edge functions, preview deployments |
| Storage | Supabase Storage | Logo uploads, winner card assets — included with Supabase |
| Analytics | PostHog | Product analytics, session recording, feature flags |
| Help Center | Notion (public pages) | Free, fast, editable without engineering. `/help/` redirects to Notion. |
| Affiliate | Manual at launch → PartnerStack at scale | UTM params + discount codes at MVP |

### 6.2 Key Implementation Notes

**Planning conversation streaming:**
The per-step AI response should stream to the client so the participant sees the AI "thinking" in real time rather than waiting for a full response. Use Next.js streaming with `ReadableStream` and Anthropic's streaming API. This is especially important for the Project Brief generation step.

**Supabase Real-Time for Participant Status Dashboard:**
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

**Build Notes as a non-blocking background call:**
Fire the Build Notes generation API call after the Project Brief is saved. Do not await it in the UI. The Build Notes panel renders with a loading skeleton and populates when the call returns. If it fails, the skeleton is replaced with nothing — no error state shown.

**Conversation history size management:**
The full `conversationHistory` is stored in `planning_sessions.conversation_history` as JSONB. For typical 5-step sessions this will be 2,000–4,000 tokens. No truncation is needed at MVP. Monitor for sessions with extensive follow-up exchanges that might grow significantly larger.

**Awards Reveal Real-Time:**
Voting reveal state changes (`reveal_triggered` on `award_categories`) use Supabase real-time so async participants see reveals update without refreshing.

**Winner Card Image Generation:**
Use Vercel's `@vercel/og` library to generate 1080x1080px PNG winner cards server-side.

### 6.3 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY           # Server-side only
ANTHROPIC_API_KEY                   # Server-side only
STRIPE_SECRET_KEY                   # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL                 # https://hacksathon.com in prod
LOVABLE_AFFILIATE_BASE_URL          # Base URL for Lovable affiliate tracking
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Core Platform (Auth, Orgs, Event Setup)
**Goal:** An Organizer can sign up, create an event, and invite participants.

- Supabase project setup (auth, database schema, RLS policies — including all planning_sessions tables)
- Next.js project scaffold with App Router, Tailwind, Supabase client
- Auth: signup, login, magic link, session management
- Organization creation (post-signup wizard: org name, logo, color)
- Event Creator Wizard (all 6 steps) — no payment yet (use free access code flow)
- Participant invite system (email list + shareable link)
- Participant first-login flow (Permission Frame, role selection, onboarding)
- Basic block display (participant dashboard showing all 10 blocks, upcoming states)
- Block 1: Kickoff (simple content block, self-reported completion)
- Organizer event dashboard: Overview tab + Participant tab (status tracker)
- Murtopolis: basic org management, event overview, content management
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

### Phase 3: Planning Module (Block 4 — Conversation Engine + Gate)
**Goal:** The most critical block. The full context-aware conversation engine is live. Block 5 does not exist until Block 4 is complete.

**Step 3a — Conversation engine foundation (do first):**
- `planning_sessions` table and all related tables created
- Session initialization API (`/api/planning/session/create`)
- Per-step response API with streaming (`/api/planning/session/[id]/respond`)
- Full `conversationHistory` threading — every step receives all prior context
- Step advance logic (`/api/planning/session/[id]/advance`)
- Session persistence (participant can leave and return mid-flow)
- Block 4 gate message (full-screen interstitial)

**Step 3b — Outputs:**
- Project Brief generation API (full conversation → synthesized document)
- Project Brief display + inline editing
- Build Notes generation API (non-blocking background call)
- Build Notes display (collapsible panel, loads asynchronously)
- Starter Prompt generation + copy button + affiliate link
- Block 4 completion logic: Brief saved + Starter Prompt copied

**Step 3c — Revise Mode:**
- "Revisit your plan" entry point from Block 5
- Revise Mode initialization (load existing brief + conversation history)
- Revision dialogue (targeted change → identify affected sections → diff display → confirm)
- Starter Prompt regeneration on significant changes

**Step 3d — Block 5:**
- Build workspace (Brief reference, Build Notes, coaching cards, URL submission, URL validation)
- Real-time URL submission → Organizer Projects tab
- Organizer: Block 4 gate visibility (who has/hasn't completed Planning)
- Organizer: Projects tab (all live URLs, URL validation status, demo order editor)

**Definition of done:** A participant completes all 5 planning steps with contextual AI responses at each step, generates a Project Brief (synthesized from the full conversation), receives Build Notes automatically, copies their Starter Prompt, and Block 5 unlocks. Revise Mode allows returning to update the plan without restarting. Organizer sees the submitted URL in real time.

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

### Phase 5: Analytics and Notifications
**Goal:** Post-event ROI visibility and the full notification layer.

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

**Definition of done:** An Organizer who has never contacted us can find the site, purchase an event, configure it, invite their team, and run it to Demo Day without any Murtopolis intervention.

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### 8.1 Performance

- **Participant dashboard initial load:** < 2 seconds (LCP)
- **Block transitions:** < 500ms perceived response
- **Planning conversation AI responses:** Stream to the client. First token should appear within 2 seconds. Do not block the UI while waiting for a complete response.
- **Project Brief generation:** Show a loading state ("Generating your brief...") — acceptable to take up to 8 seconds. Stream if possible.
- **Build Notes generation:** Fully non-blocking background call. The participant never waits for this.
- **URL validation (Block 5):** Async — show "Checking your URL..." for up to 5 seconds, then show result. Do not block submission.
- **Awards reveal:** Must be smooth during live screen share. All vote data pre-loaded before Organizer enters Presentation Mode.
- **Real-time Supabase subscriptions:** Organizer dashboard updates within 3 seconds of a participant action.

### 8.2 Security

- **API keys are server-side only.** Anthropic API key and Stripe secret key must never appear in client-side code or be accessible from the browser.
- **Supabase RLS is the primary access control layer.** Every table has RLS policies. Service-role key is used server-side only.
- **Planning session data is private.** A participant's `planningSession` conversation history is never readable by other participants. Organizers can read the generated `project_briefs` and `build_notes` but not the raw conversation history.
- **Stripe webhook validation.** All webhooks verified with `stripe.webhooks.constructEvent()`.
- **Vote integrity.** `UNIQUE(event_id, category_id, voter_user_id)` enforced at database level.
- **Impersonation logging.** All Platform Admin impersonation sessions logged — append-only.
- **No sensitive data in client-side state.**
- **HTTPS everywhere.** Enforced by Vercel.

### 8.3 Accessibility

- **WCAG 2.1 AA compliance target** for all participant-facing surfaces
- All form fields have visible labels (not placeholder-only)
- Color contrast: minimum 4.5:1 for all body text
- All interactive elements are keyboard-navigable
- Focus states are visible
- The planning conversation interface (Block 4) is fully keyboard-operable — a screen reader user can complete the full 5-step flow
- The Awards voting ballot is fully keyboard-operable

### 8.4 Mobile Responsiveness

**Fully functional and well-designed on mobile at launch:**
- Participant dashboard home (`/p/[event-slug]/`)
- Project gallery (`/p/[event-slug]/gallery/`)
- Voting ballot (Block 8) — participants often vote on their phone during Demo Day
- Reflection form (Block 9)
- Marketing homepage and Seven2 case study page

**Desktop-first (functional but not mobile-optimized at MVP):**
- Block 4 (planning conversation) and Block 5 (build workspace)
- Org Admin dashboard
- Murtopolis
- Awards Presentation Mode

### 8.5 Data and Privacy

- **GDPR compliance:** Users can request data export and account deletion. Deletion anonymizes personal data while preserving aggregate event metrics.
- **Planning conversation history:** Treated as personal data. Deleted or anonymized on account deletion.
- **Reflection quote opt-out:** Enforced at query level, not just display level.
- **Vote anonymity:** Individual vote records not queryable by Organizers. RLS enforces this.
- **Affiliate link disclosure:** Any affiliate link is disclosed with a note: "This is an affiliate link — Hacksathon earns a small commission if you sign up."

### 8.6 Reliability and Error Handling

- **Claude API failure during step responses:** Save the user's answer to `stepAnswers`. Surface a neutral message: "Something went wrong — your answer was saved. Try refreshing." Do not lose any user input under any failure condition.
- **Claude API failure during Brief generation:** Assemble brief from raw `stepAnswers` fields with a note: "Edit this if it doesn't fully capture your intent."
- **Build Notes API failure:** Panel hidden entirely. No error shown to participant.
- **Starter Prompt API failure:** Show error state on the copy button with a retry option.
- **URL validation failure (Block 5):** URL accepted provisionally with "We couldn't verify this URL is live" note. Organizer dashboard shows "Unverified" status.
- **Stripe webhook retry:** Handler must be idempotent (check for existing `stripe_payment_intent_id` before updating).
- **Email delivery failure:** Resend webhook updates `notifications.email_status = 'bounced'`. Warning surfaces in Organizer dashboard.

### 8.7 Compliance

- **Stripe for all payment processing** — PCI compliance handled by Stripe.
- **PartnerStack (post-MVP)** for 1099 compliance on affiliate payouts.
- **Terms of Service and Privacy Policy** pages required at launch (before first paying customer).

---

## Appendix A: MVP Launch Bar

**The test:** An Organizer who has never heard of Hacksathon.com:
1. Finds the site via Google or LinkedIn
2. Reads the case study
3. Purchases the Boutique package (self-serve, no sales call)
4. Creates an event in under 10 minutes
5. Invites 15 participants
6. Runs the complete 10-block program over 6 weeks
7. Completes Block 4 planning with genuinely helpful AI conversation at each step
8. Runs the Awards ceremony live on Demo Day
9. Receives a Reflection Report automatically
10. Does all of this without sending a single message to Murtopolis

If any step requires Murtopolis intervention — that is a product gap, not a process gap.

---

## Appendix B: Feature Tier Reference

| Feature | Phase | Tier |
|---|---|---|
| Complete 10-block event flow | 1–4 | MVP |
| Organizer Coaching Layer (Facilitator Notes) | 1 | MVP |
| Real-time Participant Status Tracker | 5 | MVP |
| Block 4 Gate (Planning hard gate) | 3 | MVP |
| Planning conversation engine — context threading | 3 | MVP |
| Planning conversation engine — AI thinking partner (follow-ups) | 3 | MVP |
| Project Brief — synthesized from full conversation | 3 | MVP |
| Build Notes (supplemental analysis doc) | 3 | MVP |
| Revise Mode (edit brief without restarting) | 3 | MVP |
| Starter Prompt Generator | 3 | MVP |
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
*Version 2.0 — Compiled from Sessions 1–8*
*Supersedes Version 1.0. All decisions locked.*
