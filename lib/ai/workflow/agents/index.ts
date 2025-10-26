/**
 * Workflow Agents Integration
 * 
 * This file provides wrapper functions that integrate AI agents with the StateGraph workflow.
 * Handles API key retrieval and error management.
 */

import type { ResumeGenerationState } from '../types';
import { analyzeJobAgent } from './job-analysis.agent';
import { profileMatchingAgent } from './profile-matching.agent';
import { contentOptimizationAgent } from './content-optimization.agent';
import { formatValidationAgent } from './format-validation.agent';
import { outputGeneratorAgent } from './output-generator.agent';
import { addError } from '../utils';
import { getProviderForUser } from '../../provider-utils';

/**
 * Workflow wrapper for job analysis agent
 * Retrieves user's API key and calls the analysis agent
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with job analysis
 */
export async function analyzeJobWorkflowNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  try {
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the job analysis agent
    return await analyzeJobAgent(state, config.apiKey, config.model);
  } catch (error) {
    const errorMessage = `Failed to analyze job: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[analyzeJobWorkflowNode]', errorMessage);
    return addError(state, errorMessage);
  }
}

/**
 * Workflow wrapper for profile matching agent
 * Retrieves user's API key and calls the matching agent
 * 
 * @param state - Current workflow state (requires jobAnalysis)
 * @param userId - User ID for API key lookup
 * @returns Updated state with profile matching
 */
export async function profileMatchingWorkflowNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  try {
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the profile matching agent
    return await profileMatchingAgent(state, config.apiKey, config.model);
  } catch (error) {
    const errorMessage = `Failed to match profile: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[profileMatchingWorkflowNode]', errorMessage);
    return addError(state, errorMessage);
  }
}

/**
 * Workflow wrapper for content optimization agent
 * Retrieves user's API key and calls the optimization agent
 * 
 * @param state - Current workflow state (requires jobAnalysis and profileMatch)
 * @param userId - User ID for API key lookup
 * @returns Updated state with optimized content
 */
export async function contentOptimizationWorkflowNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  try {
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the content optimization agent
    return await contentOptimizationAgent(state, config.apiKey, config.model);
  } catch (error) {
    const errorMessage = `Failed to optimize content: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[contentOptimizationWorkflowNode]', errorMessage);
    return addError(state, errorMessage);
  }
}

/**
 * Workflow wrapper for format validation agent
 * Retrieves user's API key and calls the validation agent
 * 
 * @param state - Current workflow state (requires optimizedContent)
 * @param userId - User ID for API key lookup
 * @returns Updated state with format validation
 */
export async function formatValidationWorkflowNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  try {
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the format validation agent
    return await formatValidationAgent(state, config.apiKey, config.model);
  } catch (error) {
    const errorMessage = `Failed to validate format: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[formatValidationWorkflowNode]', errorMessage);
    return addError(state, errorMessage);
  }
}

/**
 * Workflow wrapper for output generator agent
 * No API key needed - just assembles data from previous agents
 * 
 * @param state - Current workflow state (requires optimizedContent)
 * @returns Updated state with generated resume
 */
export async function outputGeneratorWorkflowNode(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  try {
    // Output generator doesn't need API key - just assembles data
    return await outputGeneratorAgent(state);
  } catch (error) {
    const errorMessage = `Failed to generate output: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[outputGeneratorWorkflowNode]', errorMessage);
    return addError(state, errorMessage);
  }
}

/**
 * Export all workflow node wrappers
 */
export const workflowAgents = {
  analyzeJob: analyzeJobWorkflowNode,
  matchProfile: profileMatchingWorkflowNode,
  optimizeContent: contentOptimizationWorkflowNode,
  validateFormat: formatValidationWorkflowNode,
  generateOutput: outputGeneratorWorkflowNode,
};
