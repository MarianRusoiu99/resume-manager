/**
 * Job Analysis Agent
 * 
 * Analyzes job descriptions to extract structured information including:
 * - Required and preferred skills
 * - ATS keywords
 * - Key responsibilities
 * - Job summary
 * 
 * Uses modern LangChain patterns with structured output for type-safe parsing.
 */

import { PromptTemplate } from '@langchain/core/prompts';
import type { BaseMessage } from '@langchain/core/messages';
import { BaseAgent, createAgentMessages, type AgentResult } from './base-agent';
import { JobAnalysisResultSchema, type JobAnalysisResult } from '../types/agent-results';
import {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  JOB_ANALYSIS_USER_TEMPLATE
} from '../prompts/agents/job-analysis';

/**
 * Input for job analysis agent
 */
export interface JobAnalysisInput {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

/**
 * Job Analysis Agent
 * Analyzes job descriptions to extract structured requirements
 */
export class JobAnalysisAgent extends BaseAgent<JobAnalysisInput, JobAnalysisResult> {
  constructor(apiKey: string, model?: string) {
    super(
      {
        apiKey,
        agentType: 'job-analysis',
        model,
        temperature: 0.3, // Lower temperature for consistent extraction
        enableLogging: true,
      },
      JobAnalysisResultSchema
    );
  }

  /**
   * Build prompt with job details using LangChain's PromptTemplate
   */
  protected async buildPrompt(input: JobAnalysisInput): Promise<BaseMessage[]> {
    const jobTitle = input.jobTitle || 'Not specified';
    const companyName = input.companyName || 'Not specified';
    
    // Use LangChain's PromptTemplate for variable substitution
    const promptTemplate = PromptTemplate.fromTemplate(JOB_ANALYSIS_USER_TEMPLATE);
    const userPrompt = await promptTemplate.format({
      jobTitle,
      companyName,
      jobDescription: input.jobDescription
    });

    // Include format instructions in system prompt
    const formatInstructions = this.getFormatInstructions();

    return createAgentMessages(
      JOB_ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      formatInstructions
    );
  }
}

/**
 * Factory function to create and execute job analysis
 * Maintains backward compatibility with existing code
 * 
 * @param input - Job analysis input
 * @param apiKey - OpenAI API key
 * @param model - Optional model override
 * @returns Job analysis result
 */
export async function analyzeJob(
  input: JobAnalysisInput,
  apiKey: string,
  model?: string
): Promise<AgentResult<JobAnalysisResult>> {
  const agent = new JobAnalysisAgent(apiKey, model);
  return agent.execute(input);
}

/**
 * Legacy function for backward compatibility with workflow nodes
 * Accepts state and extracts job data automatically
 * 
 * @param state - Workflow state
 * @param apiKey - OpenAI API key
 * @param model - Optional model override
 * @returns Updated state with job analysis, errors, and token usage
 */
export async function analyzeJobAgent(
  state: { jobDescription: string; jobTitle?: string; companyName?: string },
  apiKey: string,
  model?: string
): Promise<{ jobAnalysis?: JobAnalysisResult; errors?: string[]; tokensUsed?: number }> {
  try {
    const result = await analyzeJob(
      {
        jobDescription: state.jobDescription,
        jobTitle: state.jobTitle,
        companyName: state.companyName,
      },
      apiKey,
      model
    );

    if (result.success && result.data) {
      return { 
        jobAnalysis: result.data, 
        errors: [], 
        tokensUsed: result.tokensUsed 
      };
    }

    return { 
      errors: [result.error || 'Job analysis failed'], 
      tokensUsed: result.tokensUsed 
    };
  } catch (error) {
    return { 
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      tokensUsed: 0
    };
  }
}
