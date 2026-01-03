/**
 * Cover Letter Mode
 *
 * Mode for generating personalized cover letters
 */

import { defineMode } from './types';
import { coverLetterOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, COVER_LETTER_EXPERT_PROMPT, COVER_LETTER_OUTPUT_INSTRUCTIONS, TRUTHFULNESS_REMINDER } from '../prompts/system';
import type { ConversationContext } from '../chat/context';

export const coverLetterMode = defineMode({
  id: 'cover-letter-generation',
  name: 'Cover Letter Generation',
  description: 'Generate personalized cover letters based on resume and job description',

  outputSchema: coverLetterOutputSchema,
  primaryResultKey: 'content',

  useStructuredOutput: true,
  maxTokens: 4000,

  buildSystemPrompt(context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      COVER_LETTER_EXPERT_PROMPT,
      '',
      '## YOUR TASK',
      'Generate a compelling, personalized cover letter that:',
      '1. Addresses the specific job requirements',
      '2. Highlights relevant experience from the candidate\'s background',
      '3. Shows genuine interest in the company and role',
      '4. Maintains professional tone while being engaging',
      '5. Complements (not repeats) the resume',
      '',
      COVER_LETTER_OUTPUT_INSTRUCTIONS,
    ];

    // Add context about available information
    if (context.userProfile?.resume || context.currentResume) {
      parts.push('');
      parts.push('## CANDIDATE BACKGROUND');
      parts.push('Use the provided resume/profile as the source for the candidate\'s experience and skills.');
      parts.push('Draw specific examples from their work history to support claims in the cover letter.');
    }

    if (context.job?.description) {
      parts.push('');
      parts.push('## TARGET JOB');
      parts.push('The job description is provided. Reference specific requirements and company details.');
    }

    parts.push('');
    parts.push(TRUTHFULNESS_REMINDER);

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Include job description
    if (context.job?.description) {
      parts.push('## JOB DESCRIPTION');
      parts.push(context.job.description);
      if (context.job.title) {
        parts.push(`\nPosition: ${context.job.title}`);
      }
      if (context.job.company) {
        parts.push(`Company: ${context.job.company}`);
      }
      parts.push('');
    }

    // Include resume/profile
    const profileResume = context.userProfile?.resume || context.currentResume;
    if (profileResume) {
      parts.push('## CANDIDATE RESUME');
      parts.push('```json');
      parts.push(JSON.stringify(profileResume, null, 2));
      parts.push('```');
      parts.push('');
    }

    // Include any existing cover letter for enhancement
    if (context.currentCoverLetter) {
      parts.push('## CURRENT COVER LETTER (to enhance/modify)');
      parts.push(context.currentCoverLetter);
      parts.push('');
    }

    // User instructions
    if (message.trim()) {
      parts.push('## ADDITIONAL INSTRUCTIONS');
      parts.push(message);
    } else {
      parts.push('Please generate a compelling cover letter for this job application.');
    }

    return parts.join('\n');
  },

  getTools() {
    return [];
  },

  validateOutput(output) {
    const errors: Array<{ path: string; message: string }> = [];
    const warnings: string[] = [];

    if (!output.content || output.content.length < 100) {
      errors.push({ path: 'content', message: 'Cover letter content is too short' });
    }

    if (!output.companyName) {
      warnings.push('Company name was not identified');
    }

    if (!output.jobTitle) {
      warnings.push('Job title was not identified');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});
