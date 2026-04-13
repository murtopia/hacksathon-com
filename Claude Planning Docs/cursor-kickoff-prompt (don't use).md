# Cursor Kickoff Prompt — ZERO.Prmptr + Hacksathon.com Block 4
## Paste this as your opening message in Cursor Agent

---

I'm building Hacksathon.com — a structured hackathon platform for non-technical teams. I have two existing codebases I'm working with:

1. **ZERO.Prmptr** — a standalone planning tool that walks users through a 5-step conversational flow to generate a Project Brief and a Starter Prompt for a vibe coding tool like Lovable or Cursor
2. **IdeaLab** — an idea submission and tracking tool (originally built in Lovable, now running in Cursor)

Both use the same stack as this project. ZERO.Prmptr is approximately 90% complete. IdeaLab is functional but will need integration work later.

I have two documents I want you to read first:
- `hacksathon-prd.md` — the full Product Requirements Document for Hacksathon.com
- `zero-prmptr-enhancement-spec.md` — a specific spec for the improvements we're making to ZERO.Prmptr

Please read both of those before we do anything else.

---

## What I Want to Do in This Session

I want to improve ZERO.Prmptr's planning conversation engine. These improvements will apply to **both** the standalone ZERO.Prmptr product **and** Hacksathon.com's Block 4 (Planning block). The planning engine is a shared module — when it improves in one place, it improves in both.

There are three problems to solve, in this order of priority:

---

### Problem 1: Threading conversation context across all 5 steps (do this first)

Right now each planning step makes a fresh, stateless API call to Claude. The AI has no memory of what the user said in previous steps, which causes redundant questions and generic coaching.

The fix: a `planningSession` context object that accumulates through all five steps. Every API call receives the full prior conversation history — what was asked, what the user said, and any follow-up exchanges. By Step 3, the AI knows the target audience and core function from Steps 1 and 2. The Project Brief at the end is a synthesized document generated from the full conversation, not a concatenation of five field values.

Please start by exploring the codebase to find:
- Where the planning conversation currently lives
- How API calls to Claude are structured right now
- Where step answers are stored
Then show me what you find before writing any code.

---

### Problem 2: The AI should be a thinking partner, not a form (do this second)

After each user response, the AI should:
1. Briefly acknowledge what it heard in a way that shows genuine understanding
2. Offer 1–2 optional follow-up observations, questions, or ideas — things that would make the plan better (flagging scope risk, making connections to earlier answers, surfacing unconsidered angles)
3. Present a clear "I'm ready to move on →" action the user can take at any time

The user is never blocked by follow-ups. They can always advance. But the follow-ups should be genuinely useful — not filler.

The AI should NOT:
- Ask more than 2 follow-up questions at once
- Repeat the user's answer back to them without adding value
- Be sycophantic ("Great idea!")
- Block advancement

---

### Problem 3: Revision mode (do this third)

Currently, if a user wants to change any part of their plan, the tool restarts from Step 1. 

The fix is two distinct modes:
- **Create mode** — the existing 5-step flow for a new plan (unchanged)
- **Revise mode** — opens when editing an existing Project Brief. Loads the existing brief and conversation history, asks "what do you want to revisit?", identifies which sections are affected by the change, updates only those sections, and leaves everything else intact. The Starter Prompt is regenerated if the changes warrant it.

---

### Bonus: Supplemental analysis document

At the end of the 5-step flow (after the Project Brief is generated), the AI produces a second lightweight document called "Build Notes" — a short, readable set of:
- Tensions or open questions in the plan
- 3–5 things worth thinking about before the first build prompt
- Key assumptions embedded in the plan
- Optionally: a suggested v1 scope if the plan is ambitious

This is a second API call using the full conversation history as input. It's not a blocker — the user can ignore it. But it represents the "thinking ahead" value that makes this tool genuinely useful for someone who's never built before.

---

## The Stack

Same as the rest of my projects in this workspace. Please check the existing codebase for the specific framework, database, and AI integration patterns already in use.

## Important

- Do not change the 5-step structure or the Project Brief sections
- Do not change the Starter Prompt output or copy button behavior
- Preserve the Block 4 gate logic for the Hacksathon.com integration
- Any changes to the conversation engine should work in both the standalone ZERO.Prmptr context and the embedded Hacksathon.com Block 4 context

Please start by reading the two spec documents and exploring the relevant parts of the codebase. Show me what you find before proposing any code changes.
