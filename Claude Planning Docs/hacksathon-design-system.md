# Hacksathon.com — Platform Design System
*The design bible for all Hacksathon surfaces*
*Based on HACKS-DESIGN.md — extended for the full platform*
*Last updated: May 2026*

---

## Overview

This document is the authoritative design reference for every surface of the Hacksathon platform:

1. **Public Marketing Site** — `hacksathon.com`
2. **Participant Experience** — `/[companyslug]/`
3. **Org Admin Dashboard** — `/[companyslug]/admin/`
4. **Platform Admin (Murtopolis)** — `/murtopolis/` (planned, not yet built)
5. **Awards Ceremony Presentation** — full-screen mode

The foundation is `HACKS-DESIGN.md` — the design system built for `hacks.murtopolis.com`. That document defines the tokens, type system, spacing, and interaction principles. Everything in this document extends from it. **Read HACKS-DESIGN.md first.**

---

## The Design Philosophy (Inherited)

**Vignelli Canon influence.** Strict grid, limited typefaces, minimal color, every element earns its place.

**Grayscale foundation.** Black, white, and grays carry 95% of the design. The Lovable gradient accent is used sparingly — shimmer borders, featured highlights, never fills.

**Three-typeface discipline.** EB Garamond (editorial authority) + Inter (utility) + JetBrains Mono (labels, data, meta). No other typefaces anywhere on the platform.

**Quiet interactions.** Hover states are restrained — border darkens, text darkens. No loud UI chrome, no shadows, no background fills (except CTA buttons).

**Content-driven hierarchy.** Large type, strong alignment, clear levels. Decoration is absent.

---

## Critical Correction — Awards Ceremony

The existing `hacky-awards-v4.html` file **does not follow this design system.** It uses a warm cream palette (`#f8f7f4`), gold token (`#b8860b`), DM Serif Display, and DM Sans — none of which are part of the Hacksathon system. When the awards ceremony is rebuilt into the platform, it must be aligned to this system:

| v4 (wrong) | Platform system (correct) |
|---|---|
| `--bg: #f8f7f4` warm cream | `--bg-primary: #FFFFFF` white |
| `--ink: #111110` | `--text-primary: #1A1A1A` |
| `--muted: #88877e` warm gray | `--text-secondary: #525252` |
| `--rule: #d8d6cf` warm divider | `--border-color: #E8E8E8` |
| `--gold: #b8860b` | Gradient accent (`--gradient-accent`) or `--black` |
| DM Serif Display | EB Garamond |
| DM Sans | Inter |
| *(no monospace)* | JetBrains Mono for labels/counters |

The ◆ diamond motif is worth keeping — it's a nice ceremony detail. But it should be rendered in `--text-tertiary` (#A3A3A3) at rest, and in the gradient accent on winner reveals.

---

## Design Tokens (from HACKS-DESIGN.md)

### Color

```css
:root {
  /* Grayscale */
  --white: #FFFFFF;
  --off-white: #FAFAFA;
  --gray-50: #F5F5F5;
  --gray-100: #E8E8E8;
  --gray-200: #D1D1D1;
  --gray-300: #A3A3A3;
  --gray-400: #737373;
  --gray-500: #525252;
  --gray-600: #404040;
  --black: #1A1A1A;

  /* Semantic */
  --bg-primary: var(--white);
  --bg-secondary: var(--off-white);
  --bg-tertiary: var(--gray-50);
  --text-primary: var(--black);
  --text-secondary: var(--gray-500);
  --text-tertiary: var(--gray-300);
  --border-color: var(--gray-100);
  --border-strong: var(--gray-200);

  /* Accent — use sparingly */
  --accent-orange: #FE7B02;
  --accent-red: #FF0105;
  --accent-pink: #FF66F4;
  --accent-blue: #4B73FF;
  --gradient-accent: linear-gradient(135deg,
    var(--accent-orange),
    var(--accent-red),
    var(--accent-pink),
    var(--accent-blue)
  );
}
```

### Typography

**Typefaces:**
- `--font-serif: 'EB Garamond', Georgia, serif` — headings, hero, pull-quotes, editorial display
- `--font-sans: 'Inter', -apple-system, sans-serif` — body text, navigation, UI labels, form fields
- `--font-mono: 'JetBrains Mono', 'SF Mono', monospace` — section counters, block numbers, status badges, CTAs, meta labels

**Google Fonts embed:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Heading scale:**
- H1: EB Garamond, `clamp(3.5rem, 10vw, 6rem)`, weight 400, tight leading/tracking
- H2: EB Garamond, `clamp(2rem, 5vw, 2.5rem)`, weight 400, tight leading/tracking
- H3: EB Garamond, `1.5rem`
- H4: Inter, `0.75rem`, weight 600, uppercase, wider tracking, `--text-secondary`

**Headline rule (source of truth: the homepage hero):**
- Every display headline is EB Garamond at **weight 400**. Hierarchy is expressed through **size and tracking, never weight**. There are no bold headlines.
- Do not add `font-bold`, `font-semibold`, or `font-medium` to a heading. A bare `<h1>`/`<h2>`/`<h3>` already inherits the canonical treatment from the base styles in `globals.css`.
- The global handles are the base `h1`/`h2`/`h3` styles plus the title components `CardTitle`, `DialogTitle`, `SheetTitle`, and `PopoverTitle` (all `font-heading` + `font-normal`). Change weight in those spots, not per-usage.
- Exceptions are NOT headlines: mono eyebrows (`.mono-label`), the Inter uppercase `h4`, `.subsection-title`, and the mono `<h2>` label in `murtopolis/panel.tsx`. These keep their own treatment.

**Utility classes:**
- `.mono-label` — JetBrains Mono, 12px, 600 weight, uppercase, wide tracking, `--text-tertiary`
- `.lead` — EB Garamond, 20px, relaxed leading, `--text-secondary`, max-width 640px
- `.subsection-title` — Inter, 12px, 600 weight, uppercase, wider tracking, `--text-tertiary`, bottom border

### Spacing (8px base)

`--space-1` through `--space-12` maps 4px → 128px. See HACKS-DESIGN.md for full table.

### Motion

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

Fade-in on scroll (`.fade-in` + IntersectionObserver), staggered siblings (80ms increments), gradient shimmer on `.gradient-border` hover. Keep all interactions quiet — no transforms greater than 16px, no dramatic color changes.

---

## Surface-Specific Extensions

The HACKS-DESIGN.md system was built for a public-facing marketing site. The platform introduces four additional UI contexts that need extended patterns. All extend from the same token foundation.

