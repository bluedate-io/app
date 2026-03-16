-- AlterTable
ALTER TABLE "personalities" ADD COLUMN     "politics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "religion" TEXT[] DEFAULT ARRAY[]::TEXT[];
