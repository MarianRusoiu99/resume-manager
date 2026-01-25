
import { AppError } from "../../errors";
import { WorkflowContext, WorkflowStep } from "./types";
import { delay } from "@/lib/utils/async";
import { logger } from "@/lib/utils/logger";

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableErrors: [
    "RATE_LIMITED",
    "INTERNAL_ERROR",
    "EXTERNAL_SERVICE_ERROR",
    "REQUEST_TIMEOUT",
    "NETWORK_ERROR"
  ]
};

/**
 * Execute a workflow step with retry logic
 */
export async function executeStepWithRetry(
  step: WorkflowStep,
  context: WorkflowContext,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Partial<import("./types").WorkflowResults>> {
  let lastError: Error | undefined;
  let attempt = 1;
  const delayMs = retryConfig.initialDelayMs;

  while (attempt <= retryConfig.maxAttempts) {
    try {
      return await step.execute(context);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const errorCode = lastError instanceof AppError ? lastError.code : "UNKNOWN_ERROR";
      const isRetryable = !retryConfig.retryableErrors || retryConfig.retryableErrors.includes(errorCode);

      if (!isRetryable || attempt === retryConfig.maxAttempts) {
        throw lastError;
      }

      // Calculate exponential backoff delay with jitter
      // min(baseDelayMs * 2^(attempt-1) + random(0-1000), maxDelayMs)
      const baseDelay = retryConfig.initialDelayMs * Math.pow(retryConfig.backoffFactor, attempt - 1);
      const jitter = Math.floor(Math.random() * 1000);
      const actualDelay = Math.min(baseDelay + jitter, retryConfig.maxDelayMs);
      
      logger.warn(`Step ${step.id} failed (attempt ${attempt}/${retryConfig.maxAttempts}). Retrying in ${actualDelay}ms.`, {
        error: lastError.message,
        stepId: step.id,
        attempt
      });
      
      await delay(actualDelay);
      
      attempt++;
    }
  }

  throw lastError || new Error("Step execution failed after retries");
}
