import { AIMessage, HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { ResumeGenerationState } from './types';

/**
 * Create a system message for an agent
 */
export function createSystemMessage(content: string): SystemMessage {
  return new SystemMessage(content);
}

/**
 * Create a human message
 */
export function createHumanMessage(content: string): HumanMessage {
  return new HumanMessage(content);
}

/**
 * Create an AI message
 */
export function createAIMessage(content: string): AIMessage {
  return new AIMessage(content);
}

/**
 * Format messages for display/logging
 */
export function formatMessages(messages: BaseMessage[]): string {
  return messages
    .map((msg, idx) => {
      const role = msg._getType();
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return `[${idx + 1}] ${role.toUpperCase()}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`;
    })
    .join('\n');
}

/**
 * Add a message to the state (returns PARTIAL state for agent returns)
 * 
 * Note: Use this in agents that return Partial<ResumeGenerationState>.
 * The state reducer will merge the messages array automatically.
 */
export function addMessage(state: ResumeGenerationState, message: BaseMessage): Partial<ResumeGenerationState> {
  return {
    messages: [message] // Return only new messages - reducer will append
  };
}

/**
 * Add an error to the state (returns PARTIAL state for agent returns)
 * 
 * Note: Use this in agents that return Partial<ResumeGenerationState>.
 * The state reducer will merge the errors array automatically.
 */
export function addError(state: ResumeGenerationState, error: string): Partial<ResumeGenerationState> {
  return {
    errors: [error] // Return only new errors - reducer will append
  };
}

/**
 * Update current step in the workflow (returns PARTIAL state)
 */
export function setCurrentStep(state: ResumeGenerationState, step: string): Partial<ResumeGenerationState> {
  return {
    currentStep: step
  };
}

/**
 * Track token usage (returns PARTIAL state for agent returns)
 * 
 * Note: Use this in agents that return Partial<ResumeGenerationState>.
 * The state reducer will sum token usage automatically.
 */
export function addTokens(state: ResumeGenerationState, tokens: number): Partial<ResumeGenerationState> {
  return {
    tokensUsed: tokens // Return only new tokens - reducer will sum
  };
}

/**
 * Check if state has required data for a step
 */
export function hasJobAnalysis(state: ResumeGenerationState): boolean {
  return state.jobAnalysis !== undefined;
}

export function hasProfileMatch(state: ResumeGenerationState): boolean {
  return state.profileMatch !== undefined;
}

export function hasOptimizedContent(state: ResumeGenerationState): boolean {
  return state.optimizedResume !== undefined;
}

export function hasFormatValidation(state: ResumeGenerationState): boolean {
  return state.formatValidation !== undefined;
}

/**
 * Extract text content from a message
 */
export function extractTextContent(message: BaseMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .map(item => (typeof item === 'string' ? item : JSON.stringify(item)))
      .join(' ');
  }
  return JSON.stringify(message.content);
}

/**
 * Parse JSON from agent response, handling potential errors
 */
export function parseAgentJSON<T>(content: string): T | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }

    // Try to parse directly
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('Failed to parse agent JSON:', error);
    return null;
  }
}

/**
 * Create initial state for workflow
 */
export interface CreateInitialStateOptions {
  personalInstructions?: string;
  includeCoverLetter?: boolean;
}

export function createInitialState(
  jobDescription: string,
  userResume: Resume,
  options?: CreateInitialStateOptions
): ResumeGenerationState {
  return {
    jobDescription,
    userResume,
    personalInstructions: options?.personalInstructions,
    includeCoverLetter: options?.includeCoverLetter,
    messages: [],
    errors: [],
    tokensUsed: 0,
    currentStep: 'init'
  };
}

/**
 * Validate that user resume has required fields
 */
export function validateUserProfile(resume: ResumeGenerationState['userResume']): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!resume.basics?.name) {
    errors.push('Name is required');
  }
  if (!resume.basics?.email) {
    errors.push('Email is required');
  }
  if (!resume.work || resume.work.length === 0) {
    errors.push('At least one work experience is required');
  }
  if (!resume.education || resume.education.length === 0) {
    errors.push('At least one education entry is required');
  }
  if (!resume.skills || resume.skills.length === 0) {
    errors.push('At least some skills are required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log state for debugging
 */
export function logState(state: ResumeGenerationState, prefix = ''): void {
  console.log(`${prefix}=== Workflow State ===`);
  console.log(`${prefix}Current Step: ${state.currentStep || 'N/A'}`);
  console.log(`${prefix}Tokens Used: ${state.tokensUsed}`);
  console.log(`${prefix}Errors: ${state.errors.length}`);
  console.log(`${prefix}Messages: ${state.messages.length}`);
  console.log(`${prefix}Job Analysis: ${state.jobAnalysis ? 'YES' : 'NO'}`);
  console.log(`${prefix}Profile Match: ${state.profileMatch ? 'YES' : 'NO'}`);
  console.log(`${prefix}Optimized Resume: ${state.optimizedResume ? 'YES' : 'NO'}`);
  console.log(`${prefix}Format Validation: ${state.formatValidation ? 'YES' : 'NO'}`);
  console.log(`${prefix}Generated Resume: ${state.generatedResume ? 'YES' : 'NO'}`);
  console.log(`${prefix}=====================`);
}
