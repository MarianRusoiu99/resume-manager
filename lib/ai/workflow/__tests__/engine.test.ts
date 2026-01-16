
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeStepWithRetry } from '../retry';
import { WorkflowStep, WorkflowContext } from '../types';
import { ValidationError } from '@/lib/errors';

// Mock sleep function to speed up tests
vi.mock('@/lib/utils/async', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('Workflow Retry Logic', () => {
  const mockContext: WorkflowContext = {
    provider: {} as any,
    modelKey: 'test-model',
    jobDescription: 'test job',
    userResume: {} as any,
    results: {},
  };

  const retryConfig = {
    maxAttempts: 3,
    initialDelayMs: 10,
    maxDelayMs: 100,
    backoffFactor: 2,
    retryableErrors: ['UNKNOWN_ERROR', 'TEST_ERROR']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return result on first success', async () => {
    const execute = vi.fn().mockResolvedValue({ success: true });
    const step: WorkflowStep = {
      id: 'step-1',
      name: 'Step 1',
      description: 'Test step',
      execute,
      progressStart: 0,
      progressEnd: 100,
    };

    const result = await executeStepWithRetry(step, mockContext, retryConfig);

    expect(result).toEqual({ success: true });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const execute = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue({ success: true });

    const step: WorkflowStep = {
      id: 'step-1',
      name: 'Step 1',
      description: 'Test step',
      execute,
      progressStart: 0,
      progressEnd: 100,
    };

    const result = await executeStepWithRetry(step, mockContext, retryConfig);

    expect(result).toEqual({ success: true });
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts reached', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('Persistent failure'));

    const step: WorkflowStep = {
      id: 'step-1',
      name: 'Step 1',
      description: 'Test step',
      execute,
      progressStart: 0,
      progressEnd: 100,
    };

    await expect(executeStepWithRetry(step, mockContext, retryConfig)).rejects.toThrow('Persistent failure');
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('should not retry if shouldRetry returns false', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('Fatal error'));
    
    // Custom retry logic that aborts on 'Fatal error' - simulate by not including UNKNOWN_ERROR
    const customConfig = {
      ...retryConfig,
      retryableErrors: [] // No errors are retryable
    };

    const step: WorkflowStep = {
      id: 'step-1',
      name: 'Step 1',
      description: 'Test step',
      execute,
      progressStart: 0,
      progressEnd: 100,
    };

    await expect(executeStepWithRetry(step, mockContext, customConfig)).rejects.toThrow('Fatal error');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
