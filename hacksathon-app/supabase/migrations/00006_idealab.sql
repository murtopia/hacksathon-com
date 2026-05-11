-- ============================================
-- Milestone 2: IdeaLab
-- Adds the columns and constraints required to support idea card
-- submission, status updates, and the one-entry-per-participant rule.
-- ============================================

-- New columns: category for the submission form, plus the two demo
-- assets required before an idea can be marked 'completed'.
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS live_url TEXT,
  ADD COLUMN IF NOT EXISTS final_screenshot_url TEXT;

-- Constrain categories to the 4 Session 2 doc values. Text + CHECK
-- (vs. a Postgres enum) so expanding the list is a one-line migration
-- rather than an enum alteration dance.
ALTER TABLE ideas
  ADD CONSTRAINT ideas_category_check
  CHECK (category IS NULL OR category IN (
    'for_fun', 'solve_problem', 'work_tool', 'something_weird'
  ));

-- One idea per participant per event. The UI redirects new-form
-- attempts to the existing detail view, but the DB is authoritative.
CREATE UNIQUE INDEX IF NOT EXISTS ideas_one_per_user_per_event
  ON ideas (event_id, user_id);

-- Demo-ready gate: an idea cannot be marked 'completed' until both
-- the live URL and the final screenshot are attached. Server-side
-- validation duplicates this in API routes, but the DB constraint is
-- the source of truth so direct SQL writes can't bypass it.
ALTER TABLE ideas
  ADD CONSTRAINT ideas_completed_requires_demo_assets
  CHECK (
    status <> 'completed'
    OR (live_url IS NOT NULL AND final_screenshot_url IS NOT NULL)
  );

-- Default fresh ideas to 'in_progress' so the UI status reads
-- "In Progress" out of the box. The legacy 'idea_stage' value stays
-- in the enum for backward compatibility with any pre-migration rows
-- but isn't used by new submissions.
ALTER TABLE ideas
  ALTER COLUMN status SET DEFAULT 'in_progress';
