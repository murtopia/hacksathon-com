# Claude Project Setup Guide — Hacksathon.com Product Strategy

## Step 1: Create the Project

1. Go to https://claude.ai/projects
2. Create a new project named: **"Hacksathon.com — Product Strategy"**
3. Set the project instructions (paste the text from the "Project Instructions" section below)

## Step 2: Upload Project Knowledge

Upload ALL files from the `strategy-inputs/` folder:

### existing-docs/ (upload all 6 files)
- `PLANNING.md`
- `README.md`
- `playbook.pdf`
- `zero-prmptr-features.md`
- `idealab-overview.md`
- `edit-prmptr-overview.md`

### supabase-exports/ (upload all 6 files)
- `reflections.csv`
- `votes.csv`
- `awards.csv`
- `idealab-ideas.csv`
- `blocks.csv`
- `excluded-projects.csv`

### When available, also upload:
- `slack-export/` — Slack channel history
- `meeting-transcripts/` — Google Meet transcripts
- `google-docs/` — Any planning documents

---

## Project Instructions

Paste this into the Claude Project's custom instructions field:

```
You are a product strategist and SaaS architect helping design Hacksathon.com — a commercial SaaS platform that enables small and medium businesses to run their own company-wide hackathons.

CONTEXT:
- Nick Murto (Murtopolis) successfully ran a hackathon at Seven2 (a creative digital agency in Spokane, WA) using a custom-built event site, IdeaLab, ZERO.Prmptr, EDIT.Prmptr, and the Hacky Awards voting system.
- The Seven2 Hacks-a-Thon had ~22 participants (designers, strategists, content creators, project managers — NOT programmers), ran over 2-3 weeks, and resulted in 13 completed working prototypes.
- Nick now wants to package this entire experience into a commercial SaaS product at Hacksathon.com that any company can subscribe to and run their own hackathon.

EXISTING TOOLS TO INTEGRATE:
1. IdeaLab — Idea submission and management with AI features (idea generation, competitive analysis, feature prioritization, PRD generator)
2. ZERO.Prmptr — Conversational AI documentation generator for vibe coding projects
3. EDIT.Prmptr — Rich WYSIWYG markdown editor with sharing and export
4. Hacky Awards — Blind voting system with configurable categories
5. Event Site — Block-based timeline, reflections system, admin dashboard

The project knowledge files contain the complete documentation, database schemas, participant reflections, voting data, and project ideas from the Seven2 pilot. Use this data to inform every recommendation.

KEY PRINCIPLES:
- This is for NON-TECHNICAL teams — the UX must be dead simple
- The Seven2 experience is the gold standard — preserve what worked, fix what didn't
- Multi-tenant SaaS — each company gets their own isolated hackathon instance
- Three user roles: Participant, Org Admin (client company), Platform Admin (Murtopolis)
- The playbook structure (time-blocked phases from Kickoff to Showcase) is core IP
```

---

## Strategy Sessions

Run these as separate conversation threads within the project, in order:

### Session 1: Learnings Synthesis

```
Analyze ALL the data from the Seven2 hackathon — the participant reflections, vote results, project ideas, the playbook, and the planning documentation.

I need you to synthesize this into a comprehensive learnings report:

1. What were the biggest wins? What made this hackathon successful?
2. What were the pain points and friction? Where did participants struggle?
3. What patterns emerge from the reflection data? Group by theme.
4. What does the voting data tell us about what people valued?
5. What did participants say about the tools (IdeaLab, ZERO.Prmptr, Loveable)?
6. What would make the next hackathon 10x better based on this feedback?
7. What quotes are most powerful for marketing/case study use?

Be specific — cite individual responses and data points. This report will drive every product decision we make.
```

### Session 2: Product Vision & Positioning

```
Based on the learnings synthesis, help me define the Hacksathon.com product vision.

Answer these questions:
1. Who is the ideal customer? (company size, industry, team composition, budget)
2. What's the unique value proposition vs. running a hackathon manually?
3. How does this compare to existing platforms like Devpost, MLH, HackerEarth?
4. What makes this specifically powerful for non-technical teams?
5. What's the one-line pitch? The elevator pitch? The positioning statement?
6. What's the brand personality? (The Seven2 event had a very specific vibe — "We're all just hacks")
7. How do we use the Seven2 case study as proof of concept?

I want a crisp product vision document I can reference throughout development.
```

### Session 3: Feature Prioritization

```
Given the existing tools (IdeaLab, ZERO.Prmptr, EDIT.Prmptr, Hacky Awards, the event site framework), design the integrated feature set for Hacksathon.com.

For each feature, classify as:
- CORE (must ship in MVP)
- GROWTH (ship in v1.1-v1.3)
- PREMIUM (higher tier only)
- FUTURE (post-launch roadmap)

Consider these feature areas:
1. Event setup and configuration (blocks, timeline, dates, branding)
2. Participant onboarding and management
3. Idea submission and management (IdeaLab)
4. AI-assisted documentation (ZERO.Prmptr)
5. Document editing and sharing (EDIT.Prmptr)
6. Voting and awards (Hacky Awards)
7. Reflections and feedback collection
8. Communication tools (Slack integration, notifications, announcements)
9. Analytics and reporting (for org admins)
10. Platform administration (for Murtopolis)
11. Showcase / public case study generation
12. Build tool flexibility (not just Loveable — Cursor, Replit, Bolt, etc.)

IMPORTANT — "Vibe Coding for Creatives" Book Integration:
Nick is writing a companion book called "Vibe Coding for Creatives" — a field guide for turning creative instincts into real products. The book maps directly to the hackathon phases (Kickoff = mindset + ideas, Build = prompting + iteration, Checkpoints = QA testing, Demo = shipping). It also includes companion pieces: Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, and Demo Framework.

Consider how the book integrates into the platform:
- Should key chapters or excerpts be surfaced as in-app learning content alongside each timeline block?
- Should the companion pieces (worksheets, checklists, trackers) become interactive in-app tools rather than static downloads?
- Where does book content appear — onboarding, block intros, help panels, a dedicated "Learn" section?
- Is the book a core feature, a premium add-on, or a standalone product that feeds into the platform?

Also: what gets CUT from the individual tools when integrated? What's redundant?
```

