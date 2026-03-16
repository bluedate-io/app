-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'moderator');

-- CreateEnum
CREATE TYPE "InviteCodeStatus" AS ENUM ('active', 'used');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "nickname" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "city" TEXT,
    "bio" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "genderIdentity" TEXT,
    "genderPreference" TEXT[],
    "ageRangeMin" INTEGER,
    "ageRangeMax" INTEGER,
    "relationshipIntent" TEXT,
    "relationshipGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "heightCm" INTEGER,
    "heightCompleted" BOOLEAN NOT NULL DEFAULT false,
    "datingModeCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hobbies" TEXT[],
    "favouriteActivities" TEXT[],
    "musicTaste" TEXT[],
    "foodTaste" TEXT[],
    "bffInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bffInterestsCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socialLevel" TEXT,
    "conversationStyle" TEXT,
    "funFact" TEXT,
    "kidsStatus" TEXT,
    "kidsPreference" TEXT,
    "religion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "politics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importantLifeCompleted" BOOLEAN NOT NULL DEFAULT false,
    "familyPlansCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lifeExperiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lifeExperiencesCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "days" TEXT[],
    "times" TEXT[],

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selfDescription" TEXT,
    "idealPartner" TEXT,
    "idealDate" TEXT,

    CONSTRAINT "ai_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "status" "InviteCodeStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'WELCOME',
    "tempData" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_userId_key" ON "preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "interests_userId_key" ON "interests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "personalities_userId_key" ON "personalities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_userId_key" ON "availabilities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_signals_userId_key" ON "ai_signals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE INDEX "invite_codes_createdById_idx" ON "invite_codes"("createdById");

-- CreateIndex
CREATE INDEX "invite_codes_usedById_idx" ON "invite_codes"("usedById");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_phone_key" ON "whatsapp_sessions"("phone");

-- CreateIndex
CREATE INDEX "photos_userId_idx" ON "photos"("userId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalities" ADD CONSTRAINT "personalities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_signals" ADD CONSTRAINT "ai_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
