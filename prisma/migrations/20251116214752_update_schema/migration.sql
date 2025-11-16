/*
  Warnings:

  - You are about to drop the column `contentJson` on the `CoverLetter` table. All the data in the column will be lost.
  - You are about to drop the column `resumeId` on the `CoverLetter` table. All the data in the column will be lost.
  - You are about to drop the column `coverLetter` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `selectedTemplateId` on the `UserProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[coverLetterId]` on the table `GeneratedResume` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CoverLetter" DROP CONSTRAINT "CoverLetter_resumeId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_selectedTemplateId_fkey";

-- DropIndex
DROP INDEX "CoverLetter_resumeId_idx";

-- DropIndex
DROP INDEX "GeneratedResume_templateId_idx";

-- DropIndex
DROP INDEX "UserProfile_selectedTemplateId_idx";

-- AlterTable
ALTER TABLE "CoverLetter" DROP COLUMN "contentJson",
DROP COLUMN "resumeId";

-- AlterTable
ALTER TABLE "GeneratedResume" DROP COLUMN "coverLetter",
ADD COLUMN     "coverLetterId" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "selectedTemplateId",
ADD COLUMN     "templateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedResume_coverLetterId_key" ON "GeneratedResume"("coverLetterId");

-- CreateIndex
CREATE INDEX "UserProfile_templateId_idx" ON "UserProfile"("templateId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ResumeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedResume" ADD CONSTRAINT "GeneratedResume_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
