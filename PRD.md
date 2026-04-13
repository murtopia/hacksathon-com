# Hacksathon.com — Product Requirements Document

## 1. Product Overview

### Vision
Hacksathon.com is a SaaS platform that enables any company to run a structured, time-blocked hackathon for non-technical teams using AI building tools. It packages the proven Seven2 Hacks-a-Thon playbook — from ideation through showcase — into a turnkey product with integrated AI documentation, blind voting, reflections, and administration.

### Target Customer
Small and medium businesses (20-500 employees) with creative, non-technical teams who want to:
- Demystify AI for their workforce
- Foster innovation culture
- Give every employee the experience of building something real
- Create internal momentum around AI adoption

### Key Differentiators
1. **Designed for non-technical teams** — not another Devpost for engineers
2. **Complete playbook included** — proven block-by-block structure, not just event logistics
3. **Integrated AI tools** — IdeaLab for ideation, documentation assistant, rich editor
4. **Awards and recognition** — blind voting system with configurable categories
5. **Reflection and learning capture** — structured post-event feedback that feeds case studies

### Core Insight from Seven2 Pilot
12 out of 12 reflection respondents expressed surprise at how accessible AI building was. The most common advice: "Just start." The platform must preserve this low-barrier, encouraging energy while providing the structure that made it work.

---

## 2. User Roles & Permissions

### Participant
- Submit and manage project ideas
- Use AI documentation assistant
- Edit documents in rich editor
- Vote in awards (when open)
- Submit reflections
- View event timeline and resources
- Demo projects at showcase

### Org Admin (Client Company)
- Create and configure hackathon events
- Customize timeline blocks, awards, and branding
- Manage participant roster (invite, remove)
- Monitor progress across all participants
- Control voting windows (open/close, deadlines)
- Manage project eligibility for voting
- View voting results and announce winners
- Manage reflections (view all, feature standouts)
- Access analytics and reports
- Export data (reflections, votes, project list)

### Platform Admin (Murtopolis)
- Manage all client organizations
- View usage and billing across all clients
- Manage subscriptions and feature access
- Access support tools (impersonate org admin view)
- Manage default templates (block structures, award categories, reflection questions)
- Feature flags and rollout controls
- Platform-wide analytics

---

## 3. Feature Specifications

### 3.1 Authentication & Onboarding

**Auth Methods:**
- Email magic link (primary — lowest friction for non-technical users)
- Google OAuth
- Supabase Auth with organization-scoped sessions

**Onboarding Flow:**
1. Org Admin creates account → creates organization
2. Org Admin configures first hackathon event
3. Org Admin invites participants via email or shareable link
4. Participants click invite → create account → land in their org's event

**Acceptance Criteria:**
- Participants cannot see other organizations' data
- Org Admins can only manage their own organization
- Magic links work reliably on mobile
- Invite links carry org and event context

### 3.2 Organization & Event Management

**Organization:**
- Name, logo, primary color, domain
- Billing contact and subscription tier
- Member list with roles (admin, participant)

**Event (Hackathon Instance):**
- Title, description, dates (start/end)
- Custom branding (logo, colors override org defaults)
- Build platform recommendation (Loveable, Cursor, Bolt, Replit, or custom)
- Status: draft, active, voting, showcase, archived
- Shareable public URL for showcase (opt-in)

**Timeline Blocks (from Seven2 playbook):**
- Default template: 8 blocks (Kickoff → Showcase Showdown)
- Fully customizable: add, remove, reorder, rename blocks
- Each block: title, subtitle, duration, description, purpose, status, scheduled date
- Expandable checklists per block (before/during/after items)
- Visual timeline on participant dashboard

**Acceptance Criteria:**
- Org Admin can create multiple events (sequential hackathons)
- Default block template pre-populates but is fully editable
- Block status updates reflect on participant timeline in real-time
- Calendar integration (export to Google Cal / .ics)

