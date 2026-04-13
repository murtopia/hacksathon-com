# Session 1: Learnings Synthesis
## Seven2 Hacks-a-Thon — Complete Analysis Report
*Prepared for Hacksathon.com product development*

---

## Overview of the Data Set

- **22 participants** across producers, designers, strategists, project managers, and light technical roles
- **32 ideas submitted** to IdeaLab
- **14 completed projects** with live URLs
- **2 projects** still in progress at event close
- **13 participants submitted reflections** (84 responses across 7 questions)
- **15 participants voted** in the Hacky Awards (90 total votes across 6 categories)
- **Event duration:** ~6 weeks, Feb–Apr 2026, run in 30–45 minute time-blocked sessions

---

## 1. The Biggest Wins — What Made This Work

### The completion rate was extraordinary
14 out of ~22 participants shipped a working product with a live URL. For a non-technical team with no prior coding experience, a **64% completion rate in 6 weeks of part-time work** is the headline stat. In traditional hackathons even among developers, many teams fail to ship. This number alone validates the entire format.

### Personal passion projects out-performed work projects
The top three award-winning projects — Drift (bedtime stories), Cut-up Lyric Generator, and Even Grounds (coffee journaling) — were all deeply personal. None were about work. The format's explicit encouragement of "silly" or passion-driven ideas directly produced the most engaged participants and the most polished outcomes. Adam Simons put it bluntly: *"I loved seeing my coworkers' presentations that were based on products that were less work or productivity related. It makes the whole project a lot of fun."*

### The Shark Tank pitch session created collective energy
The one-minute pitch format was praised in both transcripts and reflections. It forced participants to crystallize their ideas quickly, generated immediate team feedback, and — critically — created social accountability. Knowing your peers had heard your pitch made you more likely to follow through on the build.

### Time blocking forced progress that self-directed learning never would
Multiple participants noted that having calendar-protected build sessions was essential. Without them, client work would have consumed the time. The structure was the product — the tools were secondary.

### The showcase created a forcing function for completion
Demo Day (3-minute demo + 2-minute Q&A) served as the finish line. Without it, "in progress" would have been the permanent state for most projects. The format also created genuine pride — the closing ceremony transcript is full of energy and genuine celebration.

### Low-pressure framing removed the fear barrier
"We're all just hacks" as a cultural framing was repeatedly cited. Participants who had never written a line of code shipped functional, publicly-accessible web apps. The permission structure — no experts expected, personal projects encouraged, progress over perfection — was the core unlock.

---

## 2. Pain Points and Friction — Where Participants Struggled

### Design direction to AI is genuinely hard
This was the single most consistent friction point across reflections. Creatives who communicate visually struggled to translate their design instincts into text prompts.

- Sena Lauer: *"Giving design direction to AI is hard."*
- Chris Hunter: *"My visual process doesn't always translate to a text-based one."*
- Callen Fulbright: *"How easy it is! But also how terrible the design features are."*
- Joe Moore: *"Don't underestimate the UI. I went in focusing on low-level logic, but the real power is bridging the gap between a rough idea and a polished aesthetic."*

The workaround participants discovered: reference existing websites as design anchors. Adam Simons: *"Giving Lovable reference websites is a really good method to getting closer to a look and style you're going for."* This is currently an undocumented tribal knowledge — it should be a documented, upfront technique.

### Scoping was a recurring failure mode
AI's enthusiasm for feature suggestions created over-scoping. Multiple participants started with tight ideas and watched them balloon.

- Christina Williams: *"The main challenge is staying focused on your original idea, because AI offers so many incredible ideas that it's easy to keep adding to it."*
- Kelsea Rothaus: *"Take your original idea and make it way more simple — have a clear vision of your end goal. Your project will grow naturally anyways."*
- Monica Elliott noted significant UI glitches once complexity increased — technical debt from feature creep, not just scope creep.

### Starting without a plan was the most commonly cited regret
Nearly every participant who reflected on what they'd do differently mentioned wanting more planning before the first prompt.

