# Project Dashboard

Status: Living
Version: 1.13.0
Last Updated: 2026-07-06 CDT
Last Updated By: Nick + Claude

Purpose:
Tracks the current project phase, locked documents, working documents, research documents, and next task.

Source of Truth:
Claude Planning Update (local)

Depends On:
- 00-home/project-summary.md
- DOCUMENT_INDEX.md
- WORKFLOW.md

Used By:
- Future planning sessions
- Session recovery
- Project status review

Lock Status:
Locked sections:
- Documentation workflow requirement

Working sections:
- Current Phase
- Next Task
- Open Questions

Next Review:
When the How It Works page enters active drafting.

---

## Current Phase

ALL EIGHT PAGES COMPLETE AND LOCKED, now including five audit-accepted revisions from the external ChatGPT audit (triaged 2026-07-06). The copy mission's final step is the site-wide cohesion pass.

### External Audit Rulings (2026-07-06)

A 21-section ChatGPT audit of the full-site export was triaged with Nick. Accepted (all applied): the homepage Seven2 proof strip, the "Couldn't we just run our own hackathon?" Pricing FAQ, the What Seven2 Proved bullets on the Case Study, the After Purchase mini-flow on Pricing, and the extended Let's Talk line. Deferred to the cohesion pass as watch-items: repetition of confidence/creation language across Home and How It Works; a possible one-line product clarifier near the homepage hero (Nick's call); About page implementation notes (mid-page CTA, pull quote treatment). Rejected with reasons: broadening Built For with corporate/HR/ops sections (violates the proof-gated vertical rule; revisit when customer proof exists), value-comparison framing on Pricing (deliberately retired), and any guarantee language (never invent promises). Audit files archived in 02-website/. Do not re-litigate these rulings on future audits without new evidence.

## Workspace Status

Source of truth: Claude Planning Update folder (local, edited by Claude via the Filesystem extension).

### Workspace Map (added 2026-07-06)

The Hacksathon.com project folder contains several sibling folders. Only one is current. Provenance verified by file dates on 2026-07-06.

| Folder | Era | Role |
|---|---|---|
| `Claude Planning Update` | Current (July 2026) | THE source of truth for all copy and planning work. The only folder that gets written to. |
| `Claude Planning Docs` | April 2026 | Product-build era strategy and specs (sessions 1-6, master strategy, PRDs, pricing strategy, market research, design system, implementation specs). Historical. Fact-check resource only; never copy direction. |
| `ChatGPT Planning Docs` | Pre-repo | One old messaging guide docx. Historical. |
| `strategy-inputs` | Months old | Raw product-planning inputs (transcripts, Slack/Supabase exports). Historical. |
| `Hacks-a-Thon Obsidian` | Late June 2026 | Mostly superseded, BUT it held the locked homepage copy (homepage-copy-v1.md, created 2026-06-29), which never reached the GitHub repo. Recovered into 02-website/homepage-copy.md on 2026-07-06. Now fully superseded. |
| `hacksathon-app`, `src` | Current | Product source code. Nick builds in Cursor. Copy sessions read, never write. |
| `Reference Files`, `Hacks Art Files` | Mixed | Assets and references. |

Correction to the 2026-07-05 session record: the Obsidian folder was recorded as "4 outdated files, fully superseded." That was wrong; it contained the locked homepage copy. Now recovered, so the folder is truly superseded as of 2026-07-06.

GitHub repos:
- `murtopia/hacksathon-com` holds the original planning folder from the ChatGPT sessions. Now a backup. Nick syncs manually when desired.
- `murtopia/hacks-a-thon` was noted in the 2026-07-04 session export as the implementation repo. Purpose to be confirmed by Nick. Not needed for copy work.

## Documentation Workflow Requirement

Before meaningful work, read:

- `WORKFLOW.md`
- `DOCUMENT_INDEX.md`
- `company-foundation.md`
- `00-home/project-summary.md`
- `00-home/project-memory.md`
- `00-home/project-dashboard.md`
- `00-home/session-notes.md`
- `01-messaging/core-messaging-principles.md`
- `01-messaging/messaging-guide.md`
- `02-website/the-program.md`

## Locked Documents

- Company Foundation
- Participant Journey
- Brand Principles
- Hacks-a-Thon Flywheel
- Core Beliefs
- Core Messaging Principles
- Workflow

## Working Documents

- Messaging Guide
- Transformation Story
- Website Structure
- The Program
- How It Works
- Built For
- Pricing Page
- Resources Strategy
- About
- Seven2 Case Study

## Locked Pages

