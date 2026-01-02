/**
 * AI Orchestrator
 *
 * Bridges conversations to the Vercel AI SDK with streaming support
 */

import { streamText, generateText, generateObject, type CoreMessage } from 'ai';
import { logger } from '@/lib/utils/logger';
import { auditLogService } from '@/lib/services';
import { calculateAICost } from '../pricing';
import { ConversationManager, type Conversation, type ConversationMode } from './conversation';
import { formatAttachmentsAsContext, getImageAttachments, getTextAttachments, hasImageAttachments } from './message';
import { formatContextForPrompt } from './context';
import type { AIMode } from '../modes/types';
import type { AITool } from '../tools/types';
import type { AIProvider } from '../providers';

/**
 * Chunk types for streaming
 */
export type AIStreamChunkType = 
  | 'text-delta'
  | 'tool-call'
  | 'tool-result'
  | 'finish'
  | 'error';

/**
 * Stream chunk from AI
 */
export interface AIStreamChunk {
  type: AIStreamChunkType;
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    toolCallId: string;
    result: unknown;
  };
  finishReason?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Options for the orchestrator
 */
export interface OrchestratorOptions {
  /** User ID for audit logging */
  userId: string;
  /** AI provider instance */
  provider: AIProvider;
  /** Model key to use */
  modelKey: string;
  /** Model ID for logging */
  modelId: string;
  /** Optional abort signal */
  abortSignal?: AbortSignal;
}

/**
 * Result from non-streaming generation
 */
export interface GenerationResult<T> {
  output: T;
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Mode registry
 */
const modeRegistry = new Map<ConversationMode, AIMode>();

/**
 * Registers a mode in the registry
 */
export function registerMode(mode: AIMode): void {
  modeRegistry.set(mode.id, mode);
}

/**
 * Gets a mode by ID
 */
export function getMode(modeId: ConversationMode): AIMode | undefined {
  return modeRegistry.get(modeId);
}

/**
 * Gets a mode or throws if not found
 */
export function getModeOrThrow(modeId: ConversationMode): AIMode {
  const mode = modeRegistry.get(modeId);
  if (!mode) {
    throw new Error(`Mode '${modeId}' not found in registry`);
  }
  return mode;
}

/**
 * Normalizes AI SDK usage to our format
 */
function normalizeUsage(usage: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
} | undefined): { promptTokens: number; completionTokens: number; totalTokens: number } {
  const promptTokens = usage?.promptTokens ?? usage?.inputTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? usage?.outputTokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: usage?.totalTokens ?? (promptTokens + completionTokens),
  };
}

/**
 * Stream part types from AI SDK
 */
interface TextDeltaPart {
  type: 'text-delta';
  textDelta?: string;
  text?: string;
}

interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
  input?: Record<string, unknown>;
}

interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  result?: unknown;
  output?: unknown;
}

interface FinishPart {
  type: 'finish';
  finishReason: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  totalUsage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

type StreamPart = TextDeltaPart | ToolCallPart | ToolResultPart | FinishPart | { type: string };

/**
 * AI Orchestrator
 * 
 * Handles the interaction between conversations and the AI provider
 */
export class AIOrchestrator {
  /**
   * Streams a response for a conversation
   */
  static async *streamResponse(
    conversation: Conversation,
    options: OrchestratorOptions
  ): AsyncGenerator<AIStreamChunk> {
    const mode = getModeOrThrow(conversation.mode);
    const model = options.provider.createLanguageModel(options.modelKey);
    
    // Build messages
    const messages = this.buildMessages(conversation, mode);
    
    // Build system prompt
    const systemPrompt = mode.buildSystemPrompt(conversation.context);
    
    // Build tools if mode has them
    const tools = this.buildTools(mode.getTools());
    
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        messages,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        abortSignal: options.abortSignal,
      });

      let fullText = '';

