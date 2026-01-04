/**
 * Resume Generation Mode
 *
 * Mode for generating tailored resumes from user profile + job description
 */

import { defineMode } from './types';
import { resumeGenerationOutputSchema } from '../schemas';
import { BASE_SYSTEM_PROMPT, RESUME_EXPERT_PROMPT, RESUME_OUTPUT_INSTRUCTIONS, TRUTHFULNESS_REMINDER } from '../prompts/system';
import type { ConversationContext } from '../chat/context';

export const resumeGenerationMode = defineMode({
  id: 'resume-generation',
  name: 'Resume Generation',
  description: 'Generate a tailored resume from profile data and job description',

  outputSchema: resumeGenerationOutputSchema,
  primaryResultKey: 'resume',

  useStructuredOutput: true,
  maxTokens: 8000,

  buildSystemPrompt(context: ConversationContext): string {
    const parts: string[] = [
      BASE_SYSTEM_PROMPT,
      '',
      RESUME_EXPERT_PROMPT,
      '',
      '## YOUR TASK',
      'Generate a tailored resume that:',
      '1. Matches the job requirements as closely as possible using ONLY the candidate\'s real experience',
      '2. Optimizes for ATS while maintaining human readability',
      '3. Highlights relevant skills and achievements',
      '4. Uses strong action verbs and quantifiable results where available',
      '',
      RESUME_OUTPUT_INSTRUCTIONS,
    ];

    // Add profile context if available
    if (context.userProfile?.resume || context.currentResume) {
      parts.push('');
      parts.push('## CANDIDATE PROFILE');
      parts.push('The candidate has provided their profile data. Use this as the source of truth.');
      parts.push('Do NOT add any skills, experiences, or qualifications not present in this profile.');
    }

    // Add job description context if available
    if (context.job?.description) {
      parts.push('');
      parts.push('## TARGET JOB');
      parts.push('The job description will be provided. Tailor the resume to match this role.');
      parts.push('Focus on experiences and skills that align with the requirements.');
    }

    parts.push('');
    parts.push(TRUTHFULNESS_REMINDER);

    return parts.join('\n');
  },

  preprocessUserMessage(message: string, context: ConversationContext): string {
    const parts: string[] = [];

    // Add field enrichment instructions at the top
    parts.push('## RESUME ENRICHMENT INSTRUCTIONS');
    parts.push('- Use ALL information from the candidate\'s profile');
    parts.push('- Synthesize information from different sections to populate relevant fields');
    parts.push('- All JSON Resume fields are OPTIONAL - include them if you can meaningfully populate them');
    parts.push('- Move and reorganize information to create the most coherent structure');
    parts.push('- Example: If volunteer work has impressive achievements, ensure \'volunteer\' section includes them');
    parts.push('- Example: If publications are mentioned in work, extract them to \'publications\' section');
    parts.push('- Example: If projects are described in education/work, create \'projects\' entries');
    parts.push('- Example: Extract certifications mentioned in work into \'certificates\' field');
    parts.push('- Example: Extract awards from education into \'awards\' field');
    parts.push('- Split single entries into multiple ones if appropriate (e.g., one work position with 3 major projects)');
    parts.push('- Merge related information if it makes more sense together');
    parts.push('');

    // If this is first message, inject full context
    if (context.job?.description) {
      parts.push('## JOB DESCRIPTION');
      parts.push(context.job.description);
      parts.push('');
    }

    const profileResume = context.userProfile?.resume || context.currentResume;
    if (profileResume) {
      parts.push('## CANDIDATE PROFILE (JSON Resume format)');
      parts.push('```json');
      parts.push(JSON.stringify(profileResume, null, 2));
      parts.push('```');
      parts.push('');
    }

    if (message.trim()) {
      parts.push('## ADDITIONAL INSTRUCTIONS');
      parts.push(message);
    } else {
      parts.push('Please generate a tailored resume for this job based on candidate profile.');
    }

    return parts.join('\n');
  },

  getTools() {
    // No tools needed for resume generation
    return [];
  },

  validateOutput(output) {
    const errors: Array<{ path: string; message: string }> = [];
    const warnings: string[] = [];

    // Validate required basics fields
    if (!output.resume.basics?.name) {
      errors.push({ path: 'resume.basics.name', message: 'Name is required' });
    }

    // Warn if work experience is empty
    if (!output.resume.work?.length) {
      warnings.push('No work experience included in the resume');
    }

    // Warn if skills are empty
    if (!output.resume.skills?.length) {
      warnings.push('No skills section included in the resume');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
});