- Homepage. Considered locked as of 2026-07-05. The locked copy itself was recovered on 2026-07-06 and now lives in 02-website/homepage-copy.md (it was previously only in the Obsidian folder). Verify against the live site during the cohesion pass. Revisit only for the final cohesion pass.
- The Program. Locked 2026-07-06 (v1.0.0). All six sections locked: Hero, What You Get, How Long Will This Take?, Born Inside a Real Agency, See It For Yourself, Final CTA. Revisit only during the final cohesion pass. The Component Reference inside the-program.md stays living.
- How It Works. Locked 2026-07-06 (v1.0.0). All six sections locked: Hero, Why Training Isn't Enough, Ownership, Confidence, Culture, CTA. Built on the Awareness / Ownership / Confidence / Culture arc. Revisit only during the final cohesion pass.
- Built For. Locked 2026-07-06 (solutions-overview.md v1.0.0). Lean one-pager instead of a vertical menu: Hero ("Built for the teams nobody calls technical"), Your Organization, Marketing & Creative Agencies (the launch-market section), and a Sound Like Your Team? CTA. Future verticals are proof-gated on the roadmap. agencies-solution-page.md archived via consolidation.
- Pricing. Locked 2026-07-06 (pricing-page.md v1.0.0). Live page structure adopted as locked copy, plus a new Why One Flat Price section and a time-commitment FAQ. Comparison framing (consultants, failed training) retired. Two live-site corrections pending Nick's Cursor pass: IdeaLab sparks/comments claim removed, chat integration reworded to chat link.
- Resources. Locked 2026-07-06 (resources.md v1.0.0). Public name Resource Library; four problem-based doors (getting started / leading a team / want to create / want proof) plus an AI Field Notes feed that doubles as the X/LinkedIn content engine. Eight-article launch roadmap; pillars are internal taxonomy only; ungated at launch; templates are the first post-launch gated addition. Launch-viable with the Seven2 story, a few field notes, and 1-2 anchor articles.
- About. Locked 2026-07-06 (about.md v1.0.0). First-person founder story: More Ideas Than Time hero, the agency years, Been Watching's five-year limbo, the vibe-coding unlock (Tony Rosland credited, HyperChrono's three deaths before the App Store), the tools-nobody-used insight, and the aha. Resolves the About-vs-Case-Study split: About carries the why with two event paragraphs; the Case Study carries the full Seven2 story. Raw origin story preserved in founder-notes.md.
- Seven2 Case Study. Locked 2026-07-06 (case-study.md v1.0.0). The live /seven2 Public Showcase adopted as the foundation (the product demonstrating itself), wrapped in a four-section narrative layer: Every Single Person Shipped opener with stat band (19/19, 100%, ~2.5 weeks, 0 facilitators), The Setup, How It Ran ("Steal it"), a one-line recap reframe, and What Happened After. Verified numbers established in proof.md; the synthesis doc's 22/14/64% corrected. Implementation checklist for Nick in case-study.md.

## Research Documents

- Participant Reflections
- Participant Insights
- Proof
- Founder Notes
- Market Notes
- Moments That Matter
- Project Memory

## Recovery Documents

- Workflow
- Document Index
- Changelog
- Session Notes
- Project Dashboard
- Project Summary
- Project Memory

## The Program Progress

