-- Track when the user has explicitly advanced past the photos step

ALTER TABLE "preferences"
ADD COLUMN IF NOT EXISTS "photosStepCompleted" BOOLEAN NOT NULL DEFAULT FALSE;