### Session 4: Information Architecture

```
Design the complete information architecture for Hacksathon.com. Map every screen and flow for all three user roles:

1. PARTICIPANT EXPERIENCE
   - Onboarding flow
   - Dashboard / home
   - Idea submission and browsing
   - Documentation workspace
   - Build phase experience
   - Voting ballot
   - Reflection form
   - Showcase / demo day

2. ORG ADMIN DASHBOARD
   - Event setup wizard
   - Timeline/block configuration
   - Participant management
   - Progress monitoring
   - Voting controls
   - Results and analytics
   - Reflection management
   - Communication tools

3. PLATFORM ADMIN (MURTOPOLIS)
   - Client organization management
   - Subscription/billing overview
   - Usage analytics across all clients
   - Support tools
   - Feature flags / rollouts
   - Content management (templates, default blocks)

4. PUBLIC MARKETING SITE
   - Homepage
   - Pricing
   - Case study / showcase
   - Documentation / help

Create a sitemap-style hierarchy and describe the key user flows.
```

### Session 5: Pricing & Packaging

```
Design a SaaS pricing model for Hacksathon.com targeting SMBs (20-500 employees).

Consider:
1. Per-event vs. subscription pricing
2. Per-seat pricing component
3. Feature gating between tiers
4. Free trial or freemium approach
5. Annual vs. monthly billing
6. What to include in each tier
7. AI usage limits (ZERO.Prmptr, IdeaLab AI features use Claude/Gemini API)
8. How to price the premium features (analytics, white-labeling, custom branding)

IMPORTANT — "Vibe Coding for Creatives" Book as a Product Layer:
Nick is writing a companion book called "Vibe Coding for Creatives" with companion pieces (Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, Demo Framework). Consider how this fits into pricing:
- Should the book be bundled free with higher tiers as a value-add?
- Should it be a standalone purchase ($19-29) that serves as top-of-funnel lead gen for the platform?
- Could a "Book + Platform" bundle be an upsell path (buy the book, get a discount on your first event)?
- Should companies be able to purchase book access for all participants as an add-on?
- Could the book's companion pieces be the free tier experience, while the full platform is paid?

Research comparable SaaS pricing in the event management and team collaboration space. Be specific with numbers.

Also consider: should we offer a "Run Your First Hackathon" package that includes onboarding support/consulting from Nick?
```

### Session 6: Go-to-Market Strategy

```
Design the go-to-market strategy for Hacksathon.com.

1. LAUNCH PLAN
   - What does the MVP launch look like?
   - Beta program structure
   - Launch marketing channels

2. SEVEN2 CASE STUDY
   - How do we package the Seven2 experience as marketing content?
   - Which reflection quotes are most powerful?
   - What metrics/outcomes should we highlight?
   - LinkedIn content strategy

3. CONTENT MARKETING
   - Blog topics
   - Social media strategy
   - SEO targets (what do companies search for when planning internal hackathons?)

4. SALES STRATEGY
   - Self-serve vs. sales-assisted
   - Target customer acquisition channels
   - Partnership opportunities (with AI tool companies like Loveable, Cursor, Bolt, Replit)

5. COMMUNITY
   - Should there be a community component?
   - How do we create network effects?
```

### Session 7: Technical Spec Handoff (PRD)

```
Write a complete Product Requirements Document (PRD) that I can bring into Cursor to start building Hacksathon.com.

The PRD should include:

1. PRODUCT OVERVIEW
   - Vision, target user, key differentiators

2. USER ROLES & PERMISSIONS
   - Participant, Org Admin, Platform Admin
   - What each role can see and do

3. FEATURE SPECIFICATIONS
   - Detailed specs for every MVP feature
   - Acceptance criteria
   - Edge cases

4. DATA MODEL
   - Multi-tenant organization model
   - Key entities and relationships
   - How existing schemas (IdeaLab, Hacksathon, ZERO.Prmptr, EDIT.Prmptr) merge

5. INTEGRATION ARCHITECTURE
   - How the 5 tools become modules in one app
   - Shared vs. module-specific database tables
   - API routes needed

6. TECH STACK RECOMMENDATION
   - Framework, database, auth, payments, AI, hosting
   - Justify each choice

7. IMPLEMENTATION PHASES
   - Phase 1: Core platform (auth, orgs, event setup)
   - Phase 2: Ideation module (IdeaLab)
   - Phase 3: Documentation module (ZERO.Prmptr + EDIT.Prmptr)
   - Phase 4: Awards and reflections
   - Phase 5: Analytics and showcase
   - Phase 6: Marketing site and billing

8. NON-FUNCTIONAL REQUIREMENTS
   - Performance, security, accessibility, compliance

Format this as a clean, structured document I can paste into my development environment.
```

---

## Tips for Best Results

- Run each session as its own conversation thread so Claude has focused context
- If a session generates a long document, ask Claude to also create a "TL;DR" summary
- After Session 7, ask Claude to consolidate all sessions into one master strategy document
- Save the final PRD as a file — you'll bring it back to Cursor for Phase 3
- You can add the Slack export and meeting transcripts to the project knowledge at any time — Claude will automatically incorporate them into future conversations
