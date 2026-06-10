-- ============================================
-- Per-event build tool
--
-- `planning_sessions.build_tool` already exists at the session level
-- (defaults to 'lovable'). Adding it to events lets the organizer pick
-- the tool ONCE during setup and have every block 03 redirect + every
-- starter prompt page point at the right tool, without each
-- participant having to pick.
--
-- Supported values are tracked via a CHECK constraint so the admin UI
-- can stay in sync — extending this list means a migration, by design.
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS build_tool TEXT NOT NULL DEFAULT 'lovable';

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_build_tool_check;

ALTER TABLE events
  ADD CONSTRAINT events_build_tool_check
  CHECK (build_tool IN ('lovable', 'bolt', 'v0', 'cursor', 'replit'));

COMMENT ON COLUMN events.build_tool IS
  'Build tool participants will use during this event (lovable, bolt, v0, cursor, replit). Drives the /plan tool query param and starter-prompt copy.';
