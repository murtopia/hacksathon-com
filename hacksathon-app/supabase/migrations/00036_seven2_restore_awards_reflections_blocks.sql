-- ============================================
-- Restore the Hacky Awards (+01) and Reflections (+02) blocks on the
-- seeded Seven2 case-study event.
--
-- The 00031 showcase seed inserted only the 8 core blocks (ZERO..FINAL),
-- so the public /seven2 run-of-show showed an 8-block schedule. The
-- locked site copy (site-copy-final-for-cursor.md, 2026-07-07) specifies
-- the full 10-block program, Kickoff to Reflections, and explicitly
-- restores these two blocks on the case-study page.
--
-- Copy matches the default event template (00024). Idempotent: clears
-- any prior +01/+02 rows for the event before inserting.
-- ============================================

DELETE FROM blocks
WHERE event_id = 'ae0b0e99-8756-50f2-8960-c372c9817704'
  AND block_key IN ('+01', '+02');

INSERT INTO blocks (event_id, block_key, title, subtitle, duration_minutes, description, purpose, status, sort_order) VALUES
  ('ae0b0e99-8756-50f2-8960-c372c9817704', '+01', 'Hacky Awards', NULL, 30, 'Vote for your favorites across the award categories.', 'Recognize standout work and shared moments.', 'completed', 8),
  ('ae0b0e99-8756-50f2-8960-c372c9817704', '+02', 'Reflections', NULL, 20, 'Capture what surprised you and what you''re taking forward.', 'Lock in the learning so it actually sticks.', 'completed', 9);
