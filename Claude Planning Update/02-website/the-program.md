# The Program

Status: Locked (pending final cohesion pass at end of project)
Version: 1.0.0
Last Updated: 2026-07-06 CDT
Last Updated By: Nick + Claude

Purpose:
Defines the page that explains what a customer is buying when they buy Hacks-a-Thon. This document is the canonical product definition.

Source of Truth:
Claude Planning Update (local)

Depends On:
- company-foundation.md
- 01-messaging/core-messaging-principles.md
- 01-messaging/messaging-guide.md
- 02-website/website-structure.md

Used By:
- The Program page
- Sales narrative
- Self-service website flow

Lock Status:
Locked sections:
- Page Purpose
- Page Job
- Section Sequence (revised and re-locked 2026-07-06)
- Hero / Program Overview
- What You Get
- How Long Will This Take?
- Born Inside a Real Agency
- See It For Yourself
- Final CTA

All six page sections are locked as of 2026-07-06. The page is complete pending the site-wide cohesion pass at the end of the project.

Working sections:
- Component Reference (living factual reference, updated as product facts are confirmed)

Next Review:
During the site-wide cohesion pass after all remaining pages are written.

---

## Page Purpose

This page answers one question clearly:

**What exactly am I buying?**

The homepage sells the belief and the transformation. The Program page explains the product.

A visitor should leave this page understanding that Hacks-a-Thon is not a loose workshop, a one-time inspirational event, or another AI training course. It is a guided, structured program that helps organizations build AI confidence by helping employees create something real.

## Page Job

Show the program in a practical, buyer-friendly way.

The page should make the offer feel concrete, packaged, and easy to understand without turning into a feature dump.

## What This Page Should Communicate

- Hacks-a-Thon is a guided AI adoption program built around employee creation.
- The customer is buying the framework, guidance, participant experience, and supporting resources to run it.
- The program supports the organizer, the participant, and the final company-wide moment.
- Personal projects are not a distraction. They are one of the fastest paths to confidence.
- The outcome is a team with more AI confidence, more momentum, and more internal proof of what AI can help people create.
- The program is useful for teams with mixed levels of AI experience, from first-time users to experienced developers.

## Section Sequence

1. Hero / Program Overview
2. What You Get (final name confirmed 2026-07-05; originally Everything Included)
3. How Long Will This Take?
4. Born Inside a Real Agency
5. See It For Yourself
6. Final CTA

Sequence revised 2026-07-06 with Nick's explicit approval (previous 11-section sequence was locked). Component deep-dive sections removed; What You Get now carries the full component story in chronological event order. Playbook removed from the page entirely: it is not a real deliverable, only an earlier concept for the admin tooling. Participant Experience and Interactive Demos removed as standalone sections; the demos live in See It For Yourself and can also be embedded elsewhere as conversion links.

## Hero / Program Overview

### Give your team the confidence to create with AI.

Hacks-a-Thon is a guided program that helps employees move from AI curiosity to hands-on confidence through creating something real.

Built around a proven framework, structured guidance, and a thoughtfully designed participant experience, Hacks-a-Thon helps organizations build AI confidence by helping employees discover new possibilities and turn ideas into real solutions.

Whether someone is opening ChatGPT for the first time or already building with AI every day, the shared experience creates new ideas, stronger collaboration, and lasting momentum across your team.

**CTA:** Explore What's Included

## Component Reference

Product facts confirmed by Nick on 2026-07-05, with product screenshots. This is the factual source for all component copy on this page. Not marketing copy.

### IdeaLab

- Where the team adds their ideas to the system.
- Becomes a shared gallery where everyone can see the ideas and projects the rest of the team is working on.
- The first step to getting an idea down on paper: just the basics and project details about what the participant wants to create.
- In-product copy reference: "Just the basics that will show up in the IdeaLab."

### Blueprint

- An AI-guided tool that helps a participant flesh out their idea.
- Asks the appropriate questions to draw out the details.
- Final output: an MD document the participant can upload to their vibe coding program, plus a starter prompt to paste in.
- Lives in step 02 of the participant's Your Idea page.
- In-product copy reference: "The one-pager you'll hand to Lovable. We'll talk it through together."
- Actions in product: View Blueprint, Download Blueprint, View Starter Prompt, Refine Blueprint.
- Strategic note: this directly closes the planning-to-build handoff gap identified in the Seven2 research (participants had planning docs but did not know how to hand them to the build tool).

