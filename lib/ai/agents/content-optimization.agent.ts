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
import type { ResumeGenerationState } from '../workflow/types';
import type { Resume } from '@/lib/validations/jsonresume';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { parseAgentJSON } from '../workflow/utils';
import { CONTENT_OPTIMIZATION_USER_TEMPLATE } from '@/lib/ai/prompts';

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
    // Format data for the template
    const keyResponsibilities = jobAnalysis.keyResponsibilities.map(r => `- ${r}`).join('\n');
    const requiredSkills = jobAnalysis.requirements.required.join(', ');
    const preferredSkills = jobAnalysis.requirements.preferred.join(', ');
    const atsKeywords = [...jobAnalysis.keywords, ...jobAnalysis.atsKeywords].join(', ');
    const matchedSkills = profileMatch.matchedSkills.join(', ');
    const missingSkills = profileMatch.missingSkills.join(', ');
    const recommendations = profileMatch.recommendations.map(r => `- ${r}`).join('\n');

    // Create the optimization chain
    const chain = await createContentOptimizationChain(apiKey, model);

    // Execute the chain with all variables
    console.log('Optimizing content with AI...');
    const result = await retryWithBackoff(
      () => chain.invoke({
        keyResponsibilities,
        requiredSkills,
        preferredSkills,
        atsKeywords,
        matchedSkills,
        missingSkills,
        relevanceScore: profileMatch.relevanceScore.toString(),
        experienceMatch: profileMatch.experienceMatch.toString(),
        recommendations,
        currentResume: JSON.stringify(userResume, null, 2),
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
      optimizedResume,
      currentStep: 'optimize_content',
      tokensUsed: estimateTokens(result as string),
    };
  } catch (error) {
    console.error('Error in content optimization agent:', error);
    return {
      errors: [
        `Content optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Create the LangChain chain for content optimization
 */
async function createContentOptimizationChain(
  apiKey: string,
  model: string = 'gpt-4-turbo-preview'
) {
  // Use PromptTemplate with all variables - no manual .replace() needed
  const prompt = PromptTemplate.fromTemplate(CONTENT_OPTIMIZATION_USER_TEMPLATE);

  const llm = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: model || 'gpt-4-turbo-preview',
    temperature: 0.5, // Higher than matching for creative writing
    maxTokens: 4000, // Need more tokens for full resume generation
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

