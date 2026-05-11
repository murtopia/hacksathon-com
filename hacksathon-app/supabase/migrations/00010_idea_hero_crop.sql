-- ============================================
-- IdeaLab: focal-point crop on the hero screenshot.
-- hero_crop_y is the vertical focal-point as a percentage (0..100)
-- used at render time as `object-position: center {y}%` on a 16:9
-- container. 50 = center (the default).
-- ============================================

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS hero_crop_y INTEGER NOT NULL DEFAULT 50;

ALTER TABLE ideas
  ADD CONSTRAINT ideas_hero_crop_y_range
  CHECK (hero_crop_y BETWEEN 0 AND 100);

COMMENT ON COLUMN ideas.hero_crop_y IS
  'Vertical focal-point (0..100) for object-position on the hero screenshot. 50 = center.';
