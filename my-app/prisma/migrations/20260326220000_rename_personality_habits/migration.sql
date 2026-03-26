-- Rename personality habit columns without data loss
ALTER TABLE "personalities"
  RENAME COLUMN "socialLevel" TO "smokingHabit";

ALTER TABLE "personalities"
  RENAME COLUMN "conversationStyle" TO "drinkingHabit";