      for await (const part of result.fullStream) {
        const p = part as any;
        switch (part.type) {
          case 'text-delta':
            const text = p.textDelta ?? p.text ?? '';
            fullText += text;
            yield {
              type: 'text-delta',
              content: text,
            };
            break;

          case 'tool-call':
            yield {
              type: 'tool-call',
              toolCall: {
                id: p.toolCallId,
                name: p.toolName,
                arguments: p.args ?? p.input ?? {},
              },
            };
            break;

          case 'tool-result':
            yield {
              type: 'tool-result',
              toolResult: {
                toolCallId: p.toolCallId,
                result: p.result ?? p.output,
              },
            };
            break;

          case 'finish':
            const usage = normalizeUsage(p.usage ?? p.totalUsage);
            yield {
              type: 'finish',
              finishReason: p.finishReason,
              usage,
            };

            // Log usage
            this.logUsage(options, usage, p.finishReason, mode.id);

            // Try to parse output if mode has structured output
            if (mode.useStructuredOutput !== false) {
              try {
                const output = this.parseOutput(fullText, mode);
                ConversationManager.setOutput(conversation.id, output);
              } catch (parseError) {
                logger.warn('Failed to parse structured output from stream', {
                  error: parseError instanceof Error ? parseError.message : String(parseError),
                  conversationId: conversation.id,
                });
              }
            }
            break;
        }
      }

      // Add assistant message
      ConversationManager.addAssistantMessage(conversation.id, fullText);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Stream response failed', error);
      
      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Generates a non-streaming response
   */
  static async generate<T>(
    conversation: Conversation,
    options: OrchestratorOptions
  ): Promise<GenerationResult<T>> {
    const mode = getModeOrThrow(conversation.mode);
    const model = options.provider.createLanguageModel(options.modelKey);
    
    const messages = this.buildMessages(conversation, mode);
    const systemPrompt = mode.buildSystemPrompt(conversation.context);
    const tools = this.buildTools(mode.getTools());

    // Use generateObject for structured output if schema is available
    if (mode.useStructuredOutput !== false && mode.outputSchema) {
      const result = await generateObject({
        model,
        system: systemPrompt,
        messages,
        schema: mode.outputSchema,
        abortSignal: options.abortSignal,
      });

      const usage = normalizeUsage(result.usage);

      // Log usage
      this.logUsage(options, usage, result.finishReason, mode.id);

      // Post-process if mode has it
      const output = mode.postprocessOutput 
        ? mode.postprocessOutput(result.object)
        : result.object;

      // Store output
      ConversationManager.setOutput(conversation.id, output);
      ConversationManager.addAssistantMessage(conversation.id, JSON.stringify(output, null, 2), output);

      return {
        output: output as T,
        text: JSON.stringify(output, null, 2),
        usage,
        finishReason: result.finishReason,
      };
    }

    // Fall back to generateText for text-based output
    const result = await generateText({
      model,
      system: systemPrompt,
      messages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      abortSignal: options.abortSignal,
    });

    const usage = normalizeUsage(result.usage);

    // Log usage
    this.logUsage(options, usage, result.finishReason, mode.id);

    // Parse and store output
    const output = this.parseOutput<T>(result.text, mode);
    ConversationManager.setOutput(conversation.id, output);
    ConversationManager.addAssistantMessage(conversation.id, result.text, output);

    return {
      output,
      text: result.text,
      usage,
      finishReason: result.finishReason,
    };
  }

  /**
   * Generates with vision support (for image attachments)
   */
  static async generateWithVision<T>(
    conversation: Conversation,
    options: OrchestratorOptions
  ): Promise<GenerationResult<T>> {
    const mode = getModeOrThrow(conversation.mode);
    const model = options.provider.createLanguageModel(options.modelKey);
    
    const messages = this.buildMessagesWithVision(conversation, mode);
    const systemPrompt = mode.buildSystemPrompt(conversation.context);

    const result = await generateText({
      model,
      system: systemPrompt,
      messages,
      abortSignal: options.abortSignal,
    });

    const usage = normalizeUsage(result.usage);

    // Log usage
    this.logUsage(options, usage, result.finishReason, mode.id);

    // Parse and store output
    const output = this.parseOutput<T>(result.text, mode);
    ConversationManager.setOutput(conversation.id, output);
    ConversationManager.addAssistantMessage(conversation.id, result.text, output);

    return {
      output,
      text: result.text,
      usage,
      finishReason: result.finishReason,
    };
  }

  /**
   * Builds messages array for AI (using CoreMessage format)
   */
  private static buildMessages(conversation: Conversation, mode: AIMode): CoreMessage[] {
    const messages: CoreMessage[] = [];

    // Add context as first user message if not in conversation
    const contextString = formatContextForPrompt(conversation.context);
    if (contextString && conversation.messages.length === 0) {
      messages.push({
        role: 'user',
        content: `Here is the context for this conversation:\n\n${contextString}`,
      });
    }

    // Add conversation messages
    for (const msg of conversation.messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        let content = msg.content;

        // Preprocess user messages if mode has it
        if (msg.role === 'user' && mode.preprocessUserMessage) {
          content = mode.preprocessUserMessage(content, conversation.context);
        }

        // Add attachment context for user messages
        if (msg.role === 'user' && msg.attachments?.length) {
          const textAttachments = getTextAttachments(msg.attachments);
          if (textAttachments.length > 0) {
            const attachmentContext = formatAttachmentsAsContext(textAttachments);
            content = `${content}\n\n${attachmentContext}`;
          }
        }

        messages.push({
          role: msg.role,
          content,
        });
      }
    }

