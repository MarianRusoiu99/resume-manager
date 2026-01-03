/**
 * AI Orchestrator
 *
 * Bridges conversations to the Vercel AI SDK with streaming support
 */

import { streamText, generateText, generateObject } from 'ai';
import { logger } from '@/lib/utils/logger';
import { ConversationManager, type Conversation } from './conversation';
import { hasImageAttachments } from './message';
import type { AITool } from '../tools/types';
import { getMode, getModeOrThrow } from './orchestrator/registry';
import { buildMessages, buildMessagesWithVision } from './orchestrator/message-builder';
import { parseOutput } from './orchestrator/output-parser';
import { logUsage, normalizeUsage } from './orchestrator/usage';
import type { 
  AIStreamChunk, 
  OrchestratorOptions, 
  GenerationResult 
} from './orchestrator/types';

export { registerMode, getMode, getModeOrThrow } from './orchestrator/registry';
export type { 
  AIStreamChunk, 
  AIStreamChunkType, 
  OrchestratorOptions, 
  GenerationResult 
} from './orchestrator/types';

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
    const messages = buildMessages(conversation, mode);
    
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
        switch (part.type) {
          case 'text-delta': {
            const text = (part as any).textDelta ?? (part as any).text ?? '';
            fullText += text;
            yield {
              type: 'text-delta',
              content: text,
            };
            break;
          }

          case 'tool-call':
            yield {
              type: 'tool-call',
              toolCall: {
                id: (part as any).toolCallId,
                name: (part as any).toolName,
                arguments: ((part as any).args ?? (part as any).input ?? {}) as Record<string, unknown>,
              },
            };
            break;

          case 'tool-result':
            yield {
              type: 'tool-result',
              toolResult: {
                toolCallId: (part as any).toolCallId,
                result: (part as any).result ?? (part as any).output,
              },
            };
            break;

          case 'finish': {
            const usage = normalizeUsage((part as any).usage ?? (part as any).totalUsage);
            yield {
              type: 'finish',
              finishReason: part.finishReason,
              usage,
            };

            // Log usage
            logUsage(options, usage, part.finishReason, mode.id);

            // Try to parse output if mode has structured output
            if (mode.useStructuredOutput !== false) {
              try {
                const output = parseOutput(fullText, mode);
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
    
    const messages = buildMessages(conversation, mode);
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
      logUsage(options, usage, result.finishReason, mode.id);

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
    logUsage(options, usage, result.finishReason, mode.id);

    // Parse and store output
    const output = parseOutput<T>(result.text, mode);
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
    
    const messages = buildMessagesWithVision(conversation, mode);
    const systemPrompt = mode.buildSystemPrompt(conversation.context);

    const result = await generateText({
      model,
      system: systemPrompt,
      messages,
      abortSignal: options.abortSignal,
    });

    const usage = normalizeUsage(result.usage);

    // Log usage
    logUsage(options, usage, result.finishReason, mode.id);

    // Parse and store output
    const output = parseOutput<T>(result.text, mode);
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
