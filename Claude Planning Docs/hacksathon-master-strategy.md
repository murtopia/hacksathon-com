# Hacksathon.com — Master Strategy Document
*Consolidated from Sessions 1–6 + ZERO.Prmptr Enhancement Spec + PRD + Cursor Kickoff Prompt*
*Last updated: April 2026*

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Seven2 Case Study — Proof of Concept](#2-the-seven2-case-study--proof-of-concept)
3. [Learnings & Product Implications](#3-learnings--product-implications)
4. [Product Vision & Positioning](#4-product-vision--positioning)
5. [Confirmed Product Decisions](#5-confirmed-product-decisions)
6. [Feature Prioritization](#6-feature-prioritization)
7. [Information Architecture](#7-information-architecture)
8. [Pricing & Packaging](#8-pricing--packaging)
9. [Go-to-Market Strategy](#9-go-to-market-strategy)
10. [ZERO.Prmptr — Enhancement Spec](#10-zeroprmptr--enhancement-spec)
11. [Development — Cursor Kickoff Reference](#11-development--cursor-kickoff-reference)

---

## 1. Product Overview

**Hacksathon.com** is a structured hackathon platform for non-technical teams. It combines a guided facilitation format, AI-native build tooling, and a repeatable block-based event structure that allows any organization to run a complete AI capability program — without hiring developers, without a dedicated facilitator, and without starting from scratch each time.

The platform integrates three existing tools into a unified experience:

- **ZERO.Prmptr** — a planning tool that walks users through a 5-step conversational flow to generate a Project Brief and Starter Prompt for a vibe coding tool like Lovable or Cursor. Approximately 90% complete. Becomes **Block 4: Planning** inside Hacksathon.
- **IdeaLab** — an idea submission and tracking tool (originally built in Lovable, now running in Cursor). Functional. Becomes **Block 2: Ideation** inside Hacksathon.
- **EDIT.Prmptr** — an embedded document editing layer. Powers the document output for any block that produces written output.

The planning conversation engine (ZERO.Prmptr) is a **shared module** — improvements made in one context apply to both the standalone product and the Hacksathon Block 4 integration simultaneously.

### The Block-Based Mental Model

Everything in the participant experience lives inside a **Block** — a time-boxed phase with a defined input, defined output, and defined participant action.

```
BLOCK 1: Kickoff       → Output: Participant oriented, permission granted
BLOCK 2: Ideation      → Output: One idea submitted with one-sentence scope
BLOCK 3: Pitch         → Output: One-minute pitch delivered, peer feedback logged
BLOCK 4: Planning      → Output: Project Brief generated (REQUIRED — hard gate)
BLOCK 5: Build         → Output: Working prototype with live URL
BLOCK 6: Mid-Check     → Output: Blocker surfaced or progress confirmed
BLOCK 7: Demo          → Output: 3-min demo + 2-min Q&A delivered
BLOCK 8: Awards        → Output: Votes cast, winners announced
BLOCK 9: Reflect       → Output: Reflection submitted
BLOCK 10: Continue     → Output: Next idea or next build session initiated
```

**Block 4 is the only hard gate.** All other blocks are open and self-paced. Participants cannot access Block 5 (Build) until Block 4 (Planning) is complete. This is non-negotiable — not a soft recommendation.

---

## 2. The Seven2 Case Study — Proof of Concept

### Event Metrics

| Metric | Value |
|---|---|
| Participants | ~22 |
| Ideas submitted | 32 |
| Completed projects (live URL) | 14 |
| Completion rate | **100%** of those who started shipped |
| Participants with coding experience | ~2 |
| Reflection submissions | 13 |
| Award votes cast | 90 (15 voters, 6 categories) |
| Best in Show margin | 12 of 15 votes (80%) |
| Participants wanting to continue building | 9 of 13 (69%) |
| Event duration | ~6 weeks, part-time |
| Time per session | 30–45 minutes |

> **Headline stat for all marketing: 100% completion rate. Zero coding experience.**
> Every participant who started, shipped.

### Top Projects

- **Drift** — Bedtime story generator with 11 Labs voice narration. Best in Show (12/15 votes), Best Execution, Shut Up and Take My Money. Won because: deeply personal emotional core, real production quality, obvious commercial potential.
- **Cut-up Lyric Generator** — Most Creative Idea, Most Seven2 Energy. Won because: genuinely personal, weird, and authentic.
- **Even Grounds** — Coffee journaling app. Third award winner.

All three top projects were personal passion projects — not work tools. This was not an accident.

### The Most Powerful Quotes

**Lead quote — use everywhere:**
> *"I have definitely found myself thinking, 'oh I could make a solution for that' — rather than 'someone should make an app for that.'"* — Sena Lauer, Seven2

**The accessibility proof:**
> *"Hacks-a-thon definitely proved that anyone can make an app or website using current AI and vibe coding platforms."* — Adam Simons

**The surprise moment:**
> *"I hardly had to do anything manually!"* — Alliyah Evans

**The mindset shift:**
> *"You don't have to choose between being a designer or a developer — you can be a product architect."* — Joe Moore

**The practical advice (most shareable):**
> *"Just start! And refine."* — Callen Fulbright

**Self-aware and funny (best for social):**
> *"I would make a great client — the prompts I gave Lovable felt like a client + agency relationship."* — Eiser

**The organizer reflection:**
> *"How much fun everybody else had."* — Nick Murto (on what surprised him most)

---

## 3. Learnings & Product Implications

### What Worked

- **Personal passion projects outperformed work projects** — the format's explicit permission to build something silly or personal produced the most engaged participants and most polished outcomes
- **Shark Tank pitch session** created social accountability and collective energy
- **Time-blocked sessions** forced progress that self-directed learning would never produce
- **Demo Day** served as the forcing function for completion — "in progress" is never the final state
- **Low-pressure framing** ("we're all just hacks") removed the fear barrier universally

### What Didn't Work (Pain Points to Fix in the Platform)

**1. Design direction to AI is genuinely hard**
The single most consistent friction point. Creatives who communicate visually struggled to translate design instincts into text prompts. The workaround participants discovered — using reference websites as design anchors — is currently undocumented tribal knowledge. It must be a taught, upfront technique.

**2. Scoping was a recurring failure mode**
AI's enthusiasm for feature suggestions created over-scoping. Multiple participants watched tight ideas balloon. The fix: a required "scope guardian" moment before the build phase.

**3. Starting without a plan was the most commonly cited regret**
Nearly every participant who reflected on what they'd do differently mentioned wanting more planning before the first prompt. The fix: make planning unavoidable via the Block 4 hard gate.

**4. ZERO.Prmptr was praised but underused**
The tool was described positively, but participants didn't know how to bridge it to Lovable. The fix: a single "Copy your first prompt" button after the Project Brief is generated.

**5. Tool overwhelm was real, especially early**
ZERO.Prmptr + IdeaLab + Lovable + Slack felt like a lot simultaneously. The fix: a unified single-identity platform where all tools live inside a single event experience.

### Five Core Product Implications

1. **The format IS the product.** Every feature either serves participant movement through the block sequence or it waits.
2. **The emotional arc is the key metric.** *Intimidation → Permission → First output → Surprise → Pride → "I have more ideas."* Design the platform to maximize each transition.
3. **Planning before prompting is the highest-leverage intervention.** Make it unavoidable. Enforce it structurally.
4. **Design direction is the unsolved problem for creative teams.** Every technical tool assumes text-first communication. Creative teams think visually. Solve this and win the creative agency audience.
5. **Post-event is an untapped opportunity.** 69% of participants wanted to keep building. A designed "what's next" path converts a one-time event into a recurring capability.

---

## 4. Product Vision & Positioning

### Ideal Customer Profile

- **Company type:** Creative and knowledge-work agencies. 20–200 people. Strategy, design, marketing, PR, consulting. Non-technical teams where even PMs don't code.
- **Trigger moment:** "We need to show our team what AI can do." Post-offsite momentum, leadership mandate, or competitive pressure.
- **Budget signal:** $3k–$15k event budget.
- **Adjacent ICP (confirmed):** Professional services firms — law, accounting, consulting. The passion project framing applies universally.

### One-Line Pitch
The structured hackathon format that turns non-technical teams into builders — in six weeks, part-time.

### Elevator Pitch (30 seconds)
Most companies want their teams to understand AI by using it — not by sitting through another workshop. Hacksathon gives you a complete format: a facilitated, time-blocked build program where anyone — regardless of technical background — ships a real, working product. We ran it at a 22-person creative agency. 100% of participants who started shipped live apps in six weeks. None of them had ever written code.

### Competitive Position

| Competitor | Their weakness | Our position |
|---|---|---|
| Devpost | Assumes technical participants. Pure submission infrastructure. | We facilitate non-technical teams. |
| MLH | Student developers, university events. Zero corporate use case. | We serve companies, not colleges. |
| HackerEarth | Evaluation-first mindset. Intimidating to non-technical participants. | Creative unlocking, not assessment. |
| DIY playbooks | Format dies with the facilitator. Can't scale or repeat. | The format IS the platform — portable and repeatable. |

### Brand Personality

**North star phrase:** *"Build something you personally want to exist in the world."*
This is the first thing every participant hears — before tools, before format, before anything. It is the permission structure the entire experience rests on.

- **Earned confidence, not hype** — We promise a first live URL, not transformation.
- **Low pressure, high accountability** — Progress over perfection. But there is a Demo Day.
- **AI as collaborator, not magic** — Always "your AI partner," never "our AI engine."
- **Tool-agnostic, format-first** — The format works with Cursor, Bolt, Replit, whatever comes next.

### Emotional Arc (the metric that matters most)
> **Intimidation → Permission → First output → Surprise → Pride → "I have more ideas"**

---

## 5. Confirmed Product Decisions

All decisions below are locked. Treat them as constraints, not variables, in all architecture, design, and development work.

| Decision | Resolution |
|---|---|
| Business model | Self-serve SaaS only. No facilitation dependency. Nick is not the product. |
| Book integration | Deferred to post-launch. Platform stands completely on its own at launch. |
| Block gating | Fully self-paced; Block 4 is the only hard gate. |
| URL structure | Path-based: `/p/[event-slug]/` — no subdomains at launch. |
| Awards reveal | Platform-generated click-through presentation, screen-shared by Organizer on Demo Day. |
| Mobile priority | Participant home, gallery, voting, reflection form, marketing homepage + case study. |
| Help center | Notion public pages at launch. `/help/` redirects to Notion. Intercom as upgrade path. |
| Headline stat | 100% completion rate (not 64%). Update everywhere. |
| Primary ICP | Ad agencies first; professional services (law, accounting) as confirmed adjacent ICP. |
| Nick's post-beta involvement | None. Platform only. No onboarding calls, no facilitation. |
| Launch Partner add-on | Removed. |
| LinkedIn | Dedicated Hacksathon business account; personal accounts amplify. |
| ProductHunt timing | Only after platform fully built and case studies are live. |
| AppSumo | Confirmed pass. Wrong buyer profile. |
| Reseller model | Off the table. Word-of-mouth referrals only. |
| Community | No cross-company community. Per-event Slack/Teams channels only. |
| Public gallery | Best in Show winners only; cumulative lifetime voting; launches at 6 completed events. |
| Consent model | Two-level opt-in (company default + participant override). More restrictive setting wins. |
| Company results page | Shareable, LinkedIn-ready page generated at event close for every completed event. |
| Second case study targets | Nick's law firm and accountants. |
| Beta recruitment | Nick personally recruits all beta partners. |
| Build tool default | Lovable (affiliate-attributed). Platform supports Lovable, Cursor, Bolt, Replit. |

---

## 6. Feature Prioritization

**Framing principle:** The format is the product. Every feature either serves participant movement through the block sequence or it waits.

**Tier definitions:**
- **CORE (MVP):** Required for launch. The platform is not self-serve without these.
- **GROWTH (v1.1):** Ships in the first major update after successful launch.
- **PREMIUM:** Paid feature gate. High margin, low volume buyers.
- **FUTURE:** On the roadmap but not scheduled.

---

### Area 1: Event Setup & Configuration

**CORE**
- Organizer Onboarding Flow — guided first-run for the event configurator. Most important UX surface in the product.
- Event Creator Wizard — 6 steps: company, event name, participant count, dates, tool, awards. Under 10 minutes.
- Block Customization — edit titles, descriptions, dates. Sequence is fixed.
- Basic Branding — company logo + primary color applied to participant-facing views.
- Session Cadence + Calendar Invites — auto-generated from Organizer's session rhythm.
- Organizer Coaching Layer — "Facilitator Notes" at each block. Organizer view only. Scales Nick's instincts.

**GROWTH**
- Event Duplication — clone a past event as the starting point for a new one.
- Custom Block Templates — save and reuse modified block configurations.
- Multi-track Events — multiple cohorts on different timelines within the same event.

**PREMIUM**
- White-Label Event Site — custom domain, full CSS, Hacksathon.com branding removed.
- Multi-Event Organization Dashboard.

---

### Area 2: Participant Onboarding & Management

**CORE**
- Invite System — single account across all tools and all blocks. No separate logins per tool.
- Participant Onboarding Flow — passion project framing is the first thing every participant sees.
- Role Types — Organizer (full admin + coaching layer) and Participant (their work + group gallery only).
- Participant Status Dashboard (Organizer view) — live view of every participant's block completion status. Essential for self-serve facilitation.

**GROWTH**
- Cohort Grouping — assign participants to small groups for peer feedback.
- Skill/Role Tagging — self-identification for role-appropriate tips.

**PREMIUM**
- SSO Integration — SAML/SSO for enterprise IT requirements.

---

### Area 3: Idea Submission & Management (IdeaLab → Block 2)

**CORE**
- Idea Submission Form — title, one-sentence description, "who is this for," and a required scope field: *"This app does ONE thing: ___."* If the response contains "and" → inline coaching fires.
- Idea Gallery — all submitted ideas visible to the full cohort. Social visibility creates early accountability.
- Idea Status Tracking — Submitted → Pitched → In Build → Shipped / In Progress.
- One Active Idea Rule — to pivot, participant archives current idea and creates a new one.

**GROWTH**
- PRD Generator — AI-generated Product Requirements Document, surfaced as a required output of Block 4.
- Competitive Analysis Generator — AI-generated market snapshot for Pitch Block prep.
- Alternative Ideas Generator — AI-suggested variations for participants who are stuck.

**FUTURE**
- Persistent IdeaLab — participants retain access to their idea bank after an event ends.

---

### Area 4: AI-Assisted Planning (ZERO.Prmptr → Block 4)

**CORE**
- The Planning Block Is Gated — hard gate before Block 5. Not a recommendation. A wall.
- Conversational Project Brief Flow — 5-step conversational UX. Outputs a one-page Project Brief.
- The Starter Prompt Button — one button after the Project Brief: "Copy your first prompt." Directly solves the Kelsea Rothaus gap: *"How do we tell Lovable how to use that?"*
- Visual Vibe Capture — dedicated field for design direction: reference site URL, vibe description, color/tone notes. Surfaces in the Starter Prompt automatically.

**GROWTH**
- Reference Site Scraper — paste a URL, platform extracts visual characteristics and adds to the Brief.
- Prompt Iteration Log — tracks the participant's prompts across the Build Block.
- Multi-Tool Prompt Formatting — Starter Prompt auto-formats based on selected build tool.

**PREMIUM**
- Team Project Briefs — two participants co-author a Brief and share a build.

---

### Area 5: Document Editing (EDIT.Prmptr — embedded)

**CORE**
- Inline Document Editing — every block that produces a document uses EDIT.Prmptr's editing layer. Participants never see it as a product name.
- Organizer Annotations — comments on any participant's Project Brief. Async coaching.

**GROWTH**
- Version History — the evolution of a Project Brief over time.
- Export to PDF / Google Doc.

**PREMIUM**
- Real-Time Co-Editing.

---

### Area 6: Voting & Awards (Block 8)

**CORE**
- Award Category Configuration — 4–6 categories. Three defaults: Best in Show, Best Execution, Shut Up and Take My Money. Two custom slots (including "Most [Company] Energy").
- Voting Window — anonymous, one vote per category per participant. Opens and closes when Organizer triggers it.
- Controlled Results Reveal — Organizer triggers results category by category. Participants see nothing until revealed.
- Winner Cards — auto-generated shareable images. Square format for Slack/LinkedIn.

**GROWTH**
- Live Results Display Mode — full-screen animated presentation mode for ceremony.
- Audience Choice Integration — external stakeholders vote via a separate link.

**PREMIUM**
- Anonymous Appreciation Messages — before voting closes, each participant sends one anonymous note to any other participant. Revealed alongside awards.

---

### Area 7: Reflections & Feedback

**CORE**
- Structured Reflection Form — 7 questions mapping to the emotional arc. Required before accessing the Continue block.
- Organizer Reflection Report — auto-generated post-event summary: completion rate, participation metrics, notable quotes, and theme summary. This is the ROI document the Organizer presents to their CEO.

**GROWTH**
- Anonymous Quote Sharing — opt-in for reflection quotes to surface in the group showcase.
- Mid-Event Pulse Check — 3-question check-in mid-Build Block. Surfaces blockers early.

**PREMIUM**
- Cross-Event Benchmarking — compare reflection themes across all events the org has run.

---

### Area 8: Communication Tools

**CORE**
- Platform Announcement Layer — in-app + email notifications sent by Organizers.
- Block Open/Close Notifications — automatic alerts when a new block becomes available.
- Organizer Nudge Templates — pre-written templates for common facilitation moments.

**GROWTH**
- Slack Integration.
- Microsoft Teams Integration.

**PREMIUM**
- In-App Group Feed — lightweight social layer within an event.

---

### Area 9: Analytics & Reporting

**CORE**
- Event Summary Dashboard — post-event: completion rate, reflection submission rate, vote participation, ideas submitted vs. shipped.
- Organizer Progress Tracker — live view of which participants have completed which blocks. The Organizer's command center.

**GROWTH**
- Block-Level Engagement Metrics.
- Second-Event Comparison — side-by-side metrics for orgs running their second event.

**PREMIUM**
- Cross-Event Trend Reports.
- Exportable Case Study Generator.

---

### Area 10: Platform Administration (Murtopolis Internal)

**CORE**
- Event Operations Dashboard — all active and past events across all customers.
- Customer Account Management — create and manage customer orgs. Manual in MVP.
- Content Management — edit default block descriptions, coaching tips, and nudge templates without a code deploy.

**GROWTH**
- Self-Serve Billing and Provisioning — Stripe-based. V1.1 priority, not future.
- Facilitator Network Management.

---

### MVP Launch Scope — The Shortest Viable Path

**Must be flawless at launch:**
1. Organizer Onboarding Flow + Event Creator Wizard
2. Participant Onboarding Flow (with passion project framing)
3. Idea Submission with Scope Validation (Block 2)
4. Planning Block — gated, with Starter Prompt output (Block 4)
5. Awards Block — voting, reveal, winner cards (Block 8)
6. Reflection Form + Organizer Reflection Report (Block 9)
7. Participant Progress Tracker (Organizer dashboard)

**Can be lighter at launch:**
- Mid-Check Block (Block 6) — simple check-in form in MVP
- Continue Block (Block 10) — placeholder with "coming soon"
- Analytics beyond Event Summary
- All GROWTH and PREMIUM items

**The launch bar:** An Organizer who has never heard of Hacksathon.com should be able to sign up, configure a full event, invite 20 participants, and run it to Demo Day without sending a single support message.

---

## 7. Information Architecture

Four distinct surfaces. Two user-facing, one internal, one public.

| Surface | Primary User | Job to Be Done |
|---|---|---|
| Participant Experience | Individual hackathon participant | Move through blocks, ship a product |
| Org Admin Dashboard | Event organizer (buyer) | Configure, monitor, and run an event |
| Platform Admin (Murtopolis) | Internal — Nick + team | Manage clients, billing, and platform ops |
| Public Marketing Site | Prospective buyers | Understand, trust, and purchase |

---

### Surface 1: Participant Experience

**URL structure:** `/p/[event-slug]/`

**Key flows:**

**Flow 1: First Login**
Invite link → Account creation (name, role, password) → Passion project framing screen → Block 1 Kickoff → Block 2 CTA

**Flow 2: Completing the Planning Gate (Block 4)**
Arrive at Block 4 → Gate message → 5-step conversational planning flow → Project Brief generated → Starter Prompt auto-generated → Copy Starter Prompt → Affiliate link to Lovable → Block 4 complete → Block 5 unlocked

**Flow 3: Submitting a Live URL**
Block 5 → Build in Lovable (external) → Return to platform → Paste URL → Validation → Submit → Block 5 complete → Demo Day unlocked

**Flow 4: Voting and Reveal**
Organizer activates voting → Participant receives notification → Open ballot → One vote per category → Submit → Waiting state → Organizer triggers reveal

**Block 4 — Planning (ZERO.Prmptr — GATED)**
Gate message: *"You can't start building yet. This is the most important 30 minutes."*

Five conversational steps:
1. What does this do? (core function, one sentence)
2. Who is it for? (one specific person)
3. What does it look like? (vibe, feel, reference sites)
4. What does it NOT do? (scope guard)
5. What does success look like? (done = when?)

Outputs: Project Brief (editable inline) + Starter Prompt (copy button) + Link to build tool (affiliate-attributed for Lovable)

---

### Surface 2: Org Admin Dashboard

**Key flows:**

**Flow 1: First-Time Event Setup (under 10 minutes)**
Sign up → Org name + details → Event Creation Wizard (6 steps) → Send invites → Dashboard (setup mode)

**Flow 2: Running an Active Block**
Dashboard → See block is open → View Facilitator Notes → Send block announcement → Monitor participant completion → Nudge at-risk participants

**Flow 3: Demo Day Operations**
Publish project gallery → Set demo order → Open voting → Monitor vote count → Close voting → View results → Trigger reveal (category by category) → Best in Show moment → Close event

**Flow 4: Post-Event Debrief**
Event Wrap-Up → Reflection report → Export → (GROWTH: generate showcase page)

**Event Creation Wizard steps:**
1. Event Basics (name, company, participant count, branding)
2. Timeline Setup (start date, session cadence, session length, auto-populated block timeline)
3. Build Tool Selection (Lovable recommended, others available)
4. Review & Customize Blocks (titles, descriptions, dates — sequence fixed)
5. Awards Configuration (default categories pre-loaded, editable)
6. Launch (review, invite method, send, confirm)

---

### Surface 3: Platform Admin — Murtopolis

Internal operations tool. Accurate, fast, trustworthy. Not customer-facing.

Key sections:
- Platform Overview (aggregate stats, recent activity)
- Organization Management (all customer orgs, plan tiers, usage)
- All-Events View (across all orgs)
- Billing Overview (MRR, manual billing in MVP, Stripe in v1.1)
- Content Management (block descriptions, onboarding copy, nudge templates, build coaching cards — editable without a code deploy)
- Platform Analytics (aggregate completion rates, block drop-off, tool usage, affiliate attribution)
- Support Tools (impersonate org/participant, reset block completion, event state override)
- Discount & Access Code Tool (percentage-off codes + 100% free access codes for beta partners)

---

### Surface 4: Public Marketing Site

**Key pages:**
- `/` — Homepage (hero stat, format overview, emotional arc, featured projects, FAQ)
- `/how-it-works/` — Full block-by-block walkthrough
- `/pricing/` — Package comparison table
- `/case-study/seven2/` — The Seven2 case study
- `/showcase/` — Public gallery (GROWTH — placeholder at launch)
- `/help/` — Redirects to Notion-hosted help center at launch
- `/about/` — Origin story + philosophy
- `/contact/` — Demo request form

**Homepage hero:** *"The structured hackathon that turns non-technical teams into builders."*
**Above-the-fold stat:** *"100% completion rate. Zero coding experience."*

**Key marketing flows:**
- Organic Discovery → Homepage → How It Works → Pricing → Sign Up (self-serve)
- Word of Mouth → Case Study → Pricing → Sign Up
- Enterprise Buyer → Any page → "Talk to us" → Contact form → Conversation
- Past Participant → Recognizes the case study → Buyer conversion at new company

---

## 8. Pricing & Packaging

### Pricing Model

**Per-event pricing only.** No subscriptions, no annual tiers, no renewals. Every purchase is a one-time event transaction. The product's core value is a permanent capability unlock — most customers will run one event.

**Seat count is the pricing variable.** Packages are based on participants invited to the event, not total company headcount.

**AI usage is fully absorbed.** AI cost per participant is under $0.15/person. No caps, no overages.

**Feature parity across all packages.** The format is the format. No tier-based feature gates.

**Minimum event size: 10 participants.** Below this, the social dynamics that make the format work start to thin out.

### Package Structure

| Package | Participants | Per Seat | Event Total |
|---|---|---|---|
| Boutique | 10–25 | $85 | $850 – $2,125 |
| Agency | 26–50 | $80 | $2,080 – $4,000 |
| Studio | 51–100 | $70 | $3,570 – $7,000 |
| Large | 101–200 | $65 | $6,565 – $13,000 |
| 200+ | Contact us | — | — |

**Returning customers: 20% off automatically.** Applied at checkout when a prior completed event is on the account. No code required.

### Margin Analysis (at 15% affiliate commission ceiling)

| Package | Avg transaction | 15% commission | AI cost | Net |
|---|---|---|---|---|
| Boutique (17 seats) | $1,445 | $217 | $3 | ~$1,225 |
| Agency (38 seats) | $3,040 | $456 | $6 | ~$2,578 |
| Studio (75 seats) | $5,250 | $788 | $11 | ~$4,451 |
| Large (150 seats) | $9,750 | $1,463 | $23 | ~$8,264 |

### Add-Ons

**Launch Partner Package — REMOVED**
No personal involvement from Nick. The Organizer Coaching Layer is the entire facilitation experience.

**"Vibe Coding for Creatives" Book — $29 individual / $199 org license (25 copies)**
Every copy includes a $100-off code for a first event. Companion pieces (Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, Demo Framework) are always free and ungated at hacksathon.com/resources.

### Free Experience — Organizer Preview

No freemium tier. No time-limited trial. Any Organizer can create a free account, configure a complete event, and preview every participant-facing screen — without being able to invite participants. Converts to paid when they click "Invite Participants" and enter payment. Highest-conversion moment: they've already built the event.

### Discount & Access Code Tooling (Murtopolis admin)

Two code types:
- **Percentage-off codes** — configurable %, single or multi-use, optional expiration. For affiliates, promotions, conferences.
- **Free access codes (100% off)** — single-use, tied to a specific package tier. For beta companies, launch partners, press. Beta company sees no indication they are on a free code.

### Distribution & Commission

- **Affiliate partners:** 10–15% of completed purchases. PartnerStack recommended for tracking and payouts.
- **Referral partners:** 10% flat. "Tell a friend" rate.
- **No internal sales hire at launch.**

---

## 9. Go-to-Market Strategy

### Launch Phases

**Phase 1: Private Beta (6–8 weeks before public launch)**
Run 3–5 beta events with free access codes. All beta partners personally recruited by Nick. Goal: case studies that prove the format transfers without facilitation.

*Hard launch gate: Two or more beta events hit 50%+ completion with zero escalations to Nick.*

**Phase 2: Soft Launch (invite-only)**
Self-serve purchasing opens to a waitlist or email list built during beta. No paid ads. Direct network outreach. Seven2 case study is live. Goal: first 10 paying customers.

**Phase 3: Public Launch**
ProductHunt, LinkedIn campaign, agency media outreach. First affiliate partners activated. Public gallery launches only after 6 completed events. Goal: 30 paying customers and a second strong case study.

### Launch Execution Timeline

| Phase | Timeline | Primary Focus | Success Criteria |
|---|---|---|---|
| Pre-launch build | Weeks 1–4 | Beta recruitment, case study page live, LinkedIn content started | 3–5 beta companies confirmed |
| Beta events | Weeks 5–12 | Run beta events, observe via Murtopolis, debrief each company | 2+ events with 50%+ completion rate |
| Soft launch | Weeks 13–16 | Self-serve purchasing live, Seven2 case study live, direct network outreach | First 10 paying customers |
| Public launch | Week 17 | ProductHunt, agency media, first affiliates activated | 30 paying customers, 1 additional case study |
| Growth | Weeks 18–26 | SEO compounding, affiliate program active, gallery launches at 6 events | 50 paying customers, $50k+ revenue |

### Channel Strategy

**Channel 1: LinkedIn (owned, free)**
Dedicated Hacksathon business account — not Nick's personal account. Personal accounts amplify. Four rotating content pillars:
1. **Story Posts** — individual participant narratives from Seven2
2. **Insight Posts** — short, provocative observations from the data
3. **Practical Posts** — useful content about running AI programs at non-technical companies
4. **Behind-the-Build Posts** — building Hacksathon.com itself

Cadence: 3–4 posts per week.

**Channel 2: ProductHunt**
Launch only after platform is fully built and case studies are live. Time for Tuesday or Wednesday. Build hunter network and supporter list in advance. Pitch: *"The hackathon platform for teams who don't code."*

**Channel 3: Direct Outreach (Nick's network)**
First 10 customers come from Nick's professional network. Each sale includes a request for a testimonial and referral invitation.

**Channel 4: Agency-Focused Media**
After Seven2 case study is live, pitch to newsletters and podcasts with agency-leader audiences. Target: Agency Spotter, Campaign, The Drum, agency operations newsletters. Lead with people and outcomes, not software.

**Channel 5: Affiliate Partners (at public launch)**
Activate 2–3 affiliate partners at launch. Target creators with agency-focused audiences already discussing AI tools for creatives.

**Channels that are NOT launch channels:** Google Ads (wait), AppSumo (confirmed pass), cold email at scale (post-launch).

### Partnership Opportunities

**Lovable (highest priority)**
- Affiliate link program for every Lovable account created through a Hacksathon event
- Co-marketing: *"We ran a hackathon with 22 non-technical people. Here's what they built with Lovable."*
- Hacksathon mentioned in Lovable's team-use or getting-started resources

**Cursor, Bolt, Replit (secondary)**
Same logic, lower priority. These tools skew more technical than the primary ICP.

### The Seven2 Case Study as Marketing Asset

The case study is a product, not a page. It lives at `/case-study/seven2/` with its own distinct visual treatment and distribution plan.

**Structure:**
1. Hero stat above the fold: *"100% completion rate. Zero coding experience."*
2. The Challenge
3. The Format (6-week, time-blocked, Shark Tank pitch, Demo Day, Awards)
4. The Results (metrics table)
5. The Unexpected Win (passion projects > work projects)
6. Featured Projects (Drift, Cut-up Lyric Generator, Even Grounds)
7. Participant Quotes (5–6 high-impact)
8. The Lasting Impact (69% wanted to keep building)
9. CTA: *"Run this at your company."*

### Beta Partner Recruitment

**Beta criteria (all three required):**
1. Matches ICP — ad agency, creative agency, or professional services firm. 15–75 people.
2. Has an internal champion — one person who will own the event without delegating.
3. Willing to participate in the value exchange — share reflection data, 30-min debrief call, at least one participant quote, Best in Show opt-in to public gallery.

**The pitch message:**
> *"I built a product called Hacksathon — a structured AI hackathon platform designed specifically for non-technical teams. We ran the first one at Seven2 and 100% of participants shipped a live app in six weeks. None of them had ever written code.*
>
> *I'm looking for 3–5 companies to run a free beta event before we publicly launch. You get the full platform at no cost. In exchange, I'd love a 30-minute debrief after your event and permission to feature your team's best project on the Hacksathon gallery.*
>
> *Given your team, I think this would be a genuinely great experience. Want to see what Seven2 built?"*

**Beta success metrics:**
| Metric | Target |
|---|---|
| Completion rate per event | ≥ 50% without Nick's involvement |
| Block 4 (Planning) completion rate | ≥ 80% of participants |
| Organizer support requests | Zero to one per event |
| Gallery opt-in rate | ≥ 1 Best in Show per event |
| Champion satisfaction (debrief) | Would recommend to a peer |

### Second Case Study

**Targets:** Nick's law firm + Nick's accountants.

**Why these are stronger than a second agency:** A law firm and accounting firm prove the format works for professional services broadly — a much larger addressable market than ad agencies alone.

**Key message:** *"It doesn't matter what industry your team works in. The format works because people build better when it's personal."*

### Public Gallery & Company Results Page

**Public Gallery**
- Curated gallery of Best in Show winners from all events. Launches at 6 completed events.
- Each project card: project name, builder's first name + role, one-line description, live URL, company name, award won.
- Two-level consent: company-level default (Organizer sets event as public/private) + participant-level opt-in at Awards stage.

**Company Results Page**
Generated at event close. Contains: company logo, event name, total projects shipped, completion rate, award winner cards with project names and one-liners, and a CTA: *"Run this at your company → hacksathon.com."* Designed to be screenshot-worthy and LinkedIn-ready. This is the organic acquisition flywheel.

### GTM Quick Reference

| Channel / Metric | Target (first 6 months) |
|---|---|
| Beta events | 3–5 |
| Paying customers (first 90 days) | 10 |
| Paying customers (first 6 months) | 30–50 |
| LinkedIn posts | 3–4/week |
| Blog posts | 1/week |
| Affiliate partners at launch | 2–3 |
| Gallery launch threshold | 6 completed events |
| Revenue target (first 6 months) | $50k+ |
| Primary success metric | Beta completion rate ≥ 50% without Nick's involvement |

---

## 10. ZERO.Prmptr — Enhancement Spec

*Applied to: Hacksathon.com Block 4 + ZERO.Prmptr standalone simultaneously.*

### The Three Problems Being Solved

---

**Problem 1: No Conversation Memory Between Steps**

*Current behavior:* Each planning step is a fresh, stateless API call. The AI has no awareness of what the user said in previous steps.

*Target behavior:* A `planningSession` context object accumulates through all five steps. Every API call receives the full prior conversation. By Step 3, the AI knows the user's target audience and core function well enough to give specific feedback.

```javascript
planningSession = {
  projectName: string,
  ideaId: string,           // from Block 2 / IdeaLab
  buildTool: string,        // from event config
  conversationHistory: [    // full message thread, passed to every API call
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: step1Question },
    { role: 'user', content: step1Answer },
    { role: 'assistant', content: step1Reflection + followUps },
    { role: 'user', content: step1FollowUpResponse },  // if any
    { role: 'assistant', content: advanceConfirmation },
    { role: 'assistant', content: step2Question },
    // ... continues
  ],
  stepAnswers: {            // structured store of confirmed answers per step
    step1: string,
    step2: string,
    step3: { vibe: string, referenceUrl: string, colorNotes: string },
    step4: string,
    step5: string
  },
  mode: 'create' | 'revise',
  existingBriefId: string | null
}
```

---

**Problem 2: The AI Is a Form, Not a Thinking Partner**

*Current behavior:* The AI accepts whatever the user types and advances. No follow-up, no quality evaluation, no surfacing of ideas the user hasn't considered.

*Target behavior:* After each user response, the AI:
1. **Acknowledges and reflects** what it heard — briefly, in a way that shows it actually processed the answer (not just "Got it!")
2. **Offers optional depth** — 1–2 follow-up observations, questions, or ideas. Genuinely useful additions: flagging scope risk, connecting to something said earlier, surfacing an unconsidered angle.
3. **Presents a clear forward path** — a visible "I'm ready to move on →" action the user can take at any point.

The user is never blocked by follow-ups. They can always advance.

**What the AI should be capable of in follow-ups:**
- Noticing when an answer sounds like two things ("this might be two separate ideas — which is the core one?")
- Connecting the current step to something from an earlier step
- Surfacing considerations the user probably hasn't thought about
- Offering a concrete variation
- Gently flagging risk ("this scope is ambitious for a first build — do you want to identify a version 1 that's smaller?")

**What the AI should NOT do:**
- Ask more than 2 follow-up questions at a time
- Repeat or rephrase what the user just said back to them without adding value
- Block advancement to the next step
- Be sycophantic ("Great idea!")

---

**Problem 3: Revisions Restart the Whole Flow**

*Current behavior:* Any change to a plan restarts from Step 1.

*Target behavior:* Two distinct modes:

**Create mode** — the full 5-step conversational flow for a new plan. Unchanged.

**Revise mode** — opened when editing an existing Project Brief. The AI loads the full existing brief and conversation history, opens a targeted dialogue: *"You've got a solid plan for [Project Name]. What do you want to revisit?"*

The AI then: asks clarifying questions about the change, identifies which sections of the Brief are affected, proposes specific updates to those sections, leaves unaffected sections intact, and regenerates the Starter Prompt if the changes warrant it. **The user never has to re-answer questions that haven't changed.**

---

### The Supplemental Analysis Document — "Build Notes"

At the end of all five steps, the AI produces a second document alongside the Project Brief. A second API call using the full `conversationHistory` as input.

**What it contains:**
1. **Tensions and open questions** — things the AI noticed that might create friction during the build
2. **3–5 "questions worth exploring"** — not blockers, but genuinely valuable things to think about before the first prompt
3. **Assumptions to watch** — the biggest bets embedded in the plan
4. **Optional: a v1 / v2 split** — if scope risk was flagged, the AI suggests what belongs in the first build vs. later

**Format:** Lightweight, readable — notes from a smart collaborator who reviewed the plan. Lives alongside the Project Brief, expandable/collapsible in the UI.

---

### What Stays the Same

- The 5-step structure (same questions, same order)
- The Starter Prompt output and copy button behavior
- The Project Brief sections and format
- The Block 4 gate logic (Hacksathon.com only)
- The affiliate link for Lovable (Hacksathon.com only)

### The System Prompt

The system prompt for the planning conversation engine should establish:
- The AI's role: a product thinking partner helping someone plan their first build
- The audience: non-technical creatives who may never have built anything before
- The tone: curious, direct, genuinely helpful — not a chatbot, not a coach
- The rules: max 2 follow-up questions, never block advancement, always acknowledge what came before
- What the AI knows: event context (if in Hacksathon), the build tool being used, the idea from Block 2

### Step Transitions

Each step transition should:
1. Pass the full `conversationHistory` to the next API call
2. Include a brief internal note in system context: "The user has confirmed they're ready to move on from Step N. Do not revisit Step N content. Build on it."
3. Open the next step with a question that demonstrates awareness of prior context.

### The Project Brief Generation

The Project Brief is generated after Step 5 by a final API call that receives the full `conversationHistory` and synthesizes a coherent brief. It is **not assembled from the `stepAnswers` fields directly** — those are the data layer; the AI-generated synthesis is the readable output.

---

## 11. Development — Cursor Kickoff Reference

### Context

Two existing codebases in the workspace:
- **ZERO.Prmptr** — standalone planning tool, ~90% complete. Shares the same tech stack.
- **IdeaLab** — idea submission and tracking tool, originally built in Lovable, now running in Cursor. Functional, needs integration work later.

Both tools become integrated modules inside Hacksathon.com. The planning conversation engine is a shared module — improvements in one place apply to both.

### Stack

Same as all Murtopolis projects: **Vercel, Supabase, GitHub, Stripe** (v1.1), **Anthropic API** for AI features. Check the existing codebase for the specific framework and AI integration patterns in use before writing any new code.

### Priority Order for ZERO.Prmptr Enhancement

1. **Conversation context threading** — foundational. Everything else builds on a working context-aware conversation. Start by exploring the codebase to understand where the planning conversation currently lives, how API calls to Claude are structured, and where step answers are stored. Show the findings before writing any code.

2. **Thinking partner behavior** (follow-ups, reflections, optional depth) — builds on top of threading.

3. **Revision mode** — a separate entry point into the same conversation engine, not a separate component. A different initialization state.

4. **Build Notes / supplemental doc** — a second API call at the end of the flow using the full `conversationHistory` as input. No separate architecture required.

### What Must Not Change

- The 5-step structure (same questions, same order)
- The Starter Prompt output and copy button behavior
- The Project Brief sections and format
- The Block 4 gate logic (Hacksathon.com integration)
- Any changes to the conversation engine must work in both standalone ZERO.Prmptr and embedded Hacksathon.com Block 4 contexts simultaneously

---

*End of Hacksathon.com Master Strategy Document*
*Source sessions: 1 (Learnings Synthesis), 2 (Product Vision & Positioning), 3 (Feature Prioritization v2), 4 (Information Architecture), 5 (Pricing & Packaging), 6 (Go-to-Market Strategy), ZERO.Prmptr Enhancement Spec, Hacksathon PRD, Cursor Kickoff Prompt*
*Last consolidated: April 2026*
