/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `templateCustomization` on the `GeneratedResume` table. All the data in the column will be lost.
  - You are about to drop the column `definition` on the `ResumeTemplate` table. All the data in the column will be lost.
  - Added the required column `cssStyles` to the `ResumeTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `htmlTemplate` to the `ResumeTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedResume" DROP COLUMN "pdfUrl",
DROP COLUMN "templateCustomization";

-- AlterTable
ALTER TABLE "ResumeTemplate" DROP COLUMN "definition",
ADD COLUMN     "cssStyles" TEXT NOT NULL,
ADD COLUMN     "htmlTemplate" TEXT NOT NULL;
