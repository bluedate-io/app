-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('student', 'non_student');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'student';

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "subArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE UNIQUE INDEX "locations_city_subArea_key" ON "locations"("city", "subArea");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
