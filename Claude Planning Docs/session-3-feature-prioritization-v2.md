# Session 3: Feature Prioritization (v2)
## Hacksathon.com — Integrated Feature Set
*Prepared for Hacksathon.com product development*
*Updated: Self-serve SaaS model confirmed. Book integration deferred to post-launch.*

---

## Confirmed Product Decisions

**1. Self-serve SaaS — no hand-holding.**
Any company should be able to sign up, configure an event, invite their team, and run it end-to-end without Murtopolis involvement. The platform is the facilitator. Nick is not the product.

**2. Book integration is post-launch.**
"Vibe Coding for Creatives" is a future content layer — valuable, but not on the critical path. The platform must stand completely on its own at launch. Book content surfaces as a premium add-on when it's ready.

---

## What These Decisions Change

### Self-serve changes the CORE list in three ways:

**The Organizer experience becomes equally important as the Participant experience.**
There are now two first-run flows to design: one for the person buying and configuring the event (the Organizer), and one for the people participating in it. Both need to be excellent. The Organizer's experience is currently underspecified — that changes here.

**"The facilitator will handle this" is no longer an acceptable answer for any friction point.**
Every moment in the Seven2 event where Nick made a judgment call or intervened in real-time now needs a platform-side solution: a coaching tip, a guardrail, a default, or a structured prompt. The platform has to scale Nick's instincts, not rely on them.

**Self-serve billing moves from FUTURE to GROWTH.**
The product isn't really self-serve if purchasing requires a sales call. Stripe-based billing needs to arrive in v1.1, not on the long-term roadmap.

### Book-as-future changes the CORE list in one way:

The interactive tools that were framed as "book companion pieces" — Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, Demo Framework — **stay in CORE**, but now justified entirely on their own merits as platform mechanics. They don't need the book to exist. When the book does launch, it will describe tools the participant already knows and trusts — which is a better integration anyway.

All contextual learning panels, "why this works" tooltips, and the full Learn section move to FUTURE.

---

## Framing Principle

The format is the product. Every feature either serves the event lifecycle — moving a participant from intimidation to shipped product — or it waits.

The emotional arc is the north star:
> **Intimidation → Permission → First output → Surprise → Pride → "I have more ideas"**

---

## What Gets Cut in Integration

| What exists today (standalone) | What it becomes in Hacksathon.com |
|---|---|
| Separate logins for each tool | Single identity across the entire event |
| ZERO.Prmptr as a standalone web app | Block 4: Planning — a required, gated step |
| IdeaLab as a standalone tool | Block 2: Ideation — same data, contextualized |
| EDIT.Prmptr as a standalone doc editor | The document layer inside any block that produces output |
| Hacky Awards as a standalone voting page | Block 8: Awards — triggered by the Organizer at Demo Day close |
| Static PDF worksheets | Interactive in-app tools at each block |
| Separate Slack comms + tool notifications | One notification layer, one source of truth |

---

## The Block-Based Mental Model

Everything lives inside a **Block** — a time-boxed phase with a defined input, defined output, and defined participant action.

```
BLOCK 1: Kickoff       → Output: Participant oriented, permission granted
BLOCK 2: Ideation      → Output: One idea submitted with one-sentence scope
BLOCK 3: Pitch         → Output: One-minute pitch delivered, peer feedback logged
BLOCK 4: Planning      → Output: Project Brief generated (REQUIRED — gated)
BLOCK 5: Build         → Output: Working prototype with live URL
BLOCK 6: Mid-Check     → Output: Blocker surfaced or progress confirmed
BLOCK 7: Demo          → Output: 3-min demo + 2-min Q&A delivered
BLOCK 8: Awards        → Output: Votes cast, winners announced
BLOCK 9: Reflect       → Output: Reflection submitted
BLOCK 10: Continue     → Output: Next idea or next build session initiated
```

---

## Feature Prioritization

---

### AREA 1: Event Setup and Configuration

