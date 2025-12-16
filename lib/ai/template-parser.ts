/**
 * AI-powered Template Parser
 * Extracts resume template structure from images using vision API
 * Supports OpenAI, Anthropic, and Google vision models
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  templateExtractionSchema,
  TEMPLATE_EXTRACTION_PROMPT,
  TEMPLATE_EXTRACTION_USER_MESSAGE,
  type ExtractedTemplateData
} from "./prompts/template-extraction";
import { logger } from "@/lib/utils/logger";

/**
 * Extracted template data with resolved types
 */
export interface ExtractedTemplate extends ExtractedTemplateData {
  category: 'PROFESSIONAL' | 'MODERN' | 'CREATIVE' | 'ATS_OPTIMIZED' | 'MINIMAL';
}

/**
 * Input for template parsing
 */
export interface ParseTemplateInput {
  imageBase64: string;
  mimeType: string;
  apiKey: string;
  providerType: 'openai' | 'anthropic' | 'google';
  modelId?: string;
}

/**
 * Default vision models for each provider
 */
const DEFAULT_VISION_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
};

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Create AI SDK model based on provider type
 */
function createVisionModel(providerType: string, apiKey: string, modelId?: string) {
  const model = modelId || DEFAULT_VISION_MODELS[providerType];

  switch (providerType) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }
    default:
      throw new Error(`Unsupported provider for vision: ${providerType}`);
  }
}

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
 * Clean JSON response from LLM (remove markdown code blocks if present)
 */
function cleanJsonResponse(text: string): string {
  let jsonText = text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }

  return jsonText.trim();
}

/**
 * Extract template from image using vision API with retry logic
 * 
 * @param input - Parse template input with image data and provider info
 * @returns Extracted template with HTML and CSS
 */
export async function parseTemplateFromImage(input: ParseTemplateInput): Promise<ExtractedTemplate> {
  const { imageBase64, mimeType, apiKey, providerType, modelId } = input;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        logger.info(`Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts} after ${delay}ms delay`);
        await sleep(delay);
      }

      const model = createVisionModel(providerType, apiKey, modelId);

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

      // Clean and parse the response
      const jsonText = cleanJsonResponse(responseText);
      const rawData = JSON.parse(jsonText);

      // Validate with Zod schema
      const validationResult = templateExtractionSchema.safeParse(rawData);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Invalid AI response: ${errors}`);
      }

      const validated = validationResult.data;

      return {
        htmlTemplate: validated.htmlTemplate,
        cssStyles: validated.cssStyles,
        name: validated.name,
        category: validated.category || 'PROFESSIONAL',
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
  throw new Error(`Template extraction failed after ${RETRY_CONFIG.maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use parseTemplateFromImage with full input object
 */
export async function parseTemplateFromImageLegacy(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedTemplate> {
  return parseTemplateFromImage({
    imageBase64,
    mimeType,
    apiKey,
    providerType: 'openai', // Default to OpenAI for legacy calls
  });
}
