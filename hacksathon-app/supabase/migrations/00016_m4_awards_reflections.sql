-- ============================================
-- M4: Awards, Reflections, Event Lock
--
-- Schema for M4 is mostly already in place from the original 00001
-- core schema (award_categories, votes, awards, reflection_questions,
-- reflections). This migration adds the missing pieces:
--
--   1. events.voting_status (closed | open | revealed) — three-state
--      replaces the old voting_config.voting_open boolean which was
--      never wired into the read path.
--   2. events.is_locked — flips true at reveal time; gates UPDATE/INSERT
--      on creative-artifact tables (ideas, project_briefs,
--      planning_sessions, block_completions).
--   3. events.reflection_summary + generated_at / approved_at columns
--      for the AI-generated post-event recap.
--   4. is_event_locked() helper (SECURITY DEFINER) reused by the lock
--      guards.
--   5. Tightened votes RLS — INSERT/UPDATE/DELETE now require the event
--      to be in voting_status='open'.
--   6. Lock guards added to ideas / project_briefs / planning_sessions /
--      block_completions UPDATE/INSERT policies.
--   7. Backfill: seed default award_categories + reflection_questions
--      into every existing event that doesn't have them yet. New events
--      are seeded via createMinimalEvent (lib/awards/categories.ts,
--      lib/reflections/questions.ts).
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voting_status TEXT NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS reflection_summary TEXT,
  ADD COLUMN IF NOT EXISTS reflection_summary_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reflection_summary_approved_at TIMESTAMPTZ;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_voting_status_check;
ALTER TABLE events
  ADD CONSTRAINT events_voting_status_check
  CHECK (voting_status IN ('closed','open','revealed'));

COMMENT ON COLUMN events.is_locked IS
  'Set true when the organizer reveals awards. Gates UPDATE/INSERT on creative artifacts (ideas, briefs, planning sessions, block completions) via is_event_locked() in RLS.';
COMMENT ON COLUMN events.voting_status IS
  'Award voting state machine: closed -> open -> revealed. Drives Block +01 rendering and gates votes RLS.';
COMMENT ON COLUMN events.reflection_summary IS
  'AI-generated post-event recap. Draft until reflection_summary_approved_at is non-null.';

-- ============================================
-- is_event_locked() — reused by lock guards.
-- SECURITY DEFINER to avoid recursing through the events RLS policy.
-- ============================================
CREATE OR REPLACE FUNCTION public.is_event_locked(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_locked FROM public.events WHERE id = p_event_id),
    false
  );
$$;

-- ============================================
-- Votes: gate INSERT / UPDATE / DELETE on voting_status='open'
-- ============================================
DROP POLICY IF EXISTS "votes_insert" ON votes;
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (
  is_event_member(event_id)
  AND user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.voting_status = 'open')
);

DROP POLICY IF EXISTS "votes_update" ON votes;
CREATE POLICY "votes_update" ON votes FOR UPDATE USING (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.voting_status = 'open')
);

DROP POLICY IF EXISTS "votes_delete" ON votes;
CREATE POLICY "votes_delete" ON votes FOR DELETE USING (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.voting_status = 'open')
);

-- ============================================
-- Lock guards: tighten existing UPDATE / INSERT policies.
-- Pattern: NOT is_event_locked(event_id) appended to USING / WITH CHECK.
-- Admin override is intentionally NOT added — a locked event is locked
-- for organizers too. They unlock by un-flipping is_locked directly.
-- ============================================

-- ideas
DROP POLICY IF EXISTS "ideas_update" ON ideas;
CREATE POLICY "ideas_update" ON ideas FOR UPDATE USING (
  (user_id = auth.uid() OR is_event_admin(event_id))
  AND NOT is_event_locked(event_id)
);

-- project_briefs (defined in 00004_planning_sessions.sql)
DROP POLICY IF EXISTS "project_briefs_update_own" ON project_briefs;
CREATE POLICY "project_briefs_update_own" ON project_briefs FOR UPDATE USING (
  user_id = auth.uid() AND NOT is_event_locked(event_id)
);

DROP POLICY IF EXISTS "project_briefs_delete_own" ON project_briefs;
CREATE POLICY "project_briefs_delete_own" ON project_briefs FOR DELETE USING (
  user_id = auth.uid() AND NOT is_event_locked(event_id)
);

-- planning_sessions (defined in 00004_planning_sessions.sql)
DROP POLICY IF EXISTS "planning_sessions_update_own" ON planning_sessions;
CREATE POLICY "planning_sessions_update_own" ON planning_sessions FOR UPDATE USING (
  user_id = auth.uid() AND NOT is_event_locked(event_id)
);

-- block_completions (defined in 00015_block_completions.sql)
DROP POLICY IF EXISTS "block_completions_insert_own" ON block_completions;
CREATE POLICY "block_completions_insert_own" ON block_completions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND NOT is_event_locked(event_id)
);

-- ============================================
-- Backfill: seed default award_categories for any existing event that
-- doesn't have them. Uses LATERAL VALUES so we get one set of six per
-- target event in a single statement.
-- ============================================
INSERT INTO award_categories (event_id, key, name, description, sort_order)
SELECT
  e.id,
  x.key,
  REPLACE(x.name_template, '{company}', COALESCE(o.name, 'Your team')),
  x.description,
  x.sort_order
FROM events e
LEFT JOIN organizations o ON o.id = e.organization_id
CROSS JOIN LATERAL (VALUES
  ('best-in-show',        'Best in Show',                'The runaway favorite — the one everyone is still talking about.',                              1),
  ('shut-up-take-money',  'Shut Up and Take My Money',    'The build you''d hand a credit card to right now.',                                            2),
  ('best-execution',      'Best Execution',               'Polished, working, and obviously cared-for.',                                                 3),
  ('most-creative',       'Most Creative Idea',           'Made you tilt your head and go "huh."',                                                      4),
  ('best-shark-tank',     'Best Shark Tank Pitch',        'Sold the room in sixty seconds.',                                                            5),
  ('most-company-energy', 'Most {company} Energy',        'Captures the soul of the team.',                                                              6)
) AS x(key, name_template, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM award_categories ac WHERE ac.event_id = e.id);

-- ============================================
-- Backfill: seed default reflection_questions for any existing event
-- that doesn't have them.
-- ============================================
INSERT INTO reflection_questions (event_id, question_text, sort_order, is_required)
SELECT
  e.id, x.question_text, x.sort_order, x.is_required
FROM events e
CROSS JOIN LATERAL (VALUES
  ('What surprised you most?',                                                  1, true),
  ('What are you most proud of building or contributing?',                       2, true),
  ('What was the hardest part?',                                                3, true),
  ('What''s one thing you learned that you''ll carry forward?',                   4, true),
  ('What would you try differently next time?',                                 5, true),
  ('Anyone you want to shout out?',                                             6, false),
  ('Anything else you want to capture before you close this out?',              7, false)
) AS x(question_text, sort_order, is_required)
WHERE NOT EXISTS (SELECT 1 FROM reflection_questions rq WHERE rq.event_id = e.id);
