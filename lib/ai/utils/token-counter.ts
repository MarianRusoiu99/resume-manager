/**
 * Token Counter Utilities
 * 
 * Utilities for estimating and tracking token usage
 */

import { estimateTokenCount as configEstimate } from '../config/token-limits';

/**
 * Estimate token count from text (4 chars ≈ 1 token)
 */
export function estimateTokens(text: string): number {
  return configEstimate(text);
}

/**
 * Estimate tokens for JSON object
 */
export function estimateTokensFromJSON(obj: unknown): number {
  const jsonString = JSON.stringify(obj);
  return estimateTokens(jsonString);
}

/**
 * Estimate tokens for multiple text inputs
 */
export function estimateTokensFromInputs(inputs: string[]): number {
  return inputs.reduce((total, input) => total + estimateTokens(input), 0);
}

/**
 * Token usage tracker class
 */
export class TokenTracker {
  private inputTokens: number = 0;
  private outputTokens: number = 0;
  
  /**
   * Add input tokens
   */
  addInput(tokens: number): void {
    this.inputTokens += tokens;
  }
  
  /**
   * Add output tokens
   */
  addOutput(tokens: number): void {
    this.outputTokens += tokens;
  }
  
  /**
   * Get total tokens used
   */
  getTotal(): number {
    return this.inputTokens + this.outputTokens;
  }
  
  /**
   * Get input tokens
   */
  getInput(): number {
    return this.inputTokens;
  }
  
  /**
   * Get output tokens
   */
  getOutput(): number {
    return this.outputTokens;
  }
  
  /**
   * Reset tracker
   */
  reset(): void {
    this.inputTokens = 0;
    this.outputTokens = 0;
  }
  
  /**
   * Get summary object
   */
  getSummary() {
    return {
      input: this.inputTokens,
      output: this.outputTokens,
      total: this.getTotal()
    };
  }
}

/**
 * Create a new token tracker instance
 */
export function createTokenTracker(): TokenTracker {
  return new TokenTracker();
}