- Callen Fulbright: *"I would have preferred to have a more detailed roadmap from the start."*
- Nick Murto: *"About the planned feature, so the agent doesn't just start building right away."*
- Sena Lauer: *"I would have spent a bit more time planning elsewhere or using the planning feature."*
- Kelsea Rothaus: *"Getting started is the hardest part. Having a super clear process documentation and continuing to only point to that would help improve focus."*

### ZERO.Prmptr was praised but underused
The tool was mentioned positively — Kelsea: *"Zero Prompter was so cool!"* — but a key question was left unanswered in the room: *"How do we tell Lovable how to use that to get started building my project?"* The handoff between documentation and building was not clearly established. ZERO.Prmptr generated docs; participants didn't always know what to do with them.

### Tool overwhelm was real, especially early
The combination of Lovable + IdeaLab + ZERO.Prmptr + Slack felt like a lot to navigate simultaneously. The playbook lists "tool overwhelm" as a key challenge. Eiser didn't realize the event could involve a personal passion project until after the fact — a communication gap in the kickoff framing.

### Lovable's native design limitations frustrated experienced designers
This is a genuine platform constraint, not a training issue. Creatives who are accustomed to precise visual control found the text-to-UI translation lossy. This is the gap that Hacksathon.com has an opportunity to bridge with better design direction tooling.

---

## 3. Patterns from the Reflection Data — Grouped by Theme

### Theme A: Universal Accessibility Surprise (13/13 participants)
Without exception, every participant expressed surprise at how accessible the experience was. This was the dominant emotional note across all reflections.

Representative quotes:
- *"Really surprised me to see how actually doable it is to go from idea to MVP."* — Adam Simons
- *"I hardly had to do anything manually!"* — Alliyah Evans
- *"How easy it was to bring my idea to life with Lovable."* — Eiser
- *"It's not even close to as daunting as it seems."* — Chris Hunter
- *"Honestly, how easy/fun it was! Which I know was the point."* — Sena Lauer

**Product implication:** The emotional journey from intimidation to surprise is the core value proposition. Hacksathon.com's onboarding must be designed to maximize this "I can't believe I just did that" moment as early as possible.

### Theme B: The "Just Start" Imperative (11/13 participants)
The most common advice given to hypothetical future participants was some variation of "just start." This advice was offered by people who had been nervous themselves — making it earned, not patronizing.

Representative quotes:
- *"Just start! And refine."* — Callen Fulbright
- *"Just jump in. It's not even close to as daunting as it seems."* — Chris Hunter
- *"It just starts with a small idea! Don't overthink it."* — Alliyah Evans
- *"Just go for it. Even if you have a half-baked idea, AI can help you figure out the direction."* — Joe Haeger
- *"Don't be afraid to jump in."* — Nick Murto

**Product implication:** The platform needs a "minimum viable first prompt" onboarding pattern — something that gets a participant to their first live output within the first session, before doubt sets in.

### Theme C: Collaboration Over Replacement (8/13 participants)
Multiple participants specifically reframed their relationship with AI from "tool" to "partner" or "collaborator" over the course of the event.

Representative quotes:
- *"Treat it like a conversation, not a one-shot task."* — Alliyah Evans
- *"Think of AI as your new partner in crime."* — Alliyah Evans
- *"AI isn't just for speeding things up — it actually expands what I can create."* — Alliyah Evans
- *"You don't have to choose between being a designer or a developer — you can be a product architect."* — Joe Moore
- *"Framing these tools to enhance vs. replace our capabilities would help."* — Eiser

**Product implication:** Language and framing in the platform UI matters enormously. "Your AI partner" not "AI tool." The mindset shift is part of the product.

### Theme D: Creative Unlocking Beyond the Event (9/13 participants)
Most participants left with new ideas they wanted to pursue — the event created ongoing creative momentum, not just a one-time output.

Representative quotes:
- *"I have a ton more ideas I want to try!"* — Callen Fulbright
- *"I have definitely found myself thinking, 'oh I could make a solution for that' rather than 'someone should make an app for that.'"* — Sena Lauer
- *"It'll definitely open up a new avenue for problem solving."* — Chris Hunter
- *"100% yes and then some."* — Nick Murto (on pursuing new ideas)

**Product implication:** The hackathon is not just an event — it's a creative unlock that creates returning users. Post-event continuation (IdeaLab as a persistent idea bank, ZERO.Prmptr for new projects) should be a designed experience, not an afterthought.

