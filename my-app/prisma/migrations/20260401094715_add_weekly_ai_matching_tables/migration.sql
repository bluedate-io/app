/*
  Warnings:

  - You are about to drop the column `candidate_user_id` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `hard_filter_passed` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `prune_reason` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `run_id` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `match_candidates` table. All the data in the column will be lost.
  - You are about to drop the column `candidate_user_id` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `error_message` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `reason_code` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `run_id` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `step_name` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `match_failures_dead_letter` table. All the data in the column will be lost.
  - You are about to drop the column `ai_score` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `candidate_user_id` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `final_score` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `rule_score` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `run_id` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `used_fallback` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `match_scores` table. All the data in the column will be lost.
  - You are about to drop the column `canary_percentage` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `dry_run` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `failures_count` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `fallback_count` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `finished_at` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `model_name` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `pairs_considered` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `pairs_scored` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `published_count` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `requested_by_user_id` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `users_processed` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `week_key` on the `matching_runs` table. All the data in the column will be lost.
  - You are about to drop the column `matched_user_id` on the `published_matches` table. All the data in the column will be lost.
  - You are about to drop the column `published_at` on the `published_matches` table. All the data in the column will be lost.
  - You are about to drop the column `run_id` on the `published_matches` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `published_matches` table. All the data in the column will be lost.
  - You are about to drop the column `week_key` on the `published_matches` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[runId,userId,candidateUserId]` on the table `match_candidates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[runId,userId,candidateUserId]` on the table `match_scores` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[weekKey]` on the table `matching_runs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[weekKey,userId,matchedUserId]` on the table `published_matches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `candidateUserId` to the `match_candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runId` to the `match_candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `match_candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidateUserId` to the `match_failures_dead_letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reasonCode` to the `match_failures_dead_letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runId` to the `match_failures_dead_letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepName` to the `match_failures_dead_letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `match_failures_dead_letter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidateUserId` to the `match_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runId` to the `match_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `match_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `match_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `matching_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekKey` to the `matching_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchedUserId` to the `published_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runId` to the `published_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `published_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekKey` to the `published_matches` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "match_candidates" DROP CONSTRAINT "match_candidates_candidate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "match_candidates" DROP CONSTRAINT "match_candidates_run_id_fkey";

-- DropForeignKey
ALTER TABLE "match_candidates" DROP CONSTRAINT "match_candidates_user_id_fkey";

-- DropForeignKey
ALTER TABLE "match_failures_dead_letter" DROP CONSTRAINT "match_failures_dead_letter_candidate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "match_failures_dead_letter" DROP CONSTRAINT "match_failures_dead_letter_run_id_fkey";

-- DropForeignKey
ALTER TABLE "match_failures_dead_letter" DROP CONSTRAINT "match_failures_dead_letter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "match_scores" DROP CONSTRAINT "match_scores_candidate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "match_scores" DROP CONSTRAINT "match_scores_run_id_fkey";

-- DropForeignKey
ALTER TABLE "match_scores" DROP CONSTRAINT "match_scores_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matching_runs" DROP CONSTRAINT "matching_runs_requested_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "published_matches" DROP CONSTRAINT "published_matches_matched_user_id_fkey";

-- DropForeignKey
ALTER TABLE "published_matches" DROP CONSTRAINT "published_matches_run_id_fkey";

-- DropForeignKey
ALTER TABLE "published_matches" DROP CONSTRAINT "published_matches_user_id_fkey";

-- DropIndex
DROP INDEX "match_candidates_run_id_user_id_candidate_user_id_key";

-- DropIndex
DROP INDEX "match_candidates_run_id_user_id_idx";

-- DropIndex
DROP INDEX "match_failures_dead_letter_run_id_step_name_created_at_idx";

-- DropIndex
DROP INDEX "match_scores_run_id_user_id_candidate_user_id_key";

-- DropIndex
DROP INDEX "match_scores_run_id_user_id_final_score_idx";

-- DropIndex
DROP INDEX "matching_runs_status_started_at_idx";

-- DropIndex
DROP INDEX "matching_runs_week_key_key";

-- DropIndex
DROP INDEX "published_matches_week_key_user_id_matched_user_id_key";

-- DropIndex
DROP INDEX "published_matches_week_key_user_id_rank_idx";

-- AlterTable
ALTER TABLE "match_candidates" DROP COLUMN "candidate_user_id",
DROP COLUMN "created_at",
DROP COLUMN "hard_filter_passed",
DROP COLUMN "prune_reason",
DROP COLUMN "run_id",
DROP COLUMN "user_id",
ADD COLUMN     "candidateUserId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hardFilterPassed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pruneReason" TEXT,
ADD COLUMN     "runId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "match_failures_dead_letter" DROP COLUMN "candidate_user_id",
DROP COLUMN "created_at",
DROP COLUMN "error_message",
DROP COLUMN "reason_code",
DROP COLUMN "run_id",
DROP COLUMN "step_name",
DROP COLUMN "user_id",
ADD COLUMN     "candidateUserId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "reasonCode" TEXT NOT NULL,
ADD COLUMN     "runId" TEXT NOT NULL,
ADD COLUMN     "stepName" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "match_scores" DROP COLUMN "ai_score",
DROP COLUMN "candidate_user_id",
DROP COLUMN "created_at",
DROP COLUMN "final_score",
DROP COLUMN "rule_score",
DROP COLUMN "run_id",
DROP COLUMN "updated_at",
DROP COLUMN "used_fallback",
DROP COLUMN "user_id",
ADD COLUMN     "aiScore" INTEGER,
ADD COLUMN     "candidateUserId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "finalScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ruleScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedFallback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "matching_runs" DROP COLUMN "canary_percentage",
DROP COLUMN "created_at",
DROP COLUMN "dry_run",
DROP COLUMN "failures_count",
DROP COLUMN "fallback_count",
DROP COLUMN "finished_at",
DROP COLUMN "model_name",
DROP COLUMN "pairs_considered",
DROP COLUMN "pairs_scored",
DROP COLUMN "published_count",
DROP COLUMN "requested_by_user_id",
DROP COLUMN "started_at",
DROP COLUMN "updated_at",
DROP COLUMN "users_processed",
DROP COLUMN "week_key",
ADD COLUMN     "canaryPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dryRun" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "failuresCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fallbackCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "modelName" TEXT,
ADD COLUMN     "pairsConsidered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pairsScored" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publishedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requestedByUserId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usersProcessed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "published_matches" DROP COLUMN "matched_user_id",
DROP COLUMN "published_at",
DROP COLUMN "run_id",
DROP COLUMN "user_id",
DROP COLUMN "week_key",
ADD COLUMN     "matchedUserId" TEXT NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "runId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "weekKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "match_candidates_runId_userId_idx" ON "match_candidates"("runId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "match_candidates_runId_userId_candidateUserId_key" ON "match_candidates"("runId", "userId", "candidateUserId");

-- CreateIndex
CREATE INDEX "match_failures_dead_letter_runId_stepName_createdAt_idx" ON "match_failures_dead_letter"("runId", "stepName", "createdAt");

-- CreateIndex
CREATE INDEX "match_scores_runId_userId_finalScore_idx" ON "match_scores"("runId", "userId", "finalScore");

-- CreateIndex
CREATE UNIQUE INDEX "match_scores_runId_userId_candidateUserId_key" ON "match_scores"("runId", "userId", "candidateUserId");

-- CreateIndex
CREATE UNIQUE INDEX "matching_runs_weekKey_key" ON "matching_runs"("weekKey");

-- CreateIndex
CREATE INDEX "matching_runs_status_startedAt_idx" ON "matching_runs"("status", "startedAt");

-- CreateIndex
CREATE INDEX "published_matches_weekKey_userId_rank_idx" ON "published_matches"("weekKey", "userId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "published_matches_weekKey_userId_matchedUserId_key" ON "published_matches"("weekKey", "userId", "matchedUserId");

-- AddForeignKey
ALTER TABLE "matching_runs" ADD CONSTRAINT "matching_runs_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_candidates" ADD CONSTRAINT "match_candidates_runId_fkey" FOREIGN KEY ("runId") REFERENCES "matching_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_candidates" ADD CONSTRAINT "match_candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_candidates" ADD CONSTRAINT "match_candidates_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_runId_fkey" FOREIGN KEY ("runId") REFERENCES "matching_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_matches" ADD CONSTRAINT "published_matches_runId_fkey" FOREIGN KEY ("runId") REFERENCES "matching_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_matches" ADD CONSTRAINT "published_matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "published_matches" ADD CONSTRAINT "published_matches_matchedUserId_fkey" FOREIGN KEY ("matchedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_failures_dead_letter" ADD CONSTRAINT "match_failures_dead_letter_runId_fkey" FOREIGN KEY ("runId") REFERENCES "matching_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_failures_dead_letter" ADD CONSTRAINT "match_failures_dead_letter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_failures_dead_letter" ADD CONSTRAINT "match_failures_dead_letter_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
