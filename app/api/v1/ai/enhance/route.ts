/**
 * AI Text Enhancement API
 * POST /api/ai/enhance
 * 
 * Enhances text using AI based on user instructions.
 * Uses centralized validation from lib/validations/settings.ts
 */

import { logger } from '@/lib/utils/logger';
import { apiProviderService } from '@/lib/services/api-provider.service';
import { userAISettingsService } from '@/lib/services/user-ai-settings.service';
import { generateText } from 'ai';
import { enhanceRequestSchema } from '@/lib/validations/settings';
import {
  AIProviderNotConfiguredError,
  ModelNotFoundError,
} from '@/lib/errors/ai';
import { createApiHandler } from '@/lib/api-handler';

/**
 * Get system prompt based on content type
 */
function getSystemPrompt(contentType: string): string {
    const basePrompt = `You are an expert text enhancement assistant. Your task is to modify the provided content according to the user's instructions while preserving the original meaning and structure unless explicitly asked to change them.

CRITICAL RULES:
1. Return ONLY the enhanced content, without any explanations, introductions, or meta-commentary
2. Do NOT wrap your response in code blocks or markdown formatting unless the content type specifically requires it
3. Preserve the overall structure and format of the original content
4. Make changes that directly address the user's instructions
5. Maintain a professional and consistent tone unless asked otherwise`;

    const typeSpecificInstructions: Record<string, string> = {
        html: `
You are enhancing HTML content. Additional rules:
- Preserve valid HTML structure and semantics
- You may improve accessibility, semantic elements, or structure if relevant to the instructions
- Return clean, properly formatted HTML`,
        css: `
You are enhancing CSS content. Additional rules:
- Preserve valid CSS syntax
- You may improve organization, naming, or add helpful comments if relevant
- Follow modern CSS best practices
- Return clean, properly formatted CSS`,
        markdown: `
You are enhancing Markdown content. Additional rules:
- Preserve valid Markdown syntax
- You may improve formatting, structure, or readability if relevant
- Return clean, properly formatted Markdown`,
        text: `
You are enhancing plain text content. Additional rules:
- Focus on clarity, grammar, and readability
- Maintain the original tone unless asked to change it`,
    };

    return basePrompt + (typeSpecificInstructions[contentType] || typeSpecificInstructions.text);
}

/**
 * Resolve AI provider from user settings
 */
async function resolveProvider(userId: string, modelId?: string) {
    // First, check user's saved AI settings for the 'enhance' feature
    const settingsResult = await userAISettingsService.resolveProviderForFeature(userId, 'enhance');
    
    if (settingsResult.success && settingsResult.data) {
        const { providerId, modelId: settingsModelId } = settingsResult.data;
        const providerResult = await apiProviderService.getProviderInstance(providerId, userId);
        if (providerResult.success) {
            return { 
                provider: providerResult.data.provider, 
                modelId: settingsModelId, 
                providerType: providerResult.data.providerType 
            };
        }
        // If saved provider is no longer valid, fall through to default behavior
        logger.warn('Saved AI settings provider no longer valid, falling back to default', { userId, providerId });
    }

    if (modelId) {
        const modelsResult = await apiProviderService.getAvailableModels(userId);
        if (!modelsResult.success) {
            throw new AIProviderNotConfiguredError();
        }

        const modelInfo = modelsResult.data.allModels.find(m => m.id === modelId);
        if (!modelInfo) {
            throw new ModelNotFoundError(modelId);
        }

        const providerResult = await apiProviderService.getProviderInstance(modelInfo.providerId, userId);
        if (!providerResult.success) {
            throw new AIProviderNotConfiguredError();
        }

        return { provider: providerResult.data.provider, modelId, providerType: providerResult.data.providerType };
    }

    // No model specified and no settings - get the first available model from user's providers
    const modelsResult = await apiProviderService.getAvailableModels(userId);
    if (!modelsResult.success || modelsResult.data.allModels.length === 0) {
        throw new AIProviderNotConfiguredError();
    }

    const firstModel = modelsResult.data.allModels[0];
    const providerResult = await apiProviderService.getProviderInstance(firstModel.providerId, userId);
    if (!providerResult.success) {
        throw new AIProviderNotConfiguredError();
    }

    return { provider: providerResult.data.provider, modelId: firstModel.id, providerType: providerResult.data.providerType };
}

/**
 * POST /api/ai/enhance - Enhance text with AI
 */
export const POST = createApiHandler(
    async (request, context, session, body) => {
        const { content, instructions, context: extraContext, contentType, modelId } = body!;

        logger.info('AI enhancement request', {
            userId: session.user.id,
            contentType,
            contentLength: content.length,
        });

        const { provider, modelId: resolvedModelId, providerType } = await resolveProvider(session.user.id, modelId);
        logger.info('Using AI provider for enhancement', { providerType, modelId: resolvedModelId });

        const systemPrompt = getSystemPrompt(contentType);
        const userPrompt = `CONTENT TO ENHANCE:
${content}

${extraContext ? `ADDITIONAL CONTEXT:\n${extraContext}\n\n` : ''}USER INSTRUCTIONS:
${instructions}

Please enhance the content according to the instructions above. Return ONLY the enhanced content.`;

        const result = await generateText({
            model: provider.createLanguageModel(resolvedModelId),
            system: systemPrompt,
            prompt: userPrompt,
        });

        const enhancedContent = result.text.trim();

        logger.info('AI enhancement completed', {
            userId: session.user.id,
            originalLength: content.length,
            enhancedLength: enhancedContent.length,
        });

        return {
            success: true,
            data: {
                enhancedContent,
                metadata: {
                    model: resolvedModelId,
                    provider: providerType,
                    contentType,
                },
            },
        };
    },
    {
        verifyUser: true,
        rateLimit: 'resumeGeneration',
        bodySchema: enhanceRequestSchema,
    }
);