### Theme E: Documentation as a Force Multiplier (6/13 participants)
Those who planned before prompting reported smoother builds. Those who didn't wished they had.

Representative quotes:
- *"Jotting down your plan and running it through chat or Gemini will always help kickstart your project."* — Callen Fulbright
- *"Zero Prompter was so cool! How do we tell Lovable how to use that?"* — Kelsea Rothaus
- *"The architecture I wanted to build upon — if I knew both, I may have been more successful."* — Jeremy Meltingtallow
- *"Having that working prototype was pivotal — there were details I wouldn't have thought of until I started."* — Kelsea Rothaus

**Product implication:** The Documentation block (Block 3) needs more teeth. It should be a guided, required step — not optional. ZERO.Prmptr's output should feed directly and visibly into the build tool.

### Theme F: Mixed Feelings on AI (2/13 participants)
A small but notable subset expressed lingering ambivalence — not about the tool's capability, but about the broader implications of AI.

- Monica Elliott: *"I have crazy mixed feelings about AI. On one hand, I'm perpetually excited. On the other hand, the ethical and environmental implications still linger."*
- Chris Hunter: *"I have a bit of bias against GenAI when it comes to creative final output, but it showed me that GenAI can be good for productivity and problem solving."*

**Product implication:** Hacksathon.com shouldn't over-claim. Participants who come in skeptical can be won over on the productivity/prototype axis without needing to resolve the broader ethical debate. Don't try to convert; just demonstrate.

---

## 4. What the Voting Data Reveals

### Drift's near-unanimous Best in Show win (12 of 15 votes) is a strong signal
No other project came close. Drift won 3 of 6 categories (Best in Show, Best Execution, Shut Up and Take My Money) and nearly swept the board. What made Drift different:

1. **Deeply personal emotional core** — bedtime stories for parents and children
2. **Real production quality** — 11 Labs voice narration, personalization features, hosted audio to manage API costs
3. **Obvious commercial potential** — "Shut Up and Take My Money" instinct was universal
4. **Clear problem/solution arc** — every parent in the room immediately got it

The lesson: **emotional resonance + polish + obvious utility = winner.** Not technical complexity.

### The "Shut Up and Take My Money" category is the most commercially useful data point
This category asked voters to identify the project they'd actually pay for. Results:

- Drift: 6 votes
- Analysis Paralysis Helper: 3 votes
- Travel Buddy: 2 votes
- Fetch-a-Drink, Fonda Chez-soi, Dreadlist, Frame Fuel: 1 vote each

Analysis Paralysis Helper (Side Quest) getting 3 "take my money" votes despite lower overall vote share suggests genuine utility — a focus/productivity tool has a real market. Travel Buddy's 2 votes are notable given its presentation was late in the event.

### Chris-Tron's Shark Tank Pitch win (11 of 15 votes) reveals what resonates in a pitch
Joe Moore nearly swept the pitch category. His advantages: clear problem definition (cybersecurity is scary for non-technical teams), strong visual presentation designed in Google AI Studio first, confident delivery, and a specific named audience. The pitch category is teachable — it's structure and clarity, not charisma.

### The vote spread on Most Creative Idea is instructive
Cut-up Lyric Generator won (5 votes), but Fetch-a-Drink (3 votes), Fonda Chez-soi (2 votes), and Even Grounds (2 votes) were competitive. "Creative" was interpreted broadly — not just novelty, but concept originality. The lyric generator won because it was genuinely weird and personal in a way that felt like it could only have come from Carlos.

### Most Seven2 Energy category is a proxy for culture fit
Cut-up Lyric Generator won this too (6 votes). The runner-up votes were spread across Frame Fuel, Drift, and Fetch-a-Drink. "Seven2 Energy" = creative, bold, fun, and a little unexpected. It's not the most useful product; it's the most authentic expression of who Seven2 is. This category matters for Hacksathon.com — every company running the platform will have their own version of "our energy."

---

## 5. What Participants Said About the Tools

### Lovable
**Universally praised for accessibility, criticized for design fidelity.**

