-- Add scheduled open/close windows for voting and reflections.
--
-- Today voting state is purely manual (admin clicks "Open voting" /
-- "Reveal winners"), and reflections are always open. This migration
-- adds optional date windows that the Helper surfaces and the API
-- enforces:
--
--   voting_open_at / voting_close_at
--     When set, the application layer flips `voting_status` from
--     `closed` → `open` at voting_open_at and from `open` → `revealed`
--     at voting_close_at. The transition is best-effort and runs lazily
--     on page render in v1; no cron yet.
--
--   reflections_open_at / reflections_close_at
--     When set, the reflections submit API rejects submissions outside
--     the window with a 409. Both NULL means "always open" (backward
--     compatible with existing events).
--
-- All four columns are nullable. CHECK constraints enforce that close
-- is strictly after open when both are set; either can be NULL.

ALTER TABLE events ADD COLUMN voting_open_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN voting_close_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN reflections_open_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN reflections_close_at TIMESTAMPTZ;

ALTER TABLE events
  ADD CONSTRAINT voting_close_after_open
    CHECK (
      voting_close_at IS NULL
      OR voting_open_at IS NULL
      OR voting_close_at > voting_open_at
    ),
  ADD CONSTRAINT reflections_close_after_open
    CHECK (
      reflections_close_at IS NULL
      OR reflections_open_at IS NULL
      OR reflections_close_at > reflections_open_at
    );

COMMENT ON COLUMN events.voting_open_at IS
  'When set, application flips voting_status closed→open at this time.';
COMMENT ON COLUMN events.voting_close_at IS
  'When set, application flips voting_status open→revealed at this time.';
COMMENT ON COLUMN events.reflections_open_at IS
  'When set, reflections cannot be submitted before this time.';
COMMENT ON COLUMN events.reflections_close_at IS
  'When set, reflections cannot be submitted after this time.';
