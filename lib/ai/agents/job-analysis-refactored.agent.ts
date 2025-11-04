/**
 * Job Analysis Agent - Refactored with BaseAgent
 * 
 * Analyzes job descriptions to extract structured information including:
 * - Required and preferred skills
 * - ATS keywords
 * - Key responsibilities
 * - Job summary
 */

import type { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, createAgentMessages } from './base-agent';
import { 
  JOB_ANALYSIS_SYSTEM_PROMPT, 
  formatJobAnalysisPrompt,
  type JobAnalysisPromptInput 
} from '../prompts';
import { 
  JobAnalysisRawResponseSchema, 
  type JobAnalysisRawResponse 
} from '../types';

/**
 * Job Analysis Agent
 * 
 * Extends BaseAgent to provide job analysis functionality
 */
export class JobAnalysisAgent extends BaseAgent<JobAnalysisPromptInput, JobAnalysisRawResponse> {
  constructor(apiKey: string, model?: string) {
    super({
      apiKey,
      agentType: 'job-analysis',
      model,
      enableLogging: true,
    });
  }

  /**
   * Build prompt messages for job analysis
   */
  protected buildPrompt(input: JobAnalysisPromptInput): BaseMessage[] {
    const userPrompt = formatJobAnalysisPrompt(input);
    
    return createAgentMessages(
      JOB_ANALYSIS_SYSTEM_PROMPT,
      userPrompt
    );
  }

  /**
   * Parse and validate LLM response
   */
  protected parseResponse(rawResponse: string): JobAnalysisRawResponse {
    // Use robust JSON parsing
    const parsed = this.parseJSON<JobAnalysisRawResponse>(rawResponse);
    
    if (!parsed) {
      throw new Error('Failed to parse job analysis response - invalid JSON');
    }

    // Validate with Zod schema
    const validation = JobAnalysisRawResponseSchema.safeParse(parsed);
    
    if (!validation.success) {
      this.logger('Validation errors:', validation.error.issues);
      throw new Error(
        `Invalid job analysis format: ${validation.error.issues
          .map(e => `${String(e.path.join('.'))}:${e.message}`)
          .join(', ')}`
      );
    }

    return validation.data;
  }

  /**
   * Additional validation for job analysis output
   */
  protected validateOutput(output: JobAnalysisRawResponse): boolean {
    // Ensure we have at least some data
    if (output.requiredSkills.length === 0 && output.atsKeywords.length === 0) {
      throw new Error('Job analysis returned no skills or keywords');
    }

    if (!output.summary || output.summary.length < 10) {
      throw new Error('Job summary is missing or too short');
    }

    return true;
  }
}

/**
 * Helper function to create and execute job analysis agent
 * 
 * @param input - Job analysis input data
 * @param apiKey - OpenAI API key
 * @param model - Optional model override
 * @returns Job analysis result
 */
export async function analyzeJob(
  input: JobAnalysisPromptInput,
  apiKey: string,
  model?: string
) {
  const agent = new JobAnalysisAgent(apiKey, model);
  return agent.execute(input);
}
