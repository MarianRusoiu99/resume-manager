import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../workflow/types';
import type { Resume } from '@/lib/validations/jsonresume';
import { addError, createSystemMessage, createAIMessage, parseAgentJSON } from '../workflow/utils';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { PROFILE_MATCHING_PROMPT } from '../prompts/agents/profile-matching';

/**
 * Profile Matching Agent
 * 
 * Analyzes user profile against job requirements to determine fit and identify gaps.
 * Provides:
 * - Skill match scores
 * - Experience relevance assessment
 * - Gap analysis (missing skills/qualifications)
 * - Recommendations for profile optimization
 * 
 * This agent uses OpenAI to intelligently compare the user's background
 * with job requirements extracted by the Job Analysis Agent.
 */

/**
 * Format work experience for the prompt
 */
function formatWork(work: Resume['work']): string {
  if (!work || work.length === 0) {
    return 'No work experience listed';
  }
  
  return work.map((job, idx) => {
    const dates = `${job.startDate || 'N/A'} - ${job.endDate || 'Present'}`;
    const summary = job.summary || 'No summary';
    return `${idx + 1}. ${job.position || 'Position'} at ${job.name || 'Company'} (${dates})\n   ${summary}`;
  }).join('\n\n');
}

/**
 * Format education for the prompt
 */
function formatEducation(education: Resume['education']): string {
  if (!education || education.length === 0) {
    return 'No education listed';
  }
  
  return education.map((edu, idx) => {
    const degree = edu.studyType || 'Degree';
    const area = edu.area || 'Field';
    const institution = edu.institution || 'Institution';
    const date = edu.endDate || edu.startDate || 'N/A';
    return `${idx + 1}. ${degree} in ${area} from ${institution} (${date})`;
  }).join('\n');
}

/**
 * Format skills for the prompt
 */
function formatSkills(skills: Resume['skills']): string {
  if (!skills || skills.length === 0) {
    return 'No skills listed';
  }
  
  return skills.map((skill) => skill.name).join(', ');
}

/**
 * Create a profile matching chain using LangChain
 */
function createProfileMatchingChain(apiKey: string, model: string = 'gpt-4-turbo-preview') {
  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model,
    temperature: 0.4, // Slightly higher for more nuanced reasoning
    maxTokens: 2500,
  });

  const prompt = PromptTemplate.fromTemplate(PROFILE_MATCHING_PROMPT);
  
  return RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}

/**
 * Profile Matching Agent
 * 
 * Analyzes how well the user's profile matches job requirements
 * 
 * @param state - Current workflow state (must include jobAnalysis)
 * @param apiKey - OpenAI API key
 * @param model - OpenAI model to use
 * @returns Updated state with profile matching results
 */