### 3.3 IdeaLab Module (Ideation)

**Based on:** IdeaLab (idealab.seven2.com)

**Features:**
- Submit idea: title, pitch (short), description (full), target audience, problem it solves
- Status pipeline: idea_stage → in_progress → completed
- Project URL field (added when live)
- Spark voting (lightweight likes)
- Comments per idea
- Screenshot/image uploads
- Gallery view with filters (by status, by submitter, search)
- Expanded detail modal

**AI Features (from IdeaLab Edge Functions):**
- AI Idea Generator: guided prompts → AI generates multiple idea suggestions
- Competitive Analysis: AI analyzes market for similar solutions
- Feature Prioritization: AI helps rank features by impact/effort
- PRD Generator: AI creates a product requirements doc from the idea

**Acceptance Criteria:**
- All ideas scoped to current event within current organization
- Participants can only edit their own ideas
- Org Admin can view all ideas
- AI features use organization's allocated AI credits

### 3.4 Documentation Module (ZERO.Prmptr)

**Based on:** ZERO.Prmptr (zero.prmptr.ai)

**Features:**
- Conversational AI chat that guides users through documentation
- One question at a time, casual encouraging tone
- Generates 5 documents: Project Brief, Features, User Flows, Design Guide, Tech Stack
- Draft shown for approval before saving
- Quality score (0-100%) based on completeness
- Sidebar progress through document sections
- Pause and resume (auto-save after every answer)
- Download all docs as zip
- Starter prompt generation (copy-paste into AI coding tool)

**Integration Points:**
- Pre-populated with idea data from IdeaLab module
- Generated docs editable in EDIT.Prmptr module
- Docs attached to the participant's project in the event

**Acceptance Criteria:**
- Conversation history persists across sessions
- Documents export as clean markdown
- Starter prompt includes all doc context
- Works with Claude as the AI backend

### 3.5 Editor Module (EDIT.Prmptr)

**Based on:** EDIT.Prmptr (edit.prmptr.ai)

**Features:**
- TipTap WYSIWYG markdown editor
- Extensions: headings, bold/italic/underline/strike, bullet lists, ordered lists, task lists, blockquotes, code blocks (with syntax highlighting), tables, horizontal rules, links, images
- Auto-save with debounce
- Multiple documents per project
- Export: Markdown, HTML, PDF
- Share: public read-only link via slug

**Integration Points:**
- Opens ZERO.Prmptr-generated docs for editing
- Participant can create additional freeform docs
- Org Admin can create shared resources/templates

**Acceptance Criteria:**
- Real-time auto-save (no data loss)
- Clean markdown export matches visual editor
- PDF export maintains formatting
- Mobile-friendly editing experience

### 3.6 Hacky Awards Module (Voting)

**Based on:** Hacky Awards voting system from hacksathon-site

**Features:**
- Configurable award categories (default 6 from Seven2, fully customizable)
- Blind ballot: voters pick one project per category
- Passcode-gated or role-gated access
- Voting window controls (open/close, deadline display)
- Project eligibility toggling (exclude projects from ballot)
- Upsert support (voters can change picks before close)
- Results dashboard with tallies and percentages
- One-click winner announcement (updates public display immediately)
- Same project can win multiple categories
- Ties result in shared awards

**Default Categories (from Seven2):**
1. Best in Show — The overall standout
2. Shut Up and Take My Money — The one everyone wants to use
3. Best Execution — Cleanest build quality
4. Most Creative Idea — The unexpected surprise
5. Best Shark Tank Pitch — Best demo presentation
6. Most [Company] Energy — Pure company spirit (name customizable)

**Acceptance Criteria:**
- Voters cannot see results until admin announces
- One vote per person per category (enforced by DB constraint)
- Org Admin controls all voting settings
- Real-time voter roll call for admin

### 3.7 Reflections Module

