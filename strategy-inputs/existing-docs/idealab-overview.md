# IdeaLab — Product Overview

## What It Is

IdeaLab is an **internal idea management and AI-powered innovation platform** built for Seven2 (a digital agency). It serves as a collaborative "idea lab" where team members can submit product ideas, vote on them with "sparks" (likes), comment, track idea status through a pipeline, and leverage AI to generate alternative ideas, competitive analyses, PRDs, and feature prioritization frameworks.

**Live domain:** idealab.seven2.com
**Tagline:** "Where Seven2's ideas ignite" / "Dream it. Drop it. Make it."
**Built with:** Lovable (AI app builder) + manual development

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Vite + React (SPA, client-side routing) |
| **Language** | TypeScript |
| **UI** | shadcn/ui (full component library), Tailwind CSS, Radix UI |
| **State Management** | TanStack Query (React Query) for server state |
| **Routing** | React Router DOM |
| **Auth** | Supabase Auth (Google OAuth for Seven2 team, email/password for external users) |
| **Database** | Supabase (PostgreSQL) |
| **AI Backend** | Supabase Edge Functions (Deno) calling Lovable AI Gateway |
| **AI Model** | Google Gemini 2.5 Flash (via Lovable AI Gateway) |
| **Markdown Rendering** | ReactMarkdown + rehype-sanitize |
| **Email** | Resend (signup notifications) |
| **Notifications** | Slack webhooks (new ideas, status changes) |
| **Theming** | next-themes (light/dark/system) |
| **Design System** | Murtopolis brand — same warm brown/earth tone palette as EDIT.Prmptr |

---

## Core Features

### 1. Idea Submission & Management
- Submit ideas with: title, pitch (one-liner), description, submitter name
- Edit ideas after submission (title, pitch, description, project URL, screenshots)
- Admin-only idea deletion
- Ideas belong to an organization (multi-tenant)

### 2. Idea Gallery / Feed
- Chronological feed of all ideas in the organization
- Each idea card shows: title, pitch, submitter avatar, spark count, comment count, status badge
- Hero images from uploaded screenshots with customizable crop position

### 3. Spark System (Voting)
- Users can "spark" (like) ideas — toggle on/off
- Spark count displayed on each idea
- Shows list of users who sparked an idea (with avatars and names)
- Powered by `idea_sparks` junction table

### 4. Commenting System
- Threaded comments on each idea
- Real-time comment count on idea cards
- Users can add, edit comments
- User profile info (name, avatar) shown alongside comments

### 5. Idea Status Pipeline
- Three-stage workflow: `idea_stage` → `in_progress` → `completed`
- Visual status badges with emoji indicators (🌱 Idea Stage, 🚀 In Progress, ✅ Completed)
- Optional project URL attachment when status changes
- Slack notifications triggered on status transitions

### 6. Screenshot Management
- Upload multiple screenshots per idea to Supabase Storage (`idea-screenshots` bucket)
- Hero image with customizable vertical crop position (`hero_crop_y`)
- Screenshot removal with storage cleanup
- Public URLs for display

### 7. AI-Powered Idea Generation
- Given an existing idea, generates **2 alternative ideas** using AI
- Optional "refinement prompt" for guided generation (e.g., "focus on mobile-first")
- Individual idea refinement — chat-style back-and-forth to iterate on a specific alternative
- Generated ideas stored in `ai_generated_ideas` table linked to original
- One-click "Save as New Idea" to promote AI-generated ideas to the main feed

### 8. AI Document Generation Suite
Three AI-powered document generators, each invoked via Supabase Edge Functions:

#### a) Product Requirements Document (PRD) Generator
- Generates comprehensive PRD from an idea's title, pitch, and description
- 12-section template: Executive Summary, Vision & Goals, Target Users, User Stories, Functional Requirements, Non-Functional Requirements, Technical Considerations, Design Requirements, Dependencies & Constraints, Release Plan, Open Questions & Risks, Appendix
- Includes detailed sub-sections for KPIs, user personas, RICE scoring, and technical architecture

#### b) Competitive Analysis Generator
- Generates market landscape analysis from idea details
- Sections: Executive Summary, Market Overview, Direct Competitors (3-5), Indirect Competitors, Competitive Advantages, Market Opportunities, Threats & Challenges, Strategic Recommendations

