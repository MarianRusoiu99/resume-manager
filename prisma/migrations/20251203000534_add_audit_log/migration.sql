-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PROFILE_CREATE', 'PROFILE_UPDATE', 'PROFILE_DELETE', 'PROFILE_SET_DEFAULT', 'PROFILE_PUBLISH', 'RESUME_CREATE', 'RESUME_UPDATE', 'RESUME_DELETE', 'RESUME_GENERATE', 'RESUME_EXPORT_PDF', 'COVER_LETTER_CREATE', 'COVER_LETTER_UPDATE', 'COVER_LETTER_DELETE', 'COVER_LETTER_GENERATE', 'TEMPLATE_CREATE', 'TEMPLATE_UPDATE', 'TEMPLATE_DELETE', 'API_KEY_ADD', 'API_KEY_UPDATE', 'API_KEY_DELETE', 'SETTINGS_UPDATE');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);
