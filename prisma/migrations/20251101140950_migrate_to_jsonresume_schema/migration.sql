/*
  Warnings:

  - You are about to drop the column `aiGeneratedContent` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `isEdited` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `resumeContent` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `sectionOrder` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `certifications` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `personalInfo` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `UserProfile` table. All the data in the column will be lost.
  - Added the required column `resume` to the `GeneratedResume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resume` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/

-- Note: Data migration will be handled programmatically via a separate TypeScript script
-- This migration adds the new columns with minimal defaults, then drops the old columns

-- AlterTable: Add new resume columns with minimal default
ALTER TABLE "GeneratedResume" ADD COLUMN "resume" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "UserProfile" ADD COLUMN "resume" JSONB NOT NULL DEFAULT '{}'::jsonb;

-- AlterTable: Drop old columns
ALTER TABLE "GeneratedResume" 
  DROP COLUMN "aiGeneratedContent",
  DROP COLUMN "isEdited",
  DROP COLUMN "resumeContent",
  DROP COLUMN "sectionOrder";

ALTER TABLE "UserProfile" 
  DROP COLUMN "certifications",
  DROP COLUMN "education",
  DROP COLUMN "experience",
  DROP COLUMN "languages",
  DROP COLUMN "personalInfo",
  DROP COLUMN "skills",
  DROP COLUMN "summary";

-- Remove default to match schema (keep existing data)
ALTER TABLE "GeneratedResume" ALTER COLUMN "resume" DROP DEFAULT;
ALTER TABLE "UserProfile" ALTER COLUMN "resume" DROP DEFAULT;