#### c) Feature Prioritization Framework Generator
- Generates prioritized feature roadmap from idea details
- Uses MoSCoW method (Must-Have/Should-Have/Could-Have/Won't-Have)
- Includes RICE Score analysis for top features
- User Value vs Effort Matrix (Quick Wins, Big Bets, Fill-Ins, Time Sinks)
- Phase-based implementation roadmap (MVP, Enhancement, Scale)

All AI documents:
- Rendered as Markdown in a scrollable dialog
- Downloadable as `.md` files
- Generated on-demand (not stored in database)

### 9. Slack Integration
- Webhook notifications for:
  - **New idea submitted** — shows title, pitch, submitter, and link
  - **Status changes** — shows old → new status with emoji indicators
- Rich Slack message formatting with attachments and color coding
- Configurable via `SLACK_WEBHOOK_URL` environment variable

### 10. Signup Notifications
- Email notification to admin (`nick@seven2.com`) when external users register
- Includes user name, email, company name
- Sent via Resend email service

### 11. Authentication & Authorization
- **Seven2 team:** Google OAuth sign-in (primary flow)
- **External users:** Email/password registration with company name
- Role-based access: `admin`, `moderator`, `user`
- Admins can delete ideas, access admin dashboard
- Organization-scoped data (Seven2 org vs external orgs)

### 12. Admin Dashboard
- Separate admin route (`/admin/dashboard`)
- Administrative capabilities for managing the platform

---

## Database Schema (Supabase/PostgreSQL)

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `ideas` | Core idea storage | `id`, `user_id`, `organization_id`, `title`, `pitch`, `description`, `submitter`, `sparks` (count), `status` (enum), `project_url`, `screenshots` (array), `hero_crop_y` |
| `ai_generated_ideas` | AI-generated alternatives | `id`, `original_idea_id` (FK→ideas), `user_id`, `title`, `pitch`, `description` |
| `idea_sparks` | Voting/likes junction | `id`, `idea_id` (FK→ideas), `user_id` |
| `idea_comments` | Comments on ideas | `id`, `idea_id` (FK→ideas), `user_id`, `content`, `updated_at` |
| `organizations` | Multi-tenant orgs | `id`, `name`, `type` (seven2/external) |
| `profiles` | User profiles | `id`, `user_id`, `email`, `full_name`, `avatar_url`, `company_name`, `organization_id` (FK→organizations), `role` |
| `user_roles` | Role assignments | `id`, `user_id`, `role` (admin/moderator/user) |

### Enums
- `idea_status`: `idea_stage` | `in_progress` | `completed`
- `organization_type`: `seven2` | `external`
- `app_role`: `admin` | `moderator` | `user`

### Database Functions
- `get_public_profile_info(profile_user_id)` — returns avatar, name, user_id for public display
- `has_role(_role, _user_id)` — checks if user has a specific role

### Storage Buckets
- `idea-screenshots` — stores uploaded idea screenshots with public URLs

---

## Supabase Edge Functions (AI Backend)

| Function | Input | AI Prompt Strategy | Output |
|---|---|---|---|
| `generate-ideas` | `ideaId`, optional `refinementPrompt` | Generates 2 alternative ideas inspired by the original, with optional user guidance treated as data (not instructions) for safety | Stores in `ai_generated_ideas` table, returns created records |
| `prd-generator` | `ideaId` | 12-section PRD template with detailed sub-prompts for each section | Returns Markdown string (not stored) |
| `competitive-analysis` | `ideaId` | Market landscape analysis with competitor profiling, SWOT-style sections | Returns Markdown string (not stored) |
| `feature-prioritization` | `ideaId` | MoSCoW + RICE framework with phased roadmap | Returns Markdown string (not stored) |
| `notify-slack` | `type`, `idea`, `oldStatus`, `newStatus` | N/A (no AI) — constructs Slack webhook payload | Sends to Slack, returns success |
| `send-signup-notification` | `userEmail`, `userName`, `companyName` | N/A (no AI) — sends notification email via Resend | Sends email, returns success |

### AI Configuration
- **Model:** `google/gemini-2.5-flash` via Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- **Auth:** `LOVABLE_API_KEY` environment variable
- **Error handling:** Rate limit (429), payment required (402), and generic error responses
- **Prompt injection protection:** User refinement prompts wrapped in `<user_input>` tags and treated as data

---

## Key Component Architecture

```
src/
├── App.tsx                          # Root — providers, routing
├── pages/
│   ├── Index.tsx                    # Main page — home or gallery based on auth
│   ├── Auth.tsx                     # Email/password auth for external users
│   ├── AdminDashboard.tsx           # Admin panel
│   └── NotFound.tsx
├── components/
│   ├── HomePage.tsx                 # Landing page (pre-auth)
│   ├── IdeaForm.tsx                 # Submit new idea dialog
│   ├── IdeaList.tsx                 # Gallery/feed of ideas
│   ├── IdeaCard.tsx                 # Individual idea display
│   ├── IdeaExpandedView.tsx         # Full idea detail view
│   ├── IdeaEditDialog.tsx           # Edit existing idea
│   ├── IdeaComments.tsx             # Comment thread
│   ├── GenerateIdeasDialog.tsx      # AI idea generation with refinement
│   ├── AIDocumentDialog.tsx         # PRD/Analysis/Prioritization viewer
│   ├── StatusBadge.tsx              # Idea stage indicator
│   ├── StatusUpdateDialog.tsx       # Change idea status
│   ├── FloatingActionButton.tsx     # "+" button to add ideas
│   ├── UserMenu.tsx                 # User dropdown (profile, admin, logout)
│   └── ui/                          # Full shadcn/ui component library (30+ components)
├── hooks/
│   ├── useAuth.tsx                  # Auth state, Google OAuth, email auth
│   ├── useIdeas.tsx                 # Ideas CRUD, sparks, status, screenshots (TanStack Query)
│   ├── useComments.tsx              # Comment CRUD
│   ├── useUserProfile.tsx           # Profile data, admin role check
│   └── use-toast.ts                 # Toast notifications
├── types/
│   └── idea.ts                      # Idea and Comment TypeScript interfaces
├── integrations/
│   └── supabase/
│       ├── client.ts                # Supabase browser client
│       └── types.ts                 # Auto-generated database types
└── lib/
    ├── utils.ts                     # Utility functions
    └── getInitials.ts               # Avatar initials helper
```

---

## Design System

- **Brand:** Murtopolis — consistent with EDIT.Prmptr
- **Typography:** Display font for headings, body font for content, uppercase tracking for labels
- **Color palette:** Warm browns, earth tones, accent color for interactive elements
- **UI components:** Full shadcn/ui library providing consistent, accessible components
- **Dark mode:** System-aware theme switching
- **Animations:** Fade-in transitions, smooth state changes

---

## Integration Potential for Hacksathon.com

### Direct Reusable Assets

1. **Idea Submission & Voting System** — The core idea/spark/comment system maps directly to hackathon project submissions. Ideas become hackathon projects, sparks become upvotes, comments become feedback threads.

2. **AI Document Generation Pipeline** — The edge function architecture for generating PRDs, competitive analyses, and feature prioritizations is extremely valuable:
   - **For participants:** Generate project plans, competitive landscape for their idea, feature prioritization for their MVP
   - **For judges:** AI-generated evaluation frameworks for scoring submissions
   - **For organizers:** Auto-generate event documentation, challenge descriptions

3. **AI Idea Generation** — The "generate alternatives" feature could power:
   - **Idea brainstorming sessions** during hackathons
   - **Pivot suggestions** when teams are stuck
   - **Challenge ideation** for organizers creating hackathon themes

4. **Status Pipeline** — The `idea_stage → in_progress → completed` workflow maps to hackathon project lifecycle stages (e.g., `registered → building → submitted → judged`)

5. **Slack Integration** — Notification patterns reusable for hackathon event notifications (new submissions, status changes, announcements)

6. **Multi-tenant Organization Model** — The `organizations` table with `seven2`/`external` types maps to hackathon organizer/participant separation, or different hackathon events

7. **Role-Based Access Control** — The `admin/moderator/user` role system is directly applicable for hackathon organizers/judges/participants

### Architectural Patterns

1. **Supabase Edge Functions + AI Gateway** — The pattern of authenticated edge functions calling AI models is reusable for any AI feature in the hackathon platform
2. **TanStack Query for Server State** — Optimistic updates, cache invalidation, and query key patterns
3. **Prompt Engineering Patterns** — Structured prompts with safety measures (user input sandboxing) for hackathon-specific AI features
4. **Real-time Data with Supabase** — Subscription and query patterns for live hackathon dashboards

### Potential Hackathon Platform Roles

- **Project submission system** — Ideas → hackathon project entries with voting
- **AI mentor/assistant** — PRD generator helps teams structure their projects, competitive analysis helps validate ideas
- **Judging platform** — Comments and status pipeline for evaluation workflow
- **Innovation hub** — Persistent idea board for ongoing hackathon communities
- **Team formation** — Idea sparks/voting to gauge interest and form teams around popular concepts
- **Event management** — Organization model for multi-event platform with role-based access

### Key Differences from EDIT.Prmptr

| Aspect | EDIT.Prmptr | IdeaLab |
|---|---|---|
| **Architecture** | Next.js (SSR/SSG) | Vite + React (SPA) |
| **Primary function** | Document editing | Idea management + AI |
| **AI integration** | None | Heavy (4 AI edge functions) |
| **Collaboration** | Public sharing (read-only) | Sparks, comments, status tracking |
| **Monetization** | Stripe subscriptions | Internal tool (no billing) |
| **Data model** | Documents + metadata | Ideas + organizations + roles |
| **External services** | Stripe, Resend, PostHog | Slack, Resend, Lovable AI Gateway |

Both products share the **Murtopolis design system**, **Supabase backend**, and **TypeScript/React** foundation, making them highly complementary for a unified hackathon platform.
