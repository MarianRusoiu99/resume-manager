import type { LanguageModel, CoreMessage } from 'ai';
import { z } from 'zod';
import { ValidatedAIRunner } from '../../core/validated-runner';
import type { ContentType } from '@/lib/validations/settings';

export type EnhanceTextInput = {
  content: string;
  instructions: string;
  context?: string;
  contentType: ContentType;
  attachments?: Array<{
    type: string;
    content: string; // base64 for images, text for others
    name: string;
  }>;
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
  const basePrompt = `You are an expert text enhancement assistant. Your task is to modify the provided content according to user's instructions.

CRITICAL RULES:
1. Return ONLY enhanced content, without any explanations, introductions, or meta-commentary
2. Do NOT wrap your response in code blocks or markdown formatting unless the content type specifically requires it
3. Preserve the overall structure and format of the original content
4. If input is JSON, ONLY enhance text values within the JSON - do NOT change keys, structure, or format
5. Make changes that directly address the user's instructions
6. Maintain a professional and consistent tone unless asked otherwise
7. For JSON content: Return valid JSON with the exact same structure, only enhanced text values
8. IMPORTANT: If "ATTACHED REFERENCE MATERIAL" or "IMAGE ATTACHMENTS" are provided, you MUST prioritize using information from them to fulfill the user's instructions (e.g., tailoring to a job description). You have permission to significantly rewrite the content to align with the provided reference material.
9. If the user asks to "tailor" or "optimize" based on attachments, you should replace generic content with specific details found in the attachments.`;

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

  const attachmentTexts = input.attachments
    ?.filter(a => !a.type.startsWith('image/'))
    .map(a => `ATTACHED FILE [${a.name}]:\n${a.content}`)
    .join('\n\n');

  const attachmentContext = attachmentTexts
    ? `### ATTACHED REFERENCE MATERIAL ###\n${attachmentTexts}\n\n`
    : '';

  const imageContext = input.attachments?.some(a => a.type.startsWith('image/'))
    ? `IMAGE ATTACHMENTS: I have attached images to this request. Please analyze their content and use it as context for the enhancement.\n\n`
    : '';

  // Detect if content is JSON (resume data) and handle accordingly
  const isJsonContent = input.content.trim().startsWith('{') || input.content.trim().startsWith('[');
  
  if (isJsonContent) {
    return `### ATTACHED REFERENCE MATERIAL ###
${attachmentContext}${imageContext}

### ORIGINAL CONTENT TO ENHANCE (JSON) ###
${input.content}

${extraContext}

### USER INSTRUCTIONS ###
${input.instructions}

CRITICAL: 
- Use the "ATTACHED REFERENCE MATERIAL" above to rewrite the text values in the JSON.
- If the instructions say "tailor" or "optimize", you MUST incorporate keywords, skills, and requirements from the reference material into the JSON text values.
- Be aggressive in tailoring: rewrite bullet points, summaries, and skills to match the reference material while maintaining truthfulness.
- Return the EXACT same JSON structure.
- ONLY enhance the text values, do not modify keys.
- Do NOT add explanations or meta-commentary.
- Return valid JSON only.`;
  }

  return `### ATTACHED REFERENCE MATERIAL ###
${attachmentContext}${imageContext}

### CONTENT TO ENHANCE ###
${input.content}

${extraContext}

### USER INSTRUCTIONS ###
${input.instructions}

Please enhance the content according to the instructions above. Use the "ATTACHED REFERENCE MATERIAL" to inform the enhancement. If the user asks to tailor the content, ensure the output reflects the requirements in the reference material. Return ONLY the enhanced content as plain text.`;
}

export async function enhanceText(
  model: LanguageModel,
  providerType: string,
  modelKey: string,
  input: EnhanceTextInput,
  userId?: string
): Promise<EnhanceTextResult> {
  const systemPrompt = getSystemPrompt(input.contentType);
  const userPrompt = buildUserPrompt(input);

  const messages: CoreMessage[] = [
    { 
      role: 'system', 
      content: systemPrompt + `\n\nIMPORTANT: Return ONLY the enhanced text. Do NOT include any JSON formatting, code blocks, or explanations. Just return the clean, enhanced text directly.` 
    },
    { 
      role: 'user', 
      content: [
        { type: 'text', text: userPrompt },
        ...(input.attachments?.filter(a => a.type.startsWith('image/')).map(a => ({
          type: 'image' as const,
          image: a.content, // base64 data URL
        })) || [])
      ]
    }
  ];

  const result = await ValidatedAIRunner.run({
    model,
    messages,
    schema: z.string(),
    userId,
    feature: 'enhance',
  });

  return {
    enhancedContent: typeof result === 'string' ? result.trim() : JSON.stringify(result),
    metadata: {
      model: modelKey,
      provider: providerType,
      contentType: input.contentType,
    },
  };
}
