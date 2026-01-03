/**
 * AI Orchestrator
 *
 * Bridges conversations to the Vercel AI SDK with streaming support
 */

import { streamText, streamObject, generateText, generateObject, type Tool } from 'ai';
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

    // Use structured output streaming for modes that require it
    if (mode.useStructuredOutput !== false && mode.outputSchema) {
      yield* this.streamStructuredResponse(conversation, mode, model, messages, systemPrompt, options);
    } else {
      yield* this.streamTextResponse(conversation, mode, model, messages, systemPrompt, options);
    }
  }

  /**
   * Stream with structured JSON output (uses streamObject for guaranteed JSON)
   * Falls back to streamText + parsing for models that don't support json_schema
   */
  private static async *streamStructuredResponse(
    conversation: Conversation,
    mode: ReturnType<typeof getModeOrThrow>,
    model: ReturnType<OrchestratorOptions['provider']['createLanguageModel']>,
    messages: ReturnType<typeof buildMessages>,
    systemPrompt: string,
    options: OrchestratorOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const result = streamObject({
        model,
        system: systemPrompt,
        messages,
        schema: mode.outputSchema,
        abortSignal: options.abortSignal,
      });

      let lastJsonString = '';

      for await (const part of result.partialObjectStream) {
        // Convert partial object to string for streaming display
        const jsonString = JSON.stringify(part, null, 2);
        if (jsonString !== lastJsonString) {
          // Only send the new content
          const newContent = jsonString.slice(lastJsonString.length);
          if (newContent) {
            yield {
              type: 'text-delta',
              content: newContent,
            };
          }
          lastJsonString = jsonString;
        }
      }

      // Get the final object
      const finalResult = await result.object;
      const usage = normalizeUsage(await result.usage);
      const finishReason = await result.finishReason;

      // Log usage
      logUsage(options, usage, finishReason, mode.id);

      // Post-process if mode has it
      const output = mode.postprocessOutput
        ? mode.postprocessOutput(finalResult)
        : finalResult;

      // Store output
      ConversationManager.setOutput(conversation.id, output);

      const fullText = JSON.stringify(output, null, 2);
      ConversationManager.addAssistantMessage(conversation.id, fullText, output);

      yield {
        type: 'finish',
        finishReason,
        usage,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if this is a model compatibility error (json_schema not supported)
      // Fall back to streamText with manual parsing for older models
      if (errorMessage.includes('json_schema') || errorMessage.includes('not supported')) {
        logger.warn('Model does not support streamObject, falling back to streamText', {
          conversationId: conversation.id,
          error: errorMessage,
        });

        // Fall back to text streaming with parsing
        yield* this.streamTextWithParsing(conversation, mode, model, messages, systemPrompt, options);
        return;
      }

      logger.error('Structured stream response failed', error);

      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Stream text and parse JSON at the end (fallback for older models)
   */
  private static async *streamTextWithParsing(
    conversation: Conversation,
    mode: ReturnType<typeof getModeOrThrow>,
    model: ReturnType<OrchestratorOptions['provider']['createLanguageModel']>,
    messages: ReturnType<typeof buildMessages>,
    systemPrompt: string,
    options: OrchestratorOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        messages,
        abortSignal: options.abortSignal,
      });

      let fullText = '';

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          const streamPart = part as { textDelta?: string; text?: string };
          const text = streamPart.textDelta ?? streamPart.text ?? '';
          fullText += text;
          yield {
            type: 'text-delta',
            content: text,
          };
        } else if (part.type === 'finish') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const finishPart = part as any;
          const usage = normalizeUsage(finishPart.usage ?? finishPart.totalUsage);

          // Log usage
          logUsage(options, usage, part.finishReason, mode.id);

          // Try to parse the output
          try {
            const output = parseOutput(fullText, mode);
            ConversationManager.setOutput(conversation.id, output);
            ConversationManager.addAssistantMessage(conversation.id, fullText, output);
          } catch (parseError) {
            logger.warn('Failed to parse structured output from text stream', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              conversationId: conversation.id,
            });
            // Still save the raw text
            ConversationManager.addAssistantMessage(conversation.id, fullText);
          }

          yield {
            type: 'finish',
            finishReason: part.finishReason,
            usage,
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Text stream with parsing failed', error);

      yield {
        type: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Stream plain text (for text-enhancement and other text modes)
   */
  private static async *streamTextResponse(
    conversation: Conversation,
    mode: ReturnType<typeof getModeOrThrow>,
    model: ReturnType<OrchestratorOptions['provider']['createLanguageModel']>,
    messages: ReturnType<typeof buildMessages>,
    systemPrompt: string,
    options: OrchestratorOptions
  ): AsyncGenerator<AIStreamChunk> {
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
            const streamPart = part as { textDelta?: string; text?: string };
            const text = streamPart.textDelta ?? streamPart.text ?? '';
            fullText += text;
            yield {
              type: 'text-delta',
              content: text,
            };
            break;
          }

          case 'tool-call': {
            const toolPart = part as { toolCallId: string; toolName: string; args?: Record<string, unknown>; input?: Record<string, unknown> };
            yield {
              type: 'tool-call',
              toolCall: {
                id: toolPart.toolCallId,
                name: toolPart.toolName,
                arguments: (toolPart.args ?? toolPart.input ?? {}) as Record<string, unknown>,
              },
            };
            break;
          }

          case 'tool-result': {
            const resultPart = part as { toolCallId: string; result?: unknown; output?: unknown };
            yield {
              type: 'tool-result',
              toolResult: {
                toolCallId: resultPart.toolCallId,
                result: resultPart.result ?? resultPart.output,
              },
            };
            break;
          }

          case 'finish': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI SDK finish event usage structure varies
            const finishPart = part as any;
            const usage = normalizeUsage(finishPart.usage ?? finishPart.totalUsage);
            yield {
              type: 'finish',
              finishReason: part.finishReason,
              usage,
            };

            // Log usage
            logUsage(options, usage, part.finishReason, mode.id);
            break;
          }
        }
      }

      // Store the output as plain text for text modes
      ConversationManager.setOutput(conversation.id, fullText);
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
      try {
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Fall back to generateText with manual parsing if model doesn't support structured output
        if (errorMessage.includes('json_schema') || errorMessage.includes('not supported')) {
          logger.warn('Model does not support generateObject, falling back to generateText', {
            conversationId: conversation.id,
            error: errorMessage,
          });
          // Continue to generateText fallback below
        } else {
          // Re-throw if it's some other error
          throw error;
        }
      }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI SDK Tool type is complex and version-specific
  private static buildTools(modeTools: AITool[]): Record<string, Tool<any, any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI SDK Tool type
    const tools: Record<string, Tool<any, any>> = {};

    for (const tool of modeTools) {
      tools[tool.name] = {
        description: tool.description,
        inputSchema: tool.parameters,
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
