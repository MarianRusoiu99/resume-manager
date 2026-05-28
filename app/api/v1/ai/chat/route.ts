/**
 * AI Chat API Route
 * 
 * Handles conversational AI interactions with support for:
 * - Multiple conversation modes (resume, cover letter, template, text enhancement)
 * - File attachments (PDFs, images, documents)
 * - Non-streaming responses
 * - Vision API for image analysis
 */

import { createApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { 
  ConversationManager, 
  AIOrchestrator, 
  requiresVision,
  type ConversationMode,
} from '@/lib/ai/chat';
import { ensureModesRegistered } from '@/lib/ai/modes';
import type { AnyModeOutput } from '@/lib/ai/modes/types';
import { resolveAIModelOrThrow } from '@/lib/ai/runtime/resolve-model';
import type { ConversationContext } from '@/lib/ai/chat/context';
import type { Attachment, AttachmentType } from '@/lib/ai/chat/message';
import { logger } from '@/lib/utils/logger';

// Ensure AI modes are registered
ensureModesRegistered();

/**
 * Request body schema for AI chat
 */
const chatRequestSchema = z.object({
  /** Existing conversation ID (optional, creates new if not provided) */
  conversationId: z.string().optional(),
  
  /** Conversation mode */
  mode: z.enum([
    'resume-generation',
    'resume-enhancement',
    'cover-letter-generation',
    'template-generation',
    'template-enhancement',
    'text-enhancement',
  ]),
  
  /** User message */
  message: z.string().min(1, 'Message is required').max(50000, 'Message too long'),
  
  /** File attachments */
  attachments: z.array(z.object({
    type: z.enum(['document', 'image', 'resume', 'job-description', 'template']),
    name: z.string(),
    content: z.string(),
    mimeType: z.string(),
  })).max(3, 'Maximum 3 attachments allowed').optional(),
  
  /** Conversation context - loosely typed to allow frontend flexibility */
  context: z.record(z.string(), z.unknown()).optional(),
  
  /** Override model ID */
  modelId: z.string().optional(),
  
  /** Enable streaming response */
  stream: z.boolean().optional().default(false),
});

type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Convert frontend attachments to internal format
 */
function convertAttachments(
  frontendAttachments: NonNullable<ChatRequest['attachments']>
): Attachment[] {
  return frontendAttachments.map((att, index) => ({
    id: `att-${Date.now()}-${index}`,
    type: att.type as AttachmentType,
    name: att.name,
    content: att.content,
    mimeType: att.mimeType,
  }));
}

/**
 * Map feature type from conversation mode
 */
function getFeatureFromMode(mode: ConversationMode): 'resume' | 'coverLetter' | 'template' {
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
    default:
      return 'resume'; // Default to resume feature for text enhancement
  }
}

/**
 * Safely convert frontend context to ConversationContext
 * The frontend may send different shapes, so we normalize here
 */
