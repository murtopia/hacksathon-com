# Hacksathon.com — Technical Architecture

## Next.js App Router Structure

```
app/
├── (marketing)/                     # Public marketing pages (no auth)
│   ├── layout.tsx                   # Marketing layout (nav, footer)
│   ├── page.tsx                     # Homepage
│   ├── pricing/page.tsx             # Pricing tiers
│   ├── case-study/page.tsx          # Seven2 case study
│   ├── showcase/page.tsx            # Public hackathon gallery
│   └── showcase/[slug]/page.tsx     # Individual hackathon showcase
│
├── (auth)/                          # Auth pages
│   ├── layout.tsx                   # Centered card layout
│   ├── login/page.tsx               # Magic link + Google OAuth
│   ├── signup/page.tsx              # Org creation flow
│   ├── join/[invite]/page.tsx       # Participant invite acceptance
│   └── callback/route.ts            # Supabase auth callback
│
├── (platform)/                      # Authenticated app (all roles)
│   ├── layout.tsx                   # App shell: sidebar + header
│   ├── dashboard/page.tsx           # Role-based redirect or overview
│   │
│   ├── events/                      # Event management
│   │   ├── page.tsx                 # Event list for current org
│   │   ├── new/page.tsx             # Create event wizard
│   │   └── [eventId]/
│   │       ├── layout.tsx           # Event-scoped layout with subnav
│   │       ├── page.tsx             # Event overview / participant home
│   │       ├── timeline/page.tsx    # Block timeline view
│   │       ├── ideas/
│   │       │   ├── page.tsx         # IdeaLab gallery
│   │       │   ├── new/page.tsx     # Submit idea form
│   │       │   └── [ideaId]/
│   │       │       ├── page.tsx     # Idea detail
│   │       │       ├── docs/page.tsx          # ZERO.Prmptr conversation
│   │       │       └── docs/[docId]/page.tsx  # EDIT.Prmptr editor
│   │       ├── vote/page.tsx        # Hacky Awards ballot
│   │       ├── reflect/page.tsx     # Reflection form
│   │       ├── showcase/page.tsx    # Public showcase preview
│   │       │
│   │       └── admin/               # Org Admin only
│   │           ├── page.tsx         # Admin overview
│   │           ├── timeline/page.tsx    # Manage blocks
│   │           ├── participants/page.tsx # Manage members
│   │           ├── ideas/page.tsx       # All ideas management
│   │           ├── voting/page.tsx      # Voting controls + results
│   │           ├── reflections/page.tsx # Reflection management
│   │           ├── awards/page.tsx      # Announce winners
│   │           ├── analytics/page.tsx   # Event analytics
│   │           └── settings/page.tsx    # Event config + branding
│   │
│   ├── settings/                    # Org-level settings
│   │   ├── page.tsx                 # General settings
│   │   ├── members/page.tsx         # Org member management
│   │   └── billing/page.tsx         # Stripe subscription
│   │
│   └── profile/page.tsx             # User profile
│
├── (superadmin)/                    # Platform Admin only
│   ├── layout.tsx                   # Superadmin layout
│   ├── page.tsx                     # Platform overview
│   ├── organizations/page.tsx       # All client orgs
│   ├── organizations/[orgId]/page.tsx
│   ├── billing/page.tsx             # Revenue and subscriptions
│   ├── templates/page.tsx           # Event templates
│   ├── analytics/page.tsx           # Platform metrics
│   └── feature-flags/page.tsx       # Feature flag management
│
├── api/                             # API Routes
│   ├── auth/callback/route.ts       # Supabase auth callback
│   ├── chat/route.ts                # AI conversation (ZERO.Prmptr)
│   ├── generate-ideas/route.ts      # AI idea generation
│   ├── competitive-analysis/route.ts # AI competitive analysis
│   ├── feature-prioritization/route.ts # AI feature ranking
│   ├── prd-generator/route.ts       # AI PRD generation
│   ├── documents/
│   │   ├── route.ts                 # CRUD documents
│   │   ├── export/route.ts          # Zip export
│   │   └── [docId]/share/route.ts   # Public share link
│   ├── webhooks/
│   │   └── stripe/route.ts          # Stripe webhook handler
│   ├── invites/
│   │   └── route.ts                 # Send invitations
│   └── admin/
│       ├── voting/route.ts          # Voting controls
│       ├── awards/route.ts          # Announce winners
│       └── reflections/route.ts     # Feature reflections
│
├── p/[slug]/page.tsx                # Public shared document view
├── layout.tsx                       # Root layout (fonts, metadata)
├── globals.css                      # Tailwind + custom tokens
└── not-found.tsx                    # 404 page
```

