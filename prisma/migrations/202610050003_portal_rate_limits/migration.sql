CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitBucket_siteId_bucketKey_key"
ON "RateLimitBucket"("siteId", "bucketKey");

CREATE INDEX "RateLimitBucket_windowEndsAt_idx"
ON "RateLimitBucket"("windowEndsAt");

ALTER TABLE "RateLimitBucket"
ADD CONSTRAINT "RateLimitBucket_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
