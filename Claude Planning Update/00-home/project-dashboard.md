# Project Dashboard

Status: Living
Version: 1.10.0
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

Six pages complete and locked pending the cohesion pass: Homepage, The Program, How It Works, Built For, Pricing, and Resources (structure and page copy; content fills in on the roadmap). Next phase: About, then the Seven2 Case Study, then the cohesion pass.

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

Draft the About page. Per website-structure.md: tell the founder story (Nick's journey into AI, the tools he built before Hacks-a-Thon, why he believes every employee should feel empowered to create, and the origin of Hacks-a-Thon). Resolve the standing open question of how much Seven2 story lives on About versus the Case Study. Sources: transformation-story.md, founder-notes.md, company-foundation.md.

After About: the Seven2 Case Study (note: a case study already exists on the live site; likely adopt-and-polish rather than from-scratch, same pattern as Pricing), then the site-wide cohesion pass.

Important guardrails (apply site-wide):

- Do not imply Hacks-a-Thon makes people AI masters.
- Do not imply every outside AI creation platform is included.
- Avoid all-inclusive framing.
- Approachable for mixed-experience teams.

Other notes:

- GitHub push pending: Nick will sync later today (staging commands are in the 2026-07-06 chat; GitHub Desktop is the friendlier route).
- Live-site corrections for Nick remain listed in pricing-page.md.
- Interactive demos to be built in Arcade. Not yet created.
- "Spring 2026" placeholder in session-1-learnings-synthesis.md still awaits Nick's actual event dates.

## Open Questions

- How much of the Seven2 story should appear on About versus Seven2 Case Study. (To resolve during About drafting.)
- Whether the homepage should include a lightweight pricing teaser or keep pricing entirely separate.
- Purpose of the `murtopia/hacks-a-thon` repo (Nick to confirm when relevant).
- Actual Seven2 event dates, to replace the "spring 2026" placeholder in session-1-learnings-synthesis.md.

Resolved 2026-07-06: final self-service CTA language for The Program page. Pricing framing (transparency over comparison). Resources prioritization (locked launch roadmap and post-launch order in resources.md).

## Change History

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
