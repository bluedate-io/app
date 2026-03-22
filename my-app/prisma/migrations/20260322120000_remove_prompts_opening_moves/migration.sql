-- Drop prompts and opening_moves tables, and remove promptsCompleted from preferences

DROP TABLE IF EXISTS "prompts";
DROP TABLE IF EXISTS "opening_moves";
ALTER TABLE "preferences" DROP COLUMN IF EXISTS "promptsCompleted";