- The entry-point experience was excellent — a single prompt could generate a working site
- Design output was a consistent frustration for the agency's visual professionals
- Advanced participants (Jeremy, Joe Moore) found paths around limitations (Cursor, Google AI Studio)
- Nick Murto noted that HyperChrono ultimately required Claude Opus within Cursor tied to Xcode to succeed — Lovable couldn't handle native iOS

**For Hacksathon.com:** Lovable is the right default tool for non-technical audiences. But the platform should be tool-agnostic — build the format around any vibe coding tool (Cursor, Bolt, Replit, etc.) and let organizers specify or participants choose.

### ZERO.Prmptr
**Praised in principle, underutilized in practice.**

- Kelsea Rothaus singled it out as "so cool" and wanted to know how to connect it to Lovable
- Multiple participants in the Shark Tank transcript were advised to use it for planning
- The kickoff transcript shows Nick recommending it actively
- BUT: no participant reflected on having used it effectively as their core planning tool

**Root cause:** The handoff workflow (ZERO.Prmptr output → Lovable prompt) was never explicitly taught. Participants knew it existed; they didn't know how to deploy it. This is a product gap, not a tool quality gap.

### IdeaLab
**Functional as a submission/tracking hub, underused as an AI feature platform.**

- All 32 ideas were submitted — it worked as a submission mechanism
- The Shark Tank session referenced it as the source of truth for project status
- The AI features (PRD generator, competitive analysis, alternative ideas) were not mentioned in any reflection — suggesting they weren't used or weren't discoverable

**For Hacksathon.com:** IdeaLab's AI document generation suite is genuinely valuable but needs better UX surfacing. If participants generated PRDs before the build phase, outcomes would be dramatically better.

### Google AI Studio (mentioned by Joe Moore, Sena Lauer)
**An emerging workaround for design direction.** Joe Moore's workflow — design in Google AI Studio, pull code to Lovable/Cursor — represents an advanced technique that others would benefit from knowing about. Sena Lauer mentioned wishing she'd used it more.

---

## 6. What Would Make the Next Hackathon 10x Better

### Fix #1: Make planning a mandatory, guided experience before the first prompt
The current Block 3 (Documentation) is 30 minutes and competes with excitement to start building. It needs to be restructured as a guided pre-build ritual with a clear output: a one-page project brief that becomes the first Lovable/Cursor prompt. ZERO.Prmptr's conversational flow is the right mechanism — it just needs to be required, not optional, and its output needs a clear "now do this" next step.

### Fix #2: Teach design direction as a specific skill in the kickoff
The kickoff currently focuses on mindset and tool orientation. It should add a 10-minute "how to give design direction to AI" module:
- Use reference websites as visual anchors
- Describe the feeling/vibe, not just the layout
- Iteration is normal — first outputs are starting points
- Consider design-first in Google AI Studio before Lovable

### Fix #3: Give every participant a "scope guardian" moment
Before the build phase, have each participant write their project scope as a single sentence: "This app does ONE thing: ___." The facilitator or a peer reviews it. If it contains "and" — it's too big. This saves hours of scope creep and glitch-inducing UI complexity.

### Fix #4: Make the ZERO.Prmptr → Builder handoff explicit
Create a specific "Starter Prompt" moment: after ZERO.Prmptr generates documentation, there should be a single button or template that says "Here is your first Lovable prompt. Paste this to begin." This bridges the gap Kelsea identified and activates the planning investment.

### Fix #5: Add a mid-event progress share (not just pitches and demo)
Between the Shark Tank pitch and Demo Day, there's a long build period with no structured accountability moment. A brief mid-event "show your screen for 60 seconds" check-in would surface blockers earlier, create motivation, and build community investment in each other's projects. The energy in the showcase transcripts suggests people genuinely cared about each other's work.

### Fix #6: Clarify the passion project framing in the very first message
Eiser didn't know personal passion projects were allowed until after the event. This should be the first thing participants hear — before tools, before format, before anything. "You are not building a work project. Build something you personally want to exist in the world."

### Fix #7: Create a "Design Direction" resource specifically for creatives
A one-pager (or in-platform guide) with concrete prompting techniques for visual direction:
- Reference site method
- Mood board description method
- "This feels like [brand X] but for [audience Y]" framing
- Before/after prompt examples

