/*
  Warnings:

  - You are about to drop the column `category` on the `ResumeTemplate` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ResumeTemplate_category_idx";

-- AlterTable
ALTER TABLE "ResumeTemplate" DROP COLUMN "category",
ALTER COLUMN "description" DROP NOT NULL;
