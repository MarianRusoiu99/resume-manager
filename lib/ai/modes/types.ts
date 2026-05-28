/**
 * Mode System Types
 *
 * Defines the interface for AI conversation modes
 */

import type { z } from 'zod';
import type { ConversationContext } from '../chat/context';
import type { ConversationMode } from '../chat/conversation';
import type { AITool } from '../tools/types';

/**
 * Validation result from mode output validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
  }>;
  warnings?: string[];
}

/**
 * Mode configuration
 */
export interface AIMode<TOutput = unknown> {
  /** Unique mode identifier */
  id: ConversationMode;
  /** Human-readable name */
  name: string;
  /** Mode description */
  description: string;
  
  /** Zod schema for validating output */
  outputSchema: z.ZodType<TOutput>;
  
  /**
   * Builds the system prompt for this mode
   * @param context - Current conversation context
   */
  buildSystemPrompt(context: ConversationContext): string;
  
  /**
   * Gets the tools available in this mode
   */
  getTools(): AITool[];
  
  /**
   * Preprocesses user message before sending to AI
   * Can inject context, format attachments, etc.
   */
  preprocessUserMessage?(
    message: string,
    context: ConversationContext
  ): string;
  
  /**
   * Post-processes the raw AI output
   * Handles parsing, cleaning, and transforming
   */
  postprocessOutput?(raw: unknown): TOutput;
  
  /**
   * Validates the output beyond schema validation
   * Can check business rules, completeness, etc.
   */
  validateOutput?(output: TOutput): ValidationResult;
  
  /**
   * Whether this mode requires vision/image capability
   */
  requiresVision?: boolean;
  
  /**
   * Whether structured output (JSON mode) should be used
   */
  useStructuredOutput?: boolean;
  
  /**
   * Maximum tokens for response (if different from default)
   */
  maxTokens?: number;

  /**
   * Primary key in the output JSON that contains the main result.
   * Useful for UI hooks to automatically extract the relevant data.
   */
  primaryResultKey?: string;
}

/**
 * Mode registry for looking up modes by ID
 */
export type ModeRegistry = Map<ConversationMode, AIMode>;

/**
 * Creates a type-safe mode definition
 */
export function defineMode<TOutput>(mode: AIMode<TOutput>): AIMode<TOutput> {
  return mode;
}

/**
 * Output type for resume generation mode
 */
export interface ResumeGenerationOutput {
  resume: import('@/lib/validations/jsonresume').Resume;
}

/**
 * Output type for resume enhancement mode
 */
export interface ResumeEnhancementOutput {
  resume: import('@/lib/validations/jsonresume').Resume;
  changes?: string[];
}

/**
 * Output type for cover letter generation mode
 */
export interface CoverLetterOutput {
  content: string;
  subject?: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
}

/**
 * Output type for template generation mode
 */
export interface TemplateGenerationOutput {
  htmlTemplate: string;
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Output type for template enhancement mode
 */
export interface TemplateEnhancementOutput {
  htmlTemplate: string;
  changes?: string[];
}

/**
 * Output type for text enhancement mode
 */
export interface TextEnhancementOutput {
  content: string;
}

/**
 * Union of all possible mode outputs
 */
export type AnyModeOutput =
  | ResumeGenerationOutput
  | ResumeEnhancementOutput
  | CoverLetterOutput
  | TemplateGenerationOutput
  | TemplateEnhancementOutput
  | TextEnhancementOutput;
