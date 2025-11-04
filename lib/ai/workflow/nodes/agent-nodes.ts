/**
 * Agent Node Wrappers
 * 
 * Wrapper functions that integrate agent logic with the workflow graph
 * These nodes call agents directly and handle state updates consistently
 */

import type { ResumeGenerationState } from '../types';
import {
  analyzeJobAgent,
  profileMatchingAgent,
  contentOptimizationAgent,
  formatValidationAgent,
  outputGeneratorAgent
} from '../../agents';
import { coverLetterWorkflowNode } from './cover-letter.node';
import { addError } from '../utils';
import { getProviderForUser } from '../../providers';

/**
 * Job Analysis Node
 * 
 * Analyzes job description to extract requirements, keywords, and responsibilities
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with job analysis results
 */
export async function jobAnalysisNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('🔍 [analyze_job] Starting job analysis...');
  
  try {
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the job analysis agent
    const result = await analyzeJobAgent(state, config.apiKey, config.model);
    
    if (result.jobAnalysis) {
      console.log('✅ [analyze_job] Analysis complete');
      console.log(`  - ${result.jobAnalysis.requirements.required.length} required skills`);
      console.log(`  - ${result.jobAnalysis.requirements.preferred.length} preferred skills`);
      console.log(`  - ${result.jobAnalysis.atsKeywords.length} ATS keywords`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [analyze_job] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Job analysis failed';
    
    return {
      currentStep: 'analyze_job',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}

/**
 * Profile Matching Node
 * 
 * Matches user profile against job requirements to assess fit
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with profile match results
 */
export async function profileMatchingNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('🎯 [match_profile] Starting profile matching...');
  
  try {
    // Validate prerequisites
    if (!state.jobAnalysis) {
      throw new Error('Job analysis is required before profile matching');
    }
    
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the profile matching agent
    const result = await profileMatchingAgent(state, config.apiKey, config.model);
    
    if (result.profileMatch) {
      console.log('✅ [match_profile] Matching complete');
      console.log(`  - Relevance score: ${result.profileMatch.relevanceScore}/100`);
      console.log(`  - Matched skills: ${result.profileMatch.matchedSkills.length}`);
      console.log(`  - Missing skills: ${result.profileMatch.missingSkills.length}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [match_profile] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Profile matching failed';
    
    return {
      currentStep: 'match_profile',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}

/**
 * Content Optimization Node
 * 
 * Optimizes resume content based on job requirements and profile match
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with optimized resume
 */
export async function contentOptimizationNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('✨ [optimize_content] Starting content optimization...');
  
  try {
    // Validate prerequisites
    if (!state.jobAnalysis) {
      throw new Error('Job analysis is required for content optimization');
    }
    if (!state.profileMatch) {
      throw new Error('Profile matching is required for content optimization');
    }
    
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the content optimization agent
    const result = await contentOptimizationAgent(state, config.apiKey, config.model);
    
    if (result.optimizedResume) {
      console.log('✅ [optimize_content] Optimization complete');
      console.log(`  - Work entries: ${result.optimizedResume.work?.length || 0}`);
      console.log(`  - Skills: ${result.optimizedResume.skills?.length || 0}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [optimize_content] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Content optimization failed';
    
    return {
      currentStep: 'optimize_content',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}

/**
 * Format Validation Node
 * 
 * Validates resume format for ATS compliance and best practices
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with validation results
 */
export async function formatValidationNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('📐 [validate_format] Starting format validation...');
  
  try {
    // Validate prerequisites
    if (!state.optimizedResume) {
      throw new Error('Optimized resume is required for format validation');
    }
    
    // Get user's OpenAI provider
    const provider = await getProviderForUser(userId, 'openai');
    
    if (!provider) {
      return addError(state, 'No OpenAI API key found. Please add an API key in settings.');
    }

    // Get provider configuration
    const config = provider.getConfig();

    // Call the format validation agent
    const result = await formatValidationAgent(state, config.apiKey, config.model);
    
    if (result.formatValidation) {
      console.log('✅ [validate_format] Validation complete');
      console.log(`  - ATS compliant: ${result.formatValidation.atsCompliant ? 'Yes' : 'No'}`);
      console.log(`  - Issues found: ${result.formatValidation.issues.length}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [validate_format] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Format validation failed';
    
    return {
      currentStep: 'validate_format',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}

/**
 * Output Generation Node
 * 
 * Generates final resume output incorporating all optimizations and validations
 * 
 * @param state - Current workflow state
 * @returns Updated state with generated resume
 */
export async function outputGenerationNode(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  console.log('📄 [generate_output] Starting output generation...');
  
  try {
    // Validate prerequisites
    if (!state.optimizedResume) {
      throw new Error('Optimized resume is required for output generation');
    }
    
    // Output generator doesn't need API key - just assembles data
    const result = await outputGeneratorAgent(state);
    
    if (result.generatedResume) {
      console.log('✅ [generate_output] Resume generated successfully');
    }
    
    return result;
  } catch (error) {
    console.error('❌ [generate_output] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Output generation failed';
    
    return {
      currentStep: 'generate_output',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}

/**
 * Cover Letter Generation Node
 * 
 * Generates personalized cover letter based on job and profile
 * 
 * @param state - Current workflow state
 * @param userId - User ID for API key lookup
 * @returns Updated state with cover letter
 */
export async function coverLetterGenerationNode(
  state: ResumeGenerationState,
  userId: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('✉️ [generate_cover_letter] Starting cover letter generation...');
  
  try {
    const result = await coverLetterWorkflowNode(state, userId);
    
    if (result.coverLetter) {
      console.log('✅ [generate_cover_letter] Cover letter generated');
      console.log(`  - Word count: ${result.coverLetter.wordCount}`);
      console.log(`  - Tone: ${result.coverLetter.tone}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [generate_cover_letter] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Cover letter generation failed';
    
    return {
      currentStep: 'generate_cover_letter',
      errors: [...(state.errors || []), errorMessage]
    };
  }
}
