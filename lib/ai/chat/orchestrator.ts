/**
 * AI Orchestrator
 *
 * Bridges conversations to the Vercel AI SDK with streaming support
 */

import { generateText, generateObject, type Tool } from 'ai';
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
  GenerationResult
} from './orchestrator/types';

export { registerMode, getMode, getModeOrThrow } from './orchestrator/registry';
export type {
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
