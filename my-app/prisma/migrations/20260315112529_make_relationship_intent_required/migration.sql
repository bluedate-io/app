/*
  Warnings:

  - Made the column `relationshipIntent` on table `preferences` required. This step will fail if there are existing NULL values in that column.

*/
-- Set existing NULL relationshipIntent to default before making column required
UPDATE "preferences" SET "relationshipIntent" = 'date' WHERE "relationshipIntent" IS NULL;

-- AlterTable
ALTER TABLE "preferences" ALTER COLUMN "relationshipIntent" SET NOT NULL;
