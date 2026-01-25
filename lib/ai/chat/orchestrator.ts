/**
 * AI Orchestrator
 *
 * Bridges conversations to the Vercel AI SDK with streaming support
 */

import { generateText, generateObject, streamObject, streamText, type Tool } from 'ai';
import type { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { ConversationManager, type Conversation } from './conversation';
import { hasImageAttachments } from './message';
import type { AITool } from '../tools/types';
import { getMode, getModeOrThrow } from './orchestrator/registry';
import { buildMessages, buildMessagesWithVision } from './orchestrator/message-builder';
import { parseOutput } from './orchestrator/output-parser';
import { logUsage, normalizeUsage } from './orchestrator/usage';
import type {
  OrchestratorOptions,
  GenerationResult,
  StreamChunk,
  StreamChunkDelta,
  StreamChunkText,
} from './orchestrator/types';
import type { DeepPartial } from '@/lib/types';

export { registerMode, getMode, getModeOrThrow } from './orchestrator/registry';
export type {
  OrchestratorOptions,
  GenerationResult,
  StreamChunk,
  StreamChunkDelta,
  StreamChunkText,
} from './orchestrator/types';
export type { DeepPartial } from '@/lib/types';

/**
 * AI Orchestrator
 * 
 * Handles the interaction between conversations and the AI provider
 */
export class AIOrchestrator {
  /**
   * Generates a streaming response
   */
  static async *streamGenerate<T = any>(
    conversation: Conversation,
    options: OrchestratorOptions
  ): AsyncGenerator<StreamChunk<T>, void, unknown> {
    const mode = getModeOrThrow(conversation.mode);
    const model = options.provider.createLanguageModel(options.modelKey);

    const needsVision = requiresVision(conversation);
    const messages = needsVision 
      ? buildMessagesWithVision(conversation, mode)
      : buildMessages(conversation, mode);
    const systemPrompt = mode.buildSystemPrompt(conversation.context);
    
    // Support structured output streaming
    if (mode.useStructuredOutput !== false && mode.outputSchema && !needsVision) {
      try {
        const { partialObjectStream, object, usage: usagePromise } = streamObject({
          model,
          system: systemPrompt,
          messages,
          schema: mode.outputSchema,
          abortSignal: options.abortSignal,
        });

        for await (const partial of partialObjectStream) {
          yield {
            type: 'delta',
            partial: partial as DeepPartial<T>,
            timestamp: Date.now()
          };
        }

        const finalObject = await object;
        const usageResult = await usagePromise;
        const usage = normalizeUsage(usageResult);
        
        logUsage(options, usage, 'stop', mode.id);

        ConversationManager.setOutput(conversation.id, finalObject);
        ConversationManager.addAssistantMessage(conversation.id, JSON.stringify(finalObject, null, 2), finalObject);

        yield {
          type: 'complete',
          final: finalObject as T,
          usage
        };

        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Structured streaming generation failed', { error: errorMessage });
        throw error;
      }
    } 

    // Support text streaming (for text-enhancement or vision fallback)
    try {
      const { textStream, text, usage: usagePromise, finishReason } = streamText({
        model,
        system: systemPrompt,
        messages,
        abortSignal: options.abortSignal,
      });

      let fullText = '';
      for await (const delta of textStream) {
        fullText += delta;
        yield {
          type: 'text',
          text: delta,
          timestamp: Date.now()
        };
      }

      const finalOutput = parseOutput<T>(await text, mode);
      const usageResult = await usagePromise;
      const usage = normalizeUsage(usageResult);
      
      logUsage(options, usage, await finishReason, mode.id);

      ConversationManager.setOutput(conversation.id, finalOutput);
      ConversationManager.addAssistantMessage(conversation.id, await text, finalOutput);

      yield {
        type: 'complete',
        final: finalOutput,
        usage
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Text streaming generation failed', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Generates a non-streaming response
   */
  static async generate<T = any>(
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
        logger.error('Structured generation failed', { error: errorMessage });
        throw error;
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
  static async generateWithVision<T = any>(
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
   * 
   * Note: Using `unknown` type parameters as AI SDK Tool type uses flexible JSONValue schemas.
   * The actual parameter validation happens via Zod schemas at runtime.
   */
  private static buildTools(modeTools: AITool[]): Record<string, Tool<unknown, unknown>> {
    const tools: Record<string, Tool<unknown, unknown>> = {};

    for (const tool of modeTools) {
      tools[tool.name] = {
        description: tool.description,
        inputSchema: tool.parameters,
        execute: async () => {
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