---

### Surface 1: Public Marketing Site

Inherits the full HACKS-DESIGN.md system unchanged. No extensions needed.

**Key pages:** `/`, `/how-it-works/`, `/pricing/`, `/case-study/seven2/`, `/showcase/`, `/help/`, `/about/`, `/contact/`

Reference HACKS-DESIGN.md for all components on these pages.

---

### Surface 2: Participant Experience

**Mental model:** The participant has one job — move through the blocks. The UI should feel like a guided, focused workspace, not a dashboard. Calm, clear, never overwhelming.

**Layout:**
- Single-column content, max-width `--container-narrow` (720px), centered
- Left-rail progress navigation on desktop (block list, current block highlighted); collapses to top progress bar on mobile
- No sidebar clutter — the block workspace is the whole screen

#### New Component: Block Progress Rail (desktop)

Vertical list of all 10 blocks. Left border of the page.

```
Behavior:
- Completed blocks: checkmark + block name in --text-tertiary, line-through
- Current block: block name in --text-primary, bold, left border accent
- Upcoming blocks: block name in --text-tertiary, no checkmark
- Block 4 locked state: lock icon + "Complete this to unlock Build" in --text-tertiary
```

- Font: JetBrains Mono, 11px, uppercase, wide tracking
- Current block indicator: 2px solid `--black` left border
- Completed indicator: `--border-color` left border
- Width: 200px fixed; collapses entirely on mobile

#### New Component: Block Progress Bar (mobile)

Thin horizontal bar at the top of the page showing progress through 10 blocks.

```
[████████░░░░░░░░░░░░]  Block 4 of 10
```

- Bar: `--border-color` background, `--black` fill
- Label: JetBrains Mono, 11px, `--text-tertiary`

#### New Component: Block Workspace

The content area for each block. Consistent shell, variable content.

```
┌─────────────────────────────────────────┐
│  BLOCK 04 · PLANNING              [gate]│  ← mono-label + status badge
│                                         │
│  Planning                               │  ← H2, EB Garamond
│  The most important 30 minutes.         │  ← .lead
│                                         │
│  ─────────────────────────────────────  │  ← --border-color divider
│                                         │
│  [block content]                        │
│                                         │
│  ─────────────────────────────────────  │
│                      [Mark complete →]  │  ← mono CTA
└─────────────────────────────────────────┘
```

- Shell: white background, 1px border (`--border-color`), 32px padding
- Block number: `.mono-label` top-left
- Status badge: top-right (see Status Badges below)
- Dividers: 1px solid `--border-color`
- Complete CTA: `.mono-label` style, outlined button → solid black on hover

#### New Component: Gate Message (Block 4 only)

```
┌─────────────────────────────────────────┐
│  You can't start building yet.          │  ← H3, EB Garamond
│                                         │
│  This is the most important 30          │
│  minutes of the whole program.          │  ← Inter, --text-secondary
│  Complete your Project Brief first.     │
└─────────────────────────────────────────┘
```

- Container: `--bg-tertiary` background, 1px `--border-strong` border, 24px padding
- NOT a warning/error state — no red, no orange, no alarm language in styling
- The gate is intentional. The design should communicate seriousness, not danger.

#### New Component: Conversational Planning Flow (Block 4)

The ZERO.Prmptr 5-step conversation. Each step is a distinct exchange — AI prompt, user response, AI reflection.

```
┌─ AI ────────────────────────────────────┐
│  What does this app do?                 │  ← EB Garamond, 20px
│  Describe the core function in one      │
│  sentence.                              │
└─────────────────────────────────────────┘

[User input field]
[  Send  →  ] or [ I'm ready to move on → ]

┌─ AI ────────────────────────────────────┐
│  Got it — a daily habit tracker for     │  ← Inter, --text-secondary
│  morning routines...                    │
│                                         │
│  One thing worth considering: →         │  ← follow-up, italic
└─────────────────────────────────────────┘
```

- AI message bubbles: `--bg-secondary` background, left-border 2px `--border-strong`, 20px padding
- User input: standard text field (see Form Inputs below)
- "Move on" CTA: `.mono-label` style, always visible below the input
- AI follow-up content: EB Garamond italic, `--text-secondary` — visually distinct from the main AI prompt
- Step indicator: JetBrains Mono, `--text-tertiary` — "Step 2 of 5" top-right

#### New Component: Project Brief Card

The generated output after Block 4. Read-only display with an edit affordance.

```
┌─────────────────────────────────────────┐
│  PROJECT BRIEF                [Edit ✎]  │  ← mono-label + edit button
│  ─────────────────────────────────────  │
│  Coffee journaling app                  │  ← H3, EB Garamond, project name
│  ─────────────────────────────────────  │
│  CORE FUNCTION                          │  ← mono subsection label
│  Track and rate your morning coffee...  │  ← Inter, --text-secondary
│                                         │
│  TARGET USER                            │
│  Coffee enthusiasts who want to...      │
│                                         │
│  DESIGN DIRECTION                       │
│  Minimal, warm. Reference: Analog.co    │
│  ─────────────────────────────────────  │
│  [◆ Copy your first prompt  →]          │  ← primary CTA, gradient border
└─────────────────────────────────────────┘
```

- Container: white, 1px `--border-color`, no background
- Section labels: `.mono-label`
- "Copy your first prompt" button: outlined button with `.gradient-border` effect — the one moment the gradient accent appears prominently in the participant flow
- Edit button: Inter, 12px, `--text-tertiary` → `--text-primary` on hover

#### New Component: Status Badges

> **RULE: No color in status badges. Ever.**
> The system is intentionally grayscale. State is communicated through fill (solid black), outline (bordered), and muted (tertiary gray) — never through red, orange, green, or any other color. This applies to every surface, every block, every component on the platform. Do not introduce color-coded status under any circumstances, even as a "quick" shortcut.

Used throughout the participant experience and Org Admin to communicate state.

| Status | Treatment | Background | Text | Border |
|---|---|---|---|---|
| Not started | Muted outline | `--bg-tertiary` | `--text-tertiary` | `--border-color` |
| In progress | Outline | `--white` | `--text-primary` | `--border-strong` |
| Complete | Solid fill | `--black` | `--white` | none |
| Locked | Muted outline + lock icon | `--bg-tertiary` | `--text-tertiary` | `--border-color` |
| Shipped | Solid fill | `--black` | `--white` | none |
| Behind | Outline | `--gray-50` | `--text-primary` | `--border-strong` |
| Submitted | Solid fill | `--black` | `--white` | none |
| Pitching | Outline | `--white` | `--text-primary` | `--border-strong` |
| Awaiting reveal | Muted outline | `--bg-tertiary` | `--text-tertiary` | `--border-color` |

