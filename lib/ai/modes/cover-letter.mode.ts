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
      '1. Addresses specific job requirements',
      '2. Highlights relevant experience from candidate\'s background',
      '3. Shows genuine interest in company and role',
      '4. Maintains professional tone while being engaging',
      '5. Complements (not repeats) resume',
      '',
      '## REQUIRED ELEMENTS',
      'Your cover letter MUST include:',
      '- Candidate\'s name at the top (from candidate profile)',
      '- Contact information (email, phone) at the end in signature area',
      '- Reference to location if relevant for context (relocation, local availability)',
      '- Mention of relevant profiles (LinkedIn, portfolio, GitHub) if available',
      '- These details are CRITICAL for hiring manager to identify and contact the candidate',
      '',
      COVER_LETTER_OUTPUT_INSTRUCTIONS,
    ];

    // Add context about available information
    if (context.userProfile?.resume || context.currentResume) {
      parts.push('');
      parts.push('## CANDIDATE BACKGROUND');
      parts.push('Use provided resume/profile as source for candidate\'s experience and skills.');
      parts.push('Draw specific examples from their work history to support claims in cover letter.');
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

    // Include resume/profile with explicit headers for personal information
    const profileResume = context.userProfile?.resume || context.currentResume;
    if (profileResume) {
      const basics = profileResume.basics || {};
      parts.push('## CANDIDATE PROFILE INFORMATION');
      parts.push(`Name: ${basics.name || 'Not specified'}`);
      parts.push(`Email: ${basics.email || 'Not specified'}`);
      parts.push(`Phone: ${basics.phone || 'Not specified'}`);
      if (basics.location) {
        parts.push(`Location: ${[basics.location.city, basics.location.region, basics.location.countryCode].filter(Boolean).join(', ') || 'Not specified'}`);
      }
      if (basics.profiles && basics.profiles.length > 0) {
        parts.push('Profiles:');
        basics.profiles.forEach((profile: { network?: string; username?: string; url?: string }) => {
          parts.push(`  - ${profile.network}: ${profile.url || profile.username || 'Not specified'}`);
        });
      }
      parts.push('');

      parts.push('## FULL RESUME DETAILS');
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