export async function profileMatchingAgent(
  state: ResumeGenerationState,
  apiKey: string,
  model?: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('[profileMatchingAgent] Starting profile matching...');
  
  try {
    // Validate input
    if (!state.jobAnalysis) {
      const error = 'Job analysis required before profile matching';
      console.error('[profileMatchingAgent]', error);
      return addError(state, error);
    }

    if (!state.userResume) {
      const error = 'User resume is required for matching';
      console.error('[profileMatchingAgent]', error);
      return addError(state, error);
    }

    // Create the matching chain
    const chain = createProfileMatchingChain(apiKey, model);

    // Prepare input data
    const jobAnalysis = state.jobAnalysis;
    const resume = state.userResume;

    console.log('[profileMatchingAgent] Calling OpenAI for profile matching...');
    const startTime = Date.now();
    
    const result = await retryWithBackoff(
      () => chain.invoke({
        requiredSkills: jobAnalysis.requirements.required.join(', '),
        preferredSkills: jobAnalysis.requirements.preferred.join(', '),
        keyResponsibilities: jobAnalysis.keyResponsibilities.join('; '),
        jobSummary: jobAnalysis.jobSummary,
        candidateName: resume.basics?.name || 'Candidate',
        candidateSummary: resume.basics?.summary || 'No summary provided',
        experience: formatWork(resume.work),
        education: formatEducation(resume.education),
        skills: formatSkills(resume.skills),
      }),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`[profileMatchingAgent] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[profileMatchingAgent] Matching completed in ${duration}ms`);

    // Parse the JSON response
    const matching = parseAgentJSON<{
      overallMatchScore: number;
      skillMatchScore: number;
      experienceRelevanceScore: number;
      educationMatchScore: number;
      matchedSkills: string[];
      missingRequiredSkills: string[];
      missingPreferredSkills: string[];
      relevantExperience: Array<{
        company: string;
        title: string;
        relevanceScore: number;
        reasoning: string;
      }>;
      strengths: string[];
      gaps: string[];
      recommendations: string[];
    }>(result);

    if (!matching) {
      const error = 'Failed to parse profile matching response';
      console.error('[profileMatchingAgent]', error);
      console.error('[profileMatchingAgent] Raw response:', result);
      return addError(state, error);
    }

    // Validate the parsed data
    if (typeof matching.overallMatchScore !== 'number') {
      const error = 'Invalid profile matching format: missing overallMatchScore';
      console.error('[profileMatchingAgent]', error);
      return addError(state, error);
    }

    // Estimate token usage
    const inputLength = JSON.stringify({
      jobAnalysis,
      resume: {
        work: formatWork(resume.work),
        education: formatEducation(resume.education),
        skills: formatSkills(resume.skills)
      }
    }).length;
    const inputTokens = Math.ceil(inputLength / 4);
    const outputTokens = Math.ceil(result.length / 4);
    const estimatedTokens = inputTokens + outputTokens;

    console.log('[profileMatchingAgent] Successfully completed profile matching');
    console.log('[profileMatchingAgent] Overall match score:', matching.overallMatchScore);
    console.log('[profileMatchingAgent] Matched skills:', matching.matchedSkills?.length || 0);
    console.log('[profileMatchingAgent] Missing required skills:', matching.missingRequiredSkills?.length || 0);

    // Combine missing skills for simpler structure
    const allMissingSkills = [
      ...(matching.missingRequiredSkills || []),
      ...(matching.missingPreferredSkills || [])
    ];

    // Return ONLY the fields we're updating - state reducers will merge them
    return {
      messages: [
        createSystemMessage('Analyzing profile match against job requirements...'),
        createAIMessage(
          `Profile analysis complete. Overall match: ${matching.overallMatchScore}%. ` +
          `Found ${matching.matchedSkills?.length || 0} matching skills. ` +
          `Identified ${matching.missingRequiredSkills?.length || 0} critical gaps.`
        )
      ],
      tokensUsed: estimatedTokens,
      profileMatch: {
        relevanceScore: matching.overallMatchScore,
        matchedSkills: matching.matchedSkills || [],
        missingSkills: allMissingSkills,
        experienceMatch: matching.experienceRelevanceScore,
        recommendations: matching.recommendations || [],
      },
    };
  } catch (error) {
    const errorMessage = `Profile matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('[profileMatchingAgent]', errorMessage);
    console.error('[profileMatchingAgent] Error details:', error);
    return addError(state, errorMessage);
  }
}

/**
 * Test function for the profile matching agent
 */
export async function testProfileMatchingAgent(
  state: ResumeGenerationState,
  apiKey: string
): Promise<void> {
  console.log('\n🧪 Testing Profile Matching Agent\n' + '='.repeat(60));
  
  const result = await profileMatchingAgent(state, apiKey);
  
  console.log('\n📊 Matching Results:');
  console.log('='.repeat(60));
  
  if (result.profileMatch) {
    console.log('\n✅ Profile Matching Successful!\n');
    console.log('Relevance Score:', result.profileMatch.relevanceScore + '%');
    console.log('Experience Match:', result.profileMatch.experienceMatch + '/10');
    console.log('\nMatched Skills:', result.profileMatch.matchedSkills);
    console.log('Missing Skills:', result.profileMatch.missingSkills);
    console.log('\nRecommendations:', result.profileMatch.recommendations);
    console.log('\nTokens Used:', result.tokensUsed);
  } else if (result.errors && result.errors.length > 0) {
    console.log('\n❌ Matching Failed!\n');
    console.log('Errors:', result.errors);
  } else {
    console.log('\n⚠️ Unexpected result\n');
    console.log('Result:', result);
  }
  
  console.log('\n' + '='.repeat(60));
}
