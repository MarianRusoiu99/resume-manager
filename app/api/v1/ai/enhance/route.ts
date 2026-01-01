/**
 * AI Text Enhancement API
 * POST /api/ai/enhance
 * 
 * Enhances text using AI based on user instructions.
 * Uses centralized validation from lib/validations/settings.ts
 */

import { aiService } from '@/lib/services';
import { enhanceRequestSchema } from '@/lib/validations/settings';
import { createApiHandler } from '@/lib/api/handler';


/**
 * POST /api/ai/enhance - Enhance text with AI
 */
export const POST = createApiHandler(
    async (request, context, session, body) => {
        const { content, instructions, context: extraContext, contentType, modelId } = body!;

        const result = await aiService.enhanceText(session.user.id, {
            content,
            instructions,
            context: extraContext,
            contentType,
            modelId,
        });

        return result;
    },
    {
        verifyUser: true,
        rateLimit: 'resumeGeneration',
        bodySchema: enhanceRequestSchema,
    }
);
