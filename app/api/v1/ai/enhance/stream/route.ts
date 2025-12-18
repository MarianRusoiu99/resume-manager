/**
 * AI Text Enhancement Streaming API
 * POST /api/v1/ai/enhance/stream
 * 
 * Streams enhanced text using AI based on user instructions.
 */

import { aiService } from '@/lib/services';
import { enhanceRequestSchema } from '@/lib/validations/settings';
import { createApiHandler } from '@/lib/api-handler';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/v1/ai/enhance/stream - Stream enhanced text with AI
 */
export const POST = createApiHandler(
    async (request, context, session, body, meta) => {
        const { content, instructions, context: extraContext, contentType, modelId } = body!;
        const userId = session.user.id;
        const requestId = meta.requestId;

        logger.info('AI Streaming enhancement started', { userId, requestId });

        const result = await aiService.streamEnhanceText(userId, {
            content,
            instructions,
            context: extraContext,
            contentType,
            modelId,
        });

        if (!result.success) {
            return result;
        }

        // The result.data is a StreamTextResult from Vercel AI SDK
        return result.data.toDataStreamResponse();
    },
    {
        verifyUser: true,
        rateLimit: 'resumeGeneration', // Using same rate limit as resume generation for now
        bodySchema: enhanceRequestSchema,
    }
);
