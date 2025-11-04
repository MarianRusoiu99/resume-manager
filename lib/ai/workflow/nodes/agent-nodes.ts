/**
 * Agent Node Wrappers
 * 
 * Wrapper functions that integrate agent logic with the workflow graph
 * These nodes call agents and handle state updates consistently
 */

import type { ResumeGenerationState } from '../types';
import {
  analyzeJobWorkflowNode,
  profileMatchingWorkflowNode,
  contentOptimizationWorkflowNode,
  formatValidationWorkflowNode,
  outputGeneratorWorkflowNode
} from '../agents';
import { coverLetterWorkflowNode } from '../agents/cover-letter.node';

/**
 * Job Analysis Node
 * 
 * Analyzes job description to extract requirements, keywords, and responsibilities
 * 
 * @param state - Current workflow state
 * @param apiKey - OpenAI API key (injected by workflow service)
 * @returns Updated state with job analysis results
 */
export async function jobAnalysisNode(
  state: ResumeGenerationState,
  apiKey: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('🔍 [analyze_job] Starting job analysis...');
  
  try {
    const result = await analyzeJobWorkflowNode(state, apiKey);
    
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
 * @param apiKey - OpenAI API key
 * @returns Updated state with profile match results
 */
export async function profileMatchingNode(
  state: ResumeGenerationState,
  apiKey: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('🎯 [match_profile] Starting profile matching...');
  
  try {
    // Validate prerequisites
    if (!state.jobAnalysis) {
      throw new Error('Job analysis is required before profile matching');
    }
    
    const result = await profileMatchingWorkflowNode(state, apiKey);
    
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
 * @param apiKey - OpenAI API key
 * @returns Updated state with optimized resume
 */
export async function contentOptimizationNode(
  state: ResumeGenerationState,
  apiKey: string
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
    
    const result = await contentOptimizationWorkflowNode(state, apiKey);
    
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
 * @param apiKey - OpenAI API key
 * @returns Updated state with validation results
 */
export async function formatValidationNode(
  state: ResumeGenerationState,
  apiKey: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('📐 [validate_format] Starting format validation...');
  
  try {
    // Validate prerequisites
    if (!state.optimizedResume) {
      throw new Error('Optimized resume is required for format validation');
    }
    
    const result = await formatValidationWorkflowNode(state, apiKey);
    
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
    
    const result = await outputGeneratorWorkflowNode(state);
    
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
 * @param apiKey - OpenAI API key
 * @returns Updated state with cover letter
 */
export async function coverLetterGenerationNode(
  state: ResumeGenerationState,
  apiKey: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('✉️ [generate_cover_letter] Starting cover letter generation...');
  
  try {
    const result = await coverLetterWorkflowNode(state, apiKey);
    
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