Complete. All six sections locked as of 2026-07-06: Hero, What You Get, How Long Will This Take?, Born Inside a Real Agency, See It For Yourself, Final CTA. The Final CTA is "Your team already has the ideas." with Buy Your Hacks-a-Thon primary (matches the product's buy flow language) and See Pricing secondary. Component deep dives were cut and Playbook removed (not a real deliverable). The Component Reference remains a living factual source.

## Next Task

The site-wide cohesion pass, the final step of the copy mission. Read all eight locked pages together and check:

- Voice consistency (plain, confident, conversational; no em dashes; no corporate speak).
- CTA chain integrity (homepage → How It Works → The Program → Pricing/Buy; Built For and Resources feeding in; Case Study links everywhere resolving to /seven2).
- Product naming consistency (the IdeaLab, Blueprint, Hacky Helper, Shark Tank Minus the Sharks, Showcase Showdown, Hacky Awards, Reflections, Public Showcase; ten blocks everywhere).
- Verified facts only (19/19, 100%, ~2.5 weeks, spring 2026, $995 model).
- No cross-page punchline duplication (e.g., costumes live on The Program; the pizza line on Pricing).
- Homepage verified against the live site.
- Audit watch-items: confidence/creation repetition across Home and How It Works (vary supporting language where cheap); possible one-line product clarifier near the homepage hero (Nick's explicit call); proof-strip placement check now that it exists.

Nick's implementation to-dos (Cursor), independent of the cohesion pass:

- Case Study: apply the narrative layer per the checklist in case-study.md (now includes the What Seven2 Proved bullets); restore the Hacky Awards and Reflections blocks on /seven2.
- Pricing: apply the live-site corrections in pricing-page.md (now eight items, including the DIY FAQ, After Purchase flow, and Let's Talk extension).
- Homepage: add the Seven2 proof strip after The Problem section.
- Build the remaining locked pages that don't exist live yet (The Program, How It Works, Built For, Resources, About).
- Arcade demos (admin + participant) once copy implementation settles.
- GitHub sync to capture Resources, About, and Case Study docs (post-Resources work is local-only).

## Open Questions

- Whether the homepage should include a lightweight pricing teaser or keep pricing entirely separate. (Candidate for the cohesion pass.)
- Purpose of the `murtopia/hacks-a-thon` repo (Nick to confirm when relevant).

Resolved 2026-07-06: final Program CTA. Pricing framing. Resources prioritization. About-vs-Case-Study split. Event dates (spring 2026 is the official public phrasing by Nick's choice; no specific days). Verified pilot numbers (19/19, 100%). The /seven2 redirects (deliberate).

## Change History

### v1.13.0
- External audit triaged: five accepted items applied across homepage-copy.md (v1.3), pricing-page.md (v1.1.0), case-study.md (v1.1.0), and the regenerated export. Rulings recorded; watch-items added to the cohesion pass checklist.

### v1.12.0
- Seven2 Case Study locked (case-study.md v1.0.0). ALL EIGHT PAGES NOW LOCKED. Verified pilot numbers (19/19, 100%) established in proof.md; synthesis doc corrected; spring 2026 confirmed as official phrasing; /seven2 redirects confirmed deliberate. Next: the cohesion pass.

### v1.11.0
- About page complete and locked (about.md v1.0.0); About-vs-Case-Study open question resolved.
- GitHub push completed. Next task set to the Seven2 Case Study, the final page.

### v1.10.0
- Resources page structure and copy locked (resources.md v1.0.0); Resources-prioritization open question resolved.
- Next task set to the About page. GitHub push noted as pending later today.

### v1.9.0
- Pricing page complete and locked (pricing-page.md v1.0.0); pricing-framing open question resolved.
- Live-site correction list recorded; Component Reference extended with platform facts from the live pricing page.
- Next task set to Resources structure.

### v1.8.0
- Built For page complete and locked (solutions-overview.md v1.0.0); agencies-solution-page.md archived via consolidation.
- Next task set to the Pricing page.

### v1.7.0
- How It Works page complete and locked at v1.0.0 (all six sections).
- Next task set to the Built For pages.

### v1.6.0
- Added the Workspace Map with folder provenance, verified by file dates.
- Corrected the 2026-07-05 Obsidian record and noted the homepage copy recovery into homepage-copy.md.

### v1.5.0
- The Program page complete: Final CTA locked, page locked at v1.0.0 pending cohesion pass.
- Added The Program to Locked Pages.
- Next task set to the How It Works page.
- Resolved the final self-service CTA open question; added the Seven2 event dates question.

### v1.4.0
- What You Get locked in chronological form; Playbook removed; Public Showcase added.
- Section sequence revised and re-locked at 6 sections.
- Three new sections locked: How Long Will This Take?, Born Inside a Real Agency, See It For Yourself.
- Next task set to the Final CTA, then full-page lock.

### v1.3.1
- Section name confirmed as What You Get. Working draft v1 saved to the-program.md, grouped into organizer and team experiences with the organizer group first.
- Section 10 renamed from Recap to Reflections.

### v1.3.0
- Moved source of truth to the local Claude Planning Update folder.
- Recorded homepage as locked pending a final cohesion pass.
- Renamed the next section from Everything Included to What's Inside the Program (working title) and captured why the all-inclusive framing was rejected.
- Added the tie-every-component-back-to-AI-confidence goal from the 2026-07-04 session.
- Noted the two GitHub repos and their roles.

### v1.2.0
- Updated current phase to The Program page.
- Recorded The Program hero as locked.
- Set Everything Included as the next task.
- Added guardrails around AI confidence, mixed-experience teams, and outside AI creation tools.

### v1.1.0
- Added metadata header.
- Added documentation workflow requirement.
- Updated current phase.
- Standardized working docs around The Program, How It Works, and Built For.
- Added participant reflections to research documents.

### v1.0.0
- Initial project dashboard.