    return messages;
  }

  /**
   * Builds messages with vision support (multimodal content)
   */
  private static buildMessagesWithVision(conversation: Conversation, mode: AIMode): CoreMessage[] {
    const messages: CoreMessage[] = [];

    for (const msg of conversation.messages) {
      if (msg.role === 'user') {
        const imageAttachments = getImageAttachments(msg.attachments);
        const textAttachments = getTextAttachments(msg.attachments);

        // Also include any "document" attachments that are PDFs if model has vision
        const allVisionAttachments = [...imageAttachments];
        
        // Only treat PDFs as vision content if we are sure we want to (though for GPT-4o etc it works)
        // For now let's keep it to images only to avoid breaking non-vision models that get PDF text via context
        // const pdfAttachments = msg.attachments?.filter(att => att.type === 'document' && att.mimeType === 'application/pdf') || [];
        // allVisionAttachments.push(...pdfAttachments);

        // Build content parts
        const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

        // Add text content
        let textContent = mode.preprocessUserMessage 
          ? mode.preprocessUserMessage(msg.content, conversation.context)
          : msg.content;

        // Add text attachment context
        if (textAttachments.length > 0) {
          const nonPdfTextAttachments = textAttachments.filter(att => att.mimeType !== 'application/pdf');
          if (nonPdfTextAttachments.length > 0) {
            textContent = `${textContent}\n\n${formatAttachmentsAsContext(nonPdfTextAttachments)}`;
          }
        }

        parts.push({ type: 'text', text: textContent });

        // Add images (and PDFs treated as images)
        for (const img of allVisionAttachments) {
          parts.push({ type: 'image', image: img.content });
        }

        messages.push({
          role: 'user',
          content: parts,
        });
      } else if (msg.role === 'assistant') {
        messages.push({
          role: 'assistant',
          content: msg.content,
        });
      }
    }

    return messages;
  }

  /**
   * Builds tools for Vercel AI SDK
   */
  private static buildTools(modeTools: AITool[]): Record<string, any> {
    const tools: Record<string, any> = {};

    for (const tool of modeTools) {
      tools[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (_params: unknown) => {
          // Note: In actual usage, we'd need to pass the context
          // For now, tools are primarily for AI guidance
          return { message: 'Tool execution requires context' };
        },
      };
    }

    return tools;
  }

  /**
   * Parses AI output using mode configuration
   */
  private static parseOutput<T>(text: string, mode: AIMode): T {
    const trimmed = text.trim();

    // Try to extract JSON from markdown blocks
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : trimmed;

    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate against schema
      const validated = mode.outputSchema.parse(parsed);
      
      // Post-process if available
      return (mode.postprocessOutput ? mode.postprocessOutput(validated) : validated) as T;
    } catch (error) {
      // If parsing fails and we just want text, return as-is
      if (mode.id === 'text-enhancement') {
        return trimmed as unknown as T;
      }
      
      throw new Error(`Failed to parse AI output: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Logs AI usage for auditing
   */
  private static logUsage(
    options: OrchestratorOptions,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    finishReason: string,
    feature: string
  ): void {
    const cost = calculateAICost(options.modelId, usage);

    auditLogService.logAsync({
      userId: options.userId,
      action: 'AI_GENERATE' as any,
      resourceType: 'AI_MODEL',
      resourceId: options.modelId,
      metadata: {
        feature,
        usage,
        cost,
        finishReason,
      },
    });
  }
}

  /**
   * Checks if a conversation requires vision capability
   */
  export function requiresVision(conversation: Conversation): boolean {
    // Check if any message has image attachments
    for (const msg of conversation.messages) {
      if (hasImageAttachments(msg.attachments)) {
        return true;
      }
    }
    
    // Check context attachments
    if (hasImageAttachments(conversation.context.attachments)) {
      return true;
    }
  
    // Check mode requirement
    const mode = getMode(conversation.mode);
    return mode?.requiresVision ?? false;
  }
