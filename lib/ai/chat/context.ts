/**
 * Conversation Context
 *
 * Manages context data for AI conversations
 */

import type { Resume } from '@/lib/validations/jsonresume';
import type { Attachment } from './message';

/**
 * User profile context for resume/cover letter generation
 */
export interface UserProfileContext {
  /** User's master resume/profile */
  resume: Resume;
  /** User's name (for personalization) */
  name?: string;
}

/**
 * Job context for targeted generation
 */
export interface JobContext {
  /** Raw job description text */
  description: string;
  /** Parsed job title (if available) */
  title?: string;
  /** Company name (if available) */
  company?: string;
  /** Key requirements extracted */
  requirements?: string[];
}

/**
 * Template context for template generation/enhancement
 */
export interface TemplateContext {
  /** Current HTML template */
  htmlTemplate?: string;
  /** Current CSS styles */
  cssStyles?: string;
  /** Template name */
  name?: string;
}

/**
 * Complete conversation context
 */
export interface ConversationContext {
  /** User profile for resume operations */
  userProfile?: UserProfileContext;
  /** Job information for targeted generation */
  job?: JobContext;
  /** Template context for template operations */
  template?: TemplateContext;
  /** Currently working resume (for enhancement) */
  currentResume?: Resume;
  /** Currently working cover letter */
  currentCoverLetter?: string;
  /** Persistent attachments for the session */
  attachments?: Attachment[];
  /** Custom instructions from user */
  personalInstructions?: string;
}

/**
 * Creates an empty context
 */
export function createEmptyContext(): ConversationContext {
  return {};
}

/**
 * Merges new context data into existing context
 */
export function mergeContext(
  existing: ConversationContext,
  updates: Partial<ConversationContext>
): ConversationContext {
  return {
    ...existing,
    ...updates,
    // Deep merge for nested objects
    userProfile: updates.userProfile ?? existing.userProfile,
    job: updates.job ?? existing.job,
    template: updates.template ?? existing.template,
    attachments: updates.attachments ?? existing.attachments,
  };
}

/**
 * Formats context as a string for inclusion in prompts
 */
export function formatContextForPrompt(context: ConversationContext): string {
  const parts: string[] = [];

  if (context.userProfile?.resume) {
    parts.push(`## User's Profile Resume\n\`\`\`json\n${JSON.stringify(context.userProfile.resume, null, 2)}\n\`\`\``);
  }

  if (context.job?.description) {
    parts.push(`## Target Job Description\n${context.job.description}`);
  }

  if (context.currentResume) {
    parts.push(`## Current Working Resume\n\`\`\`json\n${JSON.stringify(context.currentResume, null, 2)}\n\`\`\``);
  }

  if (context.currentCoverLetter) {
    parts.push(`## Current Cover Letter\n${context.currentCoverLetter}`);
  }

  if (context.template?.htmlTemplate) {
    parts.push(`## Current Template HTML\n\`\`\`html\n${context.template.htmlTemplate}\n\`\`\``);
  }

  if (context.template?.cssStyles) {
    parts.push(`## Current Template CSS\n\`\`\`css\n${context.template.cssStyles}\n\`\`\``);
  }

  if (context.personalInstructions) {
    parts.push(`## Personal Instructions\n${context.personalInstructions}`);
  }

  return parts.join('\n\n');
}

/**
 * Checks if context has sufficient data for resume generation
 */
export function hasResumeGenerationContext(context: ConversationContext): boolean {
  return !!(context.userProfile?.resume && context.job?.description);
}

/**
 * Checks if context has sufficient data for cover letter generation
 */
export function hasCoverLetterContext(context: ConversationContext): boolean {
  return !!(context.userProfile?.resume && context.job?.description);
}

/**
 * Checks if context has sufficient data for template generation
 */
export function hasTemplateGenerationContext(context: ConversationContext): boolean {
  // Need at least one image attachment for template generation
  return context.attachments?.some((att) => att.type === 'image') ?? false;
}