**Features:**
- Configurable reflection questions (default 7 from Seven2)
- Passcode-gated or role-gated access
- Participant name auto-populated from auth
- Upsert support (edit and resubmit anytime)
- Admin: view all submissions grouped by participant
- Admin: toggle individual answers as "featured"
- Featured quotes display on public showcase page
- Export all reflections as CSV/PDF

**Default Questions (from Seven2):**
1. What surprised you the most about the experience?
2. What do you wish you'd known before your very first prompt?
3. What did you discover about your own creative process along the way?
4. Did this unlock any ideas you're actually going to pursue?
5. Did this change how you think about AI, vibe coding, or what's possible for you creatively?
6. What advice would you give to a colleague who's nervous to start?
7. What one thing would help future participants jump in faster?

**Acceptance Criteria:**
- Questions fully customizable by Org Admin
- Responses stored per-question per-participant with timestamps
- Featured toggle updates public display in real-time
- Export includes all responses with participant names

### 3.8 Org Admin Dashboard

**Sections:**
1. **Event Overview** — Status, participation stats, timeline progress
2. **Timeline Manager** — Configure and update block statuses
3. **Participants** — Invite, manage, view progress per person
4. **Ideas** — All submitted ideas with status, search, filters
5. **Voting Controls** — Open/close, deadlines, eligibility, results, announce winners
6. **Reflections** — All submissions, featured toggle, export
7. **Analytics** — Participation rate, completion rate, engagement metrics, survey sentiment
8. **Settings** — Event branding, passcodes, notification preferences
9. **Resources** — Upload guides, templates, links for participants

### 3.9 Platform Admin Dashboard

**Sections:**
1. **Organizations** — All client orgs, their events, subscription status
2. **Billing** — Stripe subscription management, revenue tracking
3. **Usage** — AI credit consumption, storage usage, active events
4. **Support** — View any org's event as read-only (impersonation)
5. **Templates** — Manage default block templates, award categories, questions
6. **Feature Flags** — Enable/disable features per tier or per org
7. **Analytics** — Platform-wide metrics, growth tracking

### 3.10 Marketing Site

**Pages:**
- `/` — Homepage with hero, value props, how it works, case study teaser, pricing CTA
- `/pricing` — Tier comparison table
- `/case-study` — Seven2 hackathon case study with real data and quotes
- `/showcase` — Public gallery of completed hackathons (opt-in by orgs)
- `/login` — Auth page
- `/signup` — Org creation flow

---

## 4. Data Model

### Multi-Tenant Architecture

All data is scoped by `organization_id`. Row-Level Security (RLS) enforces tenant isolation at the database level.

### Core Tables

```
organizations
  id: uuid (PK)
  name: text
  slug: text (unique, URL-friendly)
  logo_url: text?
  primary_color: text?
  domain: text?
  stripe_customer_id: text?
  subscription_tier: enum (free, starter, professional, enterprise)
  subscription_status: enum (active, trialing, past_due, canceled)
  created_at: timestamptz
  updated_at: timestamptz

profiles
  id: uuid (PK, FK → auth.users)
  email: text
  full_name: text
  avatar_url: text?
  created_at: timestamptz
  updated_at: timestamptz

organization_members
  id: uuid (PK)
  organization_id: uuid (FK → organizations)
  user_id: uuid (FK → profiles)
  role: enum (admin, participant)
  invited_at: timestamptz
  joined_at: timestamptz?
  status: enum (invited, active, removed)

events
  id: uuid (PK)
  organization_id: uuid (FK → organizations)
  title: text
  description: text?
  start_date: date?
  end_date: date?
  build_platform: text? (loveable, cursor, bolt, replit, any)
  status: enum (draft, active, voting, showcase, archived)
  branding: jsonb (logo_url, primary_color, tagline)
  settings: jsonb (passcodes, feature toggles)
  public_showcase: boolean (default false)
  created_at: timestamptz
  updated_at: timestamptz
```