**All badges:** JetBrains Mono, 10px, uppercase, wide tracking, 4px border-radius, padding 3px 8px.

**The three tiers of visual weight communicate urgency/completion:**
- **Solid black fill** = terminal positive state (done, shipped, submitted, voted)
- **Outlined** = active state (in progress, in build, currently pitching)
- **Muted gray** = inactive state (not started, locked, waiting)

This hierarchy works without any color at all. A "Shipped" badge in solid black reads as clearly positive. A "Not started" badge in muted gray reads as clearly inactive. No green or red needed.

**Soft outline on editorial surfaces.** When an Outline-tier badge appears on a content surface (gallery card author row, idea details modal header, showcase tiles), render it with `border-[var(--gray-400)] text-[var(--gray-400)]` instead of the default `border-foreground text-foreground`. Same hierarchy — non-terminal state — but it stops competing with the body type and matches the gray-400 outline buttons that share these surfaces. Solid Fill badges (Complete, Shipped, Submitted) still use the full `--black` fill everywhere; the soft-outline rule only relaxes the *non-terminal* outline tier.

**Admin badges follow the same rule.** No amber Locked pill, no green "Approved" pill, no red destructive callout — ever. The Org Admin dashboard inherits the same grayscale-only contract as the participant surfaces. Locked uses the Muted tier (`--bg-tertiary` / `--text-tertiary` / `--border-color`) plus the `Lock` icon. Approved is terminal-positive — solid `--black` fill with `--white` text, same as Complete/Shipped/Submitted on participant surfaces. Caution callouts (e.g. "revealing locks the event") are rendered as gray-400 outlined containers with serif italic body, not amber alert boxes.

---

### Surface 3: Org Admin Dashboard

**Mental model (as-built):** The admin is a guided, single-column
editorial console — not a left-rail command center. The Hacky Helper
keeps the organizer's next action in view; the rest of the admin is a
set of focused, narrow-column forms reached from a horizontal numbered
sub-nav. It reads like the participant surfaces, not like a SaaS data
dashboard.

**Layout (shipped):**
- Lives under the slug-based member tree at `/[companyslug]/admin/*`,
  inside the standard centered platform shell.
- A horizontal numbered **sub-nav** (`event-nav/admin-subnav.tsx`) sits
  under the page header: `00 Hacky Helper` · `01 Identity` ·
  `02 Integrations` · `03 Schedule` · `04 Team` · `05 Hacky Awards` ·
  `06 Reflections`. Numbers are JetBrains Mono; the active tab darkens to
  `--text-primary`. The `00` tab carries an "N steps left" pill.
- Main content is a **single editorial column** constrained to the
  narrow reading width (`--container-narrow`, 720px) — the same column
  the participant content uses. No 220px left rail, no 1100px main, no
  data tables as the primary pattern.
- The whole tree is admin-gated in `admin/layout.tsx` (non-admins 404).

> **Superseded design (not built):** the original "Admin Left
> Navigation" (220px rail), "Data Table", "Event Stats Bar",
> "Facilitator Notes Panel", and "Announcement Composer" components below
> were never shipped and do not match the current build. They are kept
> here only as historical context for a possible future denser
> monitoring view. The current admin replaces all of them with the Hacky
> Helper + the `AdminSection` form frame.

#### Superseded: Admin Left Navigation, Data Table, Stats Bar, Composer

These four components were specced for a left-rail command center and are
**not** part of the as-built admin. The shipped equivalents are:

- **Navigation** → horizontal numbered sub-nav (`admin-subnav.tsx`).
- **Roster / "last active"** → `participants-panel.tsx` roster rows
  (serif name + mono "last seen"), not a multi-column data table.
- **Stats bar** → removed; the Hacky Helper's "X of Y done" stop headers
  carry progress instead.
- **Announcement composer / facilitator notes** → not built; team
  comms happen via the configured external team-chat link.

---

### Surface 4: Platform Admin (Murtopolis)

**Mental model:** Internal operations tool. Accurate, fast, trustworthy. Denser information than Org Admin. No ceremony — pure utility.

**Same token foundation.** Same nav pattern as Org Admin, slightly denser defaults (smaller type, tighter spacing). No gradient accent used anywhere in this surface.

**Differentiation from Org Admin:** Higher information density, smaller body type (14px vs 16px), more data tables, fewer empty states. This surface is for Nick, not for customers.

- Base font size: 14px (vs 16px on customer-facing surfaces)
- Table rows: more compact (36px height vs 48px)
- Nav: same left-rail pattern as Org Admin, same tokens
- No marketing language — functional labels only

---

### Surface 5: Awards Ceremony Presentation

Full-screen mode. The most theatrical surface in the platform. The design should feel like a ceremony, not a dashboard — but still within the same type system.

**Layout:** Full viewport, centered content, nothing else visible. No navigation, no platform chrome.

#### Slide Design (aligned to system)

