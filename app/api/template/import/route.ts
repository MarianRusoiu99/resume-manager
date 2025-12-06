/**
 * Template Import API Route
 * Handles image uploads and triggers AI template extraction
 * 
 * POST /api/template/import - Upload image, extract template
 */

import { NextResponse } from "next/server";
import { parseTemplateFromImage } from "@/lib/ai/template-parser";
import { createApiHandler } from "@/lib/api-handler";
import { apiProviderService } from "@/lib/services/api-provider.service";

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
];

export const POST = createApiHandler(async (request, context, session) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
            { error: `Unsupported file type. Supported types: PNG, JPEG, WebP, GIF` },
            { status: 400 }
        );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
            { error: "File size must be less than 10MB" },
            { status: 400 }
        );
    }

    // Get API key from user's configured providers
    const providerResult = await apiProviderService.getFirstActiveProvider(session.user.id);
    if (!providerResult.success) {
        return NextResponse.json(
            { error: providerResult.error },
            { status: 400 }
        );
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

        return NextResponse.json({
            success: true,
            template: templateData,
        });
    } catch (error) {
        console.error("Template import error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : "Failed to extract template from image"
            },
            { status: 500 }
        );
    }
});

