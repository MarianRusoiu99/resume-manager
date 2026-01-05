/*
  Warnings:

  - You are about to drop the column `cssStyles` on the `ResumeTemplate` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CoverLetter_userId_updatedAt_idx";

-- DropIndex
DROP INDEX "Notification_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Resume_userId_updatedAt_idx";

-- AlterTable
ALTER TABLE "ResumeTemplate" DROP COLUMN "cssStyles";

-- DropEnum
DROP TYPE "TemplateCategory";

-- CreateIndex
CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_type_idx" ON "Notification"("userId", "createdAt" DESC, "type");

-- CreateIndex
CREATE INDEX "Resume_userId_updatedAt_idx" ON "Resume"("userId", "updatedAt" DESC);
