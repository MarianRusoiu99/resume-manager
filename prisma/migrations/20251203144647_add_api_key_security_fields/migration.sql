-- CreateEnum
CREATE TYPE "ApiKeyAuditAction" AS ENUM ('KEY_CREATED', 'KEY_ROTATED', 'KEY_REVOKED', 'KEY_DELETED', 'KEY_DECRYPTED', 'KEY_VALIDATED', 'KEY_USED', 'KEY_SCOPE_CHANGED');

-- AlterTable
ALTER TABLE "ApiProvider" ADD COLUMN     "keyVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastUsedIp" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY['generate', 'validate']::TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ApiKeyAuditLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "action" "ApiKeyAuditAction" NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKeyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiKeyAuditLog_providerId_timestamp_idx" ON "ApiKeyAuditLog"("providerId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "ApiKeyAuditLog_userId_timestamp_idx" ON "ApiKeyAuditLog"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "ApiKeyAuditLog_action_timestamp_idx" ON "ApiKeyAuditLog"("action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "ApiProvider_revokedAt_idx" ON "ApiProvider"("revokedAt");

-- AddForeignKey
ALTER TABLE "ApiKeyAuditLog" ADD CONSTRAINT "ApiKeyAuditLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ApiProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
