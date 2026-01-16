
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeStepWithRetry, RetryConfig } from '../retry';
import { WorkflowContext } from '../types';
import { AppError } from '@/lib/errors';
import { ErrorCode } from '@/lib/types/error-codes';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

// Mock sleep function
vi.mock('@/lib/utils/async', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

class MockError extends AppError {
    readonly statusCode = 500;
    
    constructor(message: string, public readonly code: any) {
        super(message);
    }
}

describe('Workflow Retry Logic', () => {
  let mockContext: WorkflowContext;

  beforeEach(() => {
    mockContext = {} as WorkflowContext;
    vi.clearAllMocks();
  });

  const baseStep = {
    id: 'test',
    name: 'Test Step',
    description: 'Testing',
    progressStart: 0,
    progressEnd: 100,
    shouldSkip: undefined,
    retryConfig: undefined,
  };

  it('should execute successfully without retry', async () => {
    const execute = vi.fn().mockResolvedValue({ success: true });
    
    await executeStepWithRetry(
      { ...baseStep, execute },
      mockContext
    );

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure up to maxAttempts', async () => {
    const error = new MockError('Temporary failure', ErrorCode.RATE_LIMITED);
    const execute = vi.fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ success: true });

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1, // Fast for tests
      maxDelayMs: 10,
      backoffFactor: 2,
      retryableErrors: [ErrorCode.RATE_LIMITED]
    };

    await executeStepWithRetry(
      { ...baseStep, execute },
      mockContext,
      config
    );

    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('should fail immediately on non-retryable error', async () => {
    const error = new MockError('Fatal error', ErrorCode.VALIDATION_ERROR);
    const execute = vi.fn().mockRejectedValue(error);

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1,
      maxDelayMs: 10,
      backoffFactor: 2,
      retryableErrors: [ErrorCode.RATE_LIMITED]
    };

    await expect(executeStepWithRetry(
      { ...baseStep, execute },
      mockContext,
      config
    )).rejects.toThrow('Fatal error');

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('should throw last error after exhausting retries', async () => {
    const error = new MockError('Persistent failure', ErrorCode.RATE_LIMITED);
    const execute = vi.fn().mockRejectedValue(error);

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1,
      maxDelayMs: 10,
      backoffFactor: 2,
      retryableErrors: [ErrorCode.RATE_LIMITED]
    };

    await expect(executeStepWithRetry(
      { ...baseStep, execute },
      mockContext,
      config
    )).rejects.toThrow('Persistent failure');

    expect(execute).toHaveBeenCalledTimes(3);
  });
});