### Reflections / Recap

- What the section sequence calls Recap is Reflections in the product.
- A series of guided questions participants fill out after the event, prompting them to think about their journey.
- Pre-populated defaults include: What surprised you most? What are you most proud of building or contributing? What was the hardest part? What's one thing you learned that you'll carry forward? What would you try differently next time? Anyone you want to shout out? (optional) Anything else you want to capture before you close this out? (optional)
- The admin can edit these questions and add additional ones.
- At the end, AI creates a recap summary about the entire team's experience.
- Naming resolved 2026-07-05: the public page section is called Reflections, matching product navigation. The AI recap is described inside it.

### Hacky Helper

- Part of the Event Admin experience.
- An outline of all the to-do items an admin works through to set up, run, and complete the Hacks-a-Thon.
- Organized into: Identity, Integrations, Schedule, Team, Hacky Awards, Reflections.
- Tracks done/remaining items, marks optional items, flags event-day steps, and points at what to do next.
- In-product copy reference: "Run the back-of-house. The Hacky Helper tab keeps your next step in view."

### Public Showcase

- A public, shareable page for each event at its own URL, e.g. hacksathon.com/smokeshow.
- Controlled by a toggle in Event Admin ("Show this event publicly"). Where it finally lives in the admin is still being decided by Nick.
- When on: once winners are revealed, anonymous visitors see the public showcase, including winners, every idea, the AI recap, and the block timeline. One scrollable page, no sign-in required. Before reveal, visitors see a "coming soon" teaser.
- When off: anonymous visitors see a sign-in page only. The event stays private to invited participants.
- Includes a "Preview as a visitor" link for the admin.

### The Blocks (schedule model, confirmed via product screenshots 2026-07-06)

- Ten guided blocks: ZERO Kickoff (15 min), 01 Sprint to the IdeaLab (30), 02 Shark Tank, Minus the Sharks (45), 03 Documentation Is Everything (30), 04 Here We Go! (45), 05 Build Session 2 (45), 06 Your Final Build Session (45), FINAL Showcase Showdown (60), +01 Hacky Awards (30), +02 Reflections (20).
- The admin sets the date, start time, and duration for every block, with save and add-to-calendar actions.
- Shark Tank, build sessions, and Showcase Showdown support "add another session" so the format scales with team size. Default durations fit a smallish team.
- Showcase Showdown format: each builder presents a 3-minute demo followed by 2 minutes of team Q&A.
- Shark Tank format: each builder gets one minute to pitch, followed by 1 to 2 minutes of light team feedback.
- Seven2 fact for copy: the pilot ran about two and a half weeks and could have compressed to about a week with more availability. Gaps between sessions for normal work were beneficial. This corrects the roughly-6-weeks figure that appears in session-1-learnings-synthesis.md.
- Seven2 color for future copy: the Shark Tank pitches were the most fun part of the whole experience. Team members wrote real Shark Tank-style pitch scripts and some dressed up in costumes or suits for their presentations.

### Additional platform facts (from the live pricing page, corrected by Nick 2026-07-06)

- Auto-generated Starter Prompt is tuned to the chosen build tool.
- Bring-your-own build tool: Lovable, Cursor, v0, Replit, Google AI Studio, and others. Organizer picks a default or lets participants choose during setup.
- Branded email invites and notifications.
- Auto-generated awards ceremony slideshow.
- Each event gets a vanity URL (hacksathon.com/yourteam).
- Custom branding with the company logo.
- Team chat link: a field where the admin keeps the team's Slack, Discord, or Teams URL in one place. NOT a platform integration; the team sets up their own channel. Copy should never call it an integration.
- IdeaLab does NOT have sparks or comments in the shipped version. The live pricing page claims it (correction pending); no copy should repeat the claim.
- No feature gates between team sizes.

### Participant navigation (observed in product)

Event Home, Your Idea, The Blocks, IdeaLab, Hacky Awards, Reflections.

### Admin flow highlights (observed in product)

- Awards: decide on public showcase, review award categories, optional voting auto-schedule, open voting, close voting and review, run the ceremony and publish.
- Reflections: review questions, optional auto-schedule, open reflections, mark complete, generate the AI recap, approve the recap.

## What You Get

Status: Locked 2026-07-06. Approved by Nick.

Goal:
Create a clear overview of what the customer receives, tying every component back to AI confidence, without overstating what is included. Components appear in chronological order, the arc of the event itself.

