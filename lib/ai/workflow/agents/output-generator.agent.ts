/**
 * Output Generator Agent
 * 
 * This agent assembles the final structured resume from all previous agent outputs.
 * It combines optimized content with user profile data and adds generation metadata.
 * 
 * This is the final step before the resume is ready for PDF export or storage.
 */

import type { ResumeGenerationState } from '../types';

/**
 * Output Generator Agent
 * 
 * Generates the final structured resume JSON from all agent outputs.
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
  if (!state.optimizedContent) {
    throw new Error('Optimized content is required for output generation');
  }

  if (!state.userProfile) {
    throw new Error('User profile is required for output generation');
  }

  const { optimizedContent, userProfile, jobTitle, companyName, tokensUsed } = state;

  try {
    // Assemble the final resume structure
    const generatedResume = {
      personalInfo: {
        name: userProfile.personalInfo.name,
        email: userProfile.personalInfo.email,
        phone: userProfile.personalInfo.phone,
        location: userProfile.personalInfo.location,
        linkedin: userProfile.personalInfo.linkedin,
        github: userProfile.personalInfo.github,
        website: userProfile.personalInfo.website,
      },
      summary: optimizedContent.summary,
      experience: optimizedContent.experience.map(exp => ({
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.current,
        description: exp.description,
        bulletPoints: exp.bulletPoints,
      })),
      education: userProfile.education.map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        gpa: edu.gpa,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description,
      })),
      skills: optimizedContent.prioritizedSkills,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'gpt-4-turbo-preview', // Could be made dynamic
        tokensUsed: tokensUsed || 0,
        jobTitle: jobTitle,
        companyName: companyName,
      },
    };

    console.log('✅ Output generation complete');
    console.log(`- Personal info: ${generatedResume.personalInfo.name}`);
    console.log(`- Summary: ${generatedResume.summary.substring(0, 50)}...`);
    console.log(`- Experience entries: ${generatedResume.experience.length}`);
    console.log(`- Education entries: ${generatedResume.education.length}`);
    console.log(`- Skills: ${generatedResume.skills.length}`);
    console.log(`- Total tokens used: ${generatedResume.metadata.tokensUsed}`);

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const model = 'gpt-4-turbo-preview';

  // Create mock data
  const mockProfile = createMockUserProfile();
  const mockJob = createMockJobDescription();

  // Initial state
  let state: ResumeGenerationState = {
    jobDescription: mockJob,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    userProfile: mockProfile,
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

  if (!state.optimizedContent) {
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
  console.log('FINAL RESUME OUTPUT');
  console.log('='.repeat(50));

  console.log('\n👤 PERSONAL INFO:');
  console.log(`Name: ${state.generatedResume.personalInfo.name}`);
  console.log(`Email: ${state.generatedResume.personalInfo.email}`);
  if (state.generatedResume.personalInfo.phone) {
    console.log(`Phone: ${state.generatedResume.personalInfo.phone}`);
  }
  if (state.generatedResume.personalInfo.location) {
    console.log(`Location: ${state.generatedResume.personalInfo.location}`);
  }
  if (state.generatedResume.personalInfo.linkedin) {
    console.log(`LinkedIn: ${state.generatedResume.personalInfo.linkedin}`);
  }

  console.log('\n📝 SUMMARY:');
  console.log(state.generatedResume.summary);

  console.log('\n💼 EXPERIENCE:');
  state.generatedResume.experience.forEach((exp, index) => {
    console.log(`\n${index + 1}. ${exp.title} at ${exp.company}`);
    console.log(`   ${exp.startDate} - ${exp.endDate || 'Present'}`);
    console.log(`   ${exp.description}`);
    console.log('   Achievements:');
    exp.bulletPoints.forEach(bullet => {
      console.log(`   • ${bullet}`);
    });
  });

  console.log('\n🎓 EDUCATION:');
  state.generatedResume.education.forEach((edu, index) => {
    console.log(`\n${index + 1}. ${edu.degree} in ${edu.field}`);
    console.log(`   ${edu.school}`);
    console.log(`   ${edu.startDate} - ${edu.endDate || 'Present'}`);
    if (edu.gpa) {
      console.log(`   GPA: ${edu.gpa}`);
    }
  });

  console.log('\n🎯 SKILLS:');
  console.log(state.generatedResume.skills.slice(0, 15).join(', '));
  if (state.generatedResume.skills.length > 15) {
    console.log(`... and ${state.generatedResume.skills.length - 15} more`);
  }

  console.log('\n📊 METADATA:');
  console.log(`Generated: ${new Date(state.generatedResume.metadata.generatedAt).toLocaleString()}`);
  console.log(`Model: ${state.generatedResume.metadata.modelUsed}`);
  console.log(`Tokens Used: ${state.generatedResume.metadata.tokensUsed}`);
  console.log(`Target Job: ${state.generatedResume.metadata.jobTitle} at ${state.generatedResume.metadata.companyName}`);

  console.log('\n✅ Output generator test complete!');
  console.log('\nResume is ready for PDF export or database storage.');

  return state;
}
