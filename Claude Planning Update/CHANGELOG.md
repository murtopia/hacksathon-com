# Changelog

Status: Living
Version: 1.9.0
Last Updated: 2026-07-06 CDT
Last Updated By: Nick + Claude

Purpose:
Tracks meaningful changes to the Hacks-a-Thon planning workspace.

Source of Truth:
Claude Planning Update (local)

Depends On:
- WORKFLOW.md
- DOCUMENT_INDEX.md

Used By:
- Future planning sessions
- AI collaborator recovery
- Project milestone review

Lock Status:
Locked sections:
- Changelog format

Working sections:
- Current entries

Next Review:
Every meaningful planning save.

---

## 2026-07-06

### Added

- Created and locked 02-website/resources.md (v1.0.0): the Resource Library. Strategy locked: problem-based doors instead of media-type categories (I'm just getting started / I'm leading a team / I want to create / I want proof), pillars as internal taxonomy only, AI Field Notes hosted on Hacksathon.com as the X/LinkedIn content engine (Nick's call: distribution and backlinks belong on the domain that sells), ungated at launch, launch-safe scope. Page copy locked including the contextual footer CTA "See How the Hacks-a-Thon Works" for visitors arriving from outside links. Eight-article launch roadmap plus Field Notes cadence; templates slotted as the first post-launch gated addition; ChatGPT brain-dump ideas absorbed with the nonexistent-Playbook reference corrected. Sixth locked page.
- Completed and locked the Pricing page (02-website/pricing-page.md v1.0.0). Live page structure adopted as locked copy, plus a new Why One Flat Price section (whole-team rationale, ~$40/person, the pizza line) and a new How Much Time Does This Take? FAQ. Corrections applied: IdeaLab sparks/comments claim removed (feature doesn't exist), team chat integration reworded to team chat link. Comparison framing (consultants, failed training) retired in favor of transparency. Live-site correction list recorded for Nick's Cursor pass. Fifth locked page of the site.
- Added Additional Platform Facts to the Component Reference in the-program.md from the live pricing page (starter prompt tuned to build tool, branded invites, awards slideshow, vanity URLs, custom branding, chat-link accuracy note, no-sparks/comments note).
- Completed and locked the Built For page (02-website/solutions-overview.md v1.0.0). Strategy decision: a lean one-pager instead of a vertical menu, since a Built For section is only as credible as its thinnest entry. Sections: Hero ("Built for the teams nobody calls technical"), Your Organization, Marketing & Creative Agencies (launch-market section covering agency reality, the creative-skeptic dynamic, the client-facing business case, the post-event AI-first shift, and the whole-agency culture play), and a Sound Like Your Team? CTA (See How It Works primary, Read the Seven2 Story secondary). Future verticals preserved as a proof-gated roadmap. Fourth locked page of the site.
- Created and completed 02-website/how-it-works.md. All six sections locked (v1.0.0): Hero ("Confidence isn't taught. It's built."), Why Training Isn't Enough, Ownership, Confidence (carries the block-timeline visual), Culture, and CTA (See What's Included primary, See Pricing secondary, handing visitors to The Program). Page structure is the Awareness / Ownership / Confidence / Culture arc from website-structure.md. Third locked page of the site.
- Locked the Final CTA for The Program page: "Your team already has the ideas." with Buy Your Hacks-a-Thon primary (matching the product's buy flow language) and See Pricing secondary.
- Added Confirmed Pricing Facts to 02-website/pricing-page.md from product and site screenshots: $995 flat for up to 25 people, $30 per additional up to 50, Let's talk beyond 50, one-time not recurring, Stripe checkout, build-tools-not-included disclosure.
- Locked the What You Get section of The Program page. Now a single chronological list matching the event arc, ending with the Public Showcase.
- Added and locked three new Program page sections: How Long Will This Take?, Born Inside a Real Agency, and See It For Yourself.
- Added Public Showcase and The Blocks schedule model (ten blocks, 15 to 60 minutes each, admin-scheduled, repeatable pitch/build/showcase sessions) to the Component Reference in the-program.md, confirmed via product screenshots.

### Updated

- Recovered the locked homepage copy. It was written 2026-06-29 during the ChatGPT sessions but saved only to the Obsidian folder (homepage-copy-v1.md) and never reached the GitHub repo, so the 2026-07-05 mirror missed it. Consolidated into 02-website/homepage-copy.md (now v1.2, Locked). Verify against the live site during the cohesion pass.
- Added a Workspace Map to the project dashboard documenting all sibling folders and their provenance (verified by file dates): Claude Planning Update is current; Claude Planning Docs (April 2026), ChatGPT Planning Docs, and strategy-inputs are historical product-era work; the Obsidian folder is now truly superseded.
- Corrected the 2026-07-05 record that called the Obsidian folder "4 outdated files, fully superseded."
- The Program page is complete and locked at v1.0.0, pending only the site-wide cohesion pass. Second locked page of the site, after the homepage.
- Corrected the six-week duration in Claude Planning Docs/session-1-learnings-synthesis.md to about 2.5 weeks in all three places it appeared. "Spring 2026" is a placeholder pending Nick's actual event dates.
- Revised and re-locked The Program section sequence from 11 sections to 6, with Nick's explicit approval. Component deep dives, Participant Experience, and Interactive Demos removed as standalone sections.
- Removed Playbook everywhere on The Program page. Nick confirmed it is not a real deliverable, only an earlier concept for the admin tooling.
- Interactive demos plan: to be built in Arcade (arcade.software) as click-through walkthroughs, embedded in See It For Yourself and reusable as conversion links elsewhere.
- Next task is now the How It Works page.

### Archived

- agencies-solution-page.md, consolidated into solutions-overview.md per Rule 11. Reopen only if agencies later warrant a standalone vertical page.

## 2026-07-05

### Added

- Created the Claude Planning Update folder as the new local source of truth, mirroring all 46 planning docs from GitHub.
- Added WORKFLOW.md Rule 11: favor consolidation over creating new planning documents.
- Added the tie-every-component-back-to-AI-confidence goal to the What's Inside section guardrails.

### Updated

- Moved source of truth from GitHub to the local Claude Planning Update folder. Nick handles git syncs manually.
- Collaboration handoff from ChatGPT to Claude via the Filesystem extension.
- Renamed the next Program page section from Everything Included to What's Inside the Program (working title). All-inclusive framing rejected because buyers still need an outside build tool such as Lovable.
- Recorded homepage as locked pending a final cohesion pass after remaining pages are written.
- Noted `murtopia/hacks-a-thon` as a referenced implementation repo, purpose to be confirmed.

### Archived

- The Hacks-a-Thon Obsidian planning folder (4 outdated files) is fully superseded by Claude Planning Update.

## 2026-06-30

### Added

- Created `planning/WORKFLOW.md` to define the documentation and Git workflow.
- Created `planning/DOCUMENT_INDEX.md` to track planning documents, status, versions, and purpose.
- Created `planning/CHANGELOG.md` as the project-wide change record.
- Added full participant reflections as `planning/06-research/participant-reflections.md`.

### Updated

- Standardized website architecture around `The Program` instead of `Platform`.
- Updated project recovery documents to reference the documentation system.
- Updated The Program page document path and direction.
- Locked The Program hero section.
- Refined The Program promise around AI confidence instead of AI mastery.
- Clarified that Hacks-a-Thon works for mixed-experience teams, from first-time AI users to experienced developers.
- Added guardrails to avoid implying that every outside AI or vibe coding platform is included.

### Archived

- Replaced `planning/02-website/platform-page.md` with `planning/02-website/the-program.md`.

## Change History

### v1.9.0
- Added the Resources completion entry.

### v1.8.0
- Added the Pricing completion entry and the Component Reference platform-facts addition.

### v1.7.0
- Added the Built For completion entry and the agencies-page consolidation.

### v1.6.0
- Added the How It Works completion entry.

### v1.5.0
- Added the homepage copy recovery and Workspace Map entries.

### v1.4.0
- Extended the 2026-07-06 entry: Final CTA locked, The Program page locked at v1.0.0, pricing facts captured, six-week duration corrected on disk.

### v1.3.0
- Added the 2026-07-06 Program page entry: What You Get locked, sequence revised to 6 sections, Playbook removed, three new sections locked.

### v1.2.0
- Added the 2026-07-05 workspace transition entry.
- Updated metadata for the local source of truth.

### v1.1.0
- Added The Program hero lock.
- Added positioning guardrails around AI confidence, mixed-experience teams, and outside AI creation tools.

### v1.0.0
- Created project changelog.
- Added first dated project entry.
