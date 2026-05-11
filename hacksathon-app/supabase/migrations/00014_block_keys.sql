-- ============================================
-- Block keys: Session 2 ten-key scheme
-- M3: Participant event home + per-block screens.
--
-- The block_key surface used during build was a holdover from the Seven2
-- prototype: zero / 1 / 2 / 3 / 4a / 4b / 4c / final. The Session 2 plan
-- moves to a 10-key scheme with explicit Awards (+01) and Reflections (+02)
-- and zero-padded numbers so they sort lexicographically:
--
--   ZERO   Kickoff
--   01     IdeaLab
--   02     Shark Tank
--   03     The Blueprint (planning)
--   04     Build Session 1
--   05     Build Session 2
--   06     Build Session 3
--   FINAL  Showcase
--   +01    Hacky Awards
--   +02    Reflections
--
-- This migration renames any existing rows, rewrites the default event
-- template's blocks JSON, and adds a CHECK constraint to the blocks table
-- so future inserts can't drift back to the old scheme.
-- ============================================

-- 1. Rename existing block rows. Idempotent — the CASE statement leaves
-- values alone if they're already in the new scheme.
UPDATE blocks
SET block_key = CASE block_key
    WHEN 'zero'  THEN 'ZERO'
    WHEN '1'     THEN '01'
    WHEN '2'     THEN '02'
    WHEN '3'     THEN '03'
    WHEN '4a'    THEN '04'
    WHEN '4b'    THEN '05'
    WHEN '4c'    THEN '06'
    WHEN 'final' THEN 'FINAL'
    ELSE block_key
END
WHERE block_key IN ('zero','1','2','3','4a','4b','4c','final');

-- 2. Rewrite the default event_templates blocks JSON to the 10-key scheme.
-- Awards (+01) and Reflections (+02) are added with a short stub purpose;
-- they're rendered as placeholders in M3 and fleshed out in M4.
UPDATE event_templates
SET blocks = '[
  {"block_key": "ZERO", "title": "Kickoff", "duration_minutes": 15, "description": "Welcome, ground rules, and the tools you''ll use today.", "purpose": "Remove intimidation and create clarity before ideas begin."},
  {"block_key": "01", "title": "IdeaLab", "duration_minutes": 30, "description": "Brainstorm, define, and drop your project idea into the IdeaLab.", "purpose": "Commit to a direction and articulate why the idea matters."},
  {"block_key": "02", "title": "Shark Tank", "duration_minutes": 45, "description": "Each participant delivers a 1-minute pitch with light team feedback.", "purpose": "Sharpen ideas and build collective energy."},
  {"block_key": "03", "title": "The Blueprint", "duration_minutes": 30, "description": "Turn your idea into a Blueprint and a Starter Prompt for your build tool.", "purpose": "Translate the idea into a buildable direction."},
  {"block_key": "04", "title": "Build Session 1", "duration_minutes": 45, "description": "First protected build session. Let''s go.", "purpose": "Get the first version of your build on screen."},
  {"block_key": "05", "title": "Build Session 2", "duration_minutes": 45, "description": "Keep cooking. Iterate, refine, and push features.", "purpose": "Iterate and improve."},
  {"block_key": "06", "title": "Build Session 3", "duration_minutes": 45, "description": "Bring it home. Polish the demo flow.", "purpose": "Polish demo flow and prepare for showcase."},
  {"block_key": "FINAL", "title": "Showcase", "duration_minutes": 120, "description": "Each participant presents a 3-minute demo followed by 2-minute Q&A.", "purpose": "Celebrate the builds and what everyone learned."},
  {"block_key": "+01", "title": "Hacky Awards", "duration_minutes": 30, "description": "Vote for your favorites across the award categories.", "purpose": "Recognize standout work and shared moments."},
  {"block_key": "+02", "title": "Reflections", "duration_minutes": 20, "description": "Capture what surprised you and what you''re taking forward.", "purpose": "Lock in the learning so it actually sticks."}
]'::jsonb
WHERE is_default = true;

-- 3. Lock the block_key enum at the table level so application code can
-- trust the surface. Drop first in case this migration is re-run.
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_block_key_check;
ALTER TABLE blocks
  ADD CONSTRAINT blocks_block_key_check
  CHECK (block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02'));
