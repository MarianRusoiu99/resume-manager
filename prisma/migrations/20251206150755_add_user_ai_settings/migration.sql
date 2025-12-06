-- CreateTable
CREATE TABLE "UserAISettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeProviderId" TEXT,
    "resumeModelId" TEXT,
    "coverLetterProviderId" TEXT,
    "coverLetterModelId" TEXT,
    "enhanceProviderId" TEXT,
    "enhanceModelId" TEXT,
    "templateProviderId" TEXT,
    "templateModelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAISettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAISettings_userId_key" ON "UserAISettings"("userId");

-- CreateIndex
CREATE INDEX "UserAISettings_userId_idx" ON "UserAISettings"("userId");

-- AddForeignKey
ALTER TABLE "UserAISettings" ADD CONSTRAINT "UserAISettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
