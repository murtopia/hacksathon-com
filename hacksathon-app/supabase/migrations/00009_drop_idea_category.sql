-- ============================================
-- Drop the IdeaLab `category` field.
-- The field was introduced in 00006 from an early version of the
-- Session 2 doc but wasn't actually wanted in the product. No data
-- has been entered against it yet (only event in prod is the M2 test
-- event with no ideas), so we drop both the CHECK constraint and the
-- column outright rather than leaving a dead column behind.
-- ============================================

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_category_check;
ALTER TABLE ideas DROP COLUMN     IF EXISTS category;