### Event Structure Tables

```
blocks
  id: uuid (PK)
  event_id: uuid (FK → events)
  block_key: text
  title: text
  subtitle: text?
  duration_minutes: integer
  description: text?
  purpose: text?
  status: enum (upcoming, active, completed)
  scheduled_date: timestamptz?
  sort_order: integer
  checklists: jsonb (array of { group, items[] })
  created_at: timestamptz

award_categories
  id: uuid (PK)
  event_id: uuid (FK → events)
  key: text
  name: text
  description: text?
  sort_order: integer
  created_at: timestamptz

reflection_questions
  id: uuid (PK)
  event_id: uuid (FK → events)
  question_text: text
  sort_order: integer
  is_required: boolean (default true)
  created_at: timestamptz
```

### Project & Ideation Tables

```
ideas
  id: uuid (PK)
  event_id: uuid (FK → events)
  user_id: uuid (FK → profiles)
  title: text
  pitch: text
  description: text?
  target_audience: text?
  problem: text?
  status: enum (idea_stage, in_progress, completed)
  project_url: text?
  created_at: timestamptz
  updated_at: timestamptz

idea_sparks
  id: uuid (PK)
  idea_id: uuid (FK → ideas)
  user_id: uuid (FK → profiles)
  created_at: timestamptz
  UNIQUE(idea_id, user_id)

idea_comments
  id: uuid (PK)
  idea_id: uuid (FK → ideas)
  user_id: uuid (FK → profiles)
  content: text
  created_at: timestamptz

idea_screenshots
  id: uuid (PK)
  idea_id: uuid (FK → ideas)
  image_url: text
  sort_order: integer
  created_at: timestamptz
```

### Documentation Tables

```
documents
  id: uuid (PK)
  idea_id: uuid (FK → ideas)
  user_id: uuid (FK → profiles)
  title: text
  doc_type: enum (project_brief, features, user_flows, design_guide, tech_stack, custom)
  content: text (markdown)
  quality_score: integer?
  is_generated: boolean (default false)
  created_at: timestamptz
  updated_at: timestamptz

doc_conversations
  id: uuid (PK)
  document_id: uuid (FK → documents)
  messages: jsonb (array of { role, content, timestamp })
  current_section: text?
  is_complete: boolean (default false)
  created_at: timestamptz
  updated_at: timestamptz
```

### Voting & Awards Tables

```
votes
  id: uuid (PK)
  event_id: uuid (FK → events)
  user_id: uuid (FK → profiles)
  category_id: uuid (FK → award_categories)
  idea_id: uuid (FK → ideas)
  created_at: timestamptz
  UNIQUE(event_id, user_id, category_id)

awards
  id: uuid (PK)
  event_id: uuid (FK → events)
  category_id: uuid (FK → award_categories)
  winner_idea_id: uuid? (FK → ideas)
  winner_name: text?
  project_title: text?
  project_url: text?
  announced_at: timestamptz?
  created_at: timestamptz

excluded_projects
  id: uuid (PK)
  event_id: uuid (FK → events)
  idea_id: uuid (FK → ideas)
  created_at: timestamptz

voting_config
  id: uuid (PK)
  event_id: uuid (FK → events, UNIQUE)
  voting_open: boolean (default false)
  voting_deadline: text?
  updated_at: timestamptz
```

### Reflections Tables

```
reflections
  id: uuid (PK)
  event_id: uuid (FK → events)
  user_id: uuid (FK → profiles)
  question_id: uuid (FK → reflection_questions)
  answer: text
  is_featured: boolean (default false)
  created_at: timestamptz
  updated_at: timestamptz
  UNIQUE(event_id, user_id, question_id)
```

### Platform Tables

```
platform_admins
  user_id: uuid (PK, FK → profiles)
  created_at: timestamptz

event_templates
  id: uuid (PK)
  name: text
  description: text?
  blocks: jsonb
  award_categories: jsonb
  reflection_questions: jsonb
  is_default: boolean
  created_at: timestamptz
```

