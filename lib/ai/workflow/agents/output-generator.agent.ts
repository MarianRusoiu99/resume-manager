/**
 * Output Generator Agent
 * 
 * This agent finalizes the resume with metadata and ensures it's ready for storage/export.
 * With JSON Resume format, this agent primarily adds generation metadata.
 * 
 * This is the final step before the resume is ready for PDF export or storage.
 */

import type { ResumeGenerationState } from '../types';
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

    return {
      ...state,
      generatedResume,
      currentStep: 'generate_output',
    };
  } catch (error) {
    console.error('Error in output generator agent:', error);
    return {
      ...state,
      errors: [
        ...(state.errors || []),
        `Output generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Test function for standalone output generator testing
 */
export async function testOutputGeneratorAgent() {
  console.log('Testing Output Generator Agent\n');
  console.log('='.repeat(50));

  // Import dependencies for testing
  const { analyzeJobAgent } = await import('./job-analysis.agent');
  const { profileMatchingAgent } = await import('./profile-matching.agent');
  const { contentOptimizationAgent } = await import('./content-optimization.agent');
  const { formatValidationAgent } = await import('./format-validation.agent');
  const { createMockUserProfile, createMockJobDescription } = await import('../testing');

  const apiKey = process.env.OPENAI_API_KEY || '';

  const model = 'gpt-4-turbo-preview';

  // Create mock data
  const mockProfile = createMockUserProfile();
  const mockJob = createMockJobDescription();

  // mockProfile is already a Resume - no conversion needed
  const mockResume: Resume = mockProfile;

  // Initial state
  let state: ResumeGenerationState = {
    jobDescription: mockJob,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    userResume: mockResume,
    currentStep: 'validate_input',
    messages: [],
    errors: [],
    tokensUsed: 0,
  };

  console.log('\nStep 1: Analyzing job description...');
  const jobResult = await analyzeJobAgent(state, apiKey, model);
  state = { ...state, ...jobResult };

  if (!state.jobAnalysis) {
    throw new Error('Job analysis failed');
  }

  console.log('\nStep 2: Matching profile to job...');
  const matchResult = await profileMatchingAgent(state, apiKey, model);
  state = { ...state, ...matchResult };

  if (!state.profileMatch) {
    throw new Error('Profile matching failed');
  }

  console.log('\nStep 3: Optimizing content...');
  const optimizeResult = await contentOptimizationAgent(state, apiKey, model);
  state = { ...state, ...optimizeResult };

  if (!state.optimizedResume) {
    throw new Error('Content optimization failed');
  }

  console.log('\nStep 4: Validating format...');
  const validateResult = await formatValidationAgent(state, apiKey, model);
  state = { ...state, ...validateResult };

  if (!state.formatValidation) {
    throw new Error('Format validation failed');
  }

  console.log('\nStep 5: Generating final output...');
  const outputResult = await outputGeneratorAgent(state);
  state = { ...state, ...outputResult };

  if (!state.generatedResume) {
    throw new Error('Output generation failed');
  }

  // Display results
  console.log('\n' + '='.repeat(50));
  console.log('FINAL RESUME OUTPUT (JSON Resume v1.0.0)');
  console.log('='.repeat(50));

  console.log('\n👤 BASICS:');
  console.log(`Name: ${state.generatedResume?.basics?.name || 'N/A'}`);
  console.log(`Email: ${state.generatedResume?.basics?.email || 'N/A'}`);
  if (state.generatedResume?.basics?.phone) {
    console.log(`Phone: ${state.generatedResume.basics.phone}`);
  }
  if (state.generatedResume?.basics?.location?.city) {
    console.log(`Location: ${state.generatedResume.basics.location.city}`);
  }

  console.log('\n📝 SUMMARY:');
  console.log(state.generatedResume?.basics?.summary || 'No summary');

  console.log('\n💼 WORK EXPERIENCE:');
  (state.generatedResume?.work || []).forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.position || 'Position'} at ${job.name || 'Company'}`);
    console.log(`   ${job.startDate || 'N/A'} - ${job.endDate || 'Present'}`);
    if (job.summary) {
      console.log(`   ${job.summary}`);
    }
    if (job.highlights && job.highlights.length > 0) {
      console.log('   Highlights:');
      job.highlights.forEach((highlight: string) => {
        console.log(`   • ${highlight}`);
      });
    }
  });

  console.log('\n🎓 EDUCATION:');
  (state.generatedResume?.education || []).forEach((edu, index) => {
    console.log(`\n${index + 1}. ${edu.studyType || 'Degree'} in ${edu.area || 'Field'}`);
    console.log(`   ${edu.institution || 'Institution'}`);
    if (edu.startDate || edu.endDate) {
      console.log(`   ${edu.startDate || 'N/A'} - ${edu.endDate || 'Present'}`);
    }
    if (edu.score) {
      console.log(`   Score: ${edu.score}`);
    }
  });

  console.log('\n🎯 SKILLS:');
  const skillNames = (state.generatedResume?.skills || []).map((s) => s.name).slice(0, 15).join(', ');
  console.log(skillNames || 'No skills');
  if ((state.generatedResume?.skills?.length || 0) > 15) {
    console.log(`... and ${(state.generatedResume?.skills?.length || 0) - 15} more`);
  }

  console.log('\n📊 METADATA:');
  if (state.generatedResume?.meta?.lastModified) {
    console.log(`Generated: ${new Date(state.generatedResume.meta.lastModified).toLocaleString()}`);
  }
  console.log(`Total Tokens Used: ${state.tokensUsed || 0}`);

  console.log('\n✅ Output generator test complete!');
  console.log('\nResume is ready for PDF export or database storage.');

  return state;
}
