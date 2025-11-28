-- CreateTable
CREATE TABLE "ApiProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyPreview" TEXT NOT NULL,
    "models" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ApiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiProvider_userId_idx" ON "ApiProvider"("userId");

-- CreateIndex
CREATE INDEX "ApiProvider_userId_isActive_idx" ON "ApiProvider"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ApiProvider_provider_idx" ON "ApiProvider"("provider");

-- AddForeignKey
ALTER TABLE "ApiProvider" ADD CONSTRAINT "ApiProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
