ALTER TABLE "ImportFile" ADD COLUMN "rolledBackAt" TIMESTAMP(3);
ALTER TABLE "ImportFile" ADD COLUMN "rolledBackById" TEXT;

CREATE TABLE "ImportMutation" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "importFileId" TEXT,
    "previewId" TEXT,
    "modelName" TEXT NOT NULL,
    "recordId" TEXT,
    "action" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportMutation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportMutation_siteId_importFileId_createdAt_idx"
ON "ImportMutation"("siteId", "importFileId", "createdAt");
CREATE INDEX "ImportMutation_siteId_modelName_recordId_idx"
ON "ImportMutation"("siteId", "modelName", "recordId");
CREATE INDEX "ImportMutation_siteId_previewId_createdAt_idx"
ON "ImportMutation"("siteId", "previewId", "createdAt");

CREATE TABLE "ImportPreview" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "fileManifest" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),
    CONSTRAINT "ImportPreview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportPreview_siteId_createdById_status_expiresAt_idx"
ON "ImportPreview"("siteId", "createdById", "status", "expiresAt");

ALTER TABLE "ImportMutation" ADD CONSTRAINT "ImportMutation_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportMutation" ADD CONSTRAINT "ImportMutation_importFileId_fkey"
FOREIGN KEY ("importFileId") REFERENCES "ImportFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportMutation" ADD CONSTRAINT "ImportMutation_previewId_fkey"
FOREIGN KEY ("previewId") REFERENCES "ImportPreview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportPreview" ADD CONSTRAINT "ImportPreview_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportPreview" ADD CONSTRAINT "ImportPreview_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
