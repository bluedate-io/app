-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('active', 'unmatched');

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "matchedBy" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'active',
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unmatchedAt" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_skips" (
    "id" TEXT NOT NULL,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "skippedBy" TEXT NOT NULL,
    "skippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_skips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_userId1_idx" ON "matches"("userId1");

-- CreateIndex
CREATE INDEX "matches_userId2_idx" ON "matches"("userId2");

-- CreateIndex
CREATE UNIQUE INDEX "matches_userId1_userId2_key" ON "matches"("userId1", "userId2");

-- CreateIndex
CREATE INDEX "admin_skips_userId1_idx" ON "admin_skips"("userId1");

-- CreateIndex
CREATE INDEX "admin_skips_userId2_idx" ON "admin_skips"("userId2");

-- CreateIndex
CREATE UNIQUE INDEX "admin_skips_userId1_userId2_key" ON "admin_skips"("userId1", "userId2");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchedBy_fkey" FOREIGN KEY ("matchedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_skips" ADD CONSTRAINT "admin_skips_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_skips" ADD CONSTRAINT "admin_skips_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_skips" ADD CONSTRAINT "admin_skips_skippedBy_fkey" FOREIGN KEY ("skippedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
