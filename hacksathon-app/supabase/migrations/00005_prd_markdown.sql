-- ============================================
-- Migration 00005: Consolidated PRD as Markdown
-- Per Session 2 doc: planning conversation now produces ONE consolidated
-- PRD document (markdown). Structured fields remain as a data layer; the
-- AI synthesis is the readable output.
-- ============================================

ALTER TABLE project_briefs
  ADD COLUMN IF NOT EXISTS prd_markdown TEXT;

COMMENT ON COLUMN project_briefs.prd_markdown IS
  'AI-synthesized consolidated PRD as markdown. Single source of truth for the rendered Project Brief and the downloadable .md file. Structured fields above are the data layer.';
