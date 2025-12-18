/**
 * Template Import API Route
 * Handles image uploads and triggers AI template extraction
 * 
 * POST /api/template/import - Upload image, extract template
 */

import { parseTemplateFromImage } from "@/lib/ai/template-parser";
import { resolveAIModelOrThrow, resolveVisionModelKey } from "@/lib/ai/runtime";
import { createApiHandler } from "@/lib/api-handler";
import { failure, success } from "@/lib/types/service-result";

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
];

export const POST = createApiHandler<{ template: unknown }>(async (request, context, session) => {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
        return failure("No file provided", "VALIDATION_ERROR");
    }

    const file = fileValue;

    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        return failure(
            "Unsupported file type. Supported types: PNG, JPEG, WebP, GIF",
            "VALIDATION_ERROR"
        );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        return failure("File size must be less than 10MB", "VALIDATION_ERROR");
    }

    try {
        const resolvedModel = await resolveAIModelOrThrow({
            userId: session.user.id,
            feature: 'template',
        });

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        // Parse template from image using AI
        const templateData = await parseTemplateFromImage({
            imageBase64: base64,
            mimeType: file.type,
            provider: resolvedModel.provider,
            modelKey: resolveVisionModelKey(resolvedModel),
        });

        return success({ template: templateData });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to extract template from image";
        return failure(message, "INTERNAL_ERROR");
    }
});

