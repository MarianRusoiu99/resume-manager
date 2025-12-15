/**
 * Resume Import API Route
 * Handles file uploads (PDF, Image, Word) and triggers AI extraction
 */

import { parseResumeFromText, parseResumeFromImage } from "@/lib/ai/resume-parser";
import mammoth from "mammoth";
import { createApiHandler } from "@/lib/api-handler";
import { apiProviderService } from "@/lib/services/api-provider.service";
import { failure, success } from "@/lib/types/service-result";

export const POST = createApiHandler<{ resume: unknown }>(async (request, context, session) => {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const fileTypeValue = formData.get("fileType");

    if (!(fileValue instanceof File)) {
        return failure("No file provided", "VALIDATION_ERROR");
    }

    if (typeof fileTypeValue !== "string" || !fileTypeValue.trim()) {
        return failure("No file type provided", "VALIDATION_ERROR");
    }

    const file = fileValue;
    const fileType = fileTypeValue;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        return failure("File size must be less than 10MB", "VALIDATION_ERROR");
    }

    // Get API key from user's configured providers
    const providerResult = await apiProviderService.getFirstActiveProvider(session.user.id);
    if (!providerResult.success) {
        // Treat missing API key as a user-fixable 400 for this endpoint.
        const mappedCode = providerResult.code === "NOT_FOUND" ? "VALIDATION_ERROR" : providerResult.code;
        return failure(providerResult.error, mappedCode);
    }

    const { apiKey } = providerResult.data;

    let resumeData: unknown;

    if (fileType === "pdf") {
        // For PDFs, we treat them as images and use Vision API.
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage(base64, "application/pdf", apiKey);
    } else if (fileType === "image") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage(base64, file.type, apiKey);
    } else if (fileType === "word") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        resumeData = await parseResumeFromText(result.value, apiKey);
    } else {
        return failure("Unsupported file type", "VALIDATION_ERROR");
    }

    return success({ resume: resumeData });
});
