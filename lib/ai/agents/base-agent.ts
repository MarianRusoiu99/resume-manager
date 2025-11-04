/**
 * Base Agent Class
 * 
 * Abstract base class for all AI agents in the workflow.
 * Provides shared functionality for:
 * - LLM initialization with retry logic
 * - Prompt building and execution
 * - Response parsing and validation
 * - Error handling and logging
 * - Token tracking
 * 
 * Agents should extend this class and implement:
 * - buildPrompt(): Create agent-specific prompts
 * - parseResponse(): Parse and validate LLM responses
 * - execute(): Main agent logic
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseMessage } from '@langchain/core/messages';
import { retryWithBackoff, AI_RETRY_CONFIG } from '@/lib/utils/retry';
import { getModelConfig, type AgentType } from '../config/models';
import { 
  createSystemMessage, 
  createHumanMessage,
  robustParseJSON,
} from '../utils';

/**
 * Base configuration for all agents
 */
export interface BaseAgentConfig {
  apiKey: string;
  agentType: AgentType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableLogging?: boolean;
}

/**
 * Standard agent execution result
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  duration: number;
}

/**
 * Abstract base class for AI agents
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  protected readonly config: Required<BaseAgentConfig>;
  protected readonly llm: ChatOpenAI;
  protected readonly logger: (...args: unknown[]) => void;

  constructor(config: BaseAgentConfig) {
    // Merge with model configuration
    const modelConfig = getModelConfig(config.agentType);
    
    this.config = {
      ...config,
      model: config.model || modelConfig.name,
      temperature: config.temperature ?? modelConfig.temperature,
      maxTokens: config.maxTokens || modelConfig.maxTokens,
      enableLogging: config.enableLogging ?? true,
    };

    // Initialize LLM
    this.llm = new ChatOpenAI({
      openAIApiKey: this.config.apiKey,
      modelName: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    // Setup logger
    this.logger = this.config.enableLogging 
      ? (...args) => console.log(`[${this.config.agentType}]`, ...args)
      : () => {};
  }

  /**
   * Build the prompt for this agent
   * 
   * @param input - Agent-specific input data
   * @returns Array of messages to send to the LLM
   */
  protected abstract buildPrompt(input: TInput): BaseMessage[] | Promise<BaseMessage[]>;

  /**
   * Parse and validate the LLM response
   * 
   * @param rawResponse - Raw string response from LLM
   * @returns Parsed and validated output
   * @throws Error if parsing or validation fails
   */
  protected abstract parseResponse(rawResponse: string): TOutput | Promise<TOutput>;

  /**
   * Validate the parsed output
   * 
   * @param _output - Parsed output to validate
   * @returns True if valid, throws error if invalid
   */
  protected validateOutput(_output: TOutput): boolean {
    // Default: assume valid if parsing succeeded
    return true;
  }

  /**
   * Execute the agent with retry logic
   * 
   * @param input - Agent-specific input data
   * @returns Agent execution result
   */
  async execute(input: TInput): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    this.logger('Starting execution...');

    try {
      // Build prompt
      this.logger('Building prompt...');
      const messages = await this.buildPrompt(input);

      // Create chain
      const chain = this.createChain(messages);

      // Execute with retry logic
      this.logger('Calling LLM...');
      const rawResponse = await retryWithBackoff(
        () => chain.invoke({}),
        {
          ...AI_RETRY_CONFIG,
          onRetry: (error, attempt, delay) => {
            this.logger(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
          },
        }
      );

      // Parse response
      this.logger('Parsing response...');
      const parsedOutput = await this.parseResponse(rawResponse);

      // Validate output
      this.logger('Validating output...');
      this.validateOutput(parsedOutput);

      const duration = Date.now() - startTime;
      this.logger(`Execution completed in ${duration}ms`);

      return {
        success: true,
        data: parsedOutput,
        tokensUsed: this.estimateTokens(rawResponse),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger(`Execution failed after ${duration}ms:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        tokensUsed: 0,
        duration,
      };
    }
  }

  /**
   * Create a LangChain runnable sequence
   * 
   * @param messages - Messages to send to LLM
   * @returns Runnable chain
   */
  protected createChain(messages: BaseMessage[]): RunnableSequence {
    // For simple message-based chains, we can use the LLM directly
    // Subclasses can override this for more complex chains
    return RunnableSequence.from([
      // Convert messages to a prompt
      async () => messages,
      this.llm,
      new StringOutputParser(),
    ]);
  }

  /**
   * Create a template-based chain
   * 
   * Useful when you need to inject variables into a prompt template
   * 
   * @param template - Prompt template string with {variables}
   * @returns Runnable chain
   */
  protected createTemplateChain(template: string): RunnableSequence {
    const prompt = PromptTemplate.fromTemplate(template);
    
    return RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);
  }

  /**
   * Parse JSON response with fallback strategies
   * 
   * @param rawResponse - Raw LLM response
   * @returns Parsed JSON object or null if parsing fails
   */
  protected parseJSON<T = TOutput>(rawResponse: string): T | null {
    return robustParseJSON<T>(rawResponse);
  }

  /**
   * Estimate token count from text
   * 
   * Uses rough approximation: 1 token ≈ 4 characters
   * For production, use tiktoken library for accurate counting
   * 
   * @param text - Text to estimate tokens for
   * @returns Approximate token count
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Format error message for consistent logging
   * 
   * @param context - Error context
   * @param error - Error object
   * @returns Formatted error message
   */
  protected formatError(context: string, error: unknown): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `${context}: ${errorMessage}`;
  }

  /**
   * Log execution metrics
   * 
   * @param result - Agent execution result
   */
  protected logMetrics(result: AgentResult<TOutput>): void {
    if (!this.config.enableLogging) return;

    console.log(`[${this.config.agentType}] Metrics:`, {
      success: result.success,
      duration: `${result.duration}ms`,
      tokensUsed: result.tokensUsed,
      hasData: !!result.data,
      error: result.error || null,
    });
  }
}

/**
 * Helper function to create system + user message pair
 * 
 * Common pattern for agents: system message sets context, user message provides data
 */
export function createAgentMessages(
  systemPrompt: string,
  userPrompt: string
): BaseMessage[] {
  return [
    createSystemMessage(systemPrompt),
    createHumanMessage(userPrompt),
  ];
}

/**
 * Helper to batch multiple agent executions
 * 
 * @param agents - Array of agents to execute
 * @param inputs - Corresponding inputs for each agent
 * @returns Array of results
 */
export async function executeAgentBatch(
  agents: BaseAgent[],
  inputs: unknown[]
): Promise<AgentResult<unknown>[]> {
  if (agents.length !== inputs.length) {
    throw new Error('Number of agents must match number of inputs');
  }

  return Promise.all(
    agents.map((agent, i) => agent.execute(inputs[i]))
  );
}
