import { ChatOpenAI } from '@langchain/openai';
import { ResumeGenerationState } from '../types';
import { coverLetterAgent } from '../../agents/cover-letter.agent';
import { addTokens, addError } from '../utils';

/**
 * Cover Letter Generation Workflow Node
 * Generates a personalized cover letter based on job analysis and profile matching
 */
export async function coverLetterWorkflowNode(
  state: ResumeGenerationState,
  model: ChatOpenAI
): Promise<Partial<ResumeGenerationState>> {
  try {
    console.log('✉️ Generating cover letter...');

    // Validate required state
    if (!state.jobAnalysis) {
      throw new Error('Job analysis required for cover letter generation');
    }
    if (!state.profileMatch) {
      throw new Error('Profile matching required for cover letter generation');
    }

    // Prepare input for cover letter agent
    const input = {
      jobDescription: state.jobDescription,
      jobTitle: state.jobTitle,
      companyName: state.companyName,
      jobAnalysis: {
        summary: state.jobAnalysis.jobSummary,
        requiredSkills: state.jobAnalysis.requirements.required,
        preferredSkills: state.jobAnalysis.requirements.preferred,
        keyResponsibilities: state.jobAnalysis.keyResponsibilities,
        tone: state.jobAnalysis.jobSummary.toLowerCase().includes('startup') ? 'casual' : 'professional',
      },
      userResume: state.userResume,
      matchingResults: {
        overallScore: state.profileMatch.relevanceScore * 100,
        matchingSkills: state.profileMatch.matchedSkills,
        missingSkills: state.profileMatch.missingSkills,
        topExperiences: state.profileMatch.recommendations.slice(0, 3),
      },
    };

    // Generate cover letter
    const result = await coverLetterAgent(input, model);

    // Track token usage (estimate based on input/output length)
    const estimatedTokens = Math.ceil(
      (JSON.stringify(input).length + result.coverLetter.length) / 4
    );

    console.log('✅ Cover letter generated successfully');
    console.log(`📊 Word count: ${result.wordCount} words`);
    console.log(`📊 Tone: ${result.tone}`);

    const updatedState = addTokens(state, estimatedTokens);

    return {
      coverLetter: {
        content: result.coverLetter,
        structure: result.structure,
        tone: result.tone,
        wordCount: result.wordCount,
      },
      tokensUsed: updatedState.tokensUsed,
    };
  } catch (error) {
    console.error('❌ Cover letter generation failed:', error);
    const updatedState = addError(state, `Cover letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      errors: updatedState.errors,
    };
  }
}