## Key Components Structure

```
components/
├── ui/                              # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ...
│
├── layout/
│   ├── marketing-nav.tsx            # Public site navigation
│   ├── marketing-footer.tsx
│   ├── app-sidebar.tsx              # Authenticated app sidebar
│   ├── app-header.tsx               # Authenticated app header
│   ├── event-subnav.tsx             # Event-scoped tab navigation
│   └── mobile-nav.tsx
│
├── auth/
│   ├── auth-form.tsx                # Login/signup form
│   ├── google-button.tsx
│   └── org-setup-wizard.tsx         # First-time org creation
│
├── events/
│   ├── event-card.tsx               # Event list card
│   ├── event-setup-wizard.tsx       # Create event flow
│   ├── timeline.tsx                 # Block timeline display
│   ├── block-card.tsx               # Individual block
│   └── block-editor.tsx             # Admin block editing
│
├── ideas/
│   ├── idea-form.tsx                # Submit/edit idea
│   ├── idea-card.tsx                # Gallery card
│   ├── idea-detail.tsx              # Full idea view
│   ├── idea-gallery.tsx             # Filterable grid
│   ├── spark-button.tsx             # Like/spark toggle
│   ├── comment-section.tsx
│   └── ai-idea-dialog.tsx           # AI generation modal
│
├── docs/
│   ├── chat-interface.tsx           # ZERO.Prmptr conversation UI
│   ├── chat-message.tsx             # Individual message bubble
│   ├── doc-preview.tsx              # Generated doc preview
│   ├── doc-sidebar.tsx              # Section navigation
│   ├── quality-score.tsx            # Completeness indicator
│   └── starter-prompt.tsx           # Copy-paste prompt display
│
├── editor/
│   ├── editor.tsx                   # TipTap WYSIWYG editor
│   ├── toolbar.tsx                  # Formatting toolbar
│   ├── extensions/                  # Custom TipTap extensions
│   └── export-button.tsx            # MD/HTML/PDF export
│
├── voting/
│   ├── ballot.tsx                   # Full ballot interface
│   ├── category-vote.tsx            # Single category picker
│   ├── voting-controls.tsx          # Admin open/close/deadline
│   ├── results-chart.tsx            # Vote tallies
│   └── winner-announcement.tsx
│
├── reflections/
│   ├── reflection-form.tsx          # 7-question form
│   ├── reflection-viewer.tsx        # Admin view
│   └── featured-quotes.tsx          # Public display
│
├── admin/
│   ├── participant-table.tsx
│   ├── voting-dashboard.tsx
│   ├── analytics-cards.tsx
│   └── event-settings.tsx
│
└── marketing/
    ├── hero.tsx
    ├── feature-grid.tsx
    ├── pricing-table.tsx
    ├── case-study-section.tsx
    └── testimonial-carousel.tsx
```

## Library Layer

