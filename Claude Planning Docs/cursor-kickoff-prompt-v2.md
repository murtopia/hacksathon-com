# Cursor Kickoff Prompt — Hacksathon.com
## Paste this as your opening message in Cursor Agent
*Updated April 2026 — supersedes cursor-kickoff-prompt.md*

---

I'm building **Hacksathon.com** — a structured hackathon platform for non-technical teams. Before we write a single line of code, I need you to read the following documents in this order. Do not skip any of them.

## Read These First (in order)

1. `hacksathon-master-strategy.md` — the complete product strategy, feature prioritization, information architecture, pricing, and GTM. This is the single source of truth for everything we're building.

2. `zero-prmptr-enhancement-spec.md` — the specific spec for the improvements we're making to ZERO.Prmptr's planning conversation engine. This is the first thing we're building.

3. `hacksathon-design-system.md` — the design bible for the entire platform. Every UI component, every new surface, every screen must follow this system. It extends `HACKS-DESIGN.md` which should already be in this workspace.

4. `awards-ceremony-spec.md` — the spec for Block 8 (Awards ceremony), the voting timer, the presentation timer, and how the existing `hacky-awards-v4.html` file needs to be rebuilt into the platform. We are not working on this today, but read it so you understand the full scope.

Read all four before responding.

---

## Context: What Exists

**ZERO.Prmptr** — a standalone planning tool, approximately 90% complete. Walks users through a 5-step conversational flow to generate a Project Brief and a Starter Prompt for a vibe coding tool like Lovable or Cursor. This is a shared module — it becomes Block 4 (Planning) inside Hacksathon.com. Improvements here apply to both products simultaneously.

**IdeaLab** — an idea submission and tracking tool, originally built in Lovable, now running in Cursor. Functional. Becomes Block 2 (Ideation) inside Hacksathon.com. Not touching this today.

**hacky-awards-v4.html** — a standalone HTML file for the Hacky Awards ceremony. Lives in this workspace. It is a reference implementation only — we will eventually rebuild it into the platform following the design system. Not touching this today.

Both tools share the same stack as this project. Check the existing codebase for the specific framework, database, and AI integration patterns already in use before proposing anything.

---

## What We're Doing This Session: ZERO.Prmptr First

We are starting with ZERO.Prmptr. The planning conversation engine is the highest-leverage feature in the entire platform — it's the Block 4 hard gate, and it's the thing that directly determines whether participants ship something good. Getting it right before building the platform around it is the correct order of operations.

There are three problems to solve, in this priority order:

---

### Problem 1: Thread conversation context across all 5 steps
*(Do this first)*

Each planning step currently makes a fresh, stateless API call to Claude. The AI has no memory of previous steps — it gives generic coaching, asks redundant questions, and produces a Project Brief that reads like five concatenated field values rather than a synthesized plan.

**The fix:** A `planningSession` context object that accumulates through all five steps. Every API call receives the full prior conversation history. By Step 3, the AI already knows the target audience and core function from Steps 1 and 2. The Project Brief at the end is generated from the full conversation, not assembled from field values.

The full data structure is specified in `zero-prmptr-enhancement-spec.md`. Before writing any code:
- Find where the planning conversation currently lives in the codebase
- Find how API calls to Claude are currently structured
- Find where step answers are currently stored

Show me what you find before proposing any changes.

---

### Problem 2: The AI should be a thinking partner, not a form
*(Do this second)*

After each user response, the AI currently just accepts the input and advances. No evaluation of quality, no follow-up, no surfacing of ideas the user hasn't considered.

**The fix:** After each response, the AI does three things:
1. Briefly acknowledges what it heard in a way that shows it actually processed the answer — not just "Got it!"
2. Offers 1–2 optional follow-up observations, questions, or ideas — genuinely useful additions: flagging scope risk, connecting to something from an earlier step, surfacing an unconsidered angle
3. Presents a clear "I'm ready to move on →" action the user can take at any time

The user is never blocked. They can always advance. The follow-ups should be substantive enough that engaging with them produces a noticeably better plan.

**The AI must NOT:**
- Ask more than 2 follow-up questions at once
- Repeat the user's answer back without adding value
- Be sycophantic ("Great idea!")
- Block advancement to the next step

Full detail in `zero-prmptr-enhancement-spec.md`.

---

### Problem 3: Revision mode
*(Do this third)*

Currently any change to a plan restarts the entire flow from Step 1.

**The fix:** Two distinct modes:
- **Create mode** — the existing 5-step flow for a new plan. Unchanged.
- **Revise mode** — opens when editing an existing Project Brief. Loads the existing brief and full conversation history. Asks what the user wants to revisit. Identifies which sections are affected. Updates only those sections. Leaves everything else intact. Regenerates the Starter Prompt only if the changes warrant it.

The user never re-answers questions that haven't changed.

---

### Bonus: Build Notes (supplemental analysis document)

After Step 5 is complete and the Project Brief is generated, a second API call produces a lightweight "Build Notes" document using the full conversation history as input. Contents: tensions or open questions in the plan, 3–5 things worth thinking about before the first build prompt, key assumptions embedded in the plan, and optionally a v1/v2 scope split if the plan is ambitious.

This is not a blocker — the user can ignore it. It is a separate API call, not a separate architecture. Full detail in the spec.

---

## Design Constraints

Every UI component touched or created in this session must follow `hacksathon-design-system.md`. Non-negotiable rules:

- **Typefaces only:** EB Garamond (display/editorial), Inter (UI/body), JetBrains Mono (labels/data/meta). No other fonts.
- **Grayscale only:** Use only the color tokens defined in the design system. No warm colors, no cream, no gold.
- **Gradient accent sparingly:** The Lovable gradient (`--gradient-accent`) is used at most once per view — the "Copy your first prompt" CTA is the correct moment in the planning flow.
- **Status badges use fill/outline/muted only — never color.** Solid black = complete. Outlined = active/in-progress. Muted gray = inactive/locked. No red, no green, no orange. Ever.
- **Hover states are quiet:** border darkens, text darkens. No background fills, no shadows, no transforms beyond 16px.
- **Borders:** 1px solid `--border-color` as default. `--border-strong` for emphasis.

---

## What Must Not Change

- The 5-step structure (same questions, same order)
- The Starter Prompt output and copy button behavior
- The Project Brief sections and format
- The Block 4 gate logic in the Hacksathon.com integration
- Any changes to the conversation engine must work in both the standalone ZERO.Prmptr context and the embedded Hacksathon.com Block 4 context simultaneously — this is a shared module

---

## How to Start

1. Confirm you've read all four documents listed above
2. Explore the codebase: find the planning conversation component, the current API call structure, and where step answers are stored
3. Show me what you find — summarize the relevant files and how they're connected
4. Propose your approach for Problem 1 before writing any code
5. Wait for my approval before proceeding

Do not write any code until step 4 is complete and I've confirmed the approach.