This addresses the single biggest friction point for a design-heavy audience.

### Fix #8: Structured post-event continuation path
The event created significant creative momentum — 9 of 13 reflectors said they had ideas they wanted to pursue. But there was no designed "what's next." A post-event continuation path (keep building in IdeaLab, shared showcase page, monthly check-in on project status) would convert the event from a one-time experience into an ongoing capability shift.

---

## 7. The Most Powerful Quotes — For Marketing and Case Study Use

### The "Anyone Can Do This" Category
> *"Hacks-a-thon definitely proved that anyone can make an app or website using current AI and vibe coding platforms."* — Adam Simons

> *"I realized that AI isn't just for speeding things up — it actually expands what I can create."* — Alliyah Evans

> *"How easy it was to go from having an idea to something tangible and (for the most part) working."* — Chris Hunter

> *"I have definitely found myself thinking, 'oh I could make a solution for that' rather than 'someone should make an app for that.'"* — Sena Lauer

### The Mindset Shift Category
> *"You don't have to choose between being a designer or a developer — you can be a product architect."* — Joe Moore

> *"It makes it feel more approachable. I use AI for project management daily but the design/development tasks are actually just as easy."* — Callen Fulbright

> *"My process shifted from function-first to experience-first."* — Joe Moore

> *"I would make a great client — the prompts I gave Lovable felt like a client + agency relationship."* — Eiser *(self-aware and funny — great for social content)*

### The "Just Start" Category
> *"Just start! And refine."* — Callen Fulbright *(most distilled version)*

> *"Don't be afraid to jump in and know that you might throw away the first amount of work you did, but you learned something along the way."* — Nick Murto

> *"Treat it like a conversation, not a one-shot task; you can keep building on top of what AI gives you!"* — Alliyah Evans

### The Surprise Category (highest emotional impact)
> *"How much fun everybody else had."* — Nick Murto *(on what surprised him most — deeply human, unexpected from the organizer)*

> *"I hardly had to do anything manually! I was expecting to tweak more myself with design aspects, but it was so seamless."* — Alliyah Evans

> *"A simple idea turned into a complex design. There were many details I wouldn't have thought of until I started designing within the working prototype. Having that was pivotal."* — Kelsea Rothaus

### The Institutional Impact Category
> *"Taking time away from regular work felt like a stretch, but the experience provided great insight into using AI intentionally."* — (unnamed participant, Awards transcript)

> *"This unlocks a new layer of creative independence."* — from the Playbook

> *"The things I want are all doable."* — Nick Murto *(on what he discovered about his own creative process)*

---

## Key Metrics Summary — For Case Study Use

| Metric | Value |
|---|---|
| Participants | ~22 |
| Ideas submitted | 32 |
| Completed projects (live URL) | 14 |
| Completion rate | ~64% |
| Participants with coding experience | ~2 (Nick, Jeremy — everyone else non-technical) |
| Reflection submissions | 13 |
| Award votes cast | 90 |
| Best in Show margin | 12 of 15 votes (80%) |
| Participants wanting to continue building | 9 of 13 (69%) |
| Event duration | ~6 weeks, part-time |
| Time per session | 30–45 minutes |

---

## What This Means for Hacksathon.com — Top 5 Product Implications

1. **The format IS the product.** The time-blocked, low-pressure, passion-project structure is what produced the outcomes. Every feature should serve the format, not distract from it.

2. **The emotional arc is the key metric.** Intimidation → Permission → First output → Surprise → Pride → "I have more ideas." Design the platform to maximize each transition point.

3. **Planning before prompting is the highest-leverage intervention.** The gap between participants who planned and those who didn't is measurable in project quality and participant satisfaction. Make planning unavoidable.

4. **Design direction is the unsolved problem for creative teams.** Every technical tool assumes text-first communication. Creative teams think visually. The platform that solves design direction will win the creative-agency audience.

5. **Post-event is an untapped opportunity.** 69% of participants wanted to keep building. No one captured that momentum. A designed "what's next" path converts a one-time event into a recurring capability — and a recurring revenue stream.

---

*End of Session 1: Learnings Synthesis*
*Next: Session 2 — Product Vision & Positioning*
