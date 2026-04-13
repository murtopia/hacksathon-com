# ZERO.Prmptr Enhancement Spec
## Applied to: Hacksathon.com Block 4 + ZERO.Prmptr Standalone
*Session 8 — April 2026*

---

## Important Note on Scope

Every improvement described in this document applies to **both targets simultaneously**:

1. **Hacksathon.com Block 4 (Planning)** — the integrated, gated version inside the hackathon platform
2. **ZERO.Prmptr standalone product** — the independent tool

These are not two separate implementations. The planning conversation engine is a shared module. When it improves in one place, it improves in both. Any Cursor work on this feature should be organized with that dual-target in mind from the first file structure decision.

---

## The Three Problems Being Solved

### Problem 1: No Conversation Memory Between Steps

**Current behavior:** Each planning step is a fresh, stateless API call. The AI has no awareness of what the user said in previous steps. It gives generic coaching, asks questions it already knows the answer to, and produces a Project Brief that reads like five concatenated answers rather than a synthesized plan.

**Target behavior:** A `planningSession` context object accumulates through all five steps. Every API call receives the full prior conversation — what was asked, what the user said, and any AI follow-up exchanges. By Step 3, the AI knows the user's target audience and core function well enough to give specific vibe feedback. By Step 5, the "done looks like" response acknowledges everything that came before it.

**What this fixes:**
- Redundant questions ("who is this for?" being effectively re-asked in later steps)
- Generic coaching that could apply to any project
- A Project Brief that feels assembled rather than thought through

---

### Problem 2: The AI Is a Form, Not a Thinking Partner

**Current behavior:** The AI accepts whatever the user types and advances to the next step. There is no evaluation of answer quality, no follow-up, no surfacing of ideas the user hasn't considered.

**Target behavior:** After each user response, the AI does three things before offering to advance:

1. **Acknowledges and reflects** what it heard — briefly, in a way that shows it actually processed the answer (not just "Got it!")
2. **Offers optional depth** — 1–2 follow-up observations, questions, or ideas. These are genuinely useful additions: flagging scope risk, connecting to something said earlier, surfacing an angle they haven't considered. The user does not have to engage with these.
3. **Presents a clear forward path** — a visible "I'm ready to move on →" action the user can take at any point, with or without engaging the follow-ups

**The key design principle:** The AI offers more; the user controls when to advance. No step is blocked by the AI's follow-ups. But the follow-ups are substantive enough that engaging with them produces a noticeably better plan.

**What the AI should be capable of doing in follow-ups:**
- Noticing when an answer sounds like two things ("this might be two separate ideas — which is the core one?")
- Connecting the current step to something from an earlier step ("you said your user is a dad who travels — does that affect the design direction you're describing here?")
- Surfacing considerations the user probably hasn't thought about ("have you thought about what happens when a user wants to revisit a past entry?")
- Offering a concrete variation ("another angle on this: what if instead of X, you framed it as Y?")
- Gently flagging risk without being alarmist ("this scope is ambitious for a first build — do you want to identify a version 1 that's smaller?")

**What the AI should NOT do:**
- Ask more than 2 follow-up questions at a time
- Repeat or rephrase what the user just said back to them without adding value
- Block advancement to the next step
- Be sycophantic ("Great idea!")

---

### Problem 3: Revisions Restart the Whole Flow

**Current behavior:** When a user wants to change something in their plan — even a single field — the tool puts them back at step one and they lose the thread of the whole conversation.

**Target behavior:** Two distinct modes exist:

**Create mode** — the full 5-step conversational flow for a new plan. This is unchanged.

**Revise mode** — opened when editing an existing Project Brief. The AI loads the full existing brief and conversation history, then opens a targeted dialogue:

> "You've got a solid plan for [Project Name]. What do you want to revisit?"

The user describes what changed — a new direction, a scope adjustment, a different target user. The AI then:
- Asks any clarifying questions about the change
- Identifies which sections of the Project Brief are affected
- Proposes specific updates to those sections
- Leaves unaffected sections intact
- Regenerates the Starter Prompt if the changes warrant it

**The user never has to re-answer questions that haven't changed.** If the only thing that changed is the visual direction, only the design vibe section of the brief is updated.

---

## The Supplemental Analysis Document

At the end of all five steps (and optionally triggered in Revise mode), the AI produces a second document alongside the Project Brief.

