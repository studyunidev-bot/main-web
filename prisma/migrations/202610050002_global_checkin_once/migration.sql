-- Preserve historical scans while normalizing subsequent successful scans.
-- A SUCCESS row is the authoritative check-in for one enrollment across all sessions.
WITH ranked_successes AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "enrollmentId"
    ORDER BY "scannedAt" ASC, "id" ASC
  ) AS position
  FROM "CheckIn"
  WHERE "status" = 'SUCCESS'
)
UPDATE "CheckIn" AS check_in
SET "status" = 'DUPLICATE',
    "note" = concat_ws(E'\n', NULLIF(check_in."note", ''), 'Migration: historical duplicate success retained as DUPLICATE')
FROM ranked_successes
WHERE check_in."id" = ranked_successes."id"
  AND ranked_successes.position > 1;

CREATE UNIQUE INDEX "CheckIn_one_success_per_enrollment_key"
ON "CheckIn" ("enrollmentId")
WHERE "status" = 'SUCCESS';
