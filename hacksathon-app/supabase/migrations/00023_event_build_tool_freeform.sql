-- ============================================
-- Free-form event build tool
--
-- The original 00020 constraint locked `events.build_tool` to a
-- closed set (lovable / bolt / v0 / cursor / replit). The admin UI
-- now lets organizers pick "Other" and type a custom tool name —
-- think Replicate Code, ChatGPT Projects, an internal AI build
-- platform, whatever the company is running. Locking the column
-- to a closed enum would have meant a migration every time a new
-- tool shows up, which is not where this should live.
--
-- We keep a non-empty / sane-length sanity check so the column
-- doesn't end up storing whitespace or unbounded blobs. The
-- recognized list moves into the application layer
-- (src/lib/build-tool/labels.ts), where unrecognized values render
-- as the generic phrase "your vibe coding app".
-- ============================================

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_build_tool_check;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_build_tool_nonempty;

ALTER TABLE events
  ADD CONSTRAINT events_build_tool_nonempty
  CHECK (
    char_length(trim(build_tool)) > 0
    AND char_length(build_tool) <= 50
  );

COMMENT ON COLUMN events.build_tool IS
  'Build tool participants will use during this event. Free-form text (1-50 chars). Recognized values (lovable, bolt, v0, cursor, replit) get polished labels via src/lib/build-tool/labels.ts; anything else renders as the generic "your vibe coding app" phrase in copy.';
