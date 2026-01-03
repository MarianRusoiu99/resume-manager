/**
 * Text Enhancement Mode
 *
 * Simple mode for enhancing individual text fields (summaries, descriptions, etc.)
 */

import { defineMode } from './types';
import { textEnhancementOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, TRUTHFULNESS_REMINDER } from '../prompts/system';
import type { ConversationContext } from '../chat/context';

export const textEnhancementMode = defineMode({
  id: 'text-enhancement',
  name: 'Text Enhancement',
  description: 'Enhance individual text fields like summaries and descriptions',

  outputSchema: textEnhancementOutputSchema,
  primaryResultKey: 'content',

  useStructuredOutput: true,
  maxTokens: 2000,

  buildSystemPrompt(context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      '## YOUR TASK',
      'Enhance the provided text to be more impactful and professional.',
      '',
      '### ENHANCEMENT GUIDELINES',
      '- Improve clarity and readability',
      '- Use strong action verbs',
      '- Make content more concise if verbose',
      '- Add impact without changing meaning',
      '- Maintain professional tone',
      '- Preserve all factual information',
      '',
      '### DO NOT',
      '- Add information not present in the original',
      '- Change the fundamental meaning',
      '- Add fabricated achievements or metrics',
      '- Use overly complex vocabulary',
      '',
      '## OUTPUT FORMAT',
      'Return a JSON object with:',
      '- content: The enhanced text',
    ];

    // Add context about what field is being enhanced
    if (context.personalInstructions) {
      parts.push('');
      parts.push('## CONTEXT');
      parts.push(context.personalInstructions);
    }

    // Add job context if targeting
    if (context.job?.description) {
      parts.push('');
      parts.push('## TARGET JOB (for keyword optimization)');
      parts.push('Incorporate relevant keywords naturally where appropriate.');
    }

    parts.push('');
    parts.push(TRUTHFULNESS_REMINDER);

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Include job context if available
    if (context.job?.description) {
      parts.push('## TARGET JOB DESCRIPTION');
      parts.push(context.job.description);
      parts.push('');
    }

    parts.push('## TEXT TO ENHANCE');
    parts.push(message);

    return parts.join('\n');
  },

  getTools() {
    return [];
  },

  validateOutput(output) {
    const errors: Array<{ path: string; message: string }> = [];

    if (!output.content || output.content.length < 10) {
      errors.push({ path: 'content', message: 'Enhanced content is too short' });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
