/**
 * Template Enhancement Mode
 *
 * Mode for enhancing/modifying existing resume templates through conversation
 */

import { defineMode } from './types';
import { templateEnhancementOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, TEMPLATE_EXPERT_PROMPT, HANDLEBARS_REFERENCE } from '../prompts/system';
import type { ConversationContext } from '../chat/context';

export const templateEnhancementMode = defineMode({
  id: 'template-enhancement',
  name: 'Template Enhancement',
  description: 'Enhance and modify existing resume templates through conversation',

  outputSchema: templateEnhancementOutputSchema,
  primaryResultKey: 'htmlTemplate',

  useStructuredOutput: true,
  maxTokens: 12000,

  buildSystemPrompt(_context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      TEMPLATE_EXPERT_PROMPT,
      '',
      HANDLEBARS_REFERENCE,
      '',
      '## YOUR TASK',
      'You are helping the user modify and enhance their resume template.',
      '',
      '### CAPABILITIES',
      '- Modify colors, fonts, spacing, and layout',
      '- Add or remove sections',
      '- Improve responsiveness and print styling',
      '- Fix template bugs or rendering issues',
      '- Optimize for ATS compatibility',
      '- Enhance accessibility',
      '',
      '### RULES',
      '1. Preserve the overall structure unless asked to change it',
      '2. Keep all existing Handlebars placeholders intact',
      '3. Maintain proper HTML semantics',
      '4. Ensure print styles remain functional',
      '5. List all changes made in the "changes" array',
      '',
      '## OUTPUT FORMAT',
      'Return a JSON object with:',
      '- htmlTemplate: The modified HTML template including inline <style> blocks',
      '- changes: Array of strings describing what was changed',
    ];

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Include current template
    if (context.template?.htmlTemplate) {
      parts.push('## CURRENT HTML TEMPLATE');
      parts.push('```html');
      parts.push(context.template.htmlTemplate);
      parts.push('```');
      parts.push('');
    }

    parts.push('## USER REQUEST');
    parts.push(message || 'Please enhance this template for better visual appeal and usability.');

    return parts.join('\n');
  },

  getTools() {
    return [];
  },

  validateOutput(output) {
    const warnings: string[] = [];

    if (!output.htmlTemplate.includes('{{')) {
      warnings.push('HTML template might be missing Handlebars placeholders');
    }

    if (!output.htmlTemplate.includes('<style>')) {
      warnings.push('HTML template is missing a <style> tag. Styles should be embedded in the HTML.');
    }

    return {
      valid: true,
      errors: undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});
