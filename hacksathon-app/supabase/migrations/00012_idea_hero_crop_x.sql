-- ============================================
-- IdeaLab: horizontal focal-point for wide screenshots.
-- Mirrors 00010 (hero_crop_y) for the other axis: when the uploaded
-- image is wider than 16:9, object-cover crops left/right and the
-- owner picks the horizontal focal point via hero_crop_x.
-- ============================================

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS hero_crop_x INTEGER NOT NULL DEFAULT 50;

ALTER TABLE ideas
  ADD CONSTRAINT ideas_hero_crop_x_range
  CHECK (hero_crop_x BETWEEN 0 AND 100);

COMMENT ON COLUMN ideas.hero_crop_x IS
  'Horizontal focal-point (0..100) for object-position on the hero screenshot. Used when the image is wider than 16:9. 50 = center.';
