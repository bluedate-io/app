-- Delete existing plaintext OTPs (all expired under the 10-min TTL)
DELETE FROM "email_otps";

-- AlterTable: replace plaintext `code` with hashed `codeHash`
ALTER TABLE "email_otps" DROP COLUMN "code";

ALTER TABLE "email_otps" ADD COLUMN "codeHash" TEXT NOT NULL;