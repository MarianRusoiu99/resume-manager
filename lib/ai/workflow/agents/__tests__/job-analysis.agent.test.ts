import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a fake chain result JSON (must be declared before mocks)
const fakeAnalysis = JSON.stringify({
  requiredSkills: ['JavaScript', 'TypeScript'],
  preferredSkills: ['React'],
  atsKeywords: ['Node.js', 'AWS'],
  keyResponsibilities: ['Build features', 'Collaborate with team'],
  summary: 'Build and maintain web applications.'
});

// Mock RunnableSequence.from to return an object with invoke() that yields fakeAnalysis
vi.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: () => ({ invoke: async () => fakeAnalysis }),
  },
}));

import { analyzeJobAgent } from '../job-analysis.agent';

describe('analyzeJobAgent', () => {
  beforeEach(() => {
    // no-op (mocks already in place)
    vi.clearAllMocks();
  });

  it('should return jobAnalysis on valid jobDescription', async () => {
    const state: any = {
      jobDescription: 'We need a JS developer skilled in Node.js and AWS.',
      jobTitle: 'Backend Developer',
      companyName: 'Acme Corp',
      messages: [],
      currentStep: 'analyze_job',
      errors: [],
      tokensUsed: 0,
    };

    const result = await analyzeJobAgent(state, 'fake-api-key');

    expect(result.jobAnalysis).toBeDefined();
    expect(result.jobAnalysis?.requirements.required).toEqual(['JavaScript', 'TypeScript']);
    expect(result.jobAnalysis?.keywords).toEqual(['Node.js', 'AWS']);
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('should return error if jobDescription is missing', async () => {
    const state: any = {
      jobDescription: '',
      messages: [],
      currentStep: 'analyze_job',
      errors: [],
      tokensUsed: 0,
    };

    const result = await analyzeJobAgent(state, 'fake-api-key');

    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
