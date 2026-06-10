-- ============================================
-- Awards ceremony + simplified voting/reflection states
--
-- Two related changes:
--
--   1. Reflections gain an explicit three-state machine
--      (closed | open | complete), mirroring voting. The scheduled
--      reflections_open_at / reflections_close_at windows (00027) become
--      an OPTIONAL auto-schedule on top of the manual status. Submissions
--      are gated on reflection_status='open' (admins exempt).
--
--   2. The awards "reveal" becomes a two-step ceremony flow. Voting
--      close/tally now flips voting_status='revealed' and locks the
--      event, but results stay PRIVATE until the organizer runs the
--      ceremony and clicks "Publish results" (events.results_published_at).
--      The awards table gains vote_count, runner_up_idea_ids, and
--      is_overridden so the pre-ceremony review screen can show tallies
--      and let the organizer override winners/runner-ups.
-- ============================================

-- --------------------------------------------
-- 1. New event columns
-- --------------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reflection_status TEXT NOT NULL DEFAULT 'closed',
  ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ;

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_reflection_status_check;
ALTER TABLE events
  ADD CONSTRAINT events_reflection_status_check
  CHECK (reflection_status IN ('closed','open','complete'));

COMMENT ON COLUMN events.reflection_status IS
  'Reflection state machine: closed -> open -> complete. Gates reflection submissions (admins exempt). Marking complete triggers AI recap generation in the app layer.';
COMMENT ON COLUMN events.results_published_at IS
  'When set, award winners are public (participants + showcase). voting_status=revealed means tallied + locked but PRIVATE until this is stamped via "Publish results" after the ceremony.';

-- Backward compatibility:
--   - Existing events had "always open" reflections (no status), so keep
--     them open rather than silently closing submissions.
--   - Existing revealed events already showed winners publicly, so treat
--     them as already published.
UPDATE events SET reflection_status = 'open' WHERE reflection_status = 'closed';
UPDATE events
  SET results_published_at = COALESCE(results_published_at, now())
  WHERE voting_status = 'revealed';

-- --------------------------------------------
-- 2. Awards: ceremony tally + override columns
-- --------------------------------------------
ALTER TABLE awards
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS runner_up_idea_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN awards.vote_count IS
  'Vote count for the winning idea at tally time. 0 when the category had no votes.';
COMMENT ON COLUMN awards.runner_up_idea_ids IS
  'Ordered runner-up idea ids (next-highest vote getters), used by the ceremony presentation. Empty when none.';
COMMENT ON COLUMN awards.is_overridden IS
  'True when the organizer manually overrode the computed winner/runner-ups in the pre-ceremony review.';

-- --------------------------------------------
-- 3. Reflections RLS: gate submit/edit on reflection_status='open'
--    (admins always allowed, so they can fix answers any time).
-- --------------------------------------------
DROP POLICY IF EXISTS "reflections_insert" ON reflections;
CREATE POLICY "reflections_insert" ON reflections FOR INSERT WITH CHECK (
  is_event_member(event_id)
  AND user_id = auth.uid()
  AND (
    is_event_admin(event_id)
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.reflection_status = 'open'
    )
  )
);

DROP POLICY IF EXISTS "reflections_update" ON reflections;
CREATE POLICY "reflections_update" ON reflections FOR UPDATE USING (
  (user_id = auth.uid() OR is_event_admin(event_id))
  AND (
    is_event_admin(event_id)
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id AND e.reflection_status = 'open'
    )
  )
);
