-- CreateTable
CREATE TABLE "admin_onboarding_reminder_sends" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentByUserId" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "recipientUserIds" TEXT[],

    CONSTRAINT "admin_onboarding_reminder_sends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_onboarding_reminder_sends_sentAt_idx" ON "admin_onboarding_reminder_sends"("sentAt");

-- AddForeignKey
ALTER TABLE "admin_onboarding_reminder_sends" ADD CONSTRAINT "admin_onboarding_reminder_sends_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
