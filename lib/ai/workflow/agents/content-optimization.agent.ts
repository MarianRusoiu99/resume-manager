/**
 * Content Optimization Agent
 * 
 * This agent takes the job analysis and profile matching results to generate
 * tailored resume content that emphasizes relevant experience, incorporates
 * ATS keywords naturally, and addresses skill gaps strategically.
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ResumeGenerationState } from '../types';

/**
 * Content Optimization Agent
 * 
 * Optimizes resume content based on job requirements and profile matching results.
 * 
 * @param state - Current workflow state with jobAnalysis and profileMatch
 * @param apiKey - OpenAI API key (from user's settings)
 * @param model - OpenAI model to use (default: gpt-4-turbo-preview)
 * @returns Updated state with optimizedContent
 */
export async function contentOptimizationAgent(
  state: ResumeGenerationState,
  apiKey: string,
  model?: string
): Promise<Partial<ResumeGenerationState>> {
  console.log('🎨 Starting content optimization agent...');

  // Validate prerequisites
  if (!state.jobAnalysis) {
    throw new Error('Job analysis is required for content optimization');
  }

  if (!state.profileMatch) {
    throw new Error('Profile matching is required for content optimization');
  }

  if (!state.userProfile) {
    throw new Error('User profile is required for content optimization');
  }

  const { jobAnalysis, profileMatch, userProfile } = state;

  try {
    // Create the optimization chain
    const chain = createContentOptimizationChain(
      apiKey,
      model,
      userProfile,
      jobAnalysis,
      profileMatch
    );

    // Execute the chain
    console.log('Optimizing content with AI...');
    const result = await chain.invoke({
      jobTitle: state.jobTitle || 'the position',
      companyName: state.companyName || 'the company',
    });

    // Parse the JSON response
    const optimizedContent = JSON.parse(result);

    console.log('✅ Content optimization complete');
    console.log(`- Generated optimized summary (${optimizedContent.summary.length} chars)`);
    console.log(`- Optimized ${optimizedContent.experience.length} experience entries`);
    console.log(`- Prioritized ${optimizedContent.prioritizedSkills.length} skills`);

    return {
      ...state,
      optimizedContent: {
        summary: optimizedContent.summary,
        experience: optimizedContent.experience,
        prioritizedSkills: optimizedContent.prioritizedSkills,
      },
      currentStep: 'optimize_content',
      tokensUsed: (state.tokensUsed || 0) + estimateTokens(result),
    };
  } catch (error) {
    console.error('Error in content optimization agent:', error);
    return {
      ...state,
      errors: [
        ...(state.errors || []),
        `Content optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Create the LangChain chain for content optimization
 */
function createContentOptimizationChain(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview',
  userProfile: ResumeGenerationState['userProfile'],
  jobAnalysis: NonNullable<ResumeGenerationState['jobAnalysis']>,
  profileMatch: NonNullable<ResumeGenerationState['profileMatch']>
) {
  // Format the data for the prompt
  const originalSummary = userProfile!.summary || 'No summary provided';
  const matchedSkills = profileMatch.matchedSkills.join(', ');
  const missingSkills = profileMatch.missingSkills.join(', ');
  const jobKeywords = [...jobAnalysis.keywords, ...jobAnalysis.atsKeywords].join(', ');
  const keyResponsibilities = jobAnalysis.keyResponsibilities.join('\n- ');
  const recommendations = profileMatch.recommendations.join('\n- ');

  const prompt = PromptTemplate.fromTemplate(`You are an expert resume writer and ATS optimization specialist. Your task is to optimize resume content to match job requirements while maintaining authenticity and readability.

JOB INFORMATION:
Title: {jobTitle}
Company: {companyName}
Key Responsibilities:
- ${keyResponsibilities}

REQUIRED SKILLS:
${jobAnalysis.requirements.required.join(', ')}

PREFERRED SKILLS:
${jobAnalysis.requirements.preferred.join(', ')}

ATS KEYWORDS TO INCORPORATE:
${jobKeywords}

CANDIDATE'S PROFILE:
Matched Skills: ${matchedSkills}
Missing Skills: ${missingSkills}
Relevance Score: ${profileMatch.relevanceScore}/100
Experience Match: ${profileMatch.experienceMatch}/10

ORIGINAL PROFESSIONAL SUMMARY:
${originalSummary}

WORK EXPERIENCE:
${formatExperienceForOptimization(userProfile!.experience)}

PROFILE RECOMMENDATIONS:
- ${recommendations}

YOUR TASK:
Generate optimized resume content that:

1. PROFESSIONAL SUMMARY:
   - Tailor to the specific job and company
   - Highlight matched skills prominently
   - Address missing skills strategically (mention transferable skills)
   - Incorporate relevant ATS keywords naturally
   - Keep to 3-4 sentences (50-80 words)
   - Use strong action words and quantifiable achievements if mentioned in original

2. EXPERIENCE OPTIMIZATION:
   For each work experience entry:
   - Rewrite description to emphasize job-relevant responsibilities
   - Create 4-6 powerful bullet points that:
     * Start with strong action verbs
     * Incorporate ATS keywords naturally (no keyword stuffing)
     * Highlight achievements relevant to target job
     * Use numbers and metrics when available from original
     * Connect experience to job requirements
   - Maintain authenticity - only enhance, don't fabricate
   - Keep company, title, and dates exactly as provided

3. SKILL PRIORITIZATION:
   - Reorder skills to put most relevant ones first
   - Include all matched skills in top positions
   - Add relevant skills from job requirements that candidate likely has
   - Group by relevance to this specific job
   - Return as ordered array (most important first)

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{{
  "summary": "optimized professional summary text",
  "experience": [
    {{
      "company": "exact company name from original",
      "title": "exact title from original",
      "startDate": "exact start date from original",
      "endDate": "exact end date from original or null",
      "current": boolean from original,
      "description": "brief optimized description (1-2 sentences)",
      "bulletPoints": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5", "bullet 6"]
    }}
  ],
  "prioritizedSkills": ["skill1", "skill2", "skill3", ...]
}}

IMPORTANT GUIDELINES:
- Be authentic - enhance but don't fabricate
- Avoid keyword stuffing - integrate naturally
- Use industry-standard terminology
- Match tone to job posting (formal vs casual)
- Keep descriptions concise and impactful
- Prioritize relevance over volume
- Ensure ATS-friendly formatting (no special characters in key info)

Generate the optimized content now:`);

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model || 'gpt-4-turbo-preview',
    temperature: 0.5, // Higher than matching for creative writing
    maxTokens: 3000, // Need more tokens for detailed content generation
  });

  return RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}

/**
 * Format experience entries for the optimization prompt
 */
function formatExperienceForOptimization(
  experience: ResumeGenerationState['userProfile']['experience']
): string {
  return experience
    .map((exp, index) => {
      const dates = exp.current
        ? `${exp.startDate} - Present`
        : `${exp.startDate} - ${exp.endDate || 'Present'}`;

      let formatted = `\n${index + 1}. ${exp.title} at ${exp.company} (${dates})`;

      if (exp.description) {
        formatted += `\n   Description: ${exp.description}`;
      }

      return formatted;
    })
    .join('\n');
}

/**
 * Estimate token count for tracking
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Test function for standalone content optimization testing
 */
export async function testContentOptimizationAgent(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview'
) {
  console.log('Testing Content Optimization Agent\n');
  console.log('='.repeat(50));

  // Import dependencies for testing
  const { analyzeJobAgent } = await import('./job-analysis.agent');
  const { profileMatchingAgent } = await import('./profile-matching.agent');
  const { createMockUserProfile, createMockJobDescription } = await import('../testing');

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

  // Display results
  console.log('\n' + '='.repeat(50));
  console.log('OPTIMIZED CONTENT RESULTS');
  console.log('='.repeat(50));

  console.log('\n📝 OPTIMIZED SUMMARY:');
  console.log(state.optimizedContent.summary);

  console.log('\n💼 OPTIMIZED EXPERIENCE:');
  state.optimizedContent.experience.forEach((exp, index) => {
    console.log(`\n${index + 1}. ${exp.title} at ${exp.company}`);
    console.log(`   Dates: ${exp.startDate} - ${exp.endDate || 'Present'}`);
    console.log(`   Description: ${exp.description}`);
    console.log(`   Bullet Points:`);
    exp.bulletPoints.forEach(bullet => {
      console.log(`   • ${bullet}`);
    });
  });

  console.log('\n🎯 PRIORITIZED SKILLS:');
  console.log(state.optimizedContent.prioritizedSkills.slice(0, 10).join(', '));
  console.log(`(${state.optimizedContent.prioritizedSkills.length} total skills)`);

  console.log('\n📊 TOKEN USAGE:');
  console.log(`Total tokens used: ${state.tokensUsed || 0}`);

  console.log('\n✅ Content optimization test complete!');

  return state;
}
