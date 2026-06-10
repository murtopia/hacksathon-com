-- ============================================
-- Waitlist: re-bucket team_size values.
--
-- Original buckets ('1-5','6-15','16-50','51-200','200+') were generic
-- SaaS sizing and didn't match the kinds of teams running a real
-- Hacks-a-Thon. New buckets focus on the sizes we actually plan around:
-- a single squad, a department, a small org, and a larger org.
--
-- Mapping for any pre-existing rows uses the best-fit overlap. Where
-- old buckets straddle a new boundary we lean toward the lower new
-- bucket so we don't inflate apparent demand.
-- ============================================

ALTER TABLE waitlist_signups
  DROP CONSTRAINT IF EXISTS waitlist_team_size_check;

UPDATE waitlist_signups
SET team_size = CASE team_size
  WHEN '1-5'     THEN '1-10'
  WHEN '6-15'    THEN '11-25'
  WHEN '16-50'   THEN '26-50'
  WHEN '51-200'  THEN '51+'
  WHEN '200+'    THEN '51+'
  ELSE team_size
END
WHERE team_size IN ('1-5','6-15','16-50','51-200','200+');

ALTER TABLE waitlist_signups
  ADD CONSTRAINT waitlist_team_size_check
  CHECK (team_size IN ('1-10','11-25','26-50','51+'));
