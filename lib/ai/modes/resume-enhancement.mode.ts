/**
 * Resume Enhancement Mode
 *
 * Mode for enhancing/refining an existing resume through conversation
 */

import { defineMode } from './types';
import { resumeEnhancementOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, RESUME_EXPERT_PROMPT, RESUME_OUTPUT_INSTRUCTIONS, TRUTHFULNESS_REMINDER } from '../prompts/system';
import type { ConversationContext } from '../chat/context';

export const resumeEnhancementMode = defineMode({
  id: 'resume-enhancement',
  name: 'Resume Enhancement',
  description: 'Enhance and refine an existing resume through conversational iteration',

  outputSchema: resumeEnhancementOutputSchema,

  useStructuredOutput: true,
  maxTokens: 8000,

  buildSystemPrompt(context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      RESUME_EXPERT_PROMPT,
      '',
      '## YOUR TASK',
      'You are helping the user refine and enhance their resume through conversation.',
      'For each request:',
      '1. Make the requested changes while maintaining the overall structure',
      '2. Preserve all information that the user has not asked to change',
      '3. Explain what changes you made in the "changes" field',
      '4. NEVER add fabricated information - only work with what\'s provided',
      '',
      '## ENHANCEMENT CAPABILITIES',
      '- Improve wording and phrasing for impact',
      '- Add action verbs and power words',
      '- Reorganize sections for better flow',
      '- Optimize for ATS keywords (using real skills only)',
      '- Improve bullet point structure',
      '- Enhance professional summary',
      '- Fix grammar and formatting issues',
      '',
      RESUME_OUTPUT_INSTRUCTIONS,
    ];

    // Add job context if targeting a specific role
    if (context.job?.description) {
      parts.push('');
      parts.push('## TARGET JOB (for optimization)');
      parts.push('When enhancing, prioritize skills and experiences relevant to this job:');
    }

    parts.push('');
    parts.push(TRUTHFULNESS_REMINDER);

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Always include current resume state
    if (context.currentResume) {
      parts.push('## CURRENT RESUME');
      parts.push('```json');
      parts.push(JSON.stringify(context.currentResume, null, 2));
      parts.push('```');
      parts.push('');
    }

    // Include job if targeting
    if (context.job?.description) {
      parts.push('## TARGET JOB');
      parts.push(context.job.description);
      parts.push('');
    }

    parts.push('## USER REQUEST');
    parts.push(message || 'Please enhance this resume for better impact and ATS optimization.');

    return parts.join('\n');
  },

  getTools() {
    return [];
  },

  validateOutput(output) {
    const errors: Array<{ path: string; message: string }> = [];

    if (!output.resume.basics?.name) {
      errors.push({ path: 'resume.basics.name', message: 'Name is required' });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
