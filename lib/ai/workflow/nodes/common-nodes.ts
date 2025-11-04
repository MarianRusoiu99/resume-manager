/**
 * Workflow Nodes
 * 
 * Individual node definitions for the resume generation workflow
 * Each node represents a step in the workflow with clear responsibilities
 */

import type { ResumeGenerationState } from '../types';
import { setCurrentStep, addError } from '../utils';

/**
 * Input Validation Node
 * 
 * Validates that all required inputs are present before starting workflow
 * 
 * @param state - Current workflow state
 * @returns Updated state with validation results
 */
export async function validateInputNode(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  console.log('📋 [validate_input] Starting validation...');
  
  try {
    const errors: string[] = [];
    
    // Check required fields
    if (!state.jobDescription || state.jobDescription.trim().length === 0) {
      errors.push('Job description is required');
    } else if (state.jobDescription.trim().length < 50) {
      errors.push('Job description is too short (minimum 50 characters)');
    }
    
    if (!state.userResume) {
      errors.push('User resume is required');
    } else {
      // Validate resume has minimum required fields
      if (!state.userResume.basics) {
        errors.push('Resume must have basics section');
      }
      if (!state.userResume.work || state.userResume.work.length === 0) {
        errors.push('Resume must have at least one work experience');
      }
    }
    
    // If validation errors exist, add them to state
    if (errors.length > 0) {
      console.error('❌ [validate_input] Validation failed:', errors);
      return {
        currentStep: 'validate_input',
        errors: [...(state.errors || []), ...errors]
      };
    }
    
    console.log('✅ [validate_input] Validation passed');
    return {
      currentStep: 'validate_input'
    };
  } catch (error) {
    console.error('❌ [validate_input] Unexpected error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown validation error';
      
    return {
      currentStep: 'validate_input',
      errors: [...(state.errors || []), `Validation error: ${errorMessage}`]
    };
  }
}

/**
 * Error Handling Node
 * 
 * Handles workflow errors and logs state for debugging
 * 
 * @param state - Current workflow state with errors
 * @returns Final error state
 */
export async function handleErrorNode(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  console.error('❌ [handle_error] Workflow encountered errors:');
  
  // Log each error with context
  (state.errors || []).forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`);
  });
  
  // Log current step for debugging
  console.error(`  Current step: ${state.currentStep || 'unknown'}`);
  console.error(`  Tokens used: ${state.tokensUsed || 0}`);
  
  return {
    currentStep: 'error',
    // Keep existing errors
    errors: state.errors
  };
}

/**
 * Success Completion Node
 * 
 * Final node for successful workflow completion
 * Logs success metrics and prepares final state
 * 
 * @param state - Completed workflow state
 * @returns Final success state
 */
export async function completeSuccessNode(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  console.log('✅ [complete] Workflow completed successfully');
  console.log(`  📊 Tokens used: ${state.tokensUsed || 0}`);
  console.log(`  📝 Steps completed: ${state.currentStep || 'unknown'}`);
  
  if (state.generatedResume) {
    console.log('  ✓ Resume generated');
  }
  
  if (state.coverLetter) {
    console.log('  ✓ Cover letter generated');
  }
  
  return {
    currentStep: 'complete'
  };
}

/**
 * Check if workflow should continue or stop due to errors
 * 
 * @param state - Current workflow state
 * @returns True if workflow should continue, false if errors present
 */
export function shouldContinue(state: ResumeGenerationState): boolean {
  return !state.errors || state.errors.length === 0;
}

/**
 * Check if cover letter generation is requested
 * 
 * @param state - Current workflow state
 * @returns True if cover letter should be generated
 */
export function shouldGenerateCoverLetter(state: ResumeGenerationState): boolean {
  return state.includeCoverLetter === true;
}
