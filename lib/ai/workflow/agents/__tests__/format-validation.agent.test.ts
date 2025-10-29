import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock validation response
const mockValidation = {
  atsCompliant: true,
  issues: [],
  recommendations: ['Great resume format!', 'Strong keyword alignment'],
};

// Create both plain JSON and markdown-wrapped versions
const plainJsonResponse = JSON.stringify(mockValidation);
const markdownWrappedResponse = `\`\`\`json
${JSON.stringify(mockValidation, null, 2)}
\`\`\``;

// Mock RunnableSequence with a response that can be controlled per test
let mockChainResponse = plainJsonResponse;

vi.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: () => ({ invoke: async () => mockChainResponse }),
  },
}));

import { formatValidationAgent } from '../format-validation.agent';

describe('formatValidationAgent', () => {
  const mockState: any = {
    optimizedContent: {
      summary: 'Experienced Software Engineer',
      experience: [
        {
          company: 'Tech Corp',
          title: 'Senior Developer',
          startDate: '2020-01',
          current: true,
          description: 'Building scalable applications',
          bulletPoints: ['Built features', 'Mentored team'],
        },
      ],
      prioritizedSkills: ['JavaScript', 'React', 'Node.js'],
    },
    jobAnalysis: {
      role: 'Software Engineer',
      requirements: {
        required: ['JavaScript', 'React'],
        preferred: ['TypeScript'],
      },
      keywords: ['scalable', 'team'],
    },
    messages: [],
    currentStep: 'validate_format',
    errors: [],
    tokensUsed: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to plain JSON by default
    mockChainResponse = plainJsonResponse;
  });

  it('should parse plain JSON response correctly', async () => {
    mockChainResponse = plainJsonResponse;

    const result = await formatValidationAgent(mockState, 'fake-api-key');

    expect(result.formatValidation).toBeDefined();
    expect(result.formatValidation?.atsCompliant).toBe(true);
    expect(result.formatValidation?.recommendations).toHaveLength(2);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    mockChainResponse = markdownWrappedResponse;

    const result = await formatValidationAgent(mockState, 'fake-api-key');

    expect(result.formatValidation).toBeDefined();
    expect(result.formatValidation?.atsCompliant).toBe(true);
    expect(result.formatValidation?.recommendations).toHaveLength(2);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('should handle invalid JSON response', async () => {
    mockChainResponse = 'This is not valid JSON';

    const result = await formatValidationAgent(mockState, 'fake-api-key');

    expect(result.formatValidation).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0]).toContain('Format validation failed');
  });

  it('should handle empty response', async () => {
    mockChainResponse = '';

    const result = await formatValidationAgent(mockState, 'fake-api-key');

    expect(result.formatValidation).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should return error if required state fields are missing', async () => {
    const invalidState: any = {
      messages: [],
      currentStep: 'validate_format',
      errors: [],
      tokensUsed: 0,
      // Missing optimizedContent and jobAnalysis
    };

    await expect(formatValidationAgent(invalidState, 'fake-api-key')).rejects.toThrow('Optimized content is required');
  });

  it('should handle validation failures with issues', async () => {
    const failedValidation = {
      atsCompliant: false,
      issues: [
        { severity: 'error' as const, message: 'Missing key skills' },
        { severity: 'warning' as const, message: 'Weak summary' },
      ],
      recommendations: ['Add more technical keywords', 'Strengthen summary'],
    };
    mockChainResponse = JSON.stringify(failedValidation);

    const result = await formatValidationAgent(mockState, 'fake-api-key');

    expect(result.formatValidation).toBeDefined();
    expect(result.formatValidation?.atsCompliant).toBe(false);
    expect(result.formatValidation?.issues).toHaveLength(2);
    expect(result.errors).toEqual([]);
  });
});
