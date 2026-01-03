import { generateText, streamText, type LanguageModel, type CoreMessage, type GenerateTextResult, type StreamTextResult } from 'ai';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { ServiceErrors } from '@/lib/services/utils/service-wrapper';
import { auditLogService } from '@/lib/services';
import { calculateAICost } from '../pricing';
import type { AuditAction } from '@prisma/client';

interface ValidatedAIRunnerOptions<T> {
  model: LanguageModel;
  prompt?: string;
  messages?: CoreMessage[];
  system?: string;
  schema: z.ZodType<T>;
  maxRetries?: number;
  abortSignal?: AbortSignal;
  userId?: string;
  feature?: string;
}

interface StreamOptions {
  model: LanguageModel;
  prompt?: string;
  messages?: CoreMessage[];
  system?: string;
  abortSignal?: AbortSignal;
  userId?: string;
  feature?: string;
}

/** Extract model ID from LanguageModel */
function getModelId(model: LanguageModel): string {
  // LanguageModel has modelId property in Vercel AI SDK
  return (model as LanguageModel & { modelId?: string }).modelId ?? 'unknown';
}

/**
 * ValidatedAIRunner
 * 
 * A wrapper around Vercel AI SDK's generateText that ensures the output
 * matches a specific Zod schema. It handles JSON parsing and auto-retries
 * on validation failures.
 */
export class ValidatedAIRunner {
  /**
   * Runs the AI model and validates the output against the schema.
   */
  static async run<T>(options: ValidatedAIRunnerOptions<T>): Promise<T> {
    const { model, prompt, messages, system, schema, maxRetries = 2, abortSignal, userId, feature } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const enhancedSystem = system 
          ? `${system}\n\nIMPORTANT: You MUST return a valid JSON object that matches the required schema.` 
          : undefined;

        const result = messages
          ? await generateText({ model, messages, system: enhancedSystem, abortSignal })
          : await generateText({ model, prompt: prompt ?? '', system: enhancedSystem, abortSignal });

        // Log token usage
        if (userId) {
          const modelId = getModelId(model);
          const cost = calculateAICost(modelId, result.usage);

          auditLogService.logAsync({
            userId,
            action: 'AI_GENERATE' as AuditAction,
            resourceType: 'AI_MODEL',
            resourceId: modelId,
            metadata: {
              feature,
              attempt: attempt + 1,
              usage: result.usage,
              cost,
              finishReason: result.finishReason,
            },
          });
        }

        const text = result.text.trim();
        
        // If schema is z.string(), we might want the raw text
        if (schema instanceof z.ZodString && !text.startsWith('{') && !text.startsWith('[')) {
          try {
            return schema.parse(text) as unknown as T;
          } catch {
            // Fall through to JSON parsing if string validation fails for some reason
          }
        }

        // Attempt to extract JSON if the model wrapped it in markdown blocks
        const markdownMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        
        let jsonString: string;
        if (markdownMatch) {
          // Use capture group [1] for markdown code blocks
          jsonString = markdownMatch[1].trim();
        } else if (text.trimStart().startsWith('[')) {
          // Prefer array match when text starts with [
          const arrayMatch = text.match(/\[[\s\S]*\]/);
          jsonString = arrayMatch?.[0] ?? text;
        } else if (text.trimStart().startsWith('{')) {
          // Prefer object match when text starts with {
          const objectMatch = text.match(/\{[\s\S]*\}/);
          jsonString = objectMatch?.[0] ?? text;
        } else {
          // Try to find embedded JSON (object or array)
          const objectMatch = text.match(/\{[\s\S]*\}/);
          const arrayMatch = text.match(/\[[\s\S]*\]/);
          jsonString = objectMatch?.[0] ?? arrayMatch?.[0] ?? text;
        }

        try {
          const parsed = JSON.parse(jsonString) as unknown;
          const validated = schema.parse(parsed);
          return validated as T;
        } catch (parseError) {
          // If JSON parsing fails but we just wanted a string, return the raw text
          if (schema instanceof z.ZodString) {
            return text as unknown as T;
          }

          logger.warn(`AI Validation failed on attempt ${attempt + 1}`, {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            text: text.slice(0, 200),
          });
          
          if (userId) {
            auditLogService.logAsync({
              userId,
              action: 'AI_VALIDATION_FAILED' as AuditAction,
              resourceType: 'AI_MODEL',
              resourceId: getModelId(model),
              success: false,
              errorMessage: parseError instanceof Error ? parseError.message : 'Validation failed',
              metadata: {
                feature,
                attempt: attempt + 1,
                text: text.slice(0, 500),
              },
            });
          }
          
          lastError = parseError as Error;
        }
      } catch (error) {
        logger.error(`AI Generation failed on attempt ${attempt + 1}`, error);
        lastError = error as Error;
      }
    }

    throw ServiceErrors.externalService(
      `AI failed to generate valid output after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Streams the AI model output.
   * Note: Validation is harder with streaming, so this is primarily for text enhancement.
   */
  static async stream(options: StreamOptions) {
    const { model, prompt, messages, system, abortSignal, userId, feature } = options;

    // Use streamText and handle logging after the stream completes
    const result = messages
      ? await streamText({ model, messages, system, abortSignal })
      : await streamText({ model, prompt: prompt ?? '', system, abortSignal });

    // Log usage after stream is consumed (caller should handle this via onFinish callback or consuming the stream)
    if (userId) {
      // We'll log when the stream is consumed - the caller should handle this
      // The usage is available on result.usage after the stream completes
      const originalTextStream = result.textStream;
      
      // Note: Logging happens asynchronously when result.usage is accessed
      // The caller can await result.usage to get the final token counts
      result.usage.then((usage) => {
        const modelId = getModelId(model);
        const usageData = {
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
        };
        const cost = calculateAICost(modelId, usageData);

        auditLogService.logAsync({
          userId,
          action: 'AI_GENERATE' as AuditAction,
          resourceType: 'AI_MODEL',
          resourceId: modelId,
          metadata: {
            feature,
            usage: usageData,
            cost,
          },
        });
      }).catch(() => {
        // Ignore logging errors
      });
    }

    return result;
  }
}
