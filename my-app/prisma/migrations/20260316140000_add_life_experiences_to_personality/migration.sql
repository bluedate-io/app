-- Add life_experiences and life_experiences_completed to personalities

ALTER TABLE "personalities"
ADD COLUMN IF NOT EXISTS "life_experiences" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "life_experiences_completed" BOOLEAN DEFAULT FALSE;

