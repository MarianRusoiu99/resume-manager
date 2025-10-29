import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock response data that will be returned by the chain
const mockOptimizedContent = {
  summary: 'Experienced Software Engineer with 5+ years building scalable web applications',
  experience: [
    {
      position: 'Senior Developer',
      company: 'Tech Corp',
      startDate: '2020-01',
      endDate: null,
      bulletPoints: [
        'Built scalable web applications using React and Node.js',
        'Led code reviews and mentored junior developers',
      ],
    },
  ],
  prioritizedSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  education: [],
};

// Create both plain JSON and markdown-wrapped versions
const plainJsonResponse = JSON.stringify(mockOptimizedContent);
const markdownWrappedResponse = `\`\`\`json
${JSON.stringify(mockOptimizedContent, null, 2)}
\`\`\``;

// Mock RunnableSequence with a response that can be controlled per test
let mockChainResponse = plainJsonResponse;

vi.mock('@langchain/core/runnables', () => ({
  RunnableSequence: {
    from: () => ({ invoke: async () => mockChainResponse }),
  },
}));

import { contentOptimizationAgent } from '../content-optimization.agent';

describe('contentOptimizationAgent', () => {
  const mockState: any = {
    jobAnalysis: {
      role: 'Software Engineer',
      requirements: {
        required: ['JavaScript', 'React', 'Node.js'],
        preferred: ['TypeScript', 'Next.js'],
      },
      experienceLevel: 'Mid-level',
      responsibilities: ['Build web apps', 'Code reviews'],
      keywords: ['web', 'scalable', 'team'],
    },
    profileMatch: {
      overallScore: 85,
      matchedSkills: ['JavaScript', 'React', 'Node.js'],
      missingSkills: ['TypeScript'],
      recommendations: ['Add TypeScript experience'],
    },
    matchingResults: {
      overallScore: 85,
      matchedSkills: ['JavaScript', 'React', 'Node.js'],
      missingSkills: ['TypeScript'],
      recommendations: ['Add TypeScript experience'],
    },
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      summary: 'Experienced developer',
      experience: [
        {
          position: 'Developer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: null,
          description: 'Built web applications',
        },
      ],
      education: [],
      skills: ['JavaScript', 'React', 'Node.js'],
    },
    userProfile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      summary: 'Experienced developer',
      experience: [
        {
          position: 'Developer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: null,
          description: 'Built web applications',
        },
      ],
      education: [],
      skills: ['JavaScript', 'React', 'Node.js'],
    },
    messages: [],
    currentStep: 'optimize_content',
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

    const result = await contentOptimizationAgent(mockState, 'fake-api-key');

    expect(result.optimizedContent).toBeDefined();
    expect(result.optimizedContent?.summary).toBe(mockOptimizedContent.summary);
    expect(result.optimizedContent?.prioritizedSkills).toEqual(mockOptimizedContent.prioritizedSkills);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('should parse JSON wrapped in markdown code blocks', async () => {
    mockChainResponse = markdownWrappedResponse;

    const result = await contentOptimizationAgent(mockState, 'fake-api-key');

    expect(result.optimizedContent).toBeDefined();
    expect(result.optimizedContent?.summary).toBe(mockOptimizedContent.summary);
    expect(result.optimizedContent?.prioritizedSkills).toEqual(mockOptimizedContent.prioritizedSkills);
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('should handle invalid JSON response', async () => {
    mockChainResponse = 'This is not valid JSON';

    await expect(contentOptimizationAgent(mockState, 'fake-api-key')).rejects.toThrow();
  });

  it('should handle empty response', async () => {
    mockChainResponse = '';

    await expect(contentOptimizationAgent(mockState, 'fake-api-key')).rejects.toThrow();
  });

  it('should return error if required state fields are missing', async () => {
    const invalidState: any = {
      messages: [],
      currentStep: 'optimize_content',
      errors: [],
      tokensUsed: 0,
      // Missing jobAnalysis, matchingResults, profile
    };

    await expect(contentOptimizationAgent(invalidState, 'fake-api-key')).rejects.toThrow('Job analysis is required');
  });
});
