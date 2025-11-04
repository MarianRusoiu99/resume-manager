/**
 * Output Generator Agent
 * 
 * This agent finalizes the resume with metadata and ensures it's ready for storage/export.
 * With JSON Resume format, this agent primarily adds generation metadata.
 * 
 * This is the final step before the resume is ready for PDF export or storage.
 */

import type { ResumeGenerationState } from '../workflow/types';
import type { Resume } from '@/lib/validations/jsonresume';

/**
 * Output Generator Agent
 * 
 * Generates the final resume with metadata from all agent outputs.
 * No AI calls needed - this is pure data assembly.
 * 
 * @param state - Current workflow state with all agent outputs
 * @returns Updated state with generatedResume
 */
export async function outputGeneratorAgent(
  state: ResumeGenerationState
): Promise<Partial<ResumeGenerationState>> {
  console.log('📄 Starting output generator agent...');

  // Validate prerequisites
  if (!state.optimizedResume) {
    throw new Error('Optimized resume is required for output generation');
  }

  const { optimizedResume, jobTitle, companyName, tokensUsed } = state;

  try {
    // Add generation metadata to the resume
    const generatedResume: Resume = {
      ...optimizedResume,
      meta: {
        ...optimizedResume.meta,
        canonical: optimizedResume.meta?.canonical,
        version: optimizedResume.meta?.version || 'v1.0.0',
        lastModified: new Date().toISOString(),
        // Add custom metadata about generation
        ...(jobTitle && { targetJobTitle: jobTitle }),
        ...(companyName && { targetCompany: companyName }),
        ...(tokensUsed && { tokensUsed: tokensUsed.toString() }),
      },
    };

    console.log('✅ Output generation complete');
    console.log(`- Candidate: ${generatedResume.basics?.name || 'Unknown'}`);
    console.log(`- Summary: ${(generatedResume.basics?.summary || '').substring(0, 50)}${generatedResume.basics?.summary && generatedResume.basics.summary.length > 50 ? '...' : ''}`);
    console.log(`- Work entries: ${generatedResume.work?.length || 0}`);
    console.log(`- Education entries: ${generatedResume.education?.length || 0}`);
    console.log(`- Skills: ${generatedResume.skills?.length || 0}`);
    console.log(`- Total tokens used: ${tokensUsed || 0}`);

    // Return only fields being updated - SOLID principle: single responsibility
    return {
      generatedResume,
      currentStep: 'generate_output',
    };
  } catch (error) {
    console.error('Error in output generator agent:', error);
    return {
      errors: [
        `Output generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Test function for standalone output generator testing
 * NOTE: Stubbed - requires test data setup
 */
export async function testOutputGeneratorAgent() {
  console.log('Output generator agent test - not implemented');
  console.log('Use vitest tests instead: npm test');
  return null;
}