**Background:** `--white` (#FFFFFF) — not warm cream

**Typography map:**

| v4 role | Platform equivalent |
|---|---|
| Large category name | EB Garamond, `clamp(44px, 8vw, 100px)`, weight 400 |
| Italic tagline | EB Garamond, italic, `clamp(16px, 2vw, 24px)`, `--text-secondary` |
| Winner name | EB Garamond, `clamp(56px, 10.5vw, 132px)`, weight 400 |
| Category crumb / labels | JetBrains Mono, 10–11px, uppercase, wide tracking, `--text-tertiary` |
| Award number (01 of 06) | JetBrains Mono, 11px, uppercase, `--text-tertiary` |
| "And the winner is…" | EB Garamond, italic, 18–20px, `--text-secondary` |
| "Click to advance" | JetBrains Mono, 10px, uppercase, `--text-tertiary` |

**The ◆ diamond:**
- At rest (title slide, category intro): `--text-tertiary` (#A3A3A3)
- On winner reveal: apply `--gradient-accent` as a background clip on the character, or use a CSS gradient text technique
- Animation: preserve the float keyframe from v4 (`translateY(0)` ↔ `translateY(-8px)`, 3–4s infinite)

**Progress dots (bottom center):**
- Incomplete: `--border-color`
- Past: `--gray-300`
- Current: `--black`, scale 1.4× — same behavior as v4

**Confetti:**
- Preserve the 180-particle canvas burst from v4
- Update color palette to match the system: `#1A1A1A`, `#E8E8E8`, `#A3A3A3`, `#525252`, and the four gradient accent colors (`#FE7B02`, `#FF0105`, `#FF66F4`, `#4B73FF`)
- Remove the warm golds (`#b8860b`, `#d4a520`, `#c9b882`, `#5a4a2a`, `#e8e0cc`)

**Animations to preserve:**
- `slideUp` — runner-up names animate from 24px, cubic-bezier (keep exactly)
- `winReveal` — winner name scale 0.88 → 1.025 → 1 (keep exactly)
- Stagger delays on tied runner-ups (keep exactly)
- Blink on "Click to advance" (keep exactly)

**Finale grid:**
- 3-column (or 2 if ≤4 categories)
- Cards: 1px `--border-color` borders, white background
- Award label: `.mono-label`
- Winner name: EB Garamond, `clamp(16px, 1.8vw, 22px)`

---

### Form Inputs (all surfaces)

Standard form input patterns used across participant experience and Org Admin.

```css
/* Text input */
.field-input {
  width: 100%;
  background: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px 13px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--duration-fast) var(--ease-out);
}
.field-input:focus {
  border-color: var(--black);
}
.field-input::placeholder {
  color: var(--text-tertiary);
  font-size: var(--form-placeholder-size); /* 13px, one point below typed text */
}
```

- Label: `.mono-label` style, above the field. The base shadcn `Label` (`src/components/ui/label.tsx`) already renders this black uppercase mono "eyebrow" by default, so most fields need no extra classes. Exception: `reflection-form` question prompts override to serif, normal-case.
- Error state: `--border-strong` border, Inter 12px italic error message below, no red
- Disabled state: `--bg-tertiary` background, `--text-tertiary` text
- Textarea: same as text input, `resize: vertical` only
- Select: same border/padding treatment, custom chevron in `--text-tertiary`

#### Form text hierarchy + size tokens

Two global knobs in `globals.css` (`:root`) control the secondary text inside forms. Change them in one place and every form follows:

| Token | Value | Applies to |
| --- | --- | --- |
| `--form-placeholder-size` | `13px` | Placeholder text inside `Input` / `Textarea` / `Select` (wired into the base components). One point below the field's typed text. |
| `--form-hint-size` | `10px` | The `.form-hint` utility (helper lines, footnotes) and the char counter. |

Tiers, darkest to lightest:

1. **Label** - black uppercase mono eyebrow (base `Label`).
2. **Descriptive subhead** - a sentence placed *between* a label and its control stays dark (`--muted-foreground`, e.g. the "Idea image" helper). Not a `.form-hint`.
3. **Placeholder** - `--text-tertiary` at `--form-placeholder-size` (13px).
4. **Helper / hint / footnote / char counter** - `.form-hint` at `--form-hint-size` (10px), `--text-tertiary`.

---

### Button System (all surfaces)

> **RULE: The quiet mono "pill" is the standard action button everywhere.**
> Every action button across the product — admin, participant, marketing, auth, checkout, settings — renders as the same quiet mono pill. There are **no solid-black action buttons**. Solid black is reserved *exclusively* for the **selected state of a segmented toggle** (e.g. reflections Closed/Open/Complete, voting Closed/Open). This mirrors the Closed/Open/Notify/Complete controls that set the tone for the whole UI.

#### The pill (default action button — `variant="pill" size="pill"`)

The universal treatment. Implemented as a `pill` variant + `pill` size on the shared `Button` component (`src/components/ui/button.tsx`), so any button becomes a pill with `variant="pill" size="pill"`.

- Font: JetBrains Mono, 10px, uppercase, `tracking-[0.12em]`, `font-semibold`
- Shape: `rounded-[4px]`, 1px `--border-color` border, `px-3 py-1.5`, auto height
- Fill: `--bg-tertiary` (a quiet gray — **not** a solid black/accent fill), text `--text-secondary`
- Hover: `hover:border-foreground hover:text-foreground` — border and text both darken to `--text-primary`. No background fill change. (Matches the design language's "quiet interactions" rule.)
- Inline icons: drop the old `mr-2 size-4` — the pill size auto-applies `gap-1.5` and sizes SVGs to `size-3`. Just render `<Icon />` as the first child.

This is the inactive segmented-control pill, promoted to the universal action button.

#### Selected toggle state (the only solid black)

Segmented toggles (reflections Closed/Open/Complete, voting Closed/Open) keep their hand-rolled markup. The **inactive** options look exactly like the pill above; the **selected** option fills solid `--black` with `--white` text. Solid black appears nowhere else — it now reads purely as "this is the current state", not "this is the primary action".

#### Other roles (unchanged)

- **Outline** (`variant="outline"`): secondary/alternate actions and the editorial participant-content treatment (1px border, transparent fill, hover darkens border + text). Still used for things like "Replace", "Open team chat", "Sign in" alternates, and beside participant body copy.
- **Ghost** (`variant="ghost"`): Cancel / Back / Edit / inline row actions. No border or fill; text `--text-secondary` → `--text-primary` on hover.
- **Secondary / Destructive**: unchanged, used for their existing narrow roles.
- **Icon-only** (`size="icon*"`): unchanged.

#### Retired

- **"Voice A primary (solid)"** is retired. No action button uses a solid-black fill anymore — they all became pills. (The two-voices framing is gone; the pill is the single action voice, with outline/ghost as secondary weights.)

#### Email buttons (exception)

Email templates in `src/emails/*` use the `@react-email/components` `Button` and **keep their solid fill** — solid renders reliably across inboxes and there's no shared CSS to lean on. Do not convert these to pills.

#### Gradient CTA (kept — max once per view)

- The `.gradient-border` treatment remains the single *loud* accent, used at most once per view (e.g. a hero marketing CTA). It is the only sanctioned exception to "no fills on action buttons", because the objection was specifically to the flat solid-black fill, not to the gradient accent.
- Not used in Org Admin or Murtopolis.

---

### Presentation Timer Component (Block 3 + Block 7)

The timer is a functional tool — design should prioritize glanceability over decoration.

```
┌─────────────────────────────────────────┐
│  DEMO TIME                              │  ← JetBrains Mono, 11px, uppercase
│                                         │
│           3:00                          │  ← EB Garamond, clamp(4rem, 8vw, 6rem)
│                                         │
│  ▶ Start      ⏸ Pause      ↺ Reset     │  ← Inter, 13px buttons
│                                         │
│  Next up: Joe Moore →                   │  ← Inter, 13px, --text-secondary
└─────────────────────────────────────────┘
```

- Container: 1px `--border-color`, white background, 32px padding
- Countdown display: EB Garamond for the number (the one moment a large serif number reads as elegant rather than editorial). Size: large, centered, `--text-primary`
- Phase label: `.mono-label` above the number
- Phase transition: number fades out/in over 300ms; phase label updates; brief border flash (border goes `--border-strong` for 500ms, returns to `--border-color`)
- Sound-end flash: same border flash treatment — no color, just the border weight change
- Controls: secondary buttons, compact, inline row

---

### Voting Ballot Component (Block 8)

```
┌─────────────────────────────────────────┐
│  BEST IN SHOW                           │  ← mono-label
│  The one that had it all                │  ← EB Garamond, italic, --text-secondary
│  ─────────────────────────────────────  │
│  ○ Drift                                │
│  ○ Cut-up Lyric Generator               │
│  ○ Chris-Tron                           │
│  ○ Even Grounds                         │
└─────────────────────────────────────────┘

  Voting closes in  4:32                  ← JetBrains Mono, --text-tertiary
```

- Category cards: 1px `--border-color`, white, 24px padding
- Radio options: Inter, 16px, custom radio (12px circle, `--border-strong` outline, filled `--black` when selected)
- Selected option: text goes `--text-primary` bold; radio fills solid `--black`
- Timer: `.mono-label` below all category cards, centered
- Locked state (after submission): all options fade to `--text-tertiary`, radio disabled; "Votes submitted" mono-label appears

---

## Responsive Summary

Inherits all breakpoints from HACKS-DESIGN.md. Platform-specific additions:

| Breakpoint | Platform behavior |
|---|---|
| 768px | Left nav collapses to hamburger (Org Admin, Murtopolis); block progress rail becomes top bar (Participant) |
| 640px | All column grids → single column; data tables → card list view; awards ceremony full-screen maintained |

**Mobile-optimized surfaces** (must be polished at launch):
- Participant block workspace
- Voting ballot
- Reflection form
- Marketing homepage + case study

**Desktop-first** (functional but not polished at launch):
- Org Admin dashboard
- Murtopolis
- Awards ceremony (Organizer is on desktop; audience watches via Zoom)
- Block 4 planning conversation (complex enough to need a real keyboard)

---

## Reuse Checklist for Cursor

When building any new component or surface, verify:

- [ ] Colors use only `--bg-*`, `--text-*`, `--border-*` semantic tokens or named grayscale values
- [ ] No warm colors anywhere (no cream, no tan, no gold)
- [ ] Gradient accent used **at most once per view**, never as a fill
- [ ] Typography: EB Garamond for display/editorial, Inter for UI, JetBrains Mono for labels/data/meta
- [ ] No other typefaces introduced
- [ ] **Status badges use fill/outline/muted only — never color.** Solid black = complete/terminal. Outlined = active/in-progress. Muted gray = inactive/locked. No red, no green, no orange, no status color of any kind.
- [ ] Hover states: border darkens, text darkens only — no background fills, no shadows (except primary CTA buttons)
- [ ] Borders: 1px solid `--border-color` as default, `--border-strong` for emphasis
- [ ] Spacing from `--space-*` scale only
- [ ] Fade-in entrance animations on scroll-entering content (`.fade-in` + IntersectionObserver)
- [ ] Stagger siblings at 80ms increments
- [ ] Awards ceremony: white background, EB Garamond, gradient on winner ◆ — not warm cream, not gold

---

## Open Item

The awards ceremony's ◆ diamond motif needs a decision on the winner reveal treatment. Two options:

**Option A — Gradient text:** Apply CSS gradient text clip to the ◆ on winner slides. Technically clean, visually striking, stays in system.

**Option B — Black ◆:** Keep the ◆ in `--black` throughout. Simpler, more consistent with the overall quiet aesthetic. Let the winner's name in large EB Garamond carry the moment.

Option B is probably more Vignelli — decoration earns its place. The confetti and the scale-in animation on the winner name are enough ceremony.

---

## Platform Conventions

The patterns below were established during build-out and are now load-bearing across member surfaces. Treat them as authoritative — they should not be re-litigated per-feature.

### Identity & Voice

- **"Hacksathon.com"** — the product name. Use everywhere the platform speaks about itself as a noun: top-bar wordmark, footer wordmark, marketing surfaces, copyright lines, settings page titles, email signatures.
- **"Hacks-a-Thon"** — the event-type noun, hyphenated and mixed-case. Use in participant copy and nav labels that refer to *their* event: "Our Hacks-a-Thon", "Welcome to your Hacks-a-Thon", "End the Hacks-a-Thon".
- One-line audit rule: if the platform is speaking about itself, it's `.com`. If a participant is speaking about the event they're inside, it's `Hacks-a-Thon`.
- Never use lowercase `hacksathon` (no period) or `hackathon` (different word) in user-facing copy.

### Top Bar (member surfaces)

The persistent top bar on every member surface uses one shared height token so the sticky sub-nav below it can dock exactly to its bottom edge.

- Wrapper: `<header className="sticky top-0 z-50 w-full border-b bg-background">`
- Inner row: `flex items-baseline justify-between px-4 py-[18px]` inside the container. The header is intrinsically sized — the `py-[18px]` pads symmetrically above and below the baseline-aligned content so the row sits visually centered. **Do not** swap this for `h-[var(--header-height)]`: combining an explicit height with `items-baseline` pins the shared baseline to the top of the box and breaks the centering.
- Baseline alignment is intentional — all text elements in the row share the wordmark's baseline (this was tuned by hand and is easy to break with `items-center`).
- `--header-height` in `:root` (currently 60px) is the *reading* — it records the rendered height so the sticky sub-nav below can use it as its `top` offset. If `py-[18px]` or the inline content height ever changes, update `--header-height` to match.
- **Left cluster:** serif wordmark (`Hacksathon.com`, `text-xl leading-none`) — vertical `Separator` (`h-6 self-center`) — secondary serif link (company name on slug surfaces; on platform surfaces, swap in JetBrains Mono `Dashboard` / `Settings` nav links).
- **Right cluster:** the `UserMenu` primitive (in `src/components/site/user-menu.tsx`) — a `DropdownMenu` whose trigger is `UserAvatar size="xs"` + first-name in JetBrains Mono uppercase + a `ChevronDown size-3` to signal the menu affordance. Click to open (Radix default — hover-to-open breaks keyboard nav). Menu surface uses the grayscale popover treatment with monospace 12px uppercase items. Items, top to bottom: `Settings` (link to `/settings`), `Sign out` (renders the existing `<form action="/api/auth/signout" method="post">` with the menu item `asChild` wrapping the submit button so keyboard and click both submit naturally). No `Dashboard` menu item — the top-left wordmark already routes the user "home" for the current context (`/[slug]` on a member-facing slug page; `/dashboard` on the platform shell). The header never renders standalone Settings / Sign out links inline — those all live behind the avatar menu.
- First-name resolution uses the `pickFirstName(fullName, email)` helper. It falls back to the email local-part with display capitalisation if no profile name is set.

### Persistent Footer

Every member surface (slug routes, `/dashboard`, `/settings`, etc.) ends with the shared `SiteFooter` component. It contains:

- Hacksathon.com serif wordmark (matching the top-bar treatment).
- "A Murtopolis Venture" mono-label row.
- JetBrains Mono link row: legal / contact / status links as the project grows.
- Copyright line in mono, `--text-tertiary`.

Marketing surfaces use their own footer (denser, includes social links and the gradient accent) — do not collapse them.

### Social Share Images (OG / Twitter)

The link-preview cards that appear when a Hacksathon URL is shared (iMessage, Slack, X, etc.) are generated at request time with `next/og` (`ImageResponse` / satori), not hand-exported in Photoshop. They follow the same grayscale, EB Garamond system as the rest of the platform. There are two variants.

**What renders where (Next.js file conventions):**

| Variant | Files | Applies to |
| --- | --- | --- |
| Static marketing card | `src/app/opengraph-image.tsx` (+ `twitter-image.tsx`) | Site-wide default: homepage, pricing, showcase, and every non-event route. |
| Dynamic per-event card | `src/app/[companyslug]/opengraph-image.tsx` (+ `twitter-image.tsx`) | Overrides the default for every `/[companyslug]/*` route. |

Both call the shared renderer + helpers in `src/lib/og/share-image.tsx`. A segment's `opengraph-image` applies to that segment and its descendants, so the `[companyslug]` one wins for event routes.

**Design spec:**

- 1200x630 PNG, strictly grayscale: `#1A1A1A` ink headline, `#525252` italic gray tagline, `#FFFFFF` background, `#E8E8E8` logo frame. No accent color, no teal bar.
- EB Garamond at weight 400 everywhere (same headline discipline as the rest of the system, never bold).
- Left-justified throughout. Brand mark / logo sits top-left; headline + italic tagline anchor the bottom.

**The exact current knobs** (in `share-image.tsx`, so a future tweak doesn't have to re-derive them):

- Shared: `padding: 80`; headline `lineHeight 1`, `letterSpacing -1.5`, `maxWidth 1040`; tagline italic `fontSize 52`, gray, `maxWidth 1040`.
- Marketing variant (`showWordmark`): the black "H" mark at `112` + the "Hacksathon.com" wordmark at `64` (gap 32); headline `fontSize 81`.
- Per-event variant: logo / initial box at `192` (initial glyph `104`); headline `fontSize 96`. The size split is `headlineSize = showWordmark ? 81 : 96` (event titles are short and run bigger; the marketing headline is long and wraps, so it stays a hair smaller).
- The per-event card has no bottom URL. It was removed deliberately because the link-preview card already shows the `hacksathon.com` domain underneath, so repeating it was redundant.

**Copy + source of truth:** the marketing headline "Run a world-class Hacks-a-Thon at your company" and tagline "We're all just hacks. And that's kind of the point." mirror the homepage hero (`src/app/(marketing)/page.tsx`); if the hero copy changes, update the marketing image strings to match. The per-event headline is the live `event.title`; the tagline is the same brand line.

**Logo behavior:** `resolveLogo()` fetches the event (or org) `logo_url` and embeds raster formats (png / jpg / webp / gif) as a base64 data URI. SVG, missing, or fetch-failure falls back to the first-initial box (first character of the org name, else the event title), the same fallback the app uses elsewhere. Seven2 has no logo, so it shows an "S"; prmptr.ai shows its real raster mark. Logos render contain-fit in a height-bounded wide slot (about 130px tall, max-width ~480), so horizontal marks (square through ~4:1) sit at a readable size and the frame hugs the artwork; the initial fallback stays a square chip. This mirrors the in-app logo slots, which all use the same "fixed height, width grows to about 4x, object-contain" pattern instead of a fixed square box.

**Metadata note:** `generateMetadata` in `src/app/[companyslug]/page.tsx` intentionally omits `openGraph.images` / `twitter.images` so the generated `opengraph-image` route wins. Do not re-add a raw `logo_url` there, it would override the designed card with an unstyled image.

**Fonts gotcha (most likely to trip up a future change):** EB Garamond is bundled as `.woff` (satori does not accept woff2) in `src/lib/og/fonts/`, loaded by `src/lib/og/fonts.ts` via `fs.readFile(fileURLToPath(new URL("./fonts/...woff", import.meta.url)))`. The `new URL(..., import.meta.url)` reference is what makes Next trace and ship the font into the serverless function; the `fs` read is required because the Node runtime's `fetch` cannot read `file://` URLs. Do not "simplify" this back to `fetch(new URL(...))`, it builds locally but fails at prerender with "not implemented... yet...".

**Preview-cache caveat:** iMessage and the social platforms cache link previews aggressively. After changing an image, you usually will not see the new version in an existing thread. Test by sharing into a fresh conversation, or bust the cache with a share-preview debugger (e.g. the Facebook Sharing Debugger).

**Verify locally:** `npm run build`, then `next start`, and open `/opengraph-image` (marketing), `/seven2/opengraph-image` (initial fallback), and `/prmptr-ai/opengraph-image` (real logo) to eyeball the rendering before deploying.

### Iconography Policy

Decorative icons are out across every surface. "Decorative" = appearing next to a label that already says the thing the icon would mean.

Functional icons come from a closed allowlist. Anything outside this list needs a one-line design note before it ships.

| Icon | Allowed use |
|---|---|
| `Calendar` | Relative-date stamps on gallery cards and the modal author row (the one explicit "we kept this on purpose" exception from an earlier audit). |
| `ExternalLink` | `View live project` and other CTAs that open an external destination in a new tab. |
| `Pencil` | `Edit idea` and inline edit affordances on owner-only controls. |
| `X` | Modal close affordance (custom, because the default `DialogContent` close paints under sticky headers). |
| `ArrowRight` / `ArrowLeft` | Block forward/back navigation (Mark complete →, ← Previous block). |
| `Lock` | Gated/locked state badges (Block 4 gate, locked event surface). |
| `Check` | Completed checklist items, completed block indicators in the progress rail. |
| `ChevronDown` / `ChevronUp` | Accordion disclosure and the Hacky Helper Collapse/Expand toggle. |
| `Compass` | The Hacky Helper wordmark glyph (section label + participant-home setup banner). Replaced `Sparkles`, which is now retired everywhere. |
| `CircleCheck` | The reflections "Complete" state pill (submissions closed + recap drafted). |
| `FileText` | AI recap "Generate summary" / "Regenerate" actions on the reflections admin. |
| `Mail` | "Notify team" actions that email participants (voting/reflections opened). |
| `Link2` | "Generate join link" affordance in the `JoinLinkBlock`. |
| `RotateCw` | "Regenerate" the join link. |
| `Link2Off` | "Revoke" the join link. |

When adding a new functional icon, add it to this table in the same commit, with a one-line rationale.

### Editorial Card & Modal Patterns

The gallery card and idea details modal are the canonical "editorial surface" reference. Reuse the same shapes anywhere you need a content tile + expanded detail flow.

**Gallery card** — `src/components/idealab/idea-card.tsx`:

- Author row at the top: `UserAvatar size="sm"` + serif name (with `· You` muted suffix for owner viewing their own idea) + relative date in a sub-row, with a leading `Calendar` icon at `size-3.5`.
- Gray-400 soft outline status badge on the right of the author row (terminal Solid badge for Completed).
- Serif `text-xl leading-snug line-clamp-2` title — opens the modal on click.
- Serif `text-base leading-relaxed text-muted-foreground line-clamp-2` pitch teaser directly under the title.
- 16:9 hero with `rounded-[8px] border` — explicit `rounded-[8px]` is a deliberate one-off override; the platform's `--radius` is 4px but the editorial card matches IdeaLab's 8px for visual softness. Fallback when no image: gradient-to-br muted background with serif monogram of the title's first character.
- Tinted description pill: `bg-muted/40 rounded-[8px] px-3 py-2`. The `line-clamp-3` goes on an **inner `<span>`**, not the same element as the button's `block`.

  > **GOTCHA:** `line-clamp-N` sets `display: -webkit-box`. If it's on the same element as `block` (`display: block`), the clamp silently no-ops. Always put the clamp on an inner span when the outer element needs an explicit display.

- Bottom: full-width gray-400 outline `Project Details` button (editorial-voice).
- Every clickable surface on the card (title button, image button, description pill, bottom button) opens the modal — no nested anchors, no direct navigation to the editor.

**Project Details modal** — `src/components/idealab/idea-details-modal.tsx`:

- `DialogContent`: `max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0` with `showCloseButton={false}` (the default close paints under our sticky header band — we render our own).
- Sticky header band (`sticky top-0 z-10 border-b bg-background px-6 pt-6 pb-5`):
  - **Top row:** author cluster on the left (`UserAvatar size="md"` + serif name + `· You` for owners + relative date with `Calendar` icon) | gray-400 outline status badge + ghost `icon-sm` `X` close button on the right.
  - **Second row:** `DialogTitle` in serif `text-2xl leading-tight`, then the unclamped pitch in serif `text-base leading-relaxed text-muted-foreground`.
- Body: optional 16:9 hero (same `rounded-[8px] border` treatment as the card) + full description in the tinted pill, **no clamp** — the modal is where the full copy gets to breathe.
- Footer band (`border-t bg-muted/30 px-6 py-4`):
  - `Edit idea` (outlined editorial CTA with `Pencil` icon) — owner-only.
  - `View live project` (outlined editorial CTA with `ExternalLink` icon, `target="_blank" rel="noopener noreferrer"`) — only rendered when `liveUrl` is set.
  - **No solid-black buttons in this footer.** Both CTAs use the gray-400 outline treatment.

**Join-link block** — `src/components/admin/sections/participants-panel.tsx` (`JoinLinkBlock`):

A compact two-state editorial card that lives inside an existing `AdminSection`. The pattern is reusable for any admin surface that exposes a tokenized, copy-paste-able URL (think future "anonymous voting link" or "external observer link"). It is *not* a top-level section — it always nests inside the surrounding `AdminSection` rail.

- Wrapper is a single `rounded-md border p-3` block with `borderColor: var(--gray-400)` and `backgroundColor: var(--bg-tertiary)` — the same recessed tint used by the "email not configured" callout in the same panel.
- Lead with a `.mono-label` heading (e.g. `SHAREABLE JOIN LINK`) outside the block so the section gutter math stays consistent with the surrounding email-invite and roster groups.
- Inside the block: one paragraph of `font-serif text-sm italic` body copy at `var(--text-secondary)` explaining what the link does and the approval gate it triggers. Two states:
  - **No token:** body + a single gray-400 outline button (`Link2` icon + "Generate join link"). Generating immediately copies the new URL to the clipboard and surfaces a toast — no intermediate "your link is ready" affordance, the toast carries the load.
  - **Active token:** read-only `Input` showing the URL (mono, xs) + three gray-400 outline buttons in a wrap row: Copy (toggles to `Check` for ~2s after success), Regenerate (`RotateCw`, prompts before rotating), Revoke (`Link2Off`, prompts before disabling).
- Pending requests live in a sibling block keyed off the same `.mono-label` rhythm (`PENDING REQUESTS (N)`) — rendered only when the count is > 0. Each row is the same `rounded-md border bg-card p-3` shape used for pending invitations, with `Approve` (outline) and `Reject` (ghost) actions on the right and a serif name + "requested Nh ago" metadata on the left.

### Avatars

`UserAvatar` (in `src/components/ui/user-avatar.tsx`) is the single avatar primitive on the platform. Always use it instead of dropping in raw `Avatar` / `AvatarImage` / `AvatarFallback`.

| Size | Token | Used on |
|---|---|---|
| `xs` | `size-6` (24px) | Top bar |
| `sm` | `size-8` (32px) | Gallery card author row, dashboard tiles |
| `md` | `size-10` (40px) | Modal header author row, profile listings |
| `lg` | `size-14` (56px) | Settings page profile section |

- **Fallback:** EB Garamond monogram of the first character of `fullName` (or email local-part if no name yet) on a muted background. No initials pair, no color tinting, no decorative ring.
- **Storage:** the `avatars` Supabase bucket (public read, authenticated write scoped to `auth.uid()` prefix). Uploads happen on the Settings page via the `ProfileSection` client component. Profile rows expose `avatar_url`; the slug viewer/profile resolvers include it.
- **PATCH route:** `/api/profile` accepts `avatar_url` updates with origin validation (must point at the avatars bucket).

### Relative Time

`formatRelativeUpdatedAt` (in `src/lib/idealab/format-relative-date.ts`) is the standard relative-time formatter for any "last updated" / "last activity" surface that participants see.

- Granularity ladder: "just now" → "Nm ago" → "Nh ago" → "N days ago" → after one week, switches to absolute "Apr 12" / "Apr 12, 2025".
- Used today by the gallery card author row and the modal header. Reuse it anywhere we surface an editable-content timestamp on a member view — don't reintroduce a parallel formatter.

### Admin Section Frame

The Org Admin surfaces (`00 Hacky Helper`, `01 Identity`, `02 Integrations`, `03 Schedule`, `04 Team`, `05 Hacky Awards`, `06 Reflections`) all share a single editorial section pattern. Forms still feel like forms inside the section — the *frame* is what carries the editorial voice.

**Canonical implementation:** `src/components/admin/admin-section.tsx`, exporting `<AdminSection>` and `<AdminField>`.

**Reading-column width.** `<AdminSection>` takes a `width` prop. The
default is `narrow` — the section (and its form fields) is constrained to
`--container-narrow` (720px), the same reading column the participant
content uses, so forms don't sprawl edge-to-edge. `wide` is an explicit
opt-in for the few surfaces that genuinely need the full content width.
All standard admin forms (Identity, Integrations, Team, etc.) use the
narrow default.

**Anatomy of a single section:**

```
01   Event identity                                  ← mono number + serif h3
     The title participants see, plus welcome copy
     and optional intro video.                       ← serif italic intent

     │  EVENT TITLE                                  ← mono-label (AdminField)
     │  [ Spring Hacks-a-Thon              ]
     │  not shown to participants — just for         ← serif italic hint
     │  your reference.
     │
     │  WELCOME MESSAGE
     │  [ ──────────────────────────────── ]
     │  [ ──────────────────────────────── ]
     │
     │  [Save changes]                               ← shadcn button, footer slot
```

- The mono number lives in the same `min-w-12` column as the participant `TimelineSection`, so admin and participant surfaces share the same gutter math.
- The serif `<h3>` is `font-serif text-2xl leading-snug` — identical to the participant timeline rows.
- The intent line below the header is `font-serif text-sm italic text-muted-foreground/80`, one sentence max.
- Section bodies sit inside a `ml-4 border-l border-border pl-4` rail so multi-section pages (e.g. Identity stacks several 01/02/03 sections) read as a continuous editorial column.
- Section footers (typically a Save button + post-save "Saved" check) live in the `footer` slot, rendered at the bottom of the rail.

**`<AdminField>` form rows:**

- Replaces the shadcn `<Label>` + `<Input>` pairing on admin surfaces.
- The label uses the existing `.mono-label` utility (`--text-tertiary`) — same uppercase 11px JetBrains Mono treatment as participant section labels.
- `hint` renders in serif italic at `text-muted-foreground/80`. `error` renders in serif italic at `--text-secondary` (no red — caution colors are reserved for nothing).
- Inputs themselves stay shadcn (`<Input>`, `<Textarea>`, `<Select>`). Forms feel like forms; the editorial wrapper carries the voice.

**Page composition:**

Admin pages with multiple sections render a single `<h3>` page header (the tab name, e.g. "Identity") + one-line intro, then `space-y-10` between AdminSections. Single-section pages (e.g. Schedule) skip the page header redundancy and let the section header do the work.

**The Schedule page is a hybrid.** It uses the participant `BlocksTimeline` left-rule + circle-connector frame (one row per block, circle filled when the row has a `scheduled_date`) but renders an inline `<AdminField>` group for Start + Duration plus a per-row Save button beneath each block's description. Admins see the same editorial timeline participants do, but with the schedule controls inlined. The Start control uses the compact `DateTime15Field` (see below) and Duration is a narrow select stacked beneath it — neither input spans the column.

**Do not** wrap admin sections in shadcn `<Card>`/`<CardHeader>`/`<CardTitle>` going forward. Existing usage was migrated to `<AdminSection>` in the April 2026 admin pass — keep that contract.

### Hacky Helper

The Hacky Helper (`src/components/admin/sections/hacky-helper.tsx`,
mounted on the `00 Hacky Helper` tab) is the guided-walkthrough pattern.
It is **borderless and editorial** — explicitly *not* a gray-filled box.
This is the deliberate contrast with the still-tinted `JoinLinkBlock`:
the Helper is the page's spine, so it adopts the timeline frame, not a
recessed callout.

- **Structure:** an always-on, hairline-divided accordion list of the six
  journey stops (`01 Identity` → `06 Reflections`), mirroring the
  sub-nav 1:1. The list never swaps by event phase — only the copy and
  the highlighted step change.
- **Stop headers:** mono number + serif title + an "X of Y done" count in
  mono. A fully-complete stop gets a filled `Check`.
- **Open / collapse:** stops are open by default and individually
  collapsible. A single **Collapse / Expand** toggle (top-right,
  `ChevronUp` / `ChevronDown`) flips every section at once via the
  `?helper=collapsed` URL param. There is no "Hide" — the headers always
  stay visible.
- **Step markers:** `required` = solid circle; `recommended` = dashed
  circle + a mono "Optional" tag; `event-day` = solid circle + a mono
  "Event day" tag. Exactly one pending step is promoted to the primary
  "Do this next." button; every other step gets a ghost "Go". The stop
  that owns the next step carries an inset left-accent rail.
- **Tone:** grayscale-only, same caution-free contract as the rest of the
  admin — no amber "incomplete" pills, no green "done" pills beyond the
  terminal `Check`.

### 15-minute datetime picker

`src/components/admin/fields/datetime-15-field.tsx` (`DateTime15Field`)
is the standard date/time control for every admin schedule input — block
start times, the voting window, and the reflection window. It pairs a
native date input with a `<select>` constrained to 15-minute increments,
because the native `datetime-local` `step` attribute only affects spinner
behavior inconsistently across browsers. Do not drop raw
`datetime-local` inputs onto admin surfaces — reach for `DateTime15Field`
so the minute granularity stays uniform.

---

*End of Hacksathon.com Platform Design System*
*Foundation: HACKS-DESIGN.md (hacks.murtopolis.com)*
*Extends to: Participant Experience, Org Admin, Murtopolis, Awards Ceremony*
*Last updated: May 2026*
