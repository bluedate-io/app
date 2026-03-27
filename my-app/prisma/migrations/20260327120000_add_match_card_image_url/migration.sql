-- AlterTable
ALTER TABLE "matches" ADD COLUMN "cardImageUrl" TEXT;

-- Move URL-only blurbs (S3 card URLs) into cardImageUrl
UPDATE "matches"
SET "cardImageUrl" = "blurb",
    "blurb" = NULL
WHERE "blurb" IS NOT NULL
  AND ("blurb" LIKE 'http://%' OR "blurb" LIKE 'https://%');