#### CORE (MVP)

**Organizer Onboarding Flow**
A guided first-run experience for the person setting up the event. Distinct from the participant onboarding. Walks the Organizer through: naming the event, setting participant count and session cadence, selecting the build tool, previewing the block timeline, and sending invites — in a single linear flow. Ends when the first invite is sent.
- This is the most important UX surface in the product. If the Organizer bounces here, nothing else matters.

**Event Creator Wizard**
Step-by-step configuration: company name, event name, participant count, start date, session cadence (weekly / bi-weekly), and build tool selection. Output: a fully pre-populated event timeline with all blocks dated and described. Should take under 10 minutes for a first-time user.

**Block Customization**
Organizers can edit block titles, descriptions, time allocations, and dates. The block sequence is fixed in MVP — the sequence is the format.

**Basic Branding**
Company logo + primary color applied to the participant-facing event site.

**Session Cadence + Calendar Invites**
Organizer sets the session rhythm; the platform generates calendar invites for all participants automatically. Time-blocking was one of the top drivers of Seven2's completion rate — it must be structural, not manual.

**Organizer Coaching Layer**
At each block, a collapsed "Facilitator Notes" panel gives the Organizer context: what this block is for, what to watch for, what to do if participants are stuck, and a suggested async message to send their team. This is the scalable version of Nick's facilitation instincts. It lives in the Organizer view only — participants never see it.

#### GROWTH (v1.1)

**Event Duplication**
Clone a past event as the starting point for a new one. Critical for repeat customers — the second event should take five minutes to configure.

**Custom Block Templates**
Save and reuse modified block configurations across events.

**Multi-track Events**
Multiple cohorts running simultaneously on different timelines within the same event.

#### PREMIUM

**White-Label Event Site**
Custom domain, full CSS control, Hacksathon.com branding removed.

**Multi-Event Organization Dashboard**
Manage all past and present events from a single org-level view.

---

### AREA 2: Participant Onboarding and Management

#### CORE (MVP)

**Invite System**
Organizer sends email invites from the platform. Participants create one account that works across all tools and all blocks. No separate logins per tool.

**Participant Onboarding Flow**
Guided first-login experience. Surfaces: the event timeline, the passion-project framing, and one call to action (submit an idea). The first thing every participant sees — before tools, before instructions — is: *"Build something you personally want to exist in the world."* This is not optional copy. It is the permission structure the entire experience rests on.

**Role Types**
Organizer and Participant. Organizers see the full admin view + coaching layer; participants see only their own work and the group gallery.

**Participant Status Dashboard (Organizer view)**
Live view of where every participant is in the block sequence: complete, in progress, not started. Enables async nudges to participants who are falling behind. This is the tool that makes self-serve facilitation possible — the Organizer can see the whole room without being in it.

#### GROWTH (v1.1)

**Cohort Grouping**
Assign participants to small groups for peer feedback on pitches and check-ins.

**Skill/Role Tagging**
Participants self-identify (designer, strategist, producer, etc.). Used to surface role-appropriate tips.

#### PREMIUM

**SSO Integration**
SAML/SSO for enterprise orgs with IT security requirements.

---

### AREA 3: Idea Submission and Management (IdeaLab → Block 2)

#### CORE (MVP)

**Idea Submission Form**
Title, one-sentence description, "who is this for," and a scope declaration field: *"This app does ONE thing: ___."* The scope field is required. If the response contains "and," a gentle validation fires: *"This might be two ideas. Consider picking one. Simpler scope = higher chance of shipping."* This is the scope guardian moment that was missing from Seven2.

**Idea Gallery**
All submitted ideas visible to the full cohort. Participants can react to each other's ideas. Social visibility creates early accountability before the Pitch Block.

**Idea Status Tracking**
Ideas move through: Submitted → Pitched → In Build → Shipped / In Progress. Organizer updates status; visual indicator on gallery cards.