function normalizeContext(
  rawContext: Record<string, unknown> | undefined,
  attachments?: Attachment[]
): ConversationContext {
  if (!rawContext) {
    return { attachments };
  }

  const context: ConversationContext = { attachments };

  // Handle currentResume (frontend may send as 'resume' or 'currentResume')
  if (rawContext.currentResume && typeof rawContext.currentResume === 'object') {
    context.currentResume = rawContext.currentResume as ConversationContext['currentResume'];
  } else if (rawContext.resume && typeof rawContext.resume === 'object') {
    context.currentResume = rawContext.resume as ConversationContext['currentResume'];
  }

  // Handle job description
  if (rawContext.job && typeof rawContext.job === 'object') {
    const job = rawContext.job as Record<string, unknown>;
    context.job = {
      description: typeof job.description === 'string' ? job.description : '',
      title: typeof job.title === 'string' ? job.title : undefined,
      company: typeof job.company === 'string' ? job.company : undefined,
    };
  }

  // Handle template context
  if (rawContext.template && typeof rawContext.template === 'object') {
    const template = rawContext.template as Record<string, unknown>;
    context.template = {
      htmlTemplate: typeof template.htmlTemplate === 'string' ? template.htmlTemplate : undefined,
      name: typeof template.name === 'string' ? template.name : undefined,
    };
  } else if (typeof rawContext.currentTemplate === 'string') {
    context.template = { htmlTemplate: rawContext.currentTemplate };
  }

  // Handle personal instructions
  if (typeof rawContext.personalInstructions === 'string') {
    context.personalInstructions = rawContext.personalInstructions;
  }

  // Handle user profile
  if (rawContext.userProfile && typeof rawContext.userProfile === 'object') {
    const userProfile = rawContext.userProfile as Record<string, unknown>;
    if (userProfile.resume && typeof userProfile.resume === 'object') {
      context.userProfile = {
        resume: userProfile.resume as ConversationContext['userProfile'] extends { resume: infer R } ? R : never,
        name: typeof userProfile.name === 'string' ? userProfile.name : undefined,
      };
    }
  }

  return context;
}

/**
 * POST /api/v1/ai/chat
 * 
 * Send a message to the AI and receive a response
 */
export const POST = createApiHandler<unknown, ChatRequest>(
  async (request, _context, session, body, { requestId }) => {
    if (!body) {
      return Response.json(
        { success: false, error: 'Request body required', requestId },
        { status: 400 }
      );
    }

    const { conversationId, mode, message, attachments, context, modelId } = body;
    const userId = session.user.id;

    logger.info('AI chat request', {
      requestId,
      userId,
      mode,
      hasAttachments: !!attachments?.length,
    });

    try {
      // Resolve AI model for this request
      const resolvedModel = await resolveAIModelOrThrow({
        userId,
        feature: getFeatureFromMode(mode),
        modelId,
      });

      // Convert attachments to internal format
      const internalAttachments = attachments ? convertAttachments(attachments) : undefined;

      // Build conversation context from request
      const conversationContext = normalizeContext(context, internalAttachments);

      // Get or create conversation
      const conversation = ConversationManager.getOrCreate(conversationId, {
        mode,
        initialContext: conversationContext,
        attachments: internalAttachments,
      });

      // Add user message
      ConversationManager.addUserMessage(conversation.id, message, internalAttachments);

      // Check if we need vision API
      const needsVision = requiresVision(conversation);

      // Build orchestrator options
      const orchestratorOptions = {
        provider: resolvedModel.provider,
        modelKey: resolvedModel.modelKey,
        modelId: resolvedModel.modelId,
        userId,
        ...(resolvedModel.providerOptions ? { providerOptions: resolvedModel.providerOptions } : {}),
      };

      const { stream = false } = body;

      if (stream) {
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const generator = AIOrchestrator.streamGenerate<AnyModeOutput>(conversation, orchestratorOptions);
              
              for await (const chunk of generator) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
              }

              // No auto-save in chat route: save is explicit from UI header actions.
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              logger.error('Streaming error', { error, requestId, userId });
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
              );
            } finally {
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Conversation-Id': conversation.id,
          },
        });
      }

      // Non-streaming response only
      const result = needsVision
        ? await AIOrchestrator.generateWithVision(conversation, orchestratorOptions)
        : await AIOrchestrator.generate(conversation, orchestratorOptions);

      return Response.json(
        {
          success: true,
          data: {
            conversationId: conversation.id,
            text: result.text,
            output: result.output,
            usage: result.usage,
            savedId: undefined,
          },
          requestId,
        },
        {
          headers: {
            'X-Conversation-Id': conversation.id,
          },
        }
      );
    } catch (error) {
      logger.error('AI chat error', { error, requestId, userId });
      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'An error occurred', requestId },
        { status: 500 }
      );
    }
  },
  {
    bodySchema: chatRequestSchema,
    rateLimit: 'resumeGeneration',
  }
);