---

Hacks-a-Thon is one guided program, and every piece exists to do one thing: help your team build AI confidence by creating something real. Whether someone's writing their first prompt ever or already building with AI every day, the program meets them where they are and walks everyone through it, step by step. Here's what's inside, in the order your team will experience it.

**Admin Dashboard.** Mission control for your Hacks-a-Thon. Set up your event, invite your team, schedule the blocks, and watch progress roll in. The built-in Hacky Helper keeps a running checklist of every step from setup through event day, always pointing at what to do next. You don't have to be the expert in the room. The program already is.

**The IdeaLab.** Every Hacks-a-Thon starts with ideas coming out of hiding. The IdeaLab is where your team posts theirs: a shared gallery where everyone can see what everyone else is dreaming up. It's the first step from "I have an idea" to "I'm building it," and watching the gallery fill up is when your team starts to believe this is really happening.

**Blueprint.** The bridge between a rough idea and a strong first prompt. Blueprint is an AI-guided conversation that asks the right questions, helps each participant think through the details, and hands them complete project documentation plus a ready-to-paste starter prompt for their build tool. It surfaces the questions they hadn't thought to ask yet, so projects start strong instead of starting over.

**Shark Tank, Minus the Sharks.** Before the building begins, everyone gets one minute to pitch their idea to the team, followed by light, constructive feedback. No big bites. It sharpens each idea, sparks collective energy, and does something quieter but more powerful: once your team has heard your pitch, you want to finish what you started. Don't be surprised if someone shows up in costume.

**Protected build sessions.** Short, time-blocked sessions that fit around real work. No marathon weekends, no all-nighters. Protected time on the calendar is what turns "I'll get to it someday" into steady, visible progress.

**Showcase Showdown.** Demo day. Each builder gets three minutes to show what they made and two minutes of Q&A from the team. The moment "I have an idea" officially becomes "I built this."

**Hacky Awards.** The finale your team will talk about for months. Everyone votes across the award categories, then celebrates together in a click-through ceremony. Shared accomplishment is what turns one person's confidence into a team's culture.

**Reflections.** After the demos, guided questions help each participant capture what surprised them, what they're proud of, and what they'll carry forward. You can tune the questions or add your own. Then AI weaves every answer into a recap of your team's whole experience: proof of how far they came, in their own words.

**Public Showcase.** Every event gets its own page on Hacksathon.com. Flip one switch, and once winners are revealed, anyone can see your team's showcase: the winners, every idea, the AI recap. One scrollable page, no sign-in required, ready to share with leadership or the world. Prefer to keep it private? Leave the switch off and your event stays between your team.

**One thing to know:** participants build their projects in an AI creation tool like Lovable, which is separate from Hacks-a-Thon. Most have free tiers that work well for a first project, and the program is designed to work alongside whichever tool your organization chooses.

## How Long Will This Take?

Status: Locked 2026-07-06. Approved by Nick.

---

Less than you'd think. Hacks-a-Thon runs as ten guided blocks, from Kickoff to Reflections, each one a short time-blocked session between 15 and 60 minutes. You set the dates, and the program fits around your team's real workload instead of competing with it. Most teams spread the blocks across a couple of weeks. Compress it into a single week, or leave breathing room between sessions so client work never skips a beat. That time in between isn't dead air. It's where ideas simmer and confidence builds.

Bigger team? Shark Tank pitches and the Showcase Showdown can easily run as multiple sessions, so everyone gets their minute to pitch and their moment to demo.

Visual note: pair this section with the block timeline, using The Blocks layout from the product (numbered blocks, names, durations).

## Born Inside a Real Agency

Status: Locked 2026-07-06. Approved by Nick.

---

Hacks-a-Thon wasn't invented on a whiteboard. It was built and run inside Seven2, a creative agency, with a team of producers, designers, and strategists, almost none of whom had ever written code. They pitched, they built, they demoed, and they shipped real, working projects. Then something better happened: after the event ended, they kept creating.

Read the full Seven2 story →

Link target: Seven2 Case Study page.

## See It For Yourself

Status: Locked 2026-07-06. Approved by Nick.

---

The fastest way to understand Hacks-a-Thon is to see it in action.

**The Admin Experience.** Walk through setting up an event, scheduling the blocks, and running the show.

**The Participant Journey.** See what your team sees, from posting an idea to Blueprint to demo day.

