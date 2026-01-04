/**
 * AI Testing Mocks and Utilities
 * 
 * Provides mock implementations for AI providers, models, and services
 * for unit testing without making actual API calls.
 */

import { vi } from 'vitest';
import type { LanguageModel } from 'ai';
import type { AIProvider, AIModel, ProviderConfig } from '../providers/base';

// ============================================================================
// Test User Constants (matches prisma/seed.ts)
// ============================================================================

export const TEST_USER = {
  id: 'test-user-id-12345',
  email: 'test@example.com',
  name: 'Test User',
  password: 'Test123456',
} as const;
import type { Resume } from '@/lib/validations/jsonresume';

// ============================================================================
// Mock Language Model
// ============================================================================

export interface MockGenerateOptions {
  response?: string;
  usage?: { promptTokens: number; completionTokens: number };
  finishReason?: 'stop' | 'length' | 'error';
  shouldError?: boolean;
  errorMessage?: string;
}

/**
 * Creates a mock language model that returns predictable responses
 * Compatible with AI SDK v5 LanguageModelV2 specification
 */
export function createMockLanguageModel(options: MockGenerateOptions = {}): LanguageModel {
  const {
    response = '{"result": "mock response"}',
    usage = { promptTokens: 100, completionTokens: 50 },
    finishReason = 'stop',
    shouldError = false,
    errorMessage = 'Mock error',
  } = options;

  // V2 usage format
  const v2Usage = {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    totalTokens: usage.promptTokens + usage.completionTokens,
  };

  return {
    specificationVersion: 'v2',
    provider: 'mock',
    modelId: 'mock-model',
    
    // V2 requires supportedUrls
    supportedUrls: {},
    
    doGenerate: vi.fn().mockImplementation(async () => {
      if (shouldError) {
        throw new Error(errorMessage);
      }
      
      // V2 format: content is an array of content parts
      return {
        content: [
          { type: 'text', text: response }
        ],
        usage: v2Usage,
        finishReason,
        warnings: [],
        request: { body: {} },
        response: { 
          id: 'mock-id',
          timestamp: new Date(),
          modelId: 'mock-model',
          headers: {},
        },
      };
    }),
    
    doStream: vi.fn().mockImplementation(async () => {
      if (shouldError) {
        throw new Error(errorMessage);
      }
      
      const chunks = response.split('');
      let index = 0;
      const textId = 'text-0';
      
      return {
        stream: new ReadableStream({
          pull(controller) {
            // First chunk: text-start
            if (index === 0) {
              controller.enqueue({
                type: 'text-start',
                id: textId,
              });
            }
            
            if (index < chunks.length) {
              controller.enqueue({
                type: 'text-delta',
                id: textId,
                delta: chunks[index++],
              });
            } else {
              // End the text part
              controller.enqueue({
                type: 'text-end',
                id: textId,
              });
              // Signal finish
              controller.enqueue({
                type: 'finish',
                finishReason,
                usage: v2Usage,
              });
              controller.close();
            }
          },
        }),
        request: { body: {} },
        response: { headers: {} },
      };
    }),
  } as unknown as LanguageModel;
}

// ============================================================================
// Mock AI Provider
// ============================================================================

export class MockAIProvider implements AIProvider {
  readonly type = 'mock';
  readonly name = 'Mock Provider';
  
  private mockModels: AIModel[] = [
    { id: 'mock-gpt-4', name: 'Mock GPT-4', description: 'A mock model for testing', contextWindow: 8192 },
    { id: 'mock-gpt-3.5', name: 'Mock GPT-3.5', description: 'A cheaper mock model', contextWindow: 4096 },
  ];
  
  private mockResponse: MockGenerateOptions;
  
  constructor(
    private config: ProviderConfig,
    mockOptions: MockGenerateOptions = {}
  ) {
    this.mockResponse = mockOptions;
  }
  
  validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('mock-') && apiKey.length > 10;
  }
  
  async fetchModels(): Promise<AIModel[]> {
    return this.mockModels;
  }
  
  createLanguageModel(_: string): LanguageModel {
    return createMockLanguageModel(this.mockResponse);
  }
  
  getKeyPreview(apiKey: string): string {
    return apiKey.substring(0, 8) + '...';
  }
  
  setMockResponse(options: MockGenerateOptions): void {
    this.mockResponse = options;
  }
  
  setMockModels(models: AIModel[]): void {
    this.mockModels = models;
  }
}

// ============================================================================
// Mock Data Fixtures
// ============================================================================

