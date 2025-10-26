/**
 * Test script for the Profile Matching Agent
 * Run with: OPENAI_API_KEY=your-key npx tsx scripts/test-profile-matching.ts
 */

import { analyzeJobAgent } from '../lib/ai/workflow/agents/job-analysis.agent';
import { testProfileMatchingAgent } from '../lib/ai/workflow';
import { createMockUserProfile, createMockJobDescription } from '../lib/ai/workflow/testing';
import type { ResumeGenerationState } from '../lib/ai/workflow/types';

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    console.log('\nUsage: OPENAI_API_KEY=your-key npx tsx scripts/test-profile-matching.ts');
    process.exit(1);
  }

  console.log('🧪 Testing Profile Matching Agent\n');
  console.log('='.repeat(60));
  console.log('\nStep 1: Creating mock data...\n');

  // Create mock profile and job description
  const mockProfile = createMockUserProfile();
  const mockJobDescription = createMockJobDescription();

  console.log('✅ Mock profile created:');
  console.log('  - Name:', mockProfile.personalInfo.name);
  console.log('  - Experience entries:', mockProfile.experience.length);
  console.log('  - Education entries:', mockProfile.education.length);
  console.log('  - Technical skills:', mockProfile.skills.technical.length);

  // Create initial state
  const initialState: ResumeGenerationState = {
    jobDescription: mockJobDescription,
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Tech Company Inc.',
    userProfile: mockProfile,
    messages: [],
    currentStep: 'analyze_job',
    errors: [],
    tokensUsed: 0,
  };

  try {
    console.log('\nStep 2: Running job analysis...\n');
    
    // First, run job analysis (required for profile matching)
    const jobAnalysisResult = await analyzeJobAgent(initialState, apiKey);
    
    if (jobAnalysisResult.errors && jobAnalysisResult.errors.length > 0) {
      console.error('❌ Job analysis failed:', jobAnalysisResult.errors);
      process.exit(1);
    }

    if (!jobAnalysisResult.jobAnalysis) {
      console.error('❌ No job analysis result returned');
      process.exit(1);
    }

    console.log('✅ Job analysis complete');
    console.log('  - Required skills:', jobAnalysisResult.jobAnalysis.requirements.required.length);
    console.log('  - Preferred skills:', jobAnalysisResult.jobAnalysis.requirements.preferred.length);
    console.log('  - ATS keywords:', jobAnalysisResult.jobAnalysis.atsKeywords.length);

    // Create state with job analysis
    const stateWithJobAnalysis: ResumeGenerationState = {
      ...initialState,
      jobAnalysis: jobAnalysisResult.jobAnalysis,
      messages: jobAnalysisResult.messages || [],
      tokensUsed: jobAnalysisResult.tokensUsed || 0,
    };

    console.log('\nStep 3: Running profile matching...\n');
    
    // Now run profile matching
    await testProfileMatchingAgent(stateWithJobAnalysis, apiKey);
    
    console.log('\n✅ Profile matching test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
