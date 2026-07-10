# Changelog

Status: Living
Version: 1.14.0
Last Updated: 2026-07-07 CDT
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

## 2026-07-07

### Updated

- COPY MISSION COMPLETE: the site-wide cohesion pass was run, ruled on by Nick in one batch, and applied. Claude read all eight locked pages as one site against the dashboard checklist and the audit watch-items, fetched the live homepage for comparison, and delivered severity-grouped findings; Nick ruled on all fifteen; surgical edits landed across seven page docs (resources.md needed none).
- Duplication ownership resolved: the Seven2 Case Study now exclusively owns the aftermath project list (workflow boards, storyboarding tools, resourcing fixes), the "nobody asked for" phrase (max once site-wide, per Nick), and the quoted conversation-shift line. Built For generalized ("internal helpers and fixes the team built entirely on their own"; "They started thinking AI-first."); How It Works varied ("New tools appear, unprompted."; "People stop asking whether AI matters and start comparing what they're building.").
- Fact and naming fixes: Built For's "three weeks" corrected to "a couple of weeks"; How It Works' "twenty people demo twenty things" generalized to "the whole team"; Pricing naming drift fixed (the Hacks-a-Thon platform, Admin Dashboard, Shark Tank Minus the Sharks pitch sessions, Public Showcase page, The IdeaLab) and spaced hyphens replaced with colons, periods, or parentheses; Seven2 link labels standardized to sentence-case "Read the Seven2 story."
- New standing copy rules from Nick's rulings: the generic word "hackathon" is banned from public copy forever (always Hacks-a-Thon; reworded to "one-day sprint," "Couldn't we just do this ourselves?" / "start an event," "No weekend required," and About's restructured origin sentence); Hacks-a-Thon is always hyphenated with the one-word form only in Hacksathon.com; block count uses the numeral 10 in prose (spelled out only at sentence start); the outcome phrase is always "the confidence to create with AI" and may repeat across pages.
- Homepage (v1.4): hero product clarifier added per Nick's explicit call ("A structured Hacks-a-Thon program you can easily run for your own team."); closing extended to "Give them the confidence to create with AI."; proof strip confirmed staying after The Problem. Costumes confirmed living on About; The Program's costume line replaced with "Expect a little showmanship."; front desk/founders riff kept only on Pricing.
- Live homepage verified during the pass: still the pre-lock version entirely (including the nonexistent Proven Playbook tile, Nick's quote as a testimonial, and a Lovable slot). Nick confirmed he is replacing all live homepage copy with the locked copy; no Lovable mention needed on the homepage. Implementation list updated in the dashboard.
- Versions: homepage-copy v1.4; the-program, how-it-works, solutions-overview, about 1.0.1; pricing-page 1.1.1; case-study 1.1.1; full-site-copy-export regenerated as 1.2.0. Dashboard v1.14.0, session notes v1.12.0, index v1.0.10. GitHub sync still pending for all post-Resources work.

### Added

- Created 02-website/nick-review-copy-2026-07-07.md: Nick's personal markup copy of the full post-cohesion site copy, organized by page with what-changed-today notes, for his own rewrite pass before implementation. Changes triage back into the page docs; the file is archived or deleted after the pass.
- NICK'S REVIEW PASS COMPLETE (same day): Nick marked up the review copy in a Google Doc and returned it as a .docx; Claude diffed it against the locked copy and triaged six edits plus three notes, all ruled and applied. Edits: The Program's What You Get intro ("a guided program where every piece exists"); the IdeaLab blurb tightened ("Every Hacks-a-Thon starts with ideas."); NEW RULE: "the Blueprint" in prose site-wide (matches the IdeaLab pattern; applied across The Program, How It Works, Pricing, and the export's product-names note); Pricing's first FAQ retitled "What's included in a Hacks-a-Thon?" ("Every Hacks-a-Thon gets"); the DIY FAQ opens "Yep, you could."; About opens "Hi, I'm Nick Murto, founder of Hacksathon.com, and that's been my whole life, honestly." Notes ruled: the Four Doors removed from the Resources public page in favor of The Library (a simple newest-first article list; doors preserved in resources.md as the Growth Plan; blog-like at launch is a feature); "Shark Tank style" reverted to "Shark Tank pitch"; the How It Works hero keeps "Here's how it works." Versions: the-program 1.0.2, how-it-works 1.0.2, pricing-page 1.1.2 (live corrections now ten items), about 1.0.2, resources 1.1.0, export updated. The review copy is fully triaged and archivable.
- Created 02-website/site-copy-final-for-cursor.md: the implementation-ready compilation for Nick's Cursor pass (implementation rules and AI-agent guardrails, live-site replacement instructions, CTA link targets, all eight pages verbatim). Regenerate if any page doc changes before implementation.

### Updated (consistency refresh, later same day)

- website-structure.md to 1.2.0: page-level details refreshed to match the locked page docs. The Program section list corrected (Playbook removed with a do-not-reintroduce note), Pricing comparison framing replaced with the locked flat-rate approach, Resources updated to The Library list with the doors deferred, Built For verticals marked proof-gated, About opening noted, CTA Direction updated to the locked CTAs. Nav and footer confirmed unchanged: top nav is Home / The Program / How It Works / Built For / Pricing / Resources; the Seven2 Case Study lives in the footer (a change from the current live site, which has it in the top nav).
- core-messaging-principles.md to v1.1: principle 1 hardened with the never-say-generic-hackathon rule; "View the Playbook" removed from principle 9.
- messaging-guide.md to v1.4: Website Copy links updated to the full locked eight-page set plus the export; archived Agencies Solution Page link removed.
- company-foundation.md read and verified clean; no changes needed.
- site-copy-final-for-cursor.md rule 9 completed with the full five-item footer (About, Seven2 Case Study, Contact, Privacy, Terms) and an explicit note that the Case Study moves out of the live top nav.

## 2026-07-06

### Added

- Triaged the external ChatGPT audit (Hacksathon_Website_Review_Master_Audit.docx, placed in 02-website/) and applied the five accepted items: the homepage Seven2 proof strip (homepage-copy.md v1.3), the "Couldn't we just run our own hackathon?" FAQ, After Purchase mini-flow, and extended Let's Talk line (pricing-page.md v1.1.0), and the What Seven2 Proved bullets (case-study.md v1.1.0). Regenerated full-site-copy-export.md with all five. Deferred repetition and product-clarifier notes to the cohesion pass as watch-items. Rejected with reasons: Built For broadening (proof-gated rule), Pricing value-comparison framing (deliberately retired), guarantee language (never invent promises). Full rulings in the project dashboard.

- Created and locked 02-website/case-study.md (v1.0.0): the Seven2 Case Study, the eighth and final page. The live /seven2 Public Showcase adopted as the foundation, wrapped in a locked narrative layer: "Every single person shipped." opener with stat band, The Setup, How It Ran ("Steal it"), a one-line AI-recap reframe, and What Happened After. Implementation checklist recorded for Nick's Cursor pass (including restoring the Hacky Awards and Reflections blocks that failed to translate to the page).
- Established Verified Numbers in 06-research/proof.md (Nick, 2026-07-06): 19 participants, 19 projects, 19 shipped, 100% completion, ~2.5 weeks, spring 2026, 0 outside facilitators. Corrected session-1-learnings-synthesis.md (banner plus metrics table), which had 22 participants / 14 completed / 64%.
- Created and locked 02-website/about.md (v1.0.0): the About page, first person. Hero "More ideas than time," the agency years (Seven2 2004 with Tyler Lafferty, 14Four, Strategy Labs with Ramsey Pruchnik), Been Watching's five-year limbo as the someone-should-build-that beat, the vibe-coding unlock with Tony Rosland credited and linked, HyperChrono's three deaths before its March 2026 App Store launch, the tools-nobody-used insight, the aha moment, and the creatives-have-superpowers close. Nick's raw origin story preserved in 06-research/founder-notes.md. Seventh locked page; only the Seven2 Case Study remains.
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

- Captured Nick's full founder origin story as raw research in 06-research/founder-notes.md (agency history, the imagegen era, Been Watching, HyperChrono's four rounds, Tony Rosland mentorship, the IdeaLab flight build, ZERO.Prmptr and edit.prmptr, the book, the first Hacks-a-Thon, the aha).
- GitHub Desktop set up; first full backup of Claude Planning Update pushed to murtopia/hacksathon-com (51 files; the 22 remote ChatGPT-era commits pulled and merged cleanly). Hacks-a-Thon Obsidian folder added to .gitignore as superseded.
- Resolved the /seven2 URL mystery: /seven2/final, /case-study, and /showcase all redirect to /seven2 by design (URL-restructure workaround). Pricing correction list item softened to an optional tidy-up.
- ALL EIGHT PAGES OF THE SITE ARE NOW LOCKED. The copy mission's remaining step is the site-wide cohesion pass.

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

### v1.14.0
- Added Nick's review-pass entry: markup triaged, six edits and three note rulings applied, the Blueprint naming rule and the Resources Library restructure recorded.

### v1.13.0
- Added the 2026-07-07 cohesion pass entry: rulings applied, new standing copy rules, copy mission complete.

### v1.12.0
- Added the external-audit triage entry: five accepted items applied, rulings recorded.

### v1.11.0
- Added the Case Study completion, verified-numbers correction, and all-eight-pages-locked entries.

### v1.10.0
- Added the About completion, founder-story capture, and GitHub backup entries.

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
