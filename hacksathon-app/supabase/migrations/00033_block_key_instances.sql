-- ============================================
-- Block key instances: extra Shark Tank / Showcase sessions
--
-- Large teams need more than one Shark Tank pitch slot or Showcase
-- window. Rather than refactor the fixed 10-key block enum, admins can
-- add "continuation" sessions that reuse a base key's behavior via an
-- instance suffix:
--
--   02     Shark Tank        ->  02-2, 02-3, 02-4 ...
--   FINAL  Showcase Showdown ->  FINAL-2, FINAL-3, FINAL-4 ...
--
-- The application maps an instance key back to its base (see
-- lib/blocks/status.ts baseBlockKey) so it renders the same participant
-- screen. The per-type cap is enforced in app code, so the CHECK only
-- needs to allow the instance shape - no future migration to change the
-- cap.
-- ============================================

-- blocks: allow the canonical 10 keys OR an instance of 02 / FINAL.
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_block_key_check;
ALTER TABLE blocks
  ADD CONSTRAINT blocks_block_key_check
  CHECK (
    block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02')
    OR block_key ~ '^(02|FINAL)-[0-9]+$'
  );

-- block_completions: keep its key surface in sync with blocks.
ALTER TABLE block_completions DROP CONSTRAINT IF EXISTS block_completions_block_key_check;
ALTER TABLE block_completions
  ADD CONSTRAINT block_completions_block_key_check
  CHECK (
    block_key IN ('ZERO','01','02','03','04','05','06','FINAL','+01','+02')
    OR block_key ~ '^(02|FINAL)-[0-9]+$'
  );