**One Active Idea Rule**
Platform enforces one active idea per participant. To pivot, the participant archives their current idea and creates a new one — making pivots visible rather than silent.

#### GROWTH (v1.1)

**PRD Generator**
AI-generated Product Requirements Document, surfaced as a required output of Block 4 (Planning) — not a hidden tab inside IdeaLab. The PRD becomes a structured input to ZERO.Prmptr.

**Competitive Analysis Generator**
AI-generated market snapshot for submitted ideas. Useful for Pitch Block prep.

**Alternative Ideas Generator**
For participants feeling stuck, the AI suggests variations on their submitted idea.

#### FUTURE

**Persistent IdeaLab**
After an event ends, participants retain access to their idea bank and can keep submitting. The "what's next" path that 69% of Seven2 participants wanted but didn't have. This converts the event from a one-time output into an ongoing creative habit.

---

### AREA 4: AI-Assisted Planning (ZERO.Prmptr → Block 4)

#### CORE (MVP)

**The Planning Block Is Gated**
Participants cannot access Block 5 (Build) until Block 4 (Planning) is marked complete. This is a hard gate. Not a soft recommendation — a hard gate. The most consistent regret from Seven2 was not planning before building. The only reliable fix is structural enforcement.

**Conversational Project Brief Flow**
The ZERO.Prmptr conversational UX — asking questions to build a structured brief — is preserved, but it now lives inside Block 4. The output is a one-page Project Brief: project name, one-sentence scope, target user, core feature (singular), visual vibe description, and reference site URL.

**The Starter Prompt Button**
After the Project Brief is complete, one button appears: **"Copy your first prompt."** It generates a copy-ready, correctly formatted first prompt for the selected build tool (Lovable, Cursor, Bolt, etc.). This directly solves the gap Kelsea identified: *"How do we tell Lovable how to use that to get started?"* The planning investment is wasted if it doesn't feed directly into the first build action.

**Visual Vibe Capture**
A dedicated field in the Project Brief for design direction: reference site URL, vibe description (*"feels like Airbnb but for ___"*), and color/tone notes. This is the foundation of solving the #1 creative-team friction point. It surfaces as part of the Starter Prompt automatically.

#### GROWTH (v1.1)

**Reference Site Scraper**
Paste a URL; the platform extracts visual characteristics (color palette, layout type, typography feel) and adds them to the Project Brief. Reduces the verbal translation burden for visual thinkers.

**Prompt Iteration Log**
Tracks the participant's prompts across the Build Block — "prompt 1 → prompt 7." Learning artifact for the Reflect Block and for the Organizer's post-event report.

**Multi-Tool Prompt Formatting**
Starter Prompt auto-formats based on selected build tool syntax (Lovable vs. Cursor system prompt vs. Bolt).

#### PREMIUM

**Team Project Briefs**
Two participants can co-author a Project Brief and share a build.

---

### AREA 5: Document Editing (EDIT.Prmptr — embedded)

#### CORE (MVP)

**Inline Document Editing**
Every block that produces a document — Project Brief, Pitch Notes, Reflection — uses EDIT.Prmptr's editing layer. Participants never see "EDIT.Prmptr" as a product name. It's just the editor inside each block.

**Organizer Annotations**
Organizers can leave comments on any participant's Project Brief. Async coaching between sessions. Critical in a self-serve model where real-time facilitation isn't happening.

#### GROWTH (v1.1)

**Version History**
See the evolution of a Project Brief over time.

**Export to PDF / Google Doc**
Participants export their Project Brief and Reflection as clean documents. Needed for sharing up to leadership post-event.

#### PREMIUM

**Real-Time Co-Editing**
Organizer + participant editing the same document simultaneously. For workshop-style sessions.

---

### AREA 6: Voting and Awards (Hacky Awards → Block 8)

#### CORE (MVP)

