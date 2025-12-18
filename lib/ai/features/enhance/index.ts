import type { LanguageModel } from 'ai';
import { generateText } from 'ai';

import type { ContentType } from '@/lib/validations/settings';

export type EnhanceTextInput = {
  content: string;
  instructions: string;
  context?: string;
  contentType: ContentType;
};

export type EnhanceTextResult = {
  enhancedContent: string;
  metadata: {
    model: string;
    provider: string;
    contentType: ContentType;
  };
};

function getSystemPrompt(contentType: ContentType): string {
  const basePrompt = `You are an expert text enhancement assistant. Your task is to modify the provided content according to the user's instructions while preserving the original meaning and structure unless explicitly asked to change them.

CRITICAL RULES:
1. Return ONLY the enhanced content, without any explanations, introductions, or meta-commentary
2. Do NOT wrap your response in code blocks or markdown formatting unless the content type specifically requires it
3. Preserve the overall structure and format of the original content
4. Make changes that directly address the user's instructions
5. Maintain a professional and consistent tone unless asked otherwise`;

  const typeSpecificInstructions: Record<ContentType, string> = {
    html: `
You are enhancing HTML content. Additional rules:
- Preserve valid HTML structure and semantics
- You may improve accessibility, semantic elements, or structure if relevant to the instructions
- Return clean, properly formatted HTML`,
    css: `
You are enhancing CSS content. Additional rules:
- Preserve valid CSS syntax
- You may improve organization, naming, or add helpful comments if relevant
- Follow modern CSS best practices
- Return clean, properly formatted CSS`,
    markdown: `
You are enhancing Markdown content. Additional rules:
- Preserve valid Markdown syntax
- You may improve formatting, structure, or readability if relevant
- Return clean, properly formatted Markdown`,
    text: `
You are enhancing plain text content. Additional rules:
- Focus on clarity, grammar, and readability
- Maintain the original tone unless asked to change it`,
  };

  return basePrompt + typeSpecificInstructions[contentType];
}

function buildUserPrompt(input: EnhanceTextInput): string {
  const extraContext = input.context
    ? `ADDITIONAL CONTEXT (Use this for reference, e.g., job description, company info, or uploaded files):\n${input.context}\n\n`
    : '';

  return `CONTENT TO ENHANCE:
${input.content}

${extraContext}USER INSTRUCTIONS:
${input.instructions}

Please enhance the content according to the instructions above. Return ONLY the enhanced content.`;
}

import { z } from 'zod';
import { ValidatedAIRunner } from '../../core/validated-runner';

// ... (keep types and helper functions)

export async function enhanceText(
  model: LanguageModel,
  providerType: string,
  modelKey: string,
  input: EnhanceTextInput,
  userId?: string
): Promise<EnhanceTextResult> {
  const systemPrompt = getSystemPrompt(input.contentType);
  const userPrompt = buildUserPrompt(input);

  const result = await ValidatedAIRunner.run({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    schema: z.string(), // For text enhancement, we just expect a string
    userId,
    feature: 'enhance',
  } as any);

  return {
    enhancedContent: typeof result === 'string' ? result.trim() : JSON.stringify(result),
    metadata: {
      model: modelKey,
      provider: providerType,
      contentType: input.contentType,
    },
  };
}

/**
 * Streams text enhancement
 */
export async function streamEnhanceText(
  model: LanguageModel,
  input: EnhanceTextInput,
  userId?: string
) {
  const systemPrompt = getSystemPrompt(input.contentType);
  const userPrompt = buildUserPrompt(input);

  return ValidatedAIRunner.stream({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    userId,
    feature: 'enhance-stream',
  });
}

