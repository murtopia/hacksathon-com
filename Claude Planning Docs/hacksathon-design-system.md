# Hacksathon.com — Platform Design System
*The design bible for all Hacksathon surfaces*
*Based on HACKS-DESIGN.md — extended for the full platform*
*April 2026*

---

## Overview

This document is the authoritative design reference for every surface of the Hacksathon platform:

1. **Public Marketing Site** — `hacksathon.com`
2. **Participant Experience** — `/p/[event-slug]/`
3. **Org Admin Dashboard** — `/admin/`
4. **Platform Admin (Murtopolis)** — `/murtopolis/`
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

---

### Surface 3: Org Admin Dashboard

**Mental model:** The Organizer has two modes — setup and monitoring. The dashboard is a command center, not a marketing surface. It should feel precise, information-dense but scannable, and clearly functional.

**Layout:**
- Two-panel layout: left nav (fixed, 220px) + main content area
- Left nav collapses on mobile
- Main content: max-width 1100px, generous padding
- Tables, data views, and status grids are the primary content patterns

#### New Component: Admin Left Navigation

```
┌────────────────────┐
│  HACKSATHON        │  ← JetBrains Mono, 11px, uppercase
│  ──────────────    │
│  ● My Events       │  ← active state: --black, 2px left border
│  ○ Create Event    │  ← inactive: --text-secondary
│                    │
│  [Event Name]      │  ← current event section header
│  ── Overview       │
│  ── Participants   │
│  ── Blocks         │
│  ── Ideas          │
│  ── Projects       │
│  ── Awards         │
│  ── Reflections    │
│  ── Comms          │
│  ── Analytics      │
│                    │
│  ── Org Settings   │
└────────────────────┘
```

- Background: `--bg-secondary`
- Nav items: Inter, 13px, `--text-secondary` → `--text-primary` on hover
- Active item: `--text-primary`, 2px solid `--black` left border
- Section headers: `.mono-label` style, no hover state
- Width: 220px fixed

#### New Component: Data Table

Used for participant lists, idea galleries, project lists, analytics.

```
┌──────┬──────────────┬────────────────┬──────────────┬────────────┐
│ NAME │ ROLE         │ BLOCK STATUS   │ PROJECT      │ LAST ACTIVE│
├──────┼──────────────┼────────────────┼──────────────┼────────────┤
│ Joe  │ Strategist   │ Block 4 ●●●●○○ │ Chris-Tron   │ 2 days ago │
│ Sena │ Designer     │ Block 5 ●●●●●○ │ Even Grounds │ Today      │
└──────┴──────────────┴────────────────┴──────────────┴────────────┘
```

- Table: `--border-color` borders, 1px
- Header row: `--bg-tertiary` background, `.mono-label` text
- Body rows: white background, `--border-color` row dividers
- Row hover: `--bg-secondary` background
- Completion dots: filled `--black` = complete, `--border-color` = incomplete — 8px circles
- No zebra striping (too heavy for this system)

#### New Component: Event Stats Bar

At the top of every active event view. A quick-read strip of key numbers.

```
┌──────────┬──────────┬──────────┬──────────┐
│    22    │    18    │    14    │    9     │
│ ENROLLED │ IN BUILD │ SHIPPED  │ REFLECTED│
└──────────┴──────────┴──────────┴──────────┘
```

- Grid: 4 columns (or however many stats are relevant), divided by `--border-color`
- Numbers: EB Garamond, `clamp(2rem, 4vw, 3rem)`, `--text-primary`
- Labels: `.mono-label`
- Container: 1px `--border-color` border all around, no background fill

#### New Component: Facilitator Notes Panel

The Organizer coaching layer at each block. Collapsed by default.

```
▸  FACILITATOR NOTES                        ← mono-label, collapsed by default
─────────────────────────────────────────
   What this block is for.
   What to watch for.
   Suggested async message: [template]
```

- Collapsed: mono-label with `▸` indicator, `--bg-tertiary` background, 1px `--border-color`
- Expanded: white background, serif body text, dividers between sections
- Participants never see this component

#### New Component: Announcement Composer

```
┌─────────────────────────────────────────────┐
│  SEND ANNOUNCEMENT                          │  ← mono-label
│  ─────────────────────────────────────────  │
│  To: [All participants ▾]                   │  ← dropdown select
│                                             │
│  [Subject line field]                       │
│  [Message body field, 3 rows]               │
│                                             │
│  Templates: [Block is open] [Behind nudge]  │  ← mono pill buttons
│                    [Send now  →] [Schedule] │
└─────────────────────────────────────────────┘
```

- Template pills: JetBrains Mono, 11px, outlined, load content into the body field on click
- Send button: solid `--black`, white text (primary action)
- Schedule button: outlined, `--black` border (secondary action)

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
}
```

- Label: `.mono-label` style, above the field
- Error state: `--border-strong` border, Inter 12px italic error message below — no red
- Disabled state: `--bg-tertiary` background, `--text-tertiary` text
- Textarea: same as text input, `resize: vertical` only
- Select: same border/padding treatment, custom chevron in `--text-tertiary`

---

### Button System (all surfaces)

**Primary (solid):**
- Background: `--black`; text: `--white`; font: JetBrains Mono, 13px, uppercase, wide tracking
- Hover: opacity 0.85
- Padding: 12px 20px; border-radius: 4px

**Secondary (outlined):**
- Background: transparent; border: 1px solid `--black`; text: `--text-primary`
- Hover: background `--black`, text `--white`
- Same sizing as primary

**Ghost (text-only):**
- No border, no background; text: `--text-secondary`
- Hover: `--text-primary`
- Used for low-priority actions (Cancel, Back)

**Gradient CTA (sparingly — max once per view):**
- The `.gradient-border` treatment from HACKS-DESIGN.md
- Used for: "Copy your first prompt" (Block 4), "Launch Ceremony" (Awards), primary marketing CTAs
- Not used in Org Admin or Murtopolis

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

*End of Hacksathon.com Platform Design System*
*Foundation: HACKS-DESIGN.md (hacks.murtopolis.com)*
*Extends to: Participant Experience, Org Admin, Murtopolis, Awards Ceremony*
*April 2026*