**Working name:** "Build Notes" or "Before You Build"

**What it contains:**

1. **Tensions and open questions** — things the AI noticed that might create friction during the build ("your target user is very specific but your done state sounds like it's designed for anyone — worth resolving before you start")

2. **3–5 "questions worth exploring"** — not blockers, but genuinely valuable things to think about before the first prompt. These are surfaced conversationally: the AI can offer to explore any of them before the user exits to the build tool.

3. **Assumptions to watch** — the biggest bets embedded in the plan ("this assumes users will input data manually — what if they won't?")

4. **Optional: a v1 / v2 split** — if the plan is ambitious, the AI suggests what belongs in the first build and what to save for later. This is only surfaced if scope risk was flagged during the steps.

**Format:** This is a lightweight, readable addendum. Not a formal document — more like notes from a smart collaborator who reviewed the plan. It lives alongside the Project Brief and can be expanded or collapsed in the UI.

**Why this matters:** The Project Brief is the structured output. The Build Notes are the thinking output. Together they represent what a good planning conversation actually produces — not just a filled-in template, but a clearer sense of what you're building and what might trip you up.

---

## Interaction Design Summary

### The State Object

A `planningSession` object should accumulate through the entire flow:

```javascript
planningSession = {
  projectName: string,
  ideaId: string,           // from Block 2 / IdeaLab
  buildTool: string,        // from event config
  conversationHistory: [    // full message thread, passed to every API call
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: step1Question },
    { role: 'user', content: step1Answer },
    { role: 'assistant', content: step1Reflection + followUps },
    { role: 'user', content: step1FollowUpResponse },  // if any
    { role: 'assistant', content: advanceConfirmation },
    { role: 'assistant', content: step2Question },
    // ... continues
  ],
  stepAnswers: {            // structured store of confirmed answers per step
    step1: string,
    step2: string,
    step3: { vibe: string, referenceUrl: string, colorNotes: string },
    step4: string,
    step5: string
  },
  mode: 'create' | 'revise',
  existingBriefId: string | null  // populated in revise mode
}
```

### The System Prompt

The system prompt for the planning conversation engine should establish:
- The AI's role: a product thinking partner helping someone plan their first build
- The audience: non-technical creatives who may never have built anything before
- The tone: curious, direct, genuinely helpful — not a chatbot, not a coach
- The rules: max 2 follow-up questions, never block advancement, always acknowledge what came before
- What the AI knows: the event context (if in Hacksathon), the build tool being used, the idea from Block 2 / IdeaLab

### Step Transitions

Each step transition should:
1. Pass the full `conversationHistory` to the next API call
2. Include a brief internal note in the system context: "The user has confirmed they're ready to move on from Step N. Do not revisit Step N content. Build on it."
3. Open the next step with a question that demonstrates awareness of prior context — not a generic question

### The Project Brief Generation

The Project Brief is generated after Step 5 is complete. It is not assembled from the `stepAnswers` fields directly — it is generated by a final API call that receives the full `conversationHistory` and synthesizes a coherent brief. The structured fields (`stepAnswers`) are used as the data layer; the AI-generated synthesis is the readable output.

This is the difference between a form dump and an actual document.

---

## What Stays the Same

- The 5-step structure (same questions, same order)
- The Starter Prompt output and copy button
- The Project Brief sections and format
- The Block 4 gate logic (Hacksathon.com only)
- The affiliate link for Lovable (Hacksathon.com only)

---

## Implementation Notes for Cursor

When opening this work in Cursor:

1. **Find the planning conversation component first** — understand how API calls are currently structured before writing any new code
2. **The conversation history threading is the foundational change** — everything else (follow-ups, revision mode, supplemental doc) builds on top of a working context-aware conversation
3. **Build revision mode as a separate entry point** into the same conversation engine — it's not a separate component, it's a different initialization state
4. **The Build Notes / supplemental doc** can be a second API call at the end of the flow, using the full `conversationHistory` as input — it doesn't require a separate architecture
5. **Test with real planning scenarios** — the best way to validate that the AI is genuinely helpful is to run through the flow with actual project ideas and evaluate whether the follow-ups would have made the plan better

---

*End of ZERO.Prmptr Enhancement Spec*
*Apply to: Hacksathon.com Block 4 + ZERO.Prmptr standalone*
*Next: Cursor kickoff prompt*
