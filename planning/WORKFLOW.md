# Workflow

Status: Locked
Version: 1.0.0
Last Updated: 2026-06-30 CDT
Last Updated By: Nick + ChatGPT

Purpose:
Defines how future AI assistants and collaborators should work inside the Hacks-a-Thon planning repository.

Source of Truth:
GitHub

Depends On:
- planning/company-foundation.md
- planning/00-home/project-summary.md
- planning/00-home/project-dashboard.md

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

Before making recommendations, drafting new copy, or editing existing documents, read the active source documents listed in `planning/00-home/project-summary.md` and `planning/DOCUMENT_INDEX.md`.

At minimum, read:

- `planning/company-foundation.md`
- `planning/00-home/project-summary.md`
- `planning/00-home/project-memory.md`
- `planning/00-home/project-dashboard.md`
- `planning/00-home/session-notes.md`
- `planning/01-messaging/core-messaging-principles.md`
- `planning/01-messaging/messaging-guide.md`
- The relevant page document being edited

### 2. Git is the source of truth

Do not rely on chat history as the durable project record.

If something matters, save it to GitHub.

### 3. Verify write access first

Before creating locked copy, confirm GitHub write access is available.

If write access is unavailable, stop and say so before continuing.

### 4. Respect locked sections

Locked sections should not be rewritten unless Nick explicitly asks.

Small typo fixes are acceptable only when they do not change meaning, tone, structure, or strategy.

### 5. Work one section at a time

For website pages, follow this process:

1. Decide the purpose of the page.
2. Draft one section.
3. Refine until approved.
4. Update the corresponding Markdown document.
5. Commit to GitHub before moving to the next major section.

### 6. Update documentation metadata

When editing a document, update:

- Status, if changed
- Version, if changed
- Last Updated
- Change History

### 7. Update the project changelog

Any meaningful content, structure, research, or strategy change should be recorded in `planning/CHANGELOG.md`.

### 8. Update the document index

When creating, renaming, locking, or archiving a document, update `planning/DOCUMENT_INDEX.md`.

### 9. Commit in logical chunks

Do not wait until the end of a long session to commit everything.

Prefer commits like:

- Add participant reflections research
- Create documentation workflow
- Update website structure for The Program
- Draft The Program overview section

### 10. Preserve evidence separately from interpretation

Research should be stored in two layers:

- Raw evidence, such as participant responses
- Synthesized insights, such as themes and implications

Do not mix raw participant evidence with marketing copy.

## Document Metadata Standard

Every planning document should begin with this metadata pattern.

```md
# Document Title

Status: Draft | Working | Locked | Archived
Version: 1.0.0
Last Updated: 2026-06-30 CDT
Last Updated By: Nick + ChatGPT

Purpose:
One sentence describing the job of this document.

Source of Truth:
GitHub

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

### v1.0.0
- Created project workflow standard.
- Added document metadata standard.
- Added Git and commit rules.
