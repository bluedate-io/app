-- CreateEnum
CREATE TYPE "OptInStatus" AS ENUM ('opted_in', 'opted_out', 'opted_in_late');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "optInStatus"   "OptInStatus" NOT NULL DEFAULT 'opted_in',
  ADD COLUMN "optedInAt"     TIMESTAMP(3),
  ADD COLUMN "lastMatchedAt" TIMESTAMP(3);
