ALTER TABLE "ForfeitRequest" ADD COLUMN "siteId" TEXT;
ALTER TABLE "Score" ADD COLUMN "siteId" TEXT;
ALTER TABLE "CheckInSession" ADD COLUMN "siteId" TEXT;
ALTER TABLE "CheckIn" ADD COLUMN "siteId" TEXT;

UPDATE "ForfeitRequest" AS request
SET "siteId" = enrollment."siteId"
FROM "Enrollment" AS enrollment
WHERE request."enrollmentId" = enrollment."id";

UPDATE "Score" AS score
SET "siteId" = enrollment."siteId"
FROM "Enrollment" AS enrollment
WHERE score."enrollmentId" = enrollment."id";

UPDATE "CheckIn" AS check_in
SET "siteId" = enrollment."siteId"
FROM "Enrollment" AS enrollment
WHERE check_in."enrollmentId" = enrollment."id";

UPDATE "CheckInSession" SET "siteId" = 'a0000000-0000-4000-8000-000000000001';

ALTER TABLE "ForfeitRequest" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "Score" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "CheckInSession" ALTER COLUMN "siteId" SET NOT NULL;
ALTER TABLE "CheckIn" ALTER COLUMN "siteId" SET NOT NULL;

CREATE INDEX "ForfeitRequest_siteId_status_idx" ON "ForfeitRequest"("siteId", "status");
CREATE INDEX "Score_siteId_idx" ON "Score"("siteId");
CREATE INDEX "CheckInSession_siteId_isActive_academicYear_examRound_idx"
ON "CheckInSession"("siteId", "isActive", "academicYear", "examRound");
CREATE INDEX "CheckIn_siteId_scannedAt_idx" ON "CheckIn"("siteId", "scannedAt");

ALTER TABLE "ForfeitRequest" ADD CONSTRAINT "ForfeitRequest_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Score" ADD CONSTRAINT "Score_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckInSession" ADD CONSTRAINT "CheckInSession_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
