-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('PROFESSIONAL', 'MODERN', 'CREATIVE', 'ATS_OPTIMIZED', 'MINIMAL');

-- CreateEnum  
CREATE TYPE "ProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'COHERE', 'MISTRAL');

-- Step 1: Add new enum columns as nullable
ALTER TABLE "ResumeTemplate" ADD COLUMN "categoryNew" "TemplateCategory";
ALTER TABLE "ApiProvider" ADD COLUMN "providerNew" "ProviderType";

-- Step 2: Migrate data from string to enum
-- Map existing template categories to enum values
UPDATE "ResumeTemplate" 
SET "categoryNew" = CASE 
    WHEN UPPER("category") = 'PROFESSIONAL' THEN 'PROFESSIONAL'::"TemplateCategory"
    WHEN UPPER("category") = 'MODERN' THEN 'MODERN'::"TemplateCategory"
    WHEN UPPER("category") = 'CREATIVE' THEN 'CREATIVE'::"TemplateCategory"
    WHEN UPPER("category") LIKE '%ATS%' OR UPPER("category") LIKE '%OPTIMIZED%' THEN 'ATS_OPTIMIZED'::"TemplateCategory"
    WHEN UPPER("category") = 'MINIMAL' THEN 'MINIMAL'::"TemplateCategory"
    ELSE 'PROFESSIONAL'::"TemplateCategory"  -- Default fallback
END;

-- Map existing provider types to enum values
UPDATE "ApiProvider"
SET "providerNew" = CASE
    WHEN LOWER("provider") = 'openai' THEN 'OPENAI'::"ProviderType"
    WHEN LOWER("provider") = 'anthropic' THEN 'ANTHROPIC'::"ProviderType"
    WHEN LOWER("provider") = 'google' THEN 'GOOGLE'::"ProviderType"
    WHEN LOWER("provider") = 'cohere' THEN 'COHERE'::"ProviderType"
    WHEN LOWER("provider") = 'mistral' THEN 'MISTRAL'::"ProviderType"
    ELSE 'OPENAI'::"ProviderType"  -- Default fallback
END;

-- Step 3: Drop old columns and rename new columns
ALTER TABLE "ResumeTemplate" DROP COLUMN "category";
ALTER TABLE "ResumeTemplate" DROP COLUMN "version";
ALTER TABLE "ResumeTemplate" RENAME COLUMN "categoryNew" TO "category";
ALTER TABLE "ResumeTemplate" ALTER COLUMN "category" SET NOT NULL;

ALTER TABLE "ApiProvider" DROP COLUMN "provider";
ALTER TABLE "ApiProvider" DROP COLUMN "keyPreview";
ALTER TABLE "ApiProvider" DROP COLUMN "models";
ALTER TABLE "ApiProvider" RENAME COLUMN "providerNew" TO "provider";
ALTER TABLE "ApiProvider" ALTER COLUMN "provider" SET NOT NULL;

-- Step 4: Drop old index and create new one with enum
DROP INDEX IF EXISTS "ResumeTemplate_category_idx";
CREATE INDEX "ResumeTemplate_category_idx" ON "ResumeTemplate"("category");

-- Step 5: Update ApiProvider indexes
DROP INDEX IF EXISTS "ApiProvider_provider_idx";
DROP INDEX IF EXISTS "ApiProvider_userId_idx";
CREATE INDEX "ApiProvider_userId_provider_idx" ON "ApiProvider"("userId", "provider");
