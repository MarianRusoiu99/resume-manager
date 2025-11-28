/*
  Warnings:

  - A unique constraint covering the columns `[publicSlug]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_publicSlug_key" ON "UserProfile"("publicSlug");

-- CreateIndex
CREATE INDEX "UserProfile_publicSlug_idx" ON "UserProfile"("publicSlug");
