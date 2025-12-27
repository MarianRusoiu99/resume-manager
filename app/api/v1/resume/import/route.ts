/**
 * Resume Import API Route
 * Handles file uploads (PDF, Image, Word) and triggers AI extraction
 */

import { parseResumeFromText, parseResumeFromImage } from "@/lib/ai/resume-parser";
import { resolveAIModelOrThrow, resolveVisionModelKey } from "@/lib/ai/runtime";
import mammoth from "mammoth";
import { createApiHandler } from "@/lib/api-handler";
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

    const resolvedModel = await resolveAIModelOrThrow({
        userId: session.user.id,
        feature: 'resume',
    });

    let resumeData: unknown;

    if (fileType === "pdf") {
        // For PDFs, we treat them as images and use vision-capable model.
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage({
            imageBase64: base64,
            mimeType: "application/pdf",
            provider: resolvedModel.provider,
            modelKey: resolveVisionModelKey(resolvedModel),
        });
    } else if (fileType === "image") {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        resumeData = await parseResumeFromImage({
            imageBase64: base64,
            mimeType: file.type,
            provider: resolvedModel.provider,
            modelKey: resolveVisionModelKey(resolvedModel),
        });
    } else if (fileType === "word") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        resumeData = await parseResumeFromText({
            text: result.value,
            provider: resolvedModel.provider,
            modelKey: resolvedModel.modelKey,
        });
    } else {
        return failure("Unsupported file type", "VALIDATION_ERROR");
    }

    return success({ resume: resumeData });
});
