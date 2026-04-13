# Awards Ceremony — Feature Spec
## Block 8: Hacky Awards + Demo Day Presentation Timer
*Hacksathon.com — April 2026*

---

## Overview

Two related features live in and around Block 8 and Demo Day:

1. **The Hacky Awards Ceremony** — a full-screen click-through presentation auto-populated from voting data, screen-shared by the Organizer during the live awards ceremony
2. **The Demo Day Presentation Timer** — a managed countdown tool for the Organizer to time each participant's demo and Q&A without a second device or manual stopwatch

Both features replace workflows that Nick currently handles manually. The goal is that the Organizer runs a polished, high-energy ceremony entirely from within the platform.

---

## Part 1: The Hacky Awards Ceremony

### Origin — The v4 Tool

The existing tool (`hacky-awards-v4.html`) is a standalone HTML file that was run locally from Nick's Downloads folder during the Seven2 event. It is not connected to the platform in any way. Key behavior:

- **Setup screen** — Organizer manually types runner-up(s) and winner for each category before the ceremony begins
- **Presentation** — a full-screen click-through slideshow. Structure per event:
  - Title slide
  - For each category: Category intro → Runner-up reveal → Winner reveal (with confetti burst)
  - Finale recap grid showing all winners
- **Navigation** — click anywhere, spacebar, or right arrow to advance; left arrow to go back
- **Tied runner-ups** — comma-separated input, auto-sized font stack on a single slide
- **Confetti** — fires on every winner slide and the finale

### What to Preserve Exactly

The visual design and interaction model of the existing tool are strong and should be preserved as closely as possible in the platform version:

**Visual identity:**
- Typefaces: DM Serif Display (headlines, winner names) + DM Sans (body, labels)
- Color palette: `--bg: #f8f7f4`, `--ink: #111110`, `--muted: #88877e`, `--rule: #d8d6cf`, `--gold: #b8860b`
- Gold diamond `◆` as the primary decorative motif
- Warm cream background — not white, not dark

**Slide structure (preserve exactly):**
- `Title slide` → warm, sparse, gold diamond floating animation, eyebrow + large serif title
- `Category intro` → award number (01 of 06), category name in large serif, italic tagline, blinking "Click to reveal" CTA
- `Runner-up slide` → category crumb at top, RUNNER-UP label, horizontal rule, large serif name(s) with staggered slideUp animation
- `Winner slide` → "And the winner is…" in italic serif, gold diamond with float animation, massive winner name with scale-in reveal animation, confetti burst
- `Finale` → "Congratulations to all our Hacky Award winners" + 3-column grid of all category/winner pairs

**Animation specifics to preserve:**
- `slideUp` — runner-up names animate up from 24px with cubic-bezier easing; tied names stagger by 80ms each
- `winReveal` — winner name scales from 0.88 with slight overshoot (1.025) then settles
- `float` — gold diamonds gently bob up 8px on a 3–4s infinite loop
- `blink` — "Click to advance" and similar CTAs pulse between 40–100% opacity
- Confetti: 180 particles, gold/ink/cream palette, fired at winner reveal and twice at finale

**Navigation chrome:**
- Category progress dots at the bottom center (dot = not started, muted = past, ink + scaled = current)
- "Click to advance" hint bottom right
- "← Back" bottom left
- Both hidden on title and finale slides

---

### What Changes: Manual → Auto-Populated

The core difference between the v4 tool and the platform version is the **data source**. Instead of the Organizer typing runner-ups and winners before the ceremony, the presentation is **built automatically from voting results** when the Organizer closes the voting window.

#### Data Model

When voting closes, the platform calculates results per category:

```
For each award category:
  Winner  = participant(s) with the highest vote count
  Runner-up = participant(s) with the second-highest vote count
  Tied winner = if two or more participants share the top vote count, all are co-winners
  Tied runner-up = if two or more participants share second-place, all appear on the runner-up slide
```

This maps directly to the existing HTML's data structure — `RU[]` and `WIN[]` arrays — but populated from the database instead of a form.

#### Tie-Breaking Rules

| Scenario | Behavior |
|---|---|
| Single winner, single runner-up | Standard flow — one name on each slide |
| Single winner, tied runner-up | Tied runner-up slide with staggered names (existing behavior) |
| Tied winners | Winner slide shows multiple names; "Co-winners" badge replaces the diamond label |
| No runner-up (only 1 participant voted for, or only 1 participant total) | Runner-up slide shows "No runner-up" in muted italic — ceremony still flows normally |
| No votes cast for a category | Category is skipped in the ceremony; Organizer is warned during pre-ceremony review |

#### Pre-Ceremony Review (New — replaces Setup screen)

