/*
  Warnings:

  - You are about to drop the column `life_experiences` on the `personalities` table. All the data in the column will be lost.
  - You are about to drop the column `life_experiences_completed` on the `personalities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "personalities" DROP COLUMN "life_experiences",
DROP COLUMN "life_experiences_completed",
ADD COLUMN     "lifeExperiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lifeExperiencesCompleted" BOOLEAN NOT NULL DEFAULT false;
