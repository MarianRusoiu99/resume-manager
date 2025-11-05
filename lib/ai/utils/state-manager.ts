/**
 * State Manager Utilities
 * 
 * Clean utilities for managing workflow state immutably
 */

import { BaseMessage } from '@langchain/core/messages';
import type { ResumeGenerationState } from '../workflow/types';

/**
 * Add a message to state immutably
 */
export function addMessage(
  state: ResumeGenerationState,
  message: BaseMessage
): ResumeGenerationState {
  return {
    ...state,
    messages: [...state.messages, message]
  };
}

/**
 * Add multiple messages to state
 */
export function addMessages(
  state: ResumeGenerationState,
  messages: BaseMessage[]
): ResumeGenerationState {
  return {
    ...state,
    messages: [...state.messages, ...messages]
  };
}

/**
 * Add an error to state
 */
export function addError(
  state: ResumeGenerationState,
  error: string
): ResumeGenerationState {
  return {
    ...state,
    errors: [...state.errors, error]
  };
}

/**
 * Add multiple errors to state
 */
export function addErrors(
  state: ResumeGenerationState,
  errors: string[]
): ResumeGenerationState {
  return {
    ...state,
    errors: [...state.errors, ...errors]
  };
}

/**
 * Update current step
 */
export function setCurrentStep(
  state: ResumeGenerationState,
  step: string
): ResumeGenerationState {
  return {
    ...state,
    currentStep: step
  };
}

/**
 * Add token usage
 */
export function addTokens(
  state: ResumeGenerationState,
  tokens: number
): ResumeGenerationState {
  return {
    ...state,
    tokensUsed: state.tokensUsed + tokens
  };
}

/**
 * Clear errors from state
 */
export function clearErrors(state: ResumeGenerationState): ResumeGenerationState {
  return {
    ...state,
    errors: []
  };
}

/**
 * Check if state has errors
 */
export function hasErrors(state: ResumeGenerationState): boolean {
  return state.errors.length > 0;
}

/**
 * Check if state has required data for specific steps
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

export function hasGeneratedResume(state: ResumeGenerationState): boolean {
  return state.generatedResume !== undefined;
}

/**
 * Create initial state with required fields
 */
export function createInitialState(
  input: Pick<
    ResumeGenerationState,
    'jobDescription' | 'userResume'  | 'personalInstructions' | 'includeCoverLetter'
  >
): ResumeGenerationState {
  return {
    ...input,
    messages: [],
    errors: [],
    tokensUsed: 0,
    currentStep: 'init'
  };
}

/**
 * Log state for debugging
 */
export function logState(state: ResumeGenerationState, prefix: string = ''): void {
  console.log(`${prefix}Current Step: ${state.currentStep || 'none'}`);
  console.log(`${prefix}Errors: ${state.errors.length}`);
  console.log(`${prefix}Messages: ${state.messages.length}`);
  console.log(`${prefix}Tokens Used: ${state.tokensUsed}`);
  console.log(`${prefix}Has Job Analysis: ${hasJobAnalysis(state)}`);
  console.log(`${prefix}Has Profile Match: ${hasProfileMatch(state)}`);
  console.log(`${prefix}Has Optimized Content: ${hasOptimizedContent(state)}`);
  console.log(`${prefix}Has Format Validation: ${hasFormatValidation(state)}`);
  console.log(`${prefix}Has Generated Resume: ${hasGeneratedResume(state)}`);
  
  if (state.errors.length > 0) {
    console.log(`${prefix}Errors:`);
    state.errors.forEach((error, idx) => {
      console.log(`${prefix}  ${idx + 1}. ${error}`);
    });
  }
}