**Award Category Configuration**
Organizer defines 4–6 categories during event setup. Three pre-populated defaults: Best in Show, Best Execution, Shut Up and Take My Money. Two custom slots — including "Most [Company] Energy," which proved culturally powerful at Seven2.

**Voting Window**
Anonymous, one vote per category per participant. Voting opens and closes when the Organizer triggers it during Block 8. Not before, not after. Constraining the window preserves the ceremony energy.

**Controlled Results Reveal**
Organizer triggers results in a controlled sequence — participants don't see winners until the Organizer reveals them. The reveal is part of the format.

**Winner Cards**
Auto-generated shareable images for each winner: project name, category, event name, company name. Square format for Slack/LinkedIn. Participants sharing their wins is organic marketing — make it trivially easy.

#### GROWTH (v1.1)

**Live Results Display Mode**
A presentation-mode view the Organizer can put on screen during the live ceremony. Animated reveal, full-screen.

**Audience Choice Integration**
External stakeholders (leadership, clients) vote in a subset of categories via a separate link.

#### PREMIUM

**Anonymous Appreciation Messages**
Before voting closes, each participant sends one anonymous appreciation note to any other participant. Revealed alongside the awards. Creates warmth in the ceremony that no other feature can replicate.

---

### AREA 7: Reflections and Feedback

#### CORE (MVP)

**Structured Reflection Form**
7-question reflection, deployed after Demo Day. Questions map to the emotional arc: surprise, challenge, advice to future participants, what's next. Completion is required before the participant can access the Continue block or any post-event content.

**Organizer Reflection Report**
Auto-generated post-event summary: completion rate, participation metrics, notable reflection quotes (with attribution opt-in), and a formatted summary of themes. This is the ROI document the Organizer presents to their CEO. It must be generated automatically — no Organizer should have to synthesize this manually.
- This is the self-serve equivalent of the post-event analysis Nick ran for Seven2. It's what makes the platform feel intelligent rather than just a form tool.

#### GROWTH (v1.1)

**Anonymous Quote Sharing**
Participants opt in to having their reflection quotes surface in the group showcase and post-event report.

**Mid-Event Pulse Check**
3-question check-in mid-way through the Build Block. Surfaces blockers early. Delivered to the Organizer's dashboard with a suggested response for each at-risk participant.

#### PREMIUM

**Cross-Event Benchmarking**
Compare reflection themes and satisfaction scores across all events the org has run. Shows capability growth over time — the strategic ROI argument for annual contracts.

---

### AREA 8: Communication Tools

#### CORE (MVP)

**Platform Announcement Layer**
Organizers send notifications to all participants from within the platform. Delivered in-app + email. The platform also sends automatic notifications when blocks open or close. Participants shouldn't need to check Slack to know what's happening.

**Block Open/Close Notifications**
Automatic alerts to participants when a new block becomes available. Reduces coordination overhead on the Organizer — this happens without them doing anything.

**Organizer Nudge Templates**
Pre-written message templates for common facilitation moments: "You're behind on Block 4 — here's what to do," "Demo Day is in 3 days — here's how to prepare." Organizer sends with one click. This is self-serve facilitation in its most practical form.

#### GROWTH (v1.1)

**Slack Integration**
Platform announcements push to a Slack channel. Facilitator-style digest of participant statuses delivered weekly.

**Microsoft Teams Integration**
Same as Slack. Required for many enterprise accounts.

#### PREMIUM

**In-App Group Feed**
Lightweight social layer: participants share progress screenshots, prompts that worked, discoveries. Replaces the Slack channel for events where Slack isn't the primary tool.

---

### AREA 9: Analytics and Reporting

#### CORE (MVP)

**Event Summary Dashboard**
Post-event: completion rate, reflection submission rate, vote participation, ideas submitted vs. shipped. Auto-generated. The buyer's proof-of-ROI document.

**Organizer Progress Tracker**
Live view during the event: which participants have completed which blocks, who is at risk of falling behind. The Organizer's command center. Essential for self-serve — this is how you facilitate 22 people asynchronously.

