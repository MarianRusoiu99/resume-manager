/**
 * Template Import API Route
 * Handles image uploads and triggers AI template extraction
 * 
 * POST /api/template/import - Upload image, extract template
 */

import { parseTemplateFromImage } from "@/lib/ai/template-parser";
import { createApiHandler } from "@/lib/api-handler";
import { apiProviderService } from "@/lib/services/api-provider.service";
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

    // Get API key from user's configured providers
    const providerResult = await apiProviderService.getFirstActiveProvider(session.user.id);
    if (!providerResult.success) {
        // Treat missing API key as a user-fixable 400 for this endpoint.
        const mappedCode = providerResult.code === "NOT_FOUND" ? "VALIDATION_ERROR" : providerResult.code;
        return failure(providerResult.error, mappedCode);
    }

    const { apiKey, providerType } = providerResult.data;

    try {
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        // Parse template from image using AI
        const templateData = await parseTemplateFromImage({
            imageBase64: base64,
            mimeType: file.type,
            apiKey,
            providerType: providerType as 'openai' | 'anthropic' | 'google',
        });

        return success({ template: templateData });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to extract template from image";
        return failure(message, "INTERNAL_ERROR");
    }
});

