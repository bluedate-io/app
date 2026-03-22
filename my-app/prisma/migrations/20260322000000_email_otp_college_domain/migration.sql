-- Migration: email_otp_college_domain
-- Replace phone-based Twilio OTP with email OTP + college domain validation

-- 1. Make phone nullable on users (email becomes the primary auth identifier)
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;

-- 2. Add collegeName to users
ALTER TABLE "users" ADD COLUMN "collegeName" TEXT;

-- 3. Create college_domains table
CREATE TABLE "college_domains" (
    "id" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "college_domains_collegeName_key" ON "college_domains"("collegeName");
CREATE UNIQUE INDEX "college_domains_domain_key" ON "college_domains"("domain");

-- 4. Create email_otps table
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_otps_email_idx" ON "email_otps"("email");
