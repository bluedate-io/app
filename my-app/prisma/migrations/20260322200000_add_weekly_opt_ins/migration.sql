-- Create weekly_opt_ins table

CREATE TABLE "weekly_opt_ins" (
    "id"          TEXT         NOT NULL,
    "userId"      TEXT         NOT NULL,
    "weekStart"   TIMESTAMP(3) NOT NULL,
    "mode"        TEXT         NOT NULL,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_opt_ins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weekly_opt_ins_userId_weekStart_key" ON "weekly_opt_ins"("userId", "weekStart");
CREATE INDEX "weekly_opt_ins_weekStart_idx" ON "weekly_opt_ins"("weekStart");

ALTER TABLE "weekly_opt_ins"
    ADD CONSTRAINT "weekly_opt_ins_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
