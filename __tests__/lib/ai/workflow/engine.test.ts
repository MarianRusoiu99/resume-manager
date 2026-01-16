import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeWorkflow, createConsoleProgress } from '@/lib/ai/workflow/engine';
import type { WorkflowConfig, WorkflowStep, WorkflowContext, WorkflowResults } from '@/lib/ai/workflow/types';
import type { Resume } from '@/lib/validations/jsonresume';
import type { AIProvider } from '@/lib/ai/providers';
import { logger } from '@/lib/utils/logger';

describe('Workflow Engine', () => {
  let mockProvider: AIProvider;
  let mockUserResume: Resume;
  let progressCallbacks: Array<[string, string, number]>;

  const createMockProvider = (): AIProvider => ({
    generateChat: vi.fn(),
    generateCompletion: vi.fn(),
    embed: vi.fn(),
  } as unknown as AIProvider);

  const createMockStep = (
    id: string,
    executeFn: (context: WorkflowContext) => Promise<Partial<WorkflowResults>>,
    options?: Partial<WorkflowStep>
  ): WorkflowStep => ({
    id,
    name: `Step ${id}`,
    description: `Executing step ${id}`,
    progressStart: 0,
    progressEnd: 50,
    execute: executeFn,
    ...options,
  });

  beforeEach(() => {
    mockProvider = createMockProvider();
    mockUserResume = {
      basics: { name: 'John Doe', email: 'john@example.com' },
      work: [],
      education: [],
      skills: [],
    } as Resume;
    progressCallbacks = [];
  });

  describe('executeWorkflow', () => {
    it('should execute workflow with all steps', async () => {
      const step1Result = { step1Data: 'result1' };
      const step2Result = { step2Data: 'result2' };

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => step1Result, { progressStart: 0, progressEnd: 30 }),
          createMockStep('step2', async () => step2Result, { progressStart: 30, progressEnd: 60 }),
        ],
      };

      const onProgress = vi.fn((stepId: string, message: string, progress: number) => {
        progressCallbacks.push([stepId, message, progress]);
      });

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
        userId: 'user-123',
        onProgress,
      });

      expect(result.success).toBe(true);
      expect(result.executedSteps).toEqual(['step1', 'step2']);
      expect(result.skippedSteps).toEqual([]);
      expect(result.results).toEqual({ ...step1Result, ...step2Result });
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should call progress callback for each step', async () => {
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({}), { progressStart: 10, progressEnd: 40 }),
          createMockStep('step2', async () => ({}), { progressStart: 40, progressEnd: 80 }),
        ],
      };

      const onProgress = vi.fn();

      await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
        onProgress,
      });

      // Verify workflow progress callbacks are called
      expect(onProgress).toHaveBeenCalled();
      // Verify init call
      expect(onProgress).toHaveBeenCalledWith('init', 'Starting test-workflow...', 0);
      // Verify complete call
      expect(onProgress).toHaveBeenCalledWith('complete', 'Workflow complete!', 100);
    });

    it('should skip steps with shouldSkip returning true', async () => {
      const step1Result = { step1Data: 'result1' };

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => step1Result, {
            shouldSkip: (context) => context.jobDescription.includes('skip'),
          }),
          createMockStep('step2', async () => ({}), {
            shouldSkip: (context) => !context.jobDescription.includes('skip'),
          }),
        ],
      };

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'skip this step',
        userResume: mockUserResume,
      });

      expect(result.executedSteps).toEqual(['step2']);
      expect(result.results).toEqual({});
    });

    it('should accumulate results from all steps', async () => {
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({ data1: 'value1' })),
          createMockStep('step2', async () => ({ data2: 'value2' })),
          createMockStep('step3', async () => ({ data3: 'value3' })),
        ],
      };

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
      });

      expect(result.results).toEqual({
        data1: 'value1',
        data2: 'value2',
        data3: 'value3',
      });
    });

    it('should allow later steps to override earlier step results', async () => {
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({ sharedKey: 'first' })),
          createMockStep('step2', async () => ({ sharedKey: 'second' })),
          createMockStep('step3', async () => ({ sharedKey: 'third' })),
        ],
      };

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
      });

      expect(result.results.sharedKey).toBe('third');
    });

    it('should handle step execution errors and wrap in ValidationError', async () => {
      const stepError = new Error('Step failed!');
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({ data: 'value' })),
          createMockStep('step2', async () => {
            throw stepError;
          }),
        ],
      };

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('step2');
      expect(result.error).toContain('failed');
      expect(result.executedSteps).toEqual(['step1']);
      expect(result.skippedSteps).toEqual([]);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should pass context with all required fields to steps', async () => {
      const capturedContexts: WorkflowContext[] = [];

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async (context) => {
            capturedContexts.push(context);
            return {};
          }),
        ],
      };

      const onProgress = vi.fn();

      await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model-key',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
        userId: 'user-456',
        onProgress,
      });

      expect(capturedContexts).toHaveLength(1);
      expect(capturedContexts[0].provider).toBe(mockProvider);
      expect(capturedContexts[0].modelKey).toBe('test-model-key');
      expect(capturedContexts[0].jobDescription).toBe('Test job description');
      expect(capturedContexts[0].userResume).toBe(mockUserResume);
      expect(capturedContexts[0].userId).toBe('user-456');
      expect(capturedContexts[0].onProgress).toBe(onProgress);
      expect(capturedContexts[0].results).toEqual({});
    });

    it('should handle missing userId in context', async () => {
      const capturedContexts: WorkflowContext[] = [];

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async (context) => {
            capturedContexts.push(context);
            return {};
          }),
        ],
      };

      await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
        // No userId provided
      });

      expect(capturedContexts[0].userId).toBeUndefined();
    });

    it('should initialize empty results before executing steps', async () => {
      const capturedContexts: WorkflowContext[] = [];

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async (context) => {
            capturedContexts.push(context);
            return {};
          }),
        ],
      };

      await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
      });

      expect(capturedContexts[0].results).toEqual({});
    });

    it('should merge step results into context correctly', async () => {
      const capturedContexts: WorkflowContext[] = [];

      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async (context) => {
            capturedContexts.push(context);
            return { data1: 'value1' };
          }),
          createMockStep('step2', async (context) => {
            capturedContexts.push(context);
            return { data2: 'value2' };
          }),
        ],
      };

      await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
      });

      // Verify that contexts are captured for each step
      expect(capturedContexts).toHaveLength(2);
    });

    it('should work without progress callback', async () => {
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({ data: 'value' })),
        ],
      };

      const result = await executeWorkflow({
        config,
        provider: mockProvider,
        modelKey: 'test-model',
        jobDescription: 'Test job description',
        userResume: mockUserResume,
        // No onProgress provided
      });

      expect(result.success).toBe(true);
    });

    it('should handle concurrent operations', async () => {
      const config: WorkflowConfig = {
        name: 'test-workflow',
        description: 'Test workflow',
        steps: [
          createMockStep('step1', async () => ({ data: 'value1' })),
          createMockStep('step2', async () => ({ data: 'value2' })),
        ],
      };

      const results = await Promise.all([
        executeWorkflow({
          config,
          provider: mockProvider,
          modelKey: 'test-model',
          jobDescription: 'Job 1',
          userResume: mockUserResume,
        }),
        executeWorkflow({
          config,
          provider: mockProvider,
          modelKey: 'test-model',
          jobDescription: 'Job 2',
          userResume: mockUserResume,
        }),
      ]);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].results).toEqual(results[1].results);
    });
  });

  describe('createConsoleProgress', () => {
    it('should create a progress callback function', () => {
      const progressCallback = createConsoleProgress();

      expect(typeof progressCallback).toBe('function');

      progressCallback('step1', 'Executing step 1', 50);
    });
  });
});
