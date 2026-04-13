# EDIT.Prmptr — Product Overview

## What It Is

EDIT.Prmptr is a **WYSIWYG Markdown editor** SaaS product built by Murtopolis. It targets "vibe coders" who need to edit Markdown documents visually without dealing with raw syntax. The key differentiator is its ability to **preserve rich formatting** — emojis, badges, colored text, and custom HTML — that other Markdown editors strip away.

**Live domain:** edit.prmptr.ai
**Tagline:** "Edit your Markdown docs *beautifully*"

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19.2, Tailwind CSS 4, Radix UI primitives |
| **Rich Text Editor** | TipTap 3.14 (ProseMirror-based) with 15+ extensions |
| **Markdown Processing** | `marked` (parsing), `node-emoji` (emoji shortcode conversion) |
| **Syntax Highlighting** | `lowlight` (code blocks via CodeBlockLowlight) |
| **PDF Generation** | `@react-pdf/renderer` (server-side PDF rendering) |
| **Auth** | Supabase Auth (email/password, with SSR middleware) |
| **Database** | Supabase (PostgreSQL) |
| **Payments** | Stripe (checkout, portal, webhooks) |
| **Email** | Resend + React Email templates |
| **Analytics** | PostHog |
| **Styling** | Custom "Murtopolis" design system — warm browns, serif typography (Cormorant Garamond, Source Serif 4), earthy color palette |
| **Deployment** | Vercel |

---

## Core Features

### 1. WYSIWYG Markdown Editing
- Built on TipTap/ProseMirror with an extensive extension set
- Supports: headings (H1-H4), bold, italic, strikethrough, inline code, code blocks with syntax highlighting, blockquotes, bullet lists, ordered lists, task lists, tables (resizable), links, images, horizontal rules, colored text, highlights, typography auto-corrections
- **Bubble menu** — floating toolbar appears on text selection for quick formatting
- **Full toolbar** — persistent top toolbar with all formatting options organized into groups (undo/redo, text formatting, headings, lists, block elements, insert, export)

### 2. Auto-Save with Cloud Sync
- Debounced auto-save every 2 seconds via custom `useAutoSave` hook
- Tracks both HTML content and raw markdown separately
- Manual save via `Cmd+S` keyboard shortcut
- Visual save status indicator (saved/saving/error) with "last saved" timestamp
- Saves on unmount to prevent data loss

### 3. Document Management Dashboard
- List and grid view modes for documents
- Full-text search across document titles and content
- Create new documents, upload existing `.md` files, duplicate documents
- Soft delete support (`is_deleted` flag with `deleted_at` timestamp)

### 4. File Upload & Import
- Drag-and-drop `.md` / `.markdown` / `.txt` file upload
- Automatic emoji shortcode conversion (`:smile:` → 😄) via `node-emoji`
- Markdown-to-HTML conversion for TipTap editor consumption
- File size limits enforced per subscription tier

### 5. Multi-Format Export
- **Markdown** — raw markdown download
- **HTML** — self-contained HTML with full Murtopolis-branded styling (Google Fonts, custom CSS variables, responsive layout)
- **PDF** — server-side generation via `@react-pdf/renderer` with comprehensive HTML-to-PDF conversion pipeline (handles headings, lists, task items, blockquotes, code blocks, images, links, tables, inline formatting, emoji removal for font compatibility)
- PDF export is gated behind Pro subscription

### 6. Document Sharing
- Toggle documents between public and private
- Public documents get a unique slug URL (`/p/[slug]`)
- Read-only public view with shareable link
- Copy-to-clipboard and open-in-new-tab actions

### 7. Subscription & Billing (Stripe)
- **Free tier:** 5 documents, 5MB file limit, Markdown & HTML export, cloud sync
- **Creator/Pro tier ($5/mo):** Unlimited documents, 50MB file limit, PDF export, custom themes, priority support
- **Lifetime tier:** Same as Creator, acquired via promo codes
- 7-day free trial (no credit card required)
- Stripe Checkout for subscriptions, Stripe Customer Portal for management
- Webhook handling for: subscription created/updated/deleted, payment succeeded/failed
- Automated email notifications for: welcome, subscription confirmed, trial expiring, trial expired, payment failed, subscription cancelled

### 8. Promo Code System
- Admin-managed promo codes with types: `lifetime`, `discount`, `trial`
- Max uses limit, expiration dates, active/inactive toggle
- Redemption tracking with `promo_code_redemptions` table
- Admin UI for creating and managing promo codes

### 9. Admin Panel
- User management (view users, change tiers)
- Promo code management (create, edit, deactivate)
- Newsletter sending capability
- Protected behind admin role check

---

## Database Schema (Supabase/PostgreSQL)

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | User profiles & subscription info | `id`, `email`, `full_name`, `subscription_tier` (free/creator/lifetime), `subscription_status` (active/canceled/past_due/trialing), `customer_id`, `subscription_id`, `document_count`, `storage_used`, `theme`, `default_view` |
| `documents` | User documents | `id`, `user_id`, `title`, `content` (HTML), `raw_markdown`, `is_deleted`, `is_public`, `public_slug`, `folder_id` |
| `document_metadata` | Document analytics | `document_id`, `word_count`, `character_count`, `reading_time`, `has_code_blocks`, `has_images`, `has_tables`, `has_math`, `export_count`, `version` |
| `promo_codes` | Promotional codes | `code`, `type`, `tier`, `max_uses`, `current_uses`, `is_active`, `expires_at` |
| `promo_code_redemptions` | Redemption history | `promo_code_id`, `user_id`, `redeemed_at`, `tier_granted` |
| `upload_logs` | File upload tracking | `user_id`, `filename`, `file_size`, `mime_type`, `status`, `document_id` |