#### GROWTH (v1.1)

**Block-Level Engagement Metrics**
Time spent per block, common drop-off points, Planning Block completion rate vs. ship rate correlation. Used to improve the format over time.

**Second-Event Comparison**
Side-by-side metrics for orgs running their second event. Shows measurable improvement. This is the retention feature — it makes running a second event feel like a no-brainer.

#### PREMIUM

**Cross-Event Trend Reports**
AI fluency metrics across multiple events. The strategic ROI argument for multi-year contracts.

**Exportable Case Study Generator**
Pulls metrics, opted-in reflection quotes, and project screenshots into a formatted PDF case study. One-click output for the buyer to share upward or externally.

---

### AREA 10: Platform Administration (Murtopolis)

#### CORE (MVP)

**Event Operations Dashboard**
All active and past events across all customers. Status, participant counts, completion rates.

**Customer Account Management**
Create and manage customer orgs, assign plan tiers, monitor usage. Manual in MVP.

**Content Management**
Edit default block descriptions, onboarding copy, coaching tips, and prompt templates without a code deploy. Organizers will ask for copy tweaks constantly — this must be editable without engineering.

#### GROWTH (v1.1)

**Self-Serve Billing and Provisioning**
Stripe-based. Organizations purchase plans and configure events without Murtopolis involvement. This is what "self-serve" actually means at the business level — and it's a v1.1 priority, not a future item.

**Facilitator Network Management**
For when Murtopolis offers optional facilitation as a premium add-on — assign facilitators to events, track performance, manage access.

---

### AREA 11: Showcase and Case Study Generation

#### GROWTH (v1.1)

**Event Showcase Page**
Public-facing gallery of all projects from an event. Shareable URL. Shows project name, one-line description, live URL, participant first name and role. Opt-in per participant. This is the social proof engine — both for the Organizer showing their team's work and for Hacksathon.com acquiring new buyers.

**Project Profile Page**
Each shipped project gets a lightweight public page: project name, builder's first name + role, one-line description, live URL, one reflection quote. Auto-generated at event close.

#### PREMIUM

**Case Study Document Generator**
Formatted PDF case study from event data. For Organizers presenting to leadership or using in their own marketing.

**Hacksathon.com Public Showcase**
Opt-in listing on Hacksathon.com's own gallery of past events. Social proof for the platform, discovery mechanism for prospective buyers.

---

### AREA 12: Build Tool Flexibility

#### CORE (MVP)

**Build Tool Selection**
Organizer selects the primary build tool during event setup: Lovable, Cursor, Bolt, or Replit. This selection populates: the Starter Prompt format, the Build Block instructions, and tool-specific coaching tips throughout the platform. Lovable is the default for non-technical audiences.

**Tool-Specific Onboarding Tip Sets**
Pre-written "things to know before you start" for each supported tool. Surfaces at the start of the Build Block. Static in MVP.

#### GROWTH (v1.1)

**Multi-Tool Events**
Individual participants can use different tools within the same event.

**Design Direction Resource**
An in-platform guide for visual thinkers: the reference site method, mood board description technique, "this feels like [Brand X] for [Audience Y]" framing, before/after prompt examples. Addresses the single biggest friction point for the creative-agency audience. Not a book chapter — a standalone tool-agnostic resource.

#### FUTURE

**Native Build Preview**
Embedded iframe of the participant's live build URL, refreshable from within the platform. Reduces context-switching during the Build Block.

---

### AREA 13: Book Integration (Deferred)

All book-specific features are deferred to post-launch. When the book is ready, the integration model is:

**GROWTH (when ready):** Contextual learning panels — relevant chapter excerpts surfaced at each block intro. Collapsible, 2–3 paragraphs max. Drives book sales without interrupting the build experience.

