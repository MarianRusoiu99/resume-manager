/**
 * AI-powered Template Parser
 * Extracts resume template structure from images using vision API
 * Supports OpenAI, Anthropic, and Google vision models
 */

import { generateText } from "ai";
import { extractJSON } from '@/lib/ai/agents/shared';
import {
  templateExtractionSchema,
  TEMPLATE_EXTRACTION_PROMPT,
  TEMPLATE_EXTRACTION_USER_MESSAGE,
} from "./prompts/template-extraction";
import { logger } from "@/lib/utils/logger";
import { SchemaValidationError, ValidationError, ConfigurationError, AIProviderError } from "@/lib/errors";

/**
 * Extracted template data with resolved types
 */
export interface ExtractedTemplate {
  htmlTemplate: string;
  name?: string;
  description?: string;
}

/**
 * Input for template parsing
 */
export interface ParseTemplateInput {
  imageBase64: string;
  mimeType: string;
  provider: import('@/lib/ai/providers').AIProvider;
  modelKey: string;
}

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Extract template from image using vision API with retry logic
 * 
 * @param input - Parse template input with image data and provider info
 * @returns Extracted template with HTML and CSS
 */
export async function parseTemplateFromImage(input: ParseTemplateInput): Promise<ExtractedTemplate> {
  const { imageBase64, mimeType, provider, modelKey } = input;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        logger.info(`Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts} after ${delay}ms delay`);
        await sleep(delay);
      }

      const model = provider.createLanguageModel(modelKey);

      const { text: responseText } = await generateText({
        model,
        messages: [
          {
            role: "system",
            content: TEMPLATE_EXTRACTION_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: TEMPLATE_EXTRACTION_USER_MESSAGE,
              },
              {
                type: "image",
                image: `data:${mimeType};base64,${imageBase64}`,
              },
            ],
          },
        ],
        temperature: 0.3,
      });

       // Extract + parse the response
       const rawData = JSON.parse(extractJSON(responseText));

      // Validate with Zod schema
      const validationResult = templateExtractionSchema.safeParse(rawData);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        const errorDetails = validationResult.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        throw new SchemaValidationError(`Invalid AI response: ${errors}`, 'templateExtractionSchema', errorDetails);
      }

      const validated = validationResult.data;

      return {
        htmlTemplate: validated.htmlTemplate,
        name: validated.name,
        description: validated.description,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Template parsing attempt ${attempt + 1} failed`, lastError, {
        attempt: attempt + 1,
      });

      // Don't retry on validation errors (they won't get better)
      if (lastError.message.includes('Invalid AI response')) {
        throw lastError;
      }
    }
  }

  // All retries exhausted
  throw new AIProviderError('Template extraction failed', `Template extraction failed after ${RETRY_CONFIG.maxAttempts} attempts: ${lastError?.message}`, undefined, lastError);
}

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use parseTemplateFromImage with full input object
 */
export async function parseTemplateFromImageLegacy(
  _imageBase64: string,
  _mimeType: string,
  _apiKey: string
): Promise<ExtractedTemplate> {
  throw new ConfigurationError(
    'parseTemplateFromImageLegacy is no longer supported. Call parseTemplateFromImage with a resolved provider/modelKey.'
  );
}