---

## 5. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Framework | Next.js 16 (App Router) | Aligns with ZERO.Prmptr and EDIT.Prmptr; Server Components, Server Actions, API routes |
| Language | TypeScript | Type safety across full stack |
| Database | Supabase (Postgres) | Already used in all 4 existing tools; RLS for multi-tenancy; Auth; Realtime; Storage; Edge Functions |
| Auth | Supabase Auth | Magic links + Google OAuth; organization-scoped |
| UI | Tailwind CSS + shadcn/ui | Used in IdeaLab; modern, accessible component library |
| AI | Vercel AI SDK + Anthropic Claude | Used in ZERO.Prmptr; streaming, tool calling, structured output |
| Editor | TipTap | Used in EDIT.Prmptr; extensible, React-native |
| Payments | Stripe | Used in ZERO.Prmptr and EDIT.Prmptr; subscriptions + metered billing |
| Email | Resend + React Email | Used in ZERO.Prmptr and EDIT.Prmptr; transactional + marketing |
| Analytics | PostHog | Planned across all projects; product analytics + feature flags |
| Hosting | Vercel | Auto-deploy, edge functions, image optimization |

---

## 6. Implementation Phases

### Phase 1: Core Platform (Weeks 1-2)
- Next.js project scaffold with Supabase, Tailwind, shadcn/ui
- Database schema: organizations, profiles, members, events
- Authentication: magic link + Google OAuth
- Organization creation and management
- Event creation with default template
- Basic participant invite flow
- Role-based access control (RLS policies)

### Phase 2: Event Experience (Weeks 3-4)
- Timeline blocks display and management
- Block status updates (admin)
- Participant dashboard with event progress
- Resource/link sharing
- Notification system (email for key events)

### Phase 3: Ideation Module (Weeks 5-6)
- Idea submission form
- Idea gallery with filters and search
- Spark voting and comments
- Status pipeline management
- AI idea generation (Edge Function)
- Idea detail modal/page

### Phase 4: Documentation Module (Weeks 7-8)
- Conversational AI chat interface
- Document generation with Claude
- 5-document flow with progress tracking
- Document preview and approval
- Quality scoring
- Pause/resume with persistence
- Zip download and starter prompt

### Phase 5: Editor Module (Week 9)
- TipTap editor integration
- Auto-save
- Document management (list, create, edit, delete)
- Markdown/HTML/PDF export
- Public sharing via slug

### Phase 6: Awards & Reflections (Weeks 10-11)
- Award category configuration
- Blind voting ballot
- Voting controls (open/close, deadlines, eligibility)
- Results dashboard and winner announcement
- Reflection question configuration
- Reflection submission form with upsert
- Featured reflections on showcase page

### Phase 7: Admin Dashboards (Week 12)
- Org Admin dashboard (all sections)
- Platform Admin dashboard
- Analytics and reporting
- Data export (CSV/PDF)

### Phase 8: Billing & Marketing (Weeks 13-14)
- Stripe subscription integration
- Pricing page
- Marketing homepage
- Seven2 case study page
- Public showcase gallery
- SEO and OG metadata

---

## 7. Non-Functional Requirements

### Performance
- Page loads under 2 seconds
- AI conversation responses stream in real-time
- Document generation completes within 10 seconds
- Voting and reflection submissions are instant

### Security
- Row-Level Security on all tables (organization isolation)
- Admin operations via SECURITY DEFINER functions
- Stripe handles all payment data (PCI compliant)
- No sensitive data in client-side code
- Rate limiting on AI endpoints

### Accessibility
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader compatible
- Sufficient color contrast in all themes

### Scalability
- Support 100+ simultaneous organizations
- Support 500+ participants per event
- AI credit tracking per organization
- Supabase connection pooling for concurrent access