### Database Functions
- `search_documents(query_text, user_uuid)` — full-text search across user's documents
- `redeem_promo_code(code_text, user_uuid)` — atomic promo code redemption
- `can_create_document(user_uuid)` — tier-based document limit enforcement

---

## Key Component Architecture

```
app/
├── page.tsx                     # Marketing/landing page
├── login/                       # Auth pages
├── signup/
├── dashboard/
│   ├── page.tsx                 # Document management dashboard
│   └── settings/page.tsx        # User settings
├── editor/[id]/page.tsx         # Document editor page
├── p/[slug]/page.tsx            # Public shared document view
├── (admin)/admin/               # Admin panel (users, promo codes, newsletter)
├── (marketing)/                 # Privacy, terms, pricing pages
└── api/
    ├── documents/               # CRUD operations
    ├── stripe/                  # Checkout & portal
    ├── webhooks/stripe/         # Stripe webhooks
    ├── export/                  # PDF export endpoint
    ├── upload/                  # File upload
    ├── auth/callback/           # OAuth callback
    ├── cron/trial-reminders/    # Scheduled trial reminder emails
    └── admin/                   # Admin API routes

components/
├── editor/
│   ├── Editor.tsx               # Main TipTap editor with all extensions
│   ├── Toolbar.tsx              # Top formatting toolbar
│   ├── BubbleMenu.tsx           # Floating selection toolbar
│   └── SaveIndicator.tsx        # Auto-save status display
├── documents/
│   ├── DocumentCard.tsx         # List/grid document card
│   ├── DocumentList.tsx         # Document collection view
│   ├── FileUpload.tsx           # Drag-and-drop upload
│   ├── ExportDialog.tsx         # Multi-format export dialog
│   ├── ShareDialog.tsx          # Public sharing toggle & link
│   └── SearchBar.tsx            # Document search
├── subscription/
│   ├── PricingCards.tsx          # Pricing display
│   └── UpgradePrompt.tsx        # Tier upgrade CTA
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    └── Sidebar.tsx

lib/
├── hooks/
│   ├── useAutoSave.ts           # Debounced auto-save with status tracking
│   ├── useDocument.ts           # Document CRUD operations
│   ├── useSubscription.ts       # Subscription state & tier checks
│   └── useAuth.ts               # Auth state management
├── utils/
│   ├── export.ts                # Export to MD/HTML/PDF
│   └── markdown.ts              # Parse, validate, extract metadata
├── stripe/
│   ├── client.ts                # Stripe client-side SDK
│   └── webhooks.ts              # Webhook event processing
├── supabase/
│   ├── client.ts                # Browser Supabase client
│   ├── server.ts                # Server Supabase client
│   └── middleware.ts            # Auth session refresh middleware
├── pdf/
│   └── document-template.tsx    # React-PDF template with full HTML parser
└── email/
    └── templates/               # React Email templates (welcome, trial, payment, etc.)
```

---

## Design System (Murtopolis Brand)

- **Typography:** Cormorant Garamond (display/headings), Source Serif 4 (body), JetBrains Mono (code)
- **Color palette:** Warm browns and earth tones — `#F4EDE4` (bg), `#2C2825` (text), `#A67C52` (accent), `#5C5550` (secondary text)
- **UI language:** `.btn-primary`, `.btn-secondary`, `.card-murtopolis`, `.text-label`, `.text-hero`, `.text-meta`
- **Animations:** Staggered fade-in effects on marketing page
- **Theme support:** Light/dark/system via `next-themes`

---

## Integration Potential for Hacksathon.com

### Direct Reusable Assets
1. **Rich Text Editor** — The TipTap editor with all extensions could power hackathon project descriptions, README editing, submission documentation, judging criteria authoring, and event page content management
2. **Export Pipeline** — The MD/HTML/PDF export system is immediately applicable for hackathon certificates, project submission exports, and event documentation
3. **Document Sharing** — Public slug-based sharing could power hackathon project showcase pages
4. **Subscription/Billing** — The Stripe integration pattern (checkout, webhooks, portal, tier enforcement) is directly reusable for hackathon platform monetization
5. **Email Templates** — React Email templates for transactional emails (welcome, reminders, payment) provide a starting pattern for hackathon notifications

### Architectural Patterns
1. **Supabase Auth + Next.js Middleware** — Session management pattern reusable across the platform
2. **Auto-save with debounce** — Pattern applicable to any real-time collaborative editing feature
3. **Tier-based feature gating** — The `TIER_LIMITS` system and `useSubscription` hook pattern for gating features by plan
4. **Admin panel** — User management, content moderation patterns
5. **Murtopolis Design System** — The warm, editorial aesthetic and component library for brand consistency

### Potential Hackathon Platform Roles
- **Project documentation tool** — Participants use EDIT.Prmptr-style editor for project READMEs and submissions
- **Judge evaluation forms** — Rich text scoring and feedback
- **Event content management** — Organizers author event pages, rules, and schedules
- **Certificate generation** — PDF export with branded templates for participant certificates
- **Knowledge base** — Shared documentation for hackathon resources and guides