**GROWTH (when ready):** "Why this works" tooltips — at key friction moments (the scope validation, the Planning Block gate), a tooltip credits the book concept and links to the chapter. Makes the platform feel principled rather than arbitrary.

**PREMIUM (when ready):** Full "Learn" section — the complete book content, searchable by phase and topic.

**FUTURE:** AI Book Assistant — conversational interface drawing on book content to answer participant questions mid-build.

**Important note on the companion pieces:** The Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, and Demo Framework are all in CORE as platform mechanics, justified entirely on their own merits. When the book launches, it will describe tools participants already know — which is a better integration than introducing them as "book content." The book earns its place by being useful, not by being surfaced.

---

## Priority Summary Table

| Feature Area | CORE | GROWTH | PREMIUM | FUTURE |
|---|---|---|---|---|
| Event Setup | Wizard, Organizer Onboarding, Block Config, Branding, Cadence, Coaching Layer | Duplication, Custom Templates, Multi-track | White-label, Multi-event dashboard | — |
| Participant Mgmt | Invite, Participant Onboarding, Roles, Status Tracker | Cohort Groups, Skill Tags | SSO | — |
| IdeaLab (Block 2) | Submission + Scope Validation, Gallery, Status, One-Idea Rule | PRD Generator, Competitive Analysis | — | Persistent IdeaLab |
| Planning (Block 4) | Gated Brief Flow, Project Brief, Starter Prompt, Vibe Capture | Reference Scraper, Prompt Log, Multi-tool Formatting | Team Briefs | — |
| Document Editing | Inline Editor, Organizer Annotations | Version History, Export | Co-editing | — |
| Awards (Block 8) | Category Config, Voting Window, Controlled Reveal, Winner Cards | Live Display Mode, Audience Choice | Anonymous Appreciation | — |
| Reflections | Structured Form, Organizer Report | Anonymous Quotes, Pulse Check | Cross-event Benchmarking | — |
| Comms | Announcement Layer, Block Notifications, Nudge Templates | Slack, Teams | In-App Feed | — |
| Analytics | Event Summary, Progress Tracker | Block Metrics, Second-Event Comparison | Trend Reports, Case Study Gen | — |
| Admin | Ops Dashboard, Account Mgmt, Content Mgmt | Self-Serve Billing, Facilitator Network | — | — |
| Showcase | — | Showcase Page, Project Profiles | Case Study Doc Gen, Public Gallery | — |
| Build Tools | Tool Selection, Tool-Specific Tips | Multi-tool Events, Design Direction Resource | — | Native Preview |
| Book Integration | (Companion pieces reframed as platform mechanics — no book dependency) | Learning Panels, Tooltips (when book ready) | Learn Section | AI Assistant |

---

## MVP Launch Scope — The Shortest Viable Path

To launch as fast as possible, CORE is the ceiling. But within CORE, the minimum viable sequence is:

**Must be flawless at launch (highest user impact):**
1. Organizer Onboarding Flow + Event Creator Wizard
2. Participant Onboarding Flow (with the passion project framing)
3. Idea Submission with Scope Validation (Block 2)
4. Planning Block — gated, with Starter Prompt output (Block 4)
5. Awards Block — voting, reveal, winner cards (Block 8)
6. Reflection Form + Organizer Report (Block 9)
7. Participant Progress Tracker (Organizer dashboard)

**Can be lighter at launch (functional but not polished):**
- Mid-Check Block (Block 6) — can be a simple check-in form in MVP
- Continue Block (Block 10) — can be a placeholder with a "coming soon" message
- Analytics beyond the Event Summary
- All GROWTH and PREMIUM items

**The launch bar:** An Organizer who has never heard of Hacksathon.com should be able to sign up, configure a full event, invite 20 participants, and run it to Demo Day without sending a single support message. That is the definition of "self-serve."

---

*End of Session 3: Feature Prioritization (v2)*
*Next: Session 4 — Product Architecture & Go-to-Market Model*
