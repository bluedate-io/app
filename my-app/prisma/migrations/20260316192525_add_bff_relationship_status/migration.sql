-- AlterTable
ALTER TABLE "personalities" ADD COLUMN     "relationshipStatus" TEXT,
ADD COLUMN     "relationshipStatusCompleted" BOOLEAN NOT NULL DEFAULT false;