The manual setup form in v4 is replaced by a **pre-ceremony review screen** in the Org Admin dashboard. It serves the same purpose — a final check before going live — but is pre-populated:

- Shows each category with auto-calculated winner and runner-up(s)
- Organizer can override any field before launching (same as before, but now it's an exception rather than the norm)
- Categories with data issues (zero votes, tied winners) are flagged with a warning badge
- A single "Launch Ceremony" button transitions to full-screen presentation mode

#### Organizer Override

Even with auto-population, the Organizer retains the ability to manually edit any winner or runner-up field before launching. This preserves the practical flexibility of the v4 tool — if a participant's submitted project name is different from how it was voted on, the Organizer can correct it before the room sees it.

---

### Platform Integration Points

#### The Ceremony IS the Reveal

Voting closes → Organizer privately reviews results → Organizer runs the ceremony (screen-shared to participants via Zoom/Teams) → ceremony ends → only then do winners become visible to participants on their own devices.

**Nothing surfaces to participants until the Organizer explicitly ends the ceremony.** The platform does not publish results, send notifications, or update participant views during the ceremony. The room watches it happen in real-time via the Organizer's shared screen. That surprise is the point.

#### Publishing Results After the Ceremony

When the ceremony is over, the Organizer clicks a single **"Publish Results"** button in the Awards section of the Org Admin dashboard. This makes winners visible to participants on their devices — their waiting state clears and is replaced by the results summary. That's it. No animations, no sequencing, no ceremony on the participant side — they've already watched it happen live on the shared screen.

#### Where It Lives

The Awards ceremony presentation is accessed from:
- **Org Admin → Events → [Event] → Awards → Launch Ceremony**
- This opens the full-screen presentation mode (same browser window, full-screen API)

It is NOT a separate URL or file. It is a route within the platform that enters a distraction-free full-screen mode when launched.

#### Full-Screen Mode

On launch, the platform calls the browser's Full Screen API. The Organizer shares their screen (via Zoom, Teams, etc.) before clicking "Launch Ceremony." The ceremony runs full-screen from that point. Keyboard and click navigation work exactly as in the v4 tool.

#### Category Configuration

Award categories are configured by the Organizer during event setup (Block configuration in the Org Admin wizard). The ceremony presentation uses whatever categories were configured — it does not hardcode category names or count. The ceremony dynamically generates slides based on the configured set.

Default categories (pre-loaded in the Org Admin wizard):
1. Best in Show
2. Best Execution
3. Most Creative Idea
4. Shut Up and Take My Money
5. Best Shark Tank Pitch
6. Most [Company] Energy *(Organizer customizes the company name)*

---

### Slide-by-Slide Spec (Platform Version)

**Slide 0 — Title**
- Eyebrow: `[Company Name] Hacks-a-Thon · [Year]`
- Diamond: floating gold `◆`
- Title: `The Hacky Awards` (DM Serif Display, clamp 52–110px)
- Sub: `Celebrating the builders`
- *Data: event name, company name, year — from event config*

**Slides 1–3N — Category Sequence (per category)**

*Category intro slide (slide 1 of 3):*
- Award number: `Award 01 of 06` (auto-calculated from category count)
- Diamond: `◆`
- Category name (large serif)
- Category tagline (italic, muted — from Organizer's category config)
- CTA: `Click to reveal the runner-up` (or `runner-ups` if tied)

*Runner-up slide (slide 2 of 3):*
- Category crumb at top: `◆ [Category Name] ◆`
- Label: `Runner-up` or `Runner-up (tied)` or `Runner-ups ([N]-way tie)`
- Horizontal rule
- Name(s) in large serif with staggered slideUp animation
- CTA: `Click to reveal the winner`
- *Edge case: if no runner-up exists, show "—" in muted italic*

*Winner slide (slide 3 of 3):*
- Crumb: `◆ [Category Name] ◆`
- Label: `And the winner is…` (italic serif)
- Diamond: floating `◆`
- Winner name(s) in massive serif with scale-in reveal
- Confetti burst on reveal
- CTA: `Click for the next award` (or `Click to see the full recap` on final category)
- *If co-winners: names stacked, "Co-winners" badge replaces italic label*

**Slide N+1 — Finale**
- Eyebrow: `[Company Name] Hacks-a-Thon · [Year]`
- Title: `Congratulations to all our Hacky Award winners`
- Grid: 3-column (or 2-column if ≤4 categories) — one card per category showing category name + winner(s)
- Double confetti burst (immediate + 2 second delay)

---

### Winner Cards (Shareable Assets)

After the ceremony concludes, the platform auto-generates a shareable winner card for each category winner. These are designed for Slack and LinkedIn sharing.

**Card format:**
- Square (1080×1080px equivalent)
- Category name (small caps, muted)
- `◆` diamond motif
- Winner name (large DM Serif Display)
- Event name + company name (footer)
- Warm cream background — matches the ceremony aesthetic

**Generation:** Triggered automatically when the Organizer exits the ceremony or explicitly from the Awards section of the Org Admin dashboard.

**Delivery:** Available as individual downloads per winner, or as a zip of all cards.

---

### CORE vs. GROWTH for Awards

**CORE (MVP)**
- Auto-populated ceremony presentation from voting results
- Pre-ceremony review screen with Organizer override
- Full-screen presentation mode
- Tied runner-up and tied winner support
- All existing animation and confetti behavior preserved
- Backward/forward navigation (keyboard + click)
- Dynamic category count (not hardcoded to 6)
- Winner Cards (auto-generated shareable images)

**GROWTH**
- Audience participation mode — participants see a "watching" view on their own device during the ceremony (blurred until each reveal)
- Export ceremony as a PDF recap (category + winner grid, formatted)

---

## Part 2: The Presentation Timer

### The Problem

Two blocks in the event require timed presentations:

- **Block 3 — Shark Tank Pitch:** 1 minute pitch + 1 minute Q&A per participant
- **Block 7 — Demo Day:** 3 minutes demo + 2 minutes Q&A per participant

During the Seven2 event, Nick manually tracked time with a separate timer on his phone and played a sound over the Zoom call to signal when time was up. This worked but required his full attention on something other than the presentations — and falls apart entirely if anyone else runs the ceremony.

The platform replaces this with a built-in timer panel in the Organizer's view for both blocks.

---

### How It Works

The timer lives in the Org Admin dashboard, available in both **Block 3 (Shark Tank)** and **Block 7 (Demo Day)** views. Same tool, different default configurations per block.

#### Default Phase Durations

| Block | Phase 1 | Phase 2 | Total per presenter |
|---|---|---|---|
| Block 3 — Shark Tank | 1:00 — Pitch | 1:00 — Q&A | 2 minutes |
| Block 7 — Demo Day | 3:00 — Demo | 2:00 — Q&A | 5 minutes |

Both phase durations are configurable by the Organizer during event setup. The defaults above match the Seven2 format.

#### The Organizer Timer Panel

The timer panel appears in the Org Admin view for Block 3 and Block 7. It shows:

```
[ Presenter Order ]     [ Timer ]
──────────────────      ─────────────────────────────
1. Kelsea               [  3:00  ]  🎥 DEMO TIME
2. Joe Moore            
3. Adam                 ▶ Start    ⏸ Pause    ↺ Reset
4. Alliyah              
5. Nick                 Next up: Joe Moore →
```

- Presenter order is always set manually by the Organizer via drag-to-reorder (applies to both Block 3 and Block 7). Order is never auto-assigned — availability, schedules, volunteers, and pacing all vary event to event.
- Active presenter is highlighted in the order list
- Large, glanceable countdown display
- Phase label switches automatically from "DEMO TIME" to "Q&A" (or "PITCH" to "Q&A") when the first phase ends
- "Next up" shows the following presenter so the Organizer stays oriented

#### The Sound Cue

When each phase ends, a chime plays from the Organizer's computer. Since the Organizer is already screen-sharing via Zoom or Teams, participants hear the sound naturally through the shared audio. No special setup, no second device needed — it just works.

**Sound options (set on the timer panel):**
- **Soft chime** — default, gentle single tone
- **Bell** — classic ring
- **None** — silent, visual flash only

A brief gold highlight pulse around the timer display fires on every phase end, regardless of sound setting.

#### Participant Practice Timer (Block 7 only)

Participants in Block 7 have a simple practice version of the timer for rehearsal — a 3-minute countdown with the demo framework shown alongside it:

```
Demo Framework:
1. What it is     (30 sec)
2. Why I built it (30 sec)
3. Show the thing (90 sec)
4. What's next    (30 sec)
──────────────────────────
[  3:00  ]  ▶ Start practice run
```

This is a personal rehearsal tool only. It is not connected to the Organizer's timer and has no effect on the live session.

---

### Timer — CORE vs. GROWTH

**CORE (MVP)**
- Timer panel in Org Admin view for Block 3 and Block 7
- Two-phase countdown with configurable durations per block
- Start / Pause / Reset controls
- Phase auto-transition with audio chime + visual flash
- Sound option selector (soft chime / bell / none)
- Presenter order list with active presenter highlight
- Participant-side practice timer in Block 7 with demo framework

**GROWTH**
- **Presenter's device countdown** — when the Organizer starts the timer, the active presenter's device optionally shows the same countdown. Useful when a presenter is screen-sharing their build and can't see the Organizer's screen. This requires a real-time connection between devices and is a more complex feature — not needed at launch.
- **Session log** — after Demo Day or Shark Tank, Organizer can see actual presentation durations per participant.

---

---

## Part 3: Voting Window Timer

### The Problem

During Seven2, Nick manually opened voting and verbally told participants when it would close — then had to remember to shut it off himself. This is easy to forget mid-ceremony energy and creates an awkward gap if voting is still technically open after winners have been announced.

### How It Works

When the Organizer opens voting, they set a **duration** for the voting window. When the timer expires, voting closes automatically — no manual action required.

**Configuration (set when Organizer opens voting):**
- Duration options: 5 min / 10 min / 15 min / Custom
- Default: 10 minutes (enough time for a room of 20–30 people without dragging)

**What participants see:**
- A countdown timer on their voting ballot: `Voting closes in 7:42`
- When time expires: ballot locks, "Votes submitted — results coming soon" state

**What the Organizer sees:**
- The same countdown in their Awards control panel
- Live vote count: `14 of 22 participants have voted`
- Option to close voting early (if everyone has voted and there's no reason to wait)
- Option to extend by 5 minutes (if stragglers need more time)

**When voting closes (automatically or manually):**
- Ballot locks for all participants
- Organizer sees the final tally (private)
- Pre-ceremony review screen becomes available
- A notification goes out to participants: *"Voting is closed. Stay tuned for the awards ceremony."*

This is a CORE feature — the manual close is too easy to forget at exactly the wrong moment.

---

### Awards Ceremony

1. The v4 HTML file is the **reference implementation** for all slide logic, animation CSS, and confetti behavior. When building the platform version, port the CSS and JS from this file — do not rewrite from scratch. The existing animation timing and easing values are dialed in.

2. The setup form in v4 is replaced by an API call to the voting results endpoint. The `RU[]` and `WIN[]` arrays that the existing code uses should be populated from that data rather than from form inputs.

3. The presentation module should be built as a self-contained component that can enter full-screen mode via the browser Full Screen API. It should not depend on any platform chrome (nav bars, sidebars) once launched.

4. The category count is dynamic. The existing file hardcodes 6 categories and calculates `TOTAL = 1 + N*3 + 1`. This logic is correct — just ensure `N` comes from the configured category list, not a hardcoded value.

5. Winner Cards generation: a canvas-based or server-side image generation approach (e.g., using a headless renderer or html2canvas) to produce the shareable 1:1 images. Can be deferred to GROWTH if needed — the ceremony itself is CORE.

### Demo Day Timer / Shark Tank Timer

1. The timer is a reusable component used in both Block 3 and Block 7, initialized with different default phase durations. Build it once, configure it per block.

2. The audio chime should be a pre-loaded audio asset (short .mp3), not generated on the fly. Include 2–3 options as static assets in the repo.

3. The Organizer's timer and the participant's practice timer are separate instances — the Organizer's timer does not broadcast to participants in MVP. That is a GROWTH feature.

4. Timer state (who is presenting, elapsed time, current phase) should persist across page refreshes using session storage — not in the database for MVP.

---

## What This Replaces in the Master Strategy

The master strategy document references the Awards ceremony in several places. This spec supersedes and expands those references:

- **Session 3 / Area 6 (Awards):** The "Live Results Display Mode" described as a GROWTH feature IS this ceremony presentation — it was underspecified there. The auto-populated ceremony is now CORE, not GROWTH.
- **Session 4 Architecture Decision:** "Awards reveal is a platform-generated click-through presentation, screen-shared by Organizer on Demo Day" — confirmed. This spec is the detailed implementation of that decision.
- **Session 4 Note:** The reference to the "Seven2 PowerPoint" was a placeholder. The v4 HTML tool is the actual reference. The visual language and interaction model are documented above.

---

## Open Questions

1. **Best in Show ordering** — **Locked: Best in Show always runs last**, regardless of how the Organizer ordered their categories. This is a nod to the Oscars — the whole ceremony builds to it. The platform enforces this automatically: if "Best in Show" is detected in the category list, it is pulled to the end. Organizers cannot reorder it to an earlier position in the ceremony.

2. **Co-winner edge case on the finale grid** — if two people tied for Best in Show, how does the finale card display them? (Suggested: both names on the card, smaller font if needed.)

3. **Demo timer broadcast (GROWTH)** — when the Organizer's timer is running, should the active presenter see a countdown on their device? This is a WebSocket feature — confirming it's GROWTH, not CORE.

4. **Sound file hosting** — the audio assets for the timer chime need to be hosted somewhere. Static asset in the repo is fine for MVP.

---

*End of Awards Ceremony Feature Spec*
*Reference file: hacky-awards-v4.html (v4 standalone tool)*
*Applies to: Hacksathon.com Block 8 (Awards) + Block 7 (Demo Day)*
*Session: April 2026*
