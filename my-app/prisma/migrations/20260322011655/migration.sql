-- DropIndex
DROP INDEX "users_phone_idx";

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
