/*
  Warnings:

  - Added the required column `name` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserProfile_userId_idx";

-- DropIndex
DROP INDEX "public"."UserProfile_userId_key";

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Default Profile';

-- Set first profile for each user as default
UPDATE "UserProfile" SET "isDefault" = true 
WHERE "id" IN (
  SELECT "id" FROM "UserProfile" 
  WHERE "id" IN (
    SELECT MIN("id") FROM "UserProfile" GROUP BY "userId"
  )
);

-- Remove default constraint after setting values
ALTER TABLE "UserProfile" ALTER COLUMN "name" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "UserProfile_userId_createdAt_idx" ON "UserProfile"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserProfile_userId_isDefault_idx" ON "UserProfile"("userId", "isDefault");
