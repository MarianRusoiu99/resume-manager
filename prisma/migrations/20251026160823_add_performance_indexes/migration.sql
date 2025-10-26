-- DropIndex
DROP INDEX "public"."GeneratedResume_userId_createdAt_idx";

-- CreateIndex
CREATE INDEX "APIKey_userId_isActive_idx" ON "APIKey"("userId", "isActive");

-- CreateIndex
CREATE INDEX "GeneratedResume_userId_createdAt_idx" ON "GeneratedResume"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GeneratedResume_userId_updatedAt_idx" ON "GeneratedResume"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "GeneratedResume_templateId_idx" ON "GeneratedResume"("templateId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_updatedAt_idx" ON "UserProfile"("updatedAt");
