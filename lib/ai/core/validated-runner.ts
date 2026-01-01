import { generateText, streamText, type LanguageModel, type CoreMessage } from 'ai';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { ServiceErrors } from '@/lib/services/utils/service-wrapper';
import { auditLogService } from '@/lib/services';
import { calculateAICost } from '../pricing';

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
        const params: any = {
          model,
          system: system ? `${system}\n\nIMPORTANT: You MUST return a valid JSON object that matches the required schema.` : undefined,
          abortSignal,
        };

        if (messages) {
          params.messages = messages;
        } else {
          params.prompt = prompt;
        }

        const result = await generateText(params);

        // Log token usage
        if (userId) {
          const modelId = (model as any).modelId || 'unknown';
          const cost = calculateAICost(modelId, result.usage);

          auditLogService.logAsync({
            userId,
            action: 'AI_GENERATE' as any,
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
          } catch (e) {
            // Fall through to JSON parsing if string validation fails for some reason
          }
        }

        // Attempt to extract JSON if the model wrapped it in markdown blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;

        try {
          const parsed = JSON.parse(jsonString);
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
              action: 'AI_VALIDATION_FAILED' as any,
              resourceType: 'AI_MODEL',
              resourceId: (model as any).modelId || 'unknown',
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
  static async stream(options: Omit<ValidatedAIRunnerOptions<any>, 'schema'>) {
    const { model, prompt, messages, system, abortSignal, userId, feature } = options;

    const params: any = {
      model,
      system,
      abortSignal,
      onFinish: (event: any) => {
        if (userId) {
          const modelId = (model as any).modelId || 'unknown';
          const cost = calculateAICost(modelId, event.usage);

          auditLogService.logAsync({
            userId,
            action: 'AI_GENERATE' as any,
            resourceType: 'AI_MODEL',
            resourceId: modelId,
            metadata: {
              feature,
              usage: event.usage,
              cost,
              finishReason: event.finishReason,
            },
          });
        }
      },
    };

    if (messages) {
      params.messages = messages;
    } else {
      params.prompt = prompt;
    }

    const result = await streamText(params);

    return result;
  }
}
