/**
 * Validation and Correction Logic
 *
 * Implements a feedback loop where AI outputs are validated against a schema,
 * and if validation fails, the error is fed back to the AI for correction.
 */

import { generateObject, type LanguageModel, type CoreMessage } from 'ai';
import { z, type ZodSchema } from 'zod';
import { logger } from '@/lib/utils/logger';

interface ValidationCorrectionConfig<T> {
  /** Language model to use */
  model: LanguageModel;
  /** Zod schema for validation */
  schema: ZodSchema<T>;
  /** System prompt */
  systemPrompt: string;
  /** Messages for context */
  messages: CoreMessage[];
  /** Maximum number of correction attempts (default: 2) */
  maxCorrections?: number;
  /** Abort signal */
  abortSignal?: AbortSignal;
}

/**
 * Generate an object with validation and automatic correction loop
 */
export async function generateWithValidation<T>(
  config: ValidationCorrectionConfig<T>
): Promise<T> {
  const {
    model,
    schema,
    systemPrompt,
    messages: initialMessages,
    maxCorrections = 2,
    abortSignal,
  } = config;

  const currentMessages = [...initialMessages];
  let attempts = 0;

  while (attempts <= maxCorrections) {
    try {
      const result = await generateObject({
        model,
        system: systemPrompt,
        messages: currentMessages,
        schema,
        abortSignal,
      });

      // If we got here, Zod validation passed (generateObject throws on schema mismatch)
      return result.object;
    } catch (error) {
      attempts++;
      
      // If we've exhausted attempts, rethrow the error
      if (attempts > maxCorrections) {
        logger.error('Max validation correction attempts exceeded', {
          attempts,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }

      // Check if it's a validation error we can try to fix
      // AI SDK generateObject throws TypeValidationError or similar when schema fails
      // We extract the error info and ask AI to fix it
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.warn(`Validation failed, attempting correction ${attempts}/${maxCorrections}`, {
        error: errorMessage
      });

      // Append the error to the conversation history to guide the AI
      currentMessages.push({
        role: 'user',
        content: `The previous response was invalid. Please fix the following errors and try again:\n${errorMessage}`
      });
    }
  }

  // Should be unreachable due to the throw in the loop
  throw new Error('Validation correction loop failed unexpectedly');
}