Production note: demos to be built in Arcade (arcade.software), interactive click-through walkthroughs embedded on the page. Not yet created. The copy works whether they ship as click-throughs or videos. Demo links can also be embedded elsewhere on the site as conversion doorways.

## Final CTA

Status: Locked 2026-07-06. Approved by Nick.

---

### Your team already has the ideas.

Hacks-a-Thon gives them the confidence to build them. One flat price for your whole event. No subscription, no per-seat surprises.

**Primary button:** Buy Your Hacks-a-Thon
**Secondary link:** See Pricing

Notes:
- "Buy Your Hacks-a-Thon" matches the product's own buy flow language for cohesion.
- Primary button links to the buy flow; secondary links to the Pricing page.
- This resolves the long-standing open question on final self-service CTA language for this page. Homepage keeps See How It Works; The Program page closes with purchase intent.

## Notes To Protect

- Do not make this page sound like a generic software feature page.
- Keep the buyer focused on what they receive and why each part matters.
- Use “program” and “experience” more than “event.”
- Mention the hackathon format only when it helps explain the structure.
- Do not repeat the full homepage narrative.
- Do not overstate that every participant creates an AI-powered tool. Participants use AI to create projects, tools, websites, automations, workflows, prototypes, or solutions.
- Do not imply Hacks-a-Thon makes people AI masters.
- Do not imply the program includes every outside AI platform or vibe coding tool needed to participate.
- Avoid all-inclusive framing anywhere on the page.
- Tie every component back to AI confidence.
- Use AI confidence for buyer-facing language. Keep creator confidence as an internal idea to watch.

## Change History

### v1.0.0
- Locked the Final CTA ("Your team already has the ideas." with Buy Your Hacks-a-Thon primary and See Pricing secondary).
- All six sections now locked. Page complete pending the site-wide cohesion pass.
- First locked version per versioning rules.

### v0.7.0
- Locked What You Get. Reworked into a single chronological list matching the event arc: Admin Dashboard, the IdeaLab, Blueprint, Shark Tank Minus the Sharks, protected build sessions, Showcase Showdown, Hacky Awards, Reflections, Public Showcase. Organizer/team grouping dropped in favor of chronology per Nick.
- Removed Playbook from the page and the section sequence. Nick confirmed it is not a real deliverable. Its "you don't have to be the expert" spirit moved into the Admin Dashboard blurb.
- Revised and re-locked the Section Sequence to 6 sections with Nick's approval. Component deep dives, Participant Experience, and Interactive Demos removed as standalone sections.
- Added and locked three new sections: How Long Will This Take?, Born Inside a Real Agency, and See It For Yourself.
- Added Public Showcase and The Blocks schedule model to the Component Reference, confirmed via product screenshots.
- Corrected the Seven2 duration fact: about two and a half weeks, not six.
- Deleted the leftover standalone important note; the One thing to know paragraph covers it.

### v0.6.0
- Saved the What You Get working draft into this document.
- Regrouped the section into organizer and team experiences, with the organizer group first per Nick.
- Merged the structured-program and Participant Experience bullets into the team group opener.

### v0.5.1
- Renamed section 10 from Recap to Reflections, matching product navigation. Approved by Nick.
- What You Get draft being regrouped into participant experience and organizer experience.

### v0.5.0
- Confirmed What You Get as the section name.
- Added Component Reference with product facts for IdeaLab, Blueprint, Reflections/Recap, and Hacky Helper, confirmed by Nick with product screenshots.
- Flagged the Recap vs Reflections naming question.

### v0.4.0
- Renamed the working section from Everything Included to What's Inside the Program (working title) and recorded why all-inclusive framing was rejected.
- Added tie-every-component-back-to-AI-confidence to the goals and Notes To Protect.
- Marked this document as the canonical product definition per the consolidation philosophy.
- Updated metadata for the local source of truth.

### v0.3.0
- Locked Hero / Program Overview.
- Refined promise around AI confidence instead of AI mastery.
- Clarified that the program works for mixed-experience teams, from beginners to experienced AI users and developers.
- Replaced overclaiming language around complete tools with framework, guidance, participant experience, and supporting resources.
- Added note that outside AI creation platforms, such as Lovable, may still be needed.

### v0.2.0
- Renamed canonical page direction from Platform to The Program.
- Added metadata header.
- Preserved initial page purpose, section sequence, and draft hero overview.

### v0.1.0
- Initial working draft.