export const mockResume: Resume = {
  basics: {
    name: 'John Doe',
    label: 'Software Engineer',
    email: 'john.doe@example.com',
    phone: '555-1234',
    summary: 'Experienced software engineer with 5+ years of experience in web development.',
    location: {
      city: 'San Francisco',
      countryCode: 'US',
      region: 'CA',
    },
    profiles: [
      { network: 'LinkedIn', username: 'johndoe', url: 'https://linkedin.com/in/johndoe' },
      { network: 'GitHub', username: 'johndoe', url: 'https://github.com/johndoe' },
    ],
  },
  work: [
    {
      name: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: 'Present',
      summary: 'Led development of key features',
      highlights: [
        'Increased performance by 50%',
        'Led team of 5 developers',
        'Implemented CI/CD pipeline',
      ],
    },
    {
      name: 'Startup Inc',
      position: 'Junior Developer',
      startDate: '2018-01',
      endDate: '2019-12',
      summary: 'Full-stack development',
      highlights: [
        'Built REST APIs',
        'Developed React frontend',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      area: 'Computer Science',
      studyType: 'Bachelor',
      startDate: '2014-09',
      endDate: '2018-05',
    },
  ],
  skills: [
    { name: 'JavaScript', level: 'Expert', keywords: ['React', 'Node.js', 'TypeScript'] },
    { name: 'Python', level: 'Intermediate', keywords: ['Django', 'FastAPI'] },
    { name: 'DevOps', level: 'Intermediate', keywords: ['Docker', 'Kubernetes', 'AWS'] },
  ],
  projects: [
    {
      name: 'Open Source Library',
      description: 'A popular npm package with 10k+ downloads',
      highlights: ['Published on npm', 'Community contributions'],
      url: 'https://github.com/johndoe/library',
    },
  ],
};

export const mockJobDescription = `
Software Engineer - Full Stack

Company: Acme Technology Inc.

About the Role:
We are looking for a skilled Full Stack Engineer to join our team. You will be responsible for building and maintaining our web applications.

Requirements:
- 3+ years of experience with React and TypeScript
- Experience with Node.js and REST APIs
- Knowledge of cloud services (AWS preferred)
- Strong problem-solving skills
- Excellent communication abilities

Nice to have:
- Experience with Kubernetes
- GraphQL knowledge
- CI/CD pipeline experience

Benefits:
- Competitive salary
- Remote-friendly
- Health insurance
- 401k matching
`;

export const mockOptimizedResume = {
  jobTitle: 'Software Engineer - Full Stack',
  companyName: 'Acme Technology Inc.',
  resume: {
    basics: {
      name: 'John Doe',
      label: 'Full Stack Software Engineer',
      email: 'john.doe@example.com',
      phone: '555-1234',
      summary: 'Results-driven Full Stack Engineer with 5+ years of experience in React, TypeScript, and Node.js. Proven track record of improving application performance and leading development teams.',
      location: {
        city: 'San Francisco',
        countryCode: 'US',
        region: 'CA',
      },
      profiles: [
        { network: 'LinkedIn', username: 'johndoe', url: 'https://linkedin.com/in/johndoe' },
        { network: 'GitHub', username: 'johndoe', url: 'https://github.com/johndoe' },
      ],
    },
    work: [
      {
        name: 'Tech Corp',
        position: 'Senior Full Stack Developer',
        startDate: '2020-01',
        endDate: 'Present',
        summary: 'Led full-stack development using React, TypeScript, and Node.js',
        highlights: [
          'Increased application performance by 50% through optimization of React components and Node.js APIs',
          'Led cross-functional team of 5 developers in agile environment',
          'Implemented comprehensive CI/CD pipeline using AWS services',
        ],
      },
    ],
    skills: [
      { name: 'JavaScript/TypeScript', level: 'Expert', keywords: ['React', 'Node.js', 'TypeScript', 'REST APIs'] },
      { name: 'Cloud & DevOps', level: 'Advanced', keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'] },
    ],
  },
};

export const mockCoverLetterResult = {
  subject: 'Application for Software Engineer - Full Stack Position',
  content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Software Engineer - Full Stack position at Acme Technology Inc...',
  recipientName: 'Hiring Manager',
  companyName: 'Acme Technology Inc.',
  jobTitle: 'Software Engineer - Full Stack',
};

// ============================================================================
// Mock Service Helpers
// ============================================================================

/**
 * Creates a mock successful service result
 */
export function mockSuccess<T>(data: T) {
  return { success: true as const, data };
}

/**
 * Creates a mock failed service result
 */
export function mockFailure(error: string) {
  return { success: false as const, error };
}

// ============================================================================
// AI SDK Mock Helpers
// ============================================================================

/**
 * Mock the generateText function from AI SDK
 */
export function mockGenerateText(response: string, options: Partial<MockGenerateOptions> = {}) {
  const promptTokens = options.usage?.promptTokens ?? 100;
  const completionTokens = options.usage?.completionTokens ?? 50;
  
  return vi.fn().mockResolvedValue({
    text: response,
    usage: { 
      promptTokens, 
      completionTokens,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    finishReason: options.finishReason ?? 'stop',
    rawCall: { rawPrompt: null, rawSettings: {} },
    rawResponse: { headers: {} },
    response: { id: 'mock-id', timestamp: new Date(), modelId: 'mock-model' },
  } as unknown);
}

/**
 * Mock the streamText function from AI SDK
 */
export function mockStreamText(response: string) {
  const chunks = response.split('');
  
  return vi.fn().mockResolvedValue({
    textStream: (async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    })(),
    fullStream: (async function* () {
      for (const chunk of chunks) {
        yield { type: 'text-delta', textDelta: chunk };
      }
      yield { 
        type: 'finish', 
        finishReason: 'stop', 
        usage: { promptTokens: 100, completionTokens: 50, inputTokens: 100, outputTokens: 50, totalTokens: 150 } 
      };
    })(),
    usage: Promise.resolve({ inputTokens: 100, outputTokens: 50, totalTokens: 150 }),
    finishReason: Promise.resolve('stop'),
    text: Promise.resolve(response),
    toTextStreamResponse: vi.fn().mockReturnValue(new Response(response)),
  } as unknown);
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Wait for async operations to settle
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a mock abort controller for testing cancellation
 */
export function createMockAbortController(): AbortController {
  const controller = new AbortController();
  return controller;
}
