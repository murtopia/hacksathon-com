# Workflow

Status: Locked
Version: 1.1.0
Last Updated: 2026-07-05 CDT
Last Updated By: Nick + Claude

Purpose:
Defines how future AI assistants and collaborators should work inside the Hacks-a-Thon planning workspace.

Source of Truth:
Local folder: Claude Planning Update (inside the Hacksathon.com project folder). GitHub is a backup and sync target, updated manually by Nick.

Depends On:
- company-foundation.md
- 00-home/project-summary.md
- 00-home/project-dashboard.md

Used By:
- Every planning session
- Website copywriting
- Research synthesis
- Future AI collaborators

Lock Status:
Locked sections:
- Workflow Rules
- Document Metadata Standard
- Commit Rules

Working sections:
- None

Next Review:
After The Program page is locked.

---

## Workflow Rules

### 1. Read before writing

Before making recommendations, drafting new copy, or editing existing documents, read the active source documents listed in `00-home/project-summary.md` and `DOCUMENT_INDEX.md`.

At minimum, read:

- `company-foundation.md`
- `00-home/project-summary.md`
- `00-home/project-memory.md`
- `00-home/project-dashboard.md`
- `00-home/session-notes.md`
- `01-messaging/core-messaging-principles.md`
- `01-messaging/messaging-guide.md`
- The relevant page document being edited

### 2. The local folder is the source of truth

The Claude Planning Update folder on Nick's machine is the durable project record.

Do not rely on chat history as the durable project record. If something matters, save it to a file in this folder.

GitHub (`murtopia/hacksathon-com`) is a backup and sync target. Nick handles all git commits and pushes manually.

### 3. Verify file access first

Before starting meaningful work, confirm the Filesystem extension is connected and this folder is writable.

If file access is unavailable, stop and say so before continuing.

### 4. Respect locked sections

Locked sections should not be rewritten unless Nick explicitly asks.

Small typo fixes are acceptable only when they do not change meaning, tone, structure, or strategy.

### 5. Work one section at a time

For website pages, follow this process:

1. Decide the purpose of the page.
2. Draft one section.
3. Refine until approved.
4. Update the corresponding Markdown document.
5. Save before moving to the next major section.

### 6. Update documentation metadata

When editing a document, update:

- Status, if changed
- Version, if changed
- Last Updated
- Change History

### 7. Update the project changelog

Any meaningful content, structure, research, or strategy change should be recorded in `CHANGELOG.md`.

### 8. Update the document index

When creating, renaming, locking, or archiving a document, update `DOCUMENT_INDEX.md`.

### 9. Save in logical chunks

Do not wait until the end of a long session to save everything.

Prefer updates like:

- Add participant reflections research
- Create documentation workflow
- Update website structure for The Program
- Draft The Program overview section

### 10. Preserve evidence separately from interpretation

Research should be stored in two layers:

- Raw evidence, such as participant responses
- Synthesized insights, such as themes and implications

Do not mix raw participant evidence with marketing copy.

### 11. Favor consolidation over new documents

Do not create new planning documents when an existing canonical document can be extended.

Synthesize before inventing. The planning workspace should get denser, not wider.

The Program page document is the canonical product definition. Product-facing decisions should consolidate there rather than spawning new files.

## Document Metadata Standard

Every planning document should begin with this metadata pattern.

```md
# Document Title

Status: Draft | Working | Locked | Archived
Version: 1.0.0
Last Updated: 2026-07-05 CDT
Last Updated By: Nick + Claude

Purpose:
One sentence describing the job of this document.

Source of Truth:
Claude Planning Update (local)

Depends On:
- file-one.md
- file-two.md

Used By:
- Page or workflow name

Lock Status:
Locked sections:
- Section name

Working sections:
- Section name

Next Review:
After the next relevant milestone.

---
```

## Versioning Rules

Use practical semantic versioning:

- `0.x.x` for drafts and early working docs
- `1.0.0` for first locked version
- Patch version for small copy refinements
- Minor version for meaningful section updates
- Major version only for strategic repositioning

## Change History

### v1.1.0
- Source of truth moved from GitHub to the local Claude Planning Update folder. GitHub becomes a manual backup and sync target handled by Nick.
- Collaboration handoff from ChatGPT to Claude with the Filesystem extension.
- Added Rule 11: favor consolidation over creating new planning documents (decision from the 2026-07-04 session).
- Replaced Git-specific commit language with save-based language. Nick handles all git operations.

### v1.0.0
- Created project workflow standard.
- Added document metadata standard.
- Added Git and commit rules.
