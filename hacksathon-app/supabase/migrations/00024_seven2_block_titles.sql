-- ============================================
-- Restore the Seven2 block titles + fresh light descriptions.
--
-- Migration 00014 normalized block_keys to the ZERO / 01..06 / FINAL /
-- +01 / +02 scheme but left the block titles flat ("IdeaLab", "Shark
-- Tank", "The Blueprint", "Build Session 1", etc.). The original
-- Seven2 playbook had a lighter, more characterful voice — "Sprint to
-- the IdeaLab", "Shark Tank, Minus the Sharks", "Documentation Is
-- Everything", "Here We Go!", "Your Final Build Session", "Showcase
-- Showdown" — and we're bringing it back.
--
-- This migration does two things:
--   1. UPDATEs existing `blocks` rows so live events flip immediately.
--   2. Rewrites the default `event_templates.blocks` JSON so newly
--      created events inherit the new copy.
--
-- Block keys themselves do NOT change — they're URL identifiers and
-- changing them would break bookmarks. Only the participant-facing
-- title / subtitle / description / purpose strings change.
--
-- Block `+01` Hacky Awards and `+02` Reflections are intentionally not
-- touched: they're post-event additions outside the original 8-block
-- playbook and keep their current copy.
--
-- Descriptions stay tool-agnostic ("your build tool"). The block
-- detail pages already swap in the configured tool name via the
-- `buildToolLabel()` helper, so the seed copy doesn't need to bake in
-- a specific tool.
-- ============================================

-- 1. Update existing rows. One UPDATE per key keeps the SQL readable
-- and the diff easy to review per-block. Subtitle is explicitly set
-- (NULL for blocks that don't carry one) so we don't inherit stale
-- subtitles from earlier seeds.

UPDATE blocks
SET
  title = 'Kickoff',
  subtitle = NULL,
  description = 'Welcome, ground rules, and a quick tour of how the day will run.',
  purpose = 'Take the intimidation out and get everyone on the same page before ideas start flying.'
WHERE block_key = 'ZERO';

UPDATE blocks
SET
  title = 'Sprint to the IdeaLab',
  subtitle = NULL,
  description = 'Brainstorm, define, and drop your idea into the IdeaLab so the rest of the day has somewhere to aim.',
  purpose = 'Commit to a direction and put words on why your idea matters.'
WHERE block_key = '01';

UPDATE blocks
SET
  title = 'Shark Tank, Minus the Sharks',
  subtitle = NULL,
  description = 'Each builder gets one minute to pitch what they''re making. The team adds light, constructive feedback — no big bites.',
  purpose = 'Sharpen ideas and build collective energy before the build begins.'
WHERE block_key = '02';

UPDATE blocks
SET
  title = 'Documentation Is Everything',
  subtitle = NULL,
  description = 'Turn your idea into a Blueprint and a Starter Prompt your build tool can actually run with.',
  purpose = 'Translate the idea into a buildable direction so you stop talking and start shipping.'
WHERE block_key = '03';

UPDATE blocks
SET
  title = 'Here We Go!',
  subtitle = 'Build Session 1',
  description = 'First protected build session — paste your Starter Prompt, attach your Blueprint, and ship something on screen.',
  purpose = 'Get the first real version of your build in front of you.'
WHERE block_key = '04';

UPDATE blocks
SET
  title = 'Build Session 2',
  subtitle = NULL,
  description = 'Keep cooking. Sharpen the rough edges, add what''s missing, and try it the way a real user would.',
  purpose = 'Iterate and improve while the energy is high.'
WHERE block_key = '05';

UPDATE blocks
SET
  title = 'Your Final Build Session',
  subtitle = NULL,
  description = 'Last protected build slot. Polish the demo flow and resist the urge to start something new.',
  purpose = 'Bring it home — lock in what you''ll show on stage.'
WHERE block_key = '06';

UPDATE blocks
SET
  title = 'Showcase Showdown',
  subtitle = NULL,
  description = 'Each builder presents a 3-minute demo followed by 2 minutes of Q&A from the team.',
  purpose = 'Celebrate the builds and capture what everyone learned.'
WHERE block_key = 'FINAL';

-- 2. Rewrite the default event_templates blocks JSON so new events
-- inherit the Seven2 titles + fresh descriptions out of the box.
-- Hacky Awards (+01) and Reflections (+02) entries keep their post-
-- 00014 copy unchanged.

UPDATE event_templates
SET blocks = '[
  {"block_key": "ZERO", "title": "Kickoff", "duration_minutes": 15, "description": "Welcome, ground rules, and a quick tour of how the day will run.", "purpose": "Take the intimidation out and get everyone on the same page before ideas start flying."},
  {"block_key": "01", "title": "Sprint to the IdeaLab", "duration_minutes": 30, "description": "Brainstorm, define, and drop your idea into the IdeaLab so the rest of the day has somewhere to aim.", "purpose": "Commit to a direction and put words on why your idea matters."},
  {"block_key": "02", "title": "Shark Tank, Minus the Sharks", "duration_minutes": 45, "description": "Each builder gets one minute to pitch what they''re making. The team adds light, constructive feedback — no big bites.", "purpose": "Sharpen ideas and build collective energy before the build begins."},
  {"block_key": "03", "title": "Documentation Is Everything", "duration_minutes": 30, "description": "Turn your idea into a Blueprint and a Starter Prompt your build tool can actually run with.", "purpose": "Translate the idea into a buildable direction so you stop talking and start shipping."},
  {"block_key": "04", "title": "Here We Go!", "subtitle": "Build Session 1", "duration_minutes": 45, "description": "First protected build session — paste your Starter Prompt, attach your Blueprint, and ship something on screen.", "purpose": "Get the first real version of your build in front of you."},
  {"block_key": "05", "title": "Build Session 2", "duration_minutes": 45, "description": "Keep cooking. Sharpen the rough edges, add what''s missing, and try it the way a real user would.", "purpose": "Iterate and improve while the energy is high."},
  {"block_key": "06", "title": "Your Final Build Session", "duration_minutes": 45, "description": "Last protected build slot. Polish the demo flow and resist the urge to start something new.", "purpose": "Bring it home — lock in what you''ll show on stage."},
  {"block_key": "FINAL", "title": "Showcase Showdown", "duration_minutes": 120, "description": "Each builder presents a 3-minute demo followed by 2 minutes of Q&A from the team.", "purpose": "Celebrate the builds and capture what everyone learned."},
  {"block_key": "+01", "title": "Hacky Awards", "duration_minutes": 30, "description": "Vote for your favorites across the award categories.", "purpose": "Recognize standout work and shared moments."},
  {"block_key": "+02", "title": "Reflections", "duration_minutes": 20, "description": "Capture what surprised you and what you''re taking forward.", "purpose": "Lock in the learning so it actually sticks."}
]'::jsonb
WHERE is_default = true;
