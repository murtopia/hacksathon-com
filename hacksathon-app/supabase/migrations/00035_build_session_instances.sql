-- ============================================
-- Build session instances: extra build sessions for big teams
--
-- Extends the instance-key mechanism from 00033 to also cover build
-- sessions. A big team can add extra build time after Build Session 3:
--
--   06  Build Session 3  ->  06-2, 06-3, 06-4 (shown as "Build Session 4/5/6")
--
-- Same as 02 / FINAL, the app maps an instance key back to its base
-- (see lib/blocks/status.ts baseBlockKey) so it renders the same build
-- screen. The per-type cap stays in app code.
-- ============================================

ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_block_key_check;
ALTER TABLE blocks
  ADD CONSTRAINT blocks_block_key_check
  CHECK (
    block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02')
    OR block_key ~ '^(02|06|FINAL)-[0-9]+$'
  );

ALTER TABLE block_completions DROP CONSTRAINT IF EXISTS block_completions_block_key_check;
ALTER TABLE block_completions
  ADD CONSTRAINT block_completions_block_key_check
  CHECK (
    block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02')
    OR block_key ~ '^(02|06|FINAL)-[0-9]+$'
  );
