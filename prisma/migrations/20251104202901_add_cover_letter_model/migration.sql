/*
  Warnings:

  - You are about to drop the column `atsScore` on the `ResumeTemplate` table. All the data in the column will be lost.
  - You are about to drop the `APIKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."APIKey" DROP CONSTRAINT "APIKey_userId_fkey";

-- AlterTable
ALTER TABLE "ResumeTemplate" DROP COLUMN "atsScore";

-- DropTable
DROP TABLE "public"."APIKey";

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "resumeId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoverLetter_userId_createdAt_idx" ON "CoverLetter"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CoverLetter_resumeId_idx" ON "CoverLetter"("resumeId");

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "GeneratedResume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
