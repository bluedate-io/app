-- Add datingModeCompleted flag so we know if the user has explicitly
-- chosen Date vs BFF during onboarding (step 3).

ALTER TABLE "preferences"
ADD COLUMN "datingModeCompleted" BOOLEAN NOT NULL DEFAULT FALSE;

