/**
 * Token Limits and Budget Management
 * 
 * Centralized configuration for token limits per agent and workflow
 */

export interface TokenBudget {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens: number;
  estimatedCostPer1kTokens: number;  // in USD
}

/**
 * Token budgets for different agents
 */
export const TOKEN_BUDGETS = {
  JOB_ANALYSIS: {
    maxInputTokens: 3000,    // Job description + instructions
    maxOutputTokens: 2000,    // Structured analysis
    maxTotalTokens: 5000,
    estimatedCostPer1kTokens: 0.01  // GPT-4 Turbo pricing
  } as TokenBudget,

  PROFILE_MATCHING: {
    maxInputTokens: 4000,    // Resume + job analysis
    maxOutputTokens: 1500,    // Matching results
    maxTotalTokens: 5500,
    estimatedCostPer1kTokens: 0.01
  } as TokenBudget,

  CONTENT_OPTIMIZATION: {
    maxInputTokens: 8000,    // Resume + job data + instructions
    maxOutputTokens: 6000,    // Optimized resume
    maxTotalTokens: 14000,
    estimatedCostPer1kTokens: 0.01
  } as TokenBudget,

  FORMAT_VALIDATION: {
    maxInputTokens: 6000,    // Resume + validation rules
    maxOutputTokens: 1000,    // Validation results
    maxTotalTokens: 7000,
    estimatedCostPer1kTokens: 0.01
  } as TokenBudget,

  COVER_LETTER: {
    maxInputTokens: 5000,    // Job + resume + instructions
    maxOutputTokens: 1500,    // Cover letter
    maxTotalTokens: 6500,
    estimatedCostPer1kTokens: 0.01
  } as TokenBudget,

  /**
   * Total workflow budget (sum of all agents)
   */
  TOTAL_WORKFLOW: {
    maxInputTokens: 26000,
    maxOutputTokens: 12000,
    maxTotalTokens: 38000,
    estimatedCostPer1kTokens: 0.01
  } as TokenBudget
} as const;

/**
 * Estimate token count from text (rough approximation: 4 chars ≈ 1 token)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost for token usage
 */
export function estimateCost(tokens: number, costPer1k: number = 0.01): number {
  return (tokens / 1000) * costPer1k;
}

/**
 * Check if token usage is within budget
 */
export function isWithinBudget(
  inputTokens: number,
  outputTokens: number,
  budget: TokenBudget
): boolean {
  return (
    inputTokens <= budget.maxInputTokens &&
    outputTokens <= budget.maxOutputTokens &&
    (inputTokens + outputTokens) <= budget.maxTotalTokens
  );
}

/**
 * Token budget warnings
 */
export const TOKEN_WARNINGS = {
  HIGH_USAGE: 0.8,   // Warn at 80% of budget
  CRITICAL: 0.95     // Critical warning at 95%
} as const;

export function checkTokenBudgetWarning(
  currentTokens: number,
  budget: TokenBudget
): 'ok' | 'warning' | 'critical' | 'exceeded' {
  const percentage = currentTokens / budget.maxTotalTokens;
  
  if (percentage >= 1.0) return 'exceeded';
  if (percentage >= TOKEN_WARNINGS.CRITICAL) return 'critical';
  if (percentage >= TOKEN_WARNINGS.HIGH_USAGE) return 'warning';
  return 'ok';
}
