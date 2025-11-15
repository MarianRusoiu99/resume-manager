-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "selectedTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "UserProfile_selectedTemplateId_idx" ON "UserProfile"("selectedTemplateId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_selectedTemplateId_fkey" FOREIGN KEY ("selectedTemplateId") REFERENCES "ResumeTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
