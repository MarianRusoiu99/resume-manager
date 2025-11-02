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
import type { Resume } from '@/lib/validations/jsonresume';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { parseAgentJSON } from '../utils';

/**
 * Content Optimization Agent
 * 
 * Optimizes resume content based on job requirements and profile matching results.
 * 
 * @param state - Current workflow state with jobAnalysis and profileMatch
 * @param apiKey - OpenAI API key (from user's settings)
 * @param model - OpenAI model to use (default: gpt-4-turbo-preview)
 * @returns Updated state with optimizedResume
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

  if (!state.userResume) {
    throw new Error('User resume is required for content optimization');
  }

  const { jobAnalysis, profileMatch, userResume } = state;

  try {
    // Create the optimization chain
    const chain = createContentOptimizationChain(
      apiKey,
      model,
      userResume,
      jobAnalysis,
      profileMatch
    );

    // Execute the chain
    console.log('Optimizing content with AI...');
    const result = await retryWithBackoff(
      () => chain.invoke({
        jobTitle: state.jobTitle || 'the position',
        companyName: state.companyName || 'the company',
      }),
      {
        ...AI_RETRY_CONFIG,
        onRetry: (error, attempt, delay) => {
          console.warn(`[contentOptimizationAgent] Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
        },
      }
    );

    // Parse the JSON response - handles both markdown-wrapped and plain JSON
    const optimizedResume = parseAgentJSON<Resume>(result);

    if (!optimizedResume) {
      throw new Error('Failed to parse content optimization response from AI');
    }

    console.log('✅ Content optimization complete');
    console.log(`- Generated optimized summary (${optimizedResume.basics?.summary?.length || 0} chars)`);
    console.log(`- Optimized ${optimizedResume.work?.length || 0} work entries`);
    console.log(`- Included ${optimizedResume.skills?.length || 0} skills`);

    return {
      ...state,
      optimizedResume,
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
  userResume: Resume,
  jobAnalysis: NonNullable<ResumeGenerationState['jobAnalysis']>,
  profileMatch: NonNullable<ResumeGenerationState['profileMatch']>
) {
  // Format the data for the prompt
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

ORIGINAL RESUME (JSON Resume v1.0.0 format):
\`\`\`json
${JSON.stringify(userResume, null, 2)}
\`\`\`

PROFILE RECOMMENDATIONS:
- ${recommendations}

YOUR TASK:
Generate an optimized resume in JSON Resume v1.0.0 format that:

1. PROFESSIONAL SUMMARY (basics.summary):
   - Tailor to the specific job and company
   - Highlight matched skills prominently
   - Address missing skills strategically (mention transferable skills)
   - Incorporate relevant ATS keywords naturally
   - Keep to 3-4 sentences (50-80 words)
   - Use strong action words and quantifiable achievements

2. WORK EXPERIENCE OPTIMIZATION (work array):
   For each work entry:
   - Keep position, name, startDate, endDate, url, location exactly as provided
   - Rewrite summary to emphasize job-relevant responsibilities
   - Create 4-6 powerful highlights (bullet points) that:
     * Start with strong action verbs
     * Incorporate ATS keywords naturally (no keyword stuffing)
     * Highlight achievements relevant to target job
     * Use numbers and metrics when available from original
     * Connect experience to job requirements
   - Maintain authenticity - only enhance, don't fabricate

3. SKILLS PRIORITIZATION (skills array):
   - Reorder skills to put most relevant ones first
   - Include all matched skills in top positions
   - Add relevant skills from job requirements that candidate likely has
   - Format as: {{ "name": "Skill Name", "level": "Advanced|Intermediate", "keywords": ["related", "terms"] }}

4. OTHER SECTIONS:
   - Preserve all other sections (education, certificates, projects, etc.) as-is
   - Only optimize content in basics.summary, work array, and skills array

OUTPUT FORMAT:
Return ONLY valid JSON matching the JSON Resume v1.0.0 schema with ALL these sections:
{{
  "basics": {{
    "name": "from original",
    "label": "from original or optimized",
    "email": "from original",
    "phone": "from original",
    "url": "from original",
    "summary": "YOUR OPTIMIZED SUMMARY HERE",
    "location": {{ ... }},
    "profiles": [ ... ]
  }},
  "work": [
    {{
      "name": "Company Name (exact from original)",
      "position": "Job Title (exact from original)",
      "url": "from original",
      "startDate": "YYYY-MM-DD from original",
      "endDate": "YYYY-MM-DD from original or empty string if current",
      "summary": "YOUR OPTIMIZED 1-2 SENTENCE SUMMARY",
      "highlights": [
        "YOUR OPTIMIZED BULLET POINT 1",
        "YOUR OPTIMIZED BULLET POINT 2",
        "YOUR OPTIMIZED BULLET POINT 3"
      ],
      "location": "from original"
    }}
  ],
  "volunteer": [ ... from original ... ],
  "education": [ ... from original ... ],
  "awards": [ ... from original ... ],
  "certificates": [ ... from original ... ],
  "publications": [ ... from original ... ],
  "skills": [
    {{
      "name": "Most Relevant Skill 1",
      "level": "Advanced",
      "keywords": ["related", "terms"]
    }}
  ],
  "languages": [ ... from original ... ],
  "interests": [ ... from original ... ],
  "references": [ ... from original ... ],
  "projects": [ ... from original ... ],
  "meta": {{ ... from original ... }}
}}

IMPORTANT GUIDELINES:
- Return COMPLETE JSON Resume with ALL 14 sections (even if some are empty arrays)
- Be authentic - enhance but don't fabricate
- Avoid keyword stuffing - integrate naturally
- Use industry-standard terminology
- Match tone to job posting (formal vs casual)
- Keep descriptions concise and impactful
- Prioritize relevance over volume
- Ensure ATS-friendly formatting
- All dates in ISO8601 format (YYYY-MM-DD, YYYY-MM, or YYYY)

Generate the optimized JSON Resume now:`);

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

  // Display results
  console.log('\n' + '='.repeat(50));
  console.log('OPTIMIZED RESUME RESULTS');
  console.log('='.repeat(50));

  console.log('\n📝 OPTIMIZED SUMMARY:');
  console.log(state.optimizedResume.basics?.summary || 'No summary');

  console.log('\n💼 OPTIMIZED WORK EXPERIENCE:');
  state.optimizedResume.work?.forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.position} at ${job.name}`);
    console.log(`   Dates: ${job.startDate} - ${job.endDate || 'Present'}`);
    if (job.summary) {
      console.log(`   Summary: ${job.summary}`);
    }
    if (job.highlights && job.highlights.length > 0) {
      console.log(`   Highlights:`);
      job.highlights.forEach((highlight: string) => {
        console.log(`   • ${highlight}`);
      });
    }
  });

  console.log('\n🎯 OPTIMIZED SKILLS:');
  const skillNames = state.optimizedResume.skills?.map((s) => s.name).slice(0, 10).join(', ') || 'No skills';
  console.log(skillNames);
  console.log(`(${state.optimizedResume.skills?.length || 0} total skills)`);

  console.log('\n📊 TOKEN USAGE:');
  console.log(`Total tokens used: ${state.tokensUsed || 0}`);

  console.log('\n✅ Content optimization test complete!');

  return state;
}