```
lib/
├── supabase/
│   ├── client.ts                    # Browser Supabase client
│   ├── server.ts                    # Server-side Supabase client (cookies)
│   ├── admin.ts                     # Service role client (for webhooks)
│   ├── middleware.ts                # Auth middleware helpers
│   └── types.ts                     # Generated TypeScript types
│
├── ai/
│   ├── chat.ts                      # AI SDK conversation handler
│   ├── prompts/
│   │   ├── doc-generation.ts        # ZERO.Prmptr system prompts per doc type
│   │   ├── idea-generation.ts       # IdeaLab AI prompts
│   │   ├── competitive-analysis.ts
│   │   └── prd-generator.ts
│   └── quality-scoring.ts           # Document completeness algorithm
│
├── stripe/
│   ├── client.ts                    # Stripe client
│   ├── webhooks.ts                  # Webhook handler logic
│   └── plans.ts                     # Pricing tier definitions
│
├── email/
│   ├── client.ts                    # Resend client
│   └── templates/
│       ├── invite.tsx               # React Email invite template
│       ├── event-update.tsx
│       └── welcome.tsx
│
├── hooks/
│   ├── use-auth.ts                  # Auth state hook
│   ├── use-organization.ts          # Current org context
│   ├── use-event.ts                 # Current event context
│   ├── use-ideas.ts                 # Ideas CRUD
│   ├── use-documents.ts             # Documents CRUD
│   ├── use-voting.ts                # Voting state
│   └── use-reflections.ts           # Reflections CRUD
│
└── utils/
    ├── roles.ts                     # Permission checks
    ├── markdown.ts                  # MD processing
    ├── export.ts                    # Zip/PDF generation
    └── date.ts                      # Date formatting
```

## Middleware

```typescript
// middleware.ts — Root middleware for auth + org routing
// Uses Supabase Auth to:
// 1. Refresh session tokens
// 2. Redirect unauthenticated users from /events/* to /login
// 3. Redirect authenticated users from /login to /dashboard
// 4. Verify platform admin access for /superadmin/*
// 5. Verify org membership for /events/[eventId]/*
```

## Supabase Configuration

### Row-Level Security Strategy

Every table with organization-scoped data uses RLS policies:

```sql
-- Pattern: Users can only access data in their organization
CREATE POLICY "org_isolation" ON ideas
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organization_members om ON om.organization_id = e.organization_id
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- Pattern: Admin-only operations
CREATE POLICY "admin_only" ON voting_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN events e ON e.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'admin'
      AND e.id = voting_config.event_id
    )
  );
```

### Edge Functions (AI Features)

AI features run as Supabase Edge Functions or Next.js API routes (depending on latency requirements):

| Function | Location | AI Provider |
|----------|----------|-------------|
| Chat conversation | Next.js API route (streaming) | Claude via AI SDK |
| Document generation | Next.js API route (streaming) | Claude via AI SDK |
| Idea generation | Next.js API route | Claude via AI SDK |
| Competitive analysis | Next.js API route | Claude via AI SDK |
| Feature prioritization | Next.js API route | Claude via AI SDK |
| PRD generator | Next.js API route | Claude via AI SDK |

### Realtime Subscriptions

Used for live updates in:
- Voting: live voter count for admin
- Ideas: new submissions appear in gallery
- Awards: winner announcements propagate instantly
- Block status: timeline updates for participants

## Deployment Architecture

```
Vercel
├── Production (hacksathon.com)
│   ├── Next.js App (Serverless Functions)
│   ├── Edge Middleware (auth/routing)
│   └── Static Assets (marketing pages)
│
├── Preview (PR branches)
│
Supabase
├── Production project
│   ├── Postgres (all tables with RLS)
│   ├── Auth (magic link + Google OAuth)
│   ├── Storage (screenshots, logos, documents)
│   ├── Realtime (voting, ideas, blocks)
│   └── Edge Functions (if needed for background tasks)
│
Stripe
├── Subscription management
├── Webhook → /api/webhooks/stripe
│
Resend
├── Transactional email (invites, notifications)
│
PostHog
├── Product analytics
├── Feature flags
```
