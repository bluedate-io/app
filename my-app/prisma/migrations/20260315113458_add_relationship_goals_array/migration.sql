-- AlterTable
ALTER TABLE "preferences" ADD COLUMN     "relationshipGoals" TEXT[] DEFAULT ARRAY[]::TEXT[];
