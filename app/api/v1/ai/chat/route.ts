/**
 * AI Chat API
 * POST /api/v1/ai/chat
 *
 * Unified endpoint for conversational AI interactions
 * Supports all modes: resume generation, enhancement, cover letters, templates, text
 */

import { z } from 'zod';
import { createApiHandler } from '@/lib/api/handler';
import { logger } from '@/lib/utils/logger';
import { resolveAIModelOrThrow } from '@/lib/ai/runtime/resolve-model';
import { ConversationManager, type ConversationMode } from '@/lib/ai/chat/conversation';
import { AIOrchestrator, requiresVision } from '@/lib/ai/chat/orchestrator';
import { ensureModesRegistered } from '@/lib/ai/modes';
import type { ConversationContext } from '@/lib/ai/chat/context';
import type { Attachment, AttachmentType } from '@/lib/ai/chat/message';
import type { AIFeatureType } from '@/lib/repositories/interfaces/user-ai-settings.repository.interface';

// Ensure modes are registered on module load
ensureModesRegistered();

/**
 * Request attachment types (from client)
 */
const requestAttachmentTypes = ['document', 'image', 'resume', 'job-description', 'template'] as const;

/**
 * Request body schema
 */
const chatRequestSchema = z.object({
  // Conversation management
  conversationId: z.string().nullable().optional(),
  mode: z.enum([
    'resume-generation',
    'resume-enhancement',
    'cover-letter-generation',
    'template-generation',
    'template-enhancement',
    'text-enhancement',
  ]),

  // Message content
  message: z.string().min(1).max(50000),

  // Attachments (documents, images)
  attachments: z
    .array(
      z.object({
        type: z.enum(requestAttachmentTypes),
        name: z.string(),
        content: z.string(), // base64 or text content
        mimeType: z.string(),
      })
    )
    .optional(),

  // Context data
  context: z
    .object({
      userProfile: z
        .object({
          resume: z.record(z.string(), z.unknown()).optional(),
          name: z.string().optional(),
        })
        .optional(),
      job: z
        .object({
          description: z.string().optional(),
          title: z.string().optional(),
          company: z.string().optional(),
        })
        .optional(),
      template: z
        .object({
          htmlTemplate: z.string().optional(),
          cssStyles: z.string().optional(),
          name: z.string().optional(),
        })
        .optional(),
      currentResume: z.record(z.string(), z.unknown()).optional(),
      currentCoverLetter: z.string().optional(),
      personalInstructions: z.string().optional(),
    })
    .optional(),

  // Model selection
  modelId: z.string().optional(),

  // Streaming options
  stream: z.boolean().default(true),
});

type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Map mode to AI feature for model resolution
 */
function getModeFeature(mode: ConversationMode): AIFeatureType {
  switch (mode) {
    case 'resume-generation':
    case 'resume-enhancement':
      return 'resume';
    case 'cover-letter-generation':
      return 'coverLetter';
    case 'template-generation':
    case 'template-enhancement':
      return 'template';
    case 'text-enhancement':
      return 'enhance';
    default:
      return 'resume';
  }
}

/**
 * Convert request attachments to internal format
 */
function convertAttachments(attachments?: ChatRequest['attachments']): Attachment[] | undefined {
  if (!attachments?.length) return undefined;

  return attachments.map((att) => ({
    id: crypto.randomUUID(),
    type: att.type as AttachmentType,
    name: att.name,
    content: att.content,
    mimeType: att.mimeType,
  }));
}

/**
 * POST /api/v1/ai/chat - Send message to AI conversation
 */
export const POST = createApiHandler(
  async (_request, _context, session, body, meta) => {
    const { conversationId, mode, message, attachments, context, modelId, stream } = body!;
    const userId = session.user.id;
    const requestId = meta.requestId;

    logger.info('AI chat request', {
      userId,
      requestId,
      mode,
      hasConversation: !!conversationId,
      hasAttachments: !!attachments?.length,
      stream,
    });

    // Get or create conversation
    const internalAttachments = convertAttachments(attachments);
    const conversation = ConversationManager.getOrCreate(conversationId || undefined, {
      mode: mode as ConversationMode,
      initialContext: context as ConversationContext,
      attachments: internalAttachments,
    });

    // Add user message
    ConversationManager.addUserMessage(conversation.id, message, internalAttachments);

    // Resolve AI model
    const feature = getModeFeature(mode as ConversationMode);
    const resolvedModel = await resolveAIModelOrThrow({
      userId,
      feature,
      modelId,
    });

    // Check if vision is needed
    const needsVision = requiresVision(conversation);
    if (needsVision && !resolvedModel.modelKey.includes('vision') && !resolvedModel.modelKey.includes('gpt-4o')) {
      logger.warn('Vision required but model may not support it', {
        modelId: resolvedModel.modelId,
        modelKey: resolvedModel.modelKey,
      });
    }

    const orchestratorOptions = {
      userId,
      provider: resolvedModel.provider,
      modelKey: resolvedModel.modelKey,
      modelId: resolvedModel.modelId,
    };

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of AIOrchestrator.streamResponse(conversation, orchestratorOptions)) {
              const data = JSON.stringify(chunk) + '\n';
              controller.enqueue(encoder.encode(`data: ${data}\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            logger.error('Stream error', error);
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Conversation-Id': conversation.id,
        },
      });
    }

    // Non-streaming response
    const result = needsVision
      ? await AIOrchestrator.generateWithVision(conversation, orchestratorOptions)
      : await AIOrchestrator.generate(conversation, orchestratorOptions);

    return {
      success: true,
      data: {
        conversationId: conversation.id,
        output: result.output,
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
      },
    };
  },
  {
    verifyUser: true,
    rateLimit: 'resumeGeneration',
    bodySchema: chatRequestSchema,
  }
);
