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

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../types';
import { addMessage, addError, addTokens, createSystemMessage, createAIMessage, parseAgentJSON } from '../utils';

/**
 * Prompt template for profile matching
 * Instructs the AI to compare profile against job requirements
 */
const PROFILE_MATCHING_PROMPT = `You are an expert recruiter and career advisor. Your task is to analyze how well a candidate's profile matches a job's requirements and provide actionable recommendations.

You will receive:
1. Job requirements (required skills, preferred skills, responsibilities)
2. Candidate's profile (experience, education, skills)

Analyze the match and provide:
1. **Overall Match Score** (0-100): How well the candidate fits the role
2. **Skill Match Details**: Which skills they have vs. need
3. **Experience Relevance** (0-10): How relevant their experience is
4. **Education Match** (0-10): How well their education aligns
5. **Missing Qualifications**: Critical gaps in their profile
6. **Strengths**: What makes them a strong candidate
7. **Recommendations**: Specific actions to improve their application

Job Requirements:
- Required Skills: {requiredSkills}
- Preferred Skills: {preferredSkills}
- Key Responsibilities: {keyResponsibilities}
- Job Summary: {jobSummary}

Candidate Profile:
- Name: {candidateName}
- Summary: {candidateSummary}
- Experience: {experience}
- Education: {education}
- Skills: {skills}

Provide your analysis in the following JSON format:
\`\`\`json
{{
  "overallMatchScore": 0-100,
  "skillMatchScore": 0-100,
  "experienceRelevanceScore": 0-10,
  "educationMatchScore": 0-10,
  "matchedSkills": ["skill1", "skill2", ...],
  "missingRequiredSkills": ["skill1", "skill2", ...],
  "missingPreferredSkills": ["skill1", "skill2", ...],
  "relevantExperience": [
    {{
      "company": "Company Name",
      "title": "Job Title",
      "relevanceScore": 0-10,
      "reasoning": "Why this experience is relevant"
    }}
  ],
  "strengths": ["strength1", "strength2", ...],
  "gaps": ["gap1", "gap2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}}
\`\`\`

Guidelines:
- Be honest about gaps but encouraging about strengths
- Focus on actionable recommendations
- Consider transferable skills from different domains
- Assess both technical and soft skills
- Be specific in reasoning for experience relevance
- Return ONLY the JSON object, nothing else`;

/**
 * Format experience for the prompt
 */
function formatExperience(experience: ResumeGenerationState['userProfile']['experience']): string {
  if (!experience || experience.length === 0) {
    return 'No experience listed';
  }
  
  return experience.map((exp, idx) => 
    `${idx + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n   ${exp.description || 'No description'}`
  ).join('\n\n');
}

/**
 * Format education for the prompt
 */
function formatEducation(education: ResumeGenerationState['userProfile']['education']): string {
  if (!education || education.length === 0) {
    return 'No education listed';
  }
  
  return education.map((edu, idx) => 
    `${idx + 1}. ${edu.degree} in ${edu.field} from ${edu.school} (${edu.endDate || edu.startDate})`
  ).join('\n');
}

/**
 * Format skills for the prompt
 */
function formatSkills(skills: ResumeGenerationState['userProfile']['skills']): string {
  const parts: string[] = [];
  
  if (skills.technical && skills.technical.length > 0) {
    parts.push(`Technical: ${skills.technical.join(', ')}`);
  }
  if (skills.soft && skills.soft.length > 0) {
    parts.push(`Soft Skills: ${skills.soft.join(', ')}`);
  }
  if (skills.languages && skills.languages.length > 0) {
    parts.push(`Languages: ${skills.languages.join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : 'No skills listed';
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

    if (!state.userProfile) {
      const error = 'User profile is required for matching';
      console.error('[profileMatchingAgent]', error);
      return addError(state, error);
    }

    // Create the matching chain
    const chain = createProfileMatchingChain(apiKey, model);

    // Add system message
    let updatedState = addMessage(
      state,
      createSystemMessage('Analyzing profile match against job requirements...')
    );

    // Prepare input data
    const jobAnalysis = state.jobAnalysis;
    const profile = state.userProfile;

    console.log('[profileMatchingAgent] Calling OpenAI for profile matching...');
    const startTime = Date.now();
    
    const result = await chain.invoke({
      requiredSkills: jobAnalysis.requirements.required.join(', '),
      preferredSkills: jobAnalysis.requirements.preferred.join(', '),
      keyResponsibilities: jobAnalysis.keyResponsibilities.join('; '),
      jobSummary: jobAnalysis.jobSummary,
      candidateName: profile.personalInfo.name,
      candidateSummary: profile.summary || 'No summary provided',
      experience: formatExperience(profile.experience),
      education: formatEducation(profile.education),
      skills: formatSkills(profile.skills),
    });

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

    // Add AI response message
    updatedState = addMessage(
      updatedState,
      createAIMessage(
        `Profile analysis complete. Overall match: ${matching.overallMatchScore}%. ` +
        `Found ${matching.matchedSkills?.length || 0} matching skills. ` +
        `Identified ${matching.missingRequiredSkills?.length || 0} critical gaps.`
      )
    );

    // Estimate token usage
    const inputLength = JSON.stringify({
      jobAnalysis,
      profile: {
        experience: formatExperience(profile.experience),
        education: formatEducation(profile.education),
        skills: formatSkills(profile.skills)
      }
    }).length;
    const inputTokens = Math.ceil(inputLength / 4);
    const outputTokens = Math.ceil(result.length / 4);
    updatedState = addTokens(updatedState, inputTokens + outputTokens);

    console.log('[profileMatchingAgent] Successfully completed profile matching');
    console.log('[profileMatchingAgent] Overall match score:', matching.overallMatchScore);
    console.log('[profileMatchingAgent] Matched skills:', matching.matchedSkills?.length || 0);
    console.log('[profileMatchingAgent] Missing required skills:', matching.missingRequiredSkills?.length || 0);

    // Combine missing skills for simpler structure
    const allMissingSkills = [
      ...(matching.missingRequiredSkills || []),
      ...(matching.missingPreferredSkills || [])
    ];

    // Return updated state with profile matching results (matching simplified ProfileMatch interface)
    return {
      ...updatedState,
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
