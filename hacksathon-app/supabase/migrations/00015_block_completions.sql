-- ============================================
-- Per-participant block completion
-- M3 refinements: the participant's "Your timeline" view shows their own
-- progress. Some completions auto-derive from existing state (idea row,
-- Blueprint row, idea status); others come from an explicit button —
-- today only Shark Tank's "Lock my idea". This table backs the explicit
-- path. Time-based fallback (scheduled_date + duration_minutes < now)
-- is still applied at read time and doesn't require a row here.
-- ============================================

CREATE TABLE block_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, block_key),
  CHECK (block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02'))
);

CREATE INDEX idx_block_completions_event_user
  ON block_completions(event_id, user_id);

ALTER TABLE block_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_completions_select_own"
  ON block_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "block_completions_insert_own"
  ON block_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "block_completions_delete_own"
  ON block_completions FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE block_completions IS
  'Per-participant block completion. One row = one participant marked one block done in one event. See lib/blocks/status.ts for the read-time derivation that combines this with time-based and auto-derived signals.';
