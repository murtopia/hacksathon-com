-- ============================================
-- M-aux: Waitlist signups
--
-- Captures early interest before the platform is fully launched.
-- Anyone can submit (the POST /api/waitlist route uses the service
-- role admin client). Reads happen via the Supabase dashboard or a
-- future admin UI — never through anon or authenticated clients.
-- ============================================

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  team_size TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'waitlist-page',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_team_size_check
    CHECK (team_size IN ('1-5','6-15','16-50','51-200','200+'))
);

-- One row per email (case-insensitive). Lets the API re-submit safely
-- and surface a softer "you're already on the list" response without
-- duplicating rows or revealing existence through error codes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_waitlist_email_lower
  ON waitlist_signups (lower(email));

CREATE INDEX IF NOT EXISTS idx_waitlist_created
  ON waitlist_signups (created_at DESC);

COMMENT ON TABLE waitlist_signups IS
  'Early-access waitlist captured from the public /waitlist page. Service-role read/write only.';

-- RLS with no policies = denied for anon and authenticated. The service
-- role bypasses RLS, so the API admin client and Supabase dashboard
-- still have full access. This is the right shape: it's a private
-- mailing list, not user-facing data.
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;
